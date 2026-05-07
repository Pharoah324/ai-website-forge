
-- 1. Extend plan_caps with credit fields (idempotent)
ALTER TABLE public.plan_caps
  ADD COLUMN IF NOT EXISTS monthly_build_credits int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_runtime_credits int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS build_rollover_pct int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS runtime_rollover_pct int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS priority_queue boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS white_label boolean NOT NULL DEFAULT false;

UPDATE public.plan_caps SET monthly_build_credits = 20,   monthly_runtime_credits = 300,    build_rollover_pct = 0,  runtime_rollover_pct = 0, priority_queue = false, white_label = false WHERE plan = 'free';
UPDATE public.plan_caps SET monthly_build_credits = 100,  monthly_runtime_credits = 2500,   build_rollover_pct = 0,  runtime_rollover_pct = 0, priority_queue = false, white_label = false WHERE plan = 'starter';
UPDATE public.plan_caps SET monthly_build_credits = 300,  monthly_runtime_credits = 10000,  build_rollover_pct = 50, runtime_rollover_pct = 0, priority_queue = false, white_label = false WHERE plan = 'builder';
UPDATE public.plan_caps SET monthly_build_credits = 800,  monthly_runtime_credits = 30000,  build_rollover_pct = 50, runtime_rollover_pct = 0, priority_queue = true,  white_label = false WHERE plan = 'pro';
UPDATE public.plan_caps SET monthly_build_credits = 2000, monthly_runtime_credits = 100000, build_rollover_pct = 50, runtime_rollover_pct = 0, priority_queue = true,  white_label = true  WHERE plan = 'agency';

-- 2. Add new admin_alert_type values (idempotent)
DO $$ BEGIN
  ALTER TYPE public.admin_alert_type ADD VALUE IF NOT EXISTS 'account_paused';
EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.admin_alert_type ADD VALUE IF NOT EXISTS 'grace_period_expired';
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- 3. account_flags
DO $$ BEGIN
  CREATE TYPE public.account_flag_type AS ENUM (
    'emergency_pause','abuse_suspected','dispute_flagged','manual_review','suspended'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.account_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  flag_type public.account_flag_type NOT NULL,
  triggered_by text NOT NULL DEFAULT 'system',  -- 'system' | 'admin'
  reason text NOT NULL,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by_admin uuid,
  resolved_at timestamptz,
  notes text,
  metadata jsonb
);
CREATE INDEX IF NOT EXISTS account_flags_user_active_idx
  ON public.account_flags (user_id) WHERE resolved_at IS NULL;

ALTER TABLE public.account_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage flags" ON public.account_flags;
CREATE POLICY "Admins manage flags" ON public.account_flags
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users read own flags" ON public.account_flags;
CREATE POLICY "Users read own flags" ON public.account_flags
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Helpers
CREATE OR REPLACE FUNCTION public.is_account_paused(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.account_flags
    WHERE user_id = _uid
      AND resolved_at IS NULL
      AND flag_type IN ('emergency_pause','suspended')
  );
$$;

CREATE OR REPLACE FUNCTION public.pause_account(
  _uid uuid, _reason text, _flag_type public.account_flag_type DEFAULT 'emergency_pause',
  _triggered_by text DEFAULT 'system', _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text;
BEGIN
  -- Already paused? do nothing
  IF public.is_account_paused(_uid) THEN
    RETURN jsonb_build_object('ok', true, 'already_paused', true);
  END IF;
  INSERT INTO public.account_flags (user_id, flag_type, triggered_by, reason, metadata)
  VALUES (_uid, _flag_type, _triggered_by, _reason, _metadata);
  SELECT email INTO v_email FROM public.profiles WHERE id = _uid;
  INSERT INTO public.admin_alerts (alert_type, severity, affected_user_id, affected_user_email, description, metadata)
  VALUES ('account_paused', 'critical', _uid, v_email,
          'URGENT: Account auto-paused — ' || _reason || ' — requires manual review',
          _metadata || jsonb_build_object('flag_type', _flag_type::text));
  RETURN jsonb_build_object('ok', true, 'paused', true);
END $$;

CREATE OR REPLACE FUNCTION public.resume_account(_uid uuid, _notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.account_flags
    SET resolved_at = now(),
        reviewed_by_admin = auth.uid(),
        notes = COALESCE(notes,'') || CASE WHEN _notes IS NULL THEN '' ELSE E'\n' || _notes END
    WHERE user_id = _uid
      AND resolved_at IS NULL
      AND flag_type IN ('emergency_pause','abuse_suspected','manual_review');
  RETURN jsonb_build_object('ok', true);
END $$;

-- 5. Block paused accounts in the consume gate
CREATE OR REPLACE FUNCTION public.check_and_consume(_uid uuid, _action rate_action, _credit_cost integer DEFAULT 1)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  v_plan text; v_caps public.plan_caps%ROWTYPE; v_rl public.rate_limits%ROWTYPE;
  v_daily_limit int; v_hourly_limit int; v_balance int;
  v_now timestamptz := now(); v_retry int; v_admin boolean;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated'); END IF;

  v_admin := public.is_admin(_uid);
  IF v_admin THEN
    INSERT INTO public.admin_usage_log (admin_user_id, action_type, notes)
    VALUES (_uid, _action::text, 'admin bypass');
    RETURN jsonb_build_object('ok', true, 'plan', 'admin', 'admin_bypass', true);
  END IF;

  -- Hard block if paused
  IF public.is_account_paused(_uid) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'account_paused');
  END IF;

  v_plan := COALESCE((SELECT plan::text FROM public.profiles WHERE id = _uid), 'free');
  SELECT * INTO v_caps FROM public.plan_caps WHERE plan = v_plan;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'unknown_plan', 'plan', v_plan); END IF;

  v_daily_limit := CASE _action
    WHEN 'site_generation' THEN v_caps.daily_site_generations
    WHEN 'optimization_run' THEN v_caps.daily_optimization_runs
    ELSE -1 END;
  v_hourly_limit := v_caps.hourly_api_calls;

  INSERT INTO public.rate_limits (user_id, action_type) VALUES (_uid, _action)
  ON CONFLICT (user_id, action_type) DO NOTHING;
  SELECT * INTO v_rl FROM public.rate_limits WHERE user_id = _uid AND action_type = _action FOR UPDATE;

  IF v_rl.day_window_start < v_now - interval '1 day' THEN
    v_rl.count_today := 0; v_rl.day_window_start := v_now;
  END IF;
  IF v_rl.hour_window_start < v_now - interval '1 hour' THEN
    v_rl.count_this_hour := 0; v_rl.hour_window_start := v_now;
  END IF;

  IF v_rl.blocked_until IS NOT NULL AND v_rl.blocked_until > v_now THEN
    v_retry := EXTRACT(EPOCH FROM (v_rl.blocked_until - v_now))::int;
    RETURN jsonb_build_object('ok', false, 'reason', 'blocked', 'plan', v_plan, 'retry_after_seconds', v_retry);
  END IF;
  IF v_daily_limit >= 0 AND v_rl.count_today >= v_daily_limit THEN
    v_retry := EXTRACT(EPOCH FROM ((v_rl.day_window_start + interval '1 day') - v_now))::int;
    RETURN jsonb_build_object('ok', false, 'reason', 'daily_limit', 'plan', v_plan,
      'daily_used', v_rl.count_today, 'daily_limit', v_daily_limit,
      'retry_after_seconds', GREATEST(v_retry, 0));
  END IF;
  IF v_hourly_limit >= 0 AND v_rl.count_this_hour >= v_hourly_limit THEN
    v_retry := EXTRACT(EPOCH FROM ((v_rl.hour_window_start + interval '1 hour') - v_now))::int;
    RETURN jsonb_build_object('ok', false, 'reason', 'hourly_limit', 'plan', v_plan,
      'hourly_used', v_rl.count_this_hour, 'hourly_limit', v_hourly_limit,
      'retry_after_seconds', GREATEST(v_retry, 0));
  END IF;

  IF _credit_cost > 0 THEN
    SELECT build_credits INTO v_balance FROM public.profiles WHERE id = _uid FOR UPDATE;
    IF v_balance IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'no_profile'); END IF;
    IF v_balance < _credit_cost THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'no_credits', 'plan', v_plan, 'balance_after', v_balance);
    END IF;
    UPDATE public.profiles SET build_credits = GREATEST(0, build_credits - _credit_cost) WHERE id = _uid;
    INSERT INTO public.credit_transactions
      (user_id, transaction_type, credit_kind, credits_before, credits_after, amount_changed, reason, metadata)
    VALUES (_uid, 'deduction', 'build', v_balance, v_balance - _credit_cost,
            -_credit_cost, _action::text, jsonb_build_object('action', _action::text));
    INSERT INTO public.credit_ledger (user_id, kind, amount, reason, description)
    VALUES (_uid, 'build', -_credit_cost, 'generate', _action::text);
    v_balance := v_balance - _credit_cost;
  END IF;

  UPDATE public.rate_limits SET
    count_today = v_rl.count_today + 1,
    count_this_hour = v_rl.count_this_hour + 1,
    day_window_start = v_rl.day_window_start,
    hour_window_start = v_rl.hour_window_start,
    updated_at = v_now
  WHERE user_id = _uid AND action_type = _action;

  RETURN jsonb_build_object('ok', true, 'plan', v_plan, 'balance_after', v_balance,
    'daily_used', v_rl.count_today + 1, 'daily_limit', v_daily_limit,
    'hourly_used', v_rl.count_this_hour + 1, 'hourly_limit', v_hourly_limit);
END $function$;

-- 6. Abuse detection
CREATE OR REPLACE FUNCTION public.detect_abuse_and_pause()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row RECORD; v_count int := 0;
  v_runtime_24h int; v_caps public.plan_caps%ROWTYPE;
BEGIN
  -- Trigger 1: runtime credit explosion (>=50% of monthly runtime in 24h)
  FOR v_row IN
    SELECT p.id, p.email, p.plan::text AS plan
    FROM public.profiles p
    WHERE NOT public.is_account_paused(p.id)
      AND NOT public.is_admin(p.id)
  LOOP
    SELECT * INTO v_caps FROM public.plan_caps WHERE plan = v_row.plan;
    IF NOT FOUND THEN CONTINUE; END IF;

    SELECT COALESCE(SUM(-amount_changed), 0) INTO v_runtime_24h
    FROM public.credit_transactions
    WHERE user_id = v_row.id AND credit_kind = 'runtime'
      AND transaction_type = 'deduction'
      AND created_at > now() - interval '24 hours';
    IF v_caps.monthly_runtime_credits > 0
       AND v_runtime_24h >= (v_caps.monthly_runtime_credits / 2) THEN
      PERFORM public.pause_account(v_row.id,
        format('Runtime credit explosion: %s of %s monthly used in 24h', v_runtime_24h, v_caps.monthly_runtime_credits),
        'emergency_pause', 'system',
        jsonb_build_object('trigger','runtime_explosion','runtime_24h',v_runtime_24h,'limit',v_caps.monthly_runtime_credits));
      v_count := v_count + 1;
      CONTINUE;
    END IF;
  END LOOP;

  -- Trigger 2 & 3: hourly counters from rate_limits (already enforced, but if exceeded somehow → pause)
  FOR v_row IN
    SELECT rl.user_id, p.email, rl.action_type::text AS action, rl.count_this_hour
    FROM public.rate_limits rl
    JOIN public.profiles p ON p.id = rl.user_id
    WHERE rl.hour_window_start > now() - interval '1 hour'
      AND NOT public.is_admin(rl.user_id)
      AND NOT public.is_account_paused(rl.user_id)
      AND (
        (rl.action_type = 'site_generation' AND rl.count_this_hour > 20)
        OR (rl.action_type = 'api_call' AND rl.count_this_hour > 500)
      )
  LOOP
    PERFORM public.pause_account(v_row.user_id,
      format('Abuse pattern: %s %s in last hour', v_row.count_this_hour, v_row.action),
      'emergency_pause', 'system',
      jsonb_build_object('trigger','rate_abuse','action',v_row.action,'count',v_row.count_this_hour));
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'flagged', v_count);
END $$;

REVOKE ALL ON FUNCTION public.detect_abuse_and_pause() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pause_account(uuid,text,public.account_flag_type,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resume_account(uuid,text) TO authenticated;
