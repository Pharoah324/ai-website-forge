-- =========================================================================
-- BUILD 1: Hardening foundation
-- =========================================================================

-- ---------- enums ----------
DO $$ BEGIN
  CREATE TYPE public.rate_action AS ENUM (
    'site_generation','optimization_run','api_call','ghl_sync','search_atlas_call'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.credit_txn_type AS ENUM (
    'deduction','addition','rollover','topup','reset','refund'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.job_status AS ENUM (
    'pending','processing','completed','failed','retrying'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- rate_limits ----------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type public.rate_action NOT NULL,
  count_today int NOT NULL DEFAULT 0,
  count_this_hour int NOT NULL DEFAULT 0,
  hour_window_start timestamptz NOT NULL DEFAULT now(),
  day_window_start timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz,
  last_reset_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, action_type)
);
CREATE INDEX IF NOT EXISTS rate_limits_user_idx ON public.rate_limits(user_id);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User reads own rate limits" ON public.rate_limits;
CREATE POLICY "User reads own rate limits" ON public.rate_limits
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ---------- credit_transactions ----------
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  transaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_type public.credit_txn_type NOT NULL,
  credit_kind text NOT NULL DEFAULT 'build',  -- 'build' | 'runtime'
  credits_before int NOT NULL,
  credits_after int NOT NULL,
  amount_changed int NOT NULL,
  reason text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS credit_txn_user_idx ON public.credit_transactions(user_id, created_at DESC);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User reads own credit transactions" ON public.credit_transactions;
CREATE POLICY "User reads own credit transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ---------- job_queue ----------
CREATE TABLE IF NOT EXISTS public.job_queue (
  job_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_type text NOT NULL,
  status public.job_status NOT NULL DEFAULT 'pending',
  payload jsonb,
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  error_message text,
  next_retry_at timestamptz,
  credit_refunded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS job_queue_user_idx ON public.job_queue(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS job_queue_status_idx ON public.job_queue(status, next_retry_at);
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User reads own jobs" ON public.job_queue;
CREATE POLICY "User reads own jobs" ON public.job_queue
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ---------- plan_caps (per-plan limits config) ----------
CREATE TABLE IF NOT EXISTS public.plan_caps (
  plan text PRIMARY KEY,
  daily_site_generations int NOT NULL,
  daily_optimization_runs int NOT NULL,   -- -1 = unlimited
  hourly_api_calls int NOT NULL,
  max_sites int NOT NULL,                  -- -1 = unlimited
  max_optimization_reports int NOT NULL,   -- -1 = unlimited
  max_upload_mb int NOT NULL,              -- 0 = no uploads, -1 = unlimited
  search_atlas_enabled boolean NOT NULL DEFAULT false,
  gsc_enabled boolean NOT NULL DEFAULT false
);
ALTER TABLE public.plan_caps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads plan caps" ON public.plan_caps;
CREATE POLICY "Anyone reads plan caps" ON public.plan_caps FOR SELECT USING (true);

INSERT INTO public.plan_caps
  (plan, daily_site_generations, daily_optimization_runs, hourly_api_calls,
   max_sites, max_optimization_reports, max_upload_mb,
   search_atlas_enabled, gsc_enabled)
VALUES
  ('free',     3,   1,   20,   1,    5,    0,   false, false),
  ('starter',  10,  3,   100,  3,    20,   10,  false, false),
  ('builder',  30,  10,  500,  10,   100,  50,  true,  false),
  ('pro',      75,  30,  2000, 25,  -1,    200, true,  true),
  ('agency',   200, -1,  5000, -1,  -1,    1024, true, true)
ON CONFLICT (plan) DO UPDATE SET
  daily_site_generations  = EXCLUDED.daily_site_generations,
  daily_optimization_runs = EXCLUDED.daily_optimization_runs,
  hourly_api_calls        = EXCLUDED.hourly_api_calls,
  max_sites               = EXCLUDED.max_sites,
  max_optimization_reports= EXCLUDED.max_optimization_reports,
  max_upload_mb           = EXCLUDED.max_upload_mb,
  search_atlas_enabled    = EXCLUDED.search_atlas_enabled,
  gsc_enabled             = EXCLUDED.gsc_enabled;

-- ---------- helper: effective plan ----------
CREATE OR REPLACE FUNCTION public.get_effective_plan(_uid uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_admin(_uid) THEN 'admin'
    ELSE COALESCE((SELECT plan::text FROM public.profiles WHERE id = _uid), 'free')
  END;
$$;

-- ---------- main gate: check_and_consume ----------
-- Atomically: admin bypass → plan gate → rate-limit windows → credit balance →
--             deduct credits → bump rate-limit counters → record audit row.
-- Returns: { ok:bool, reason:text|null, plan:text, balance_after:int|null,
--            retry_after_seconds:int|null, daily_used:int, daily_limit:int,
--            hourly_used:int, hourly_limit:int }
CREATE OR REPLACE FUNCTION public.check_and_consume(
  _uid uuid,
  _action public.rate_action,
  _credit_cost int DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_caps public.plan_caps%ROWTYPE;
  v_rl public.rate_limits%ROWTYPE;
  v_daily_limit int;
  v_hourly_limit int;
  v_balance int;
  v_now timestamptz := now();
  v_retry int;
  v_admin boolean;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  v_admin := public.is_admin(_uid);

  -- Admin bypass: log to admin_usage_log, skip everything else
  IF v_admin THEN
    INSERT INTO public.admin_usage_log (admin_user_id, action_type, notes)
    VALUES (_uid, _action::text, 'admin bypass');
    RETURN jsonb_build_object('ok', true, 'plan', 'admin', 'admin_bypass', true);
  END IF;

  v_plan := COALESCE((SELECT plan::text FROM public.profiles WHERE id = _uid), 'free');
  SELECT * INTO v_caps FROM public.plan_caps WHERE plan = v_plan;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unknown_plan', 'plan', v_plan);
  END IF;

  -- Plan-feature gate (free / starter blocked from optimization runs entirely
  -- IF action requires Builder+ — site_generation is allowed on all paid plans + free).
  -- We don't hard-block optimization_run by plan here; instead callers should also
  -- check plan_caps.search_atlas_enabled / gsc_enabled when invoking those features.

  -- Pick the right limits for this action
  v_daily_limit := CASE _action
    WHEN 'site_generation' THEN v_caps.daily_site_generations
    WHEN 'optimization_run' THEN v_caps.daily_optimization_runs
    ELSE -1  -- generic: only hourly cap
  END;
  v_hourly_limit := v_caps.hourly_api_calls;

  -- Lock-or-create the rate-limit row
  INSERT INTO public.rate_limits (user_id, action_type)
  VALUES (_uid, _action)
  ON CONFLICT (user_id, action_type) DO NOTHING;

  SELECT * INTO v_rl FROM public.rate_limits
    WHERE user_id = _uid AND action_type = _action FOR UPDATE;

  -- Roll windows
  IF v_rl.day_window_start < v_now - interval '1 day' THEN
    v_rl.count_today := 0;
    v_rl.day_window_start := v_now;
  END IF;
  IF v_rl.hour_window_start < v_now - interval '1 hour' THEN
    v_rl.count_this_hour := 0;
    v_rl.hour_window_start := v_now;
  END IF;

  -- Block window
  IF v_rl.blocked_until IS NOT NULL AND v_rl.blocked_until > v_now THEN
    v_retry := EXTRACT(EPOCH FROM (v_rl.blocked_until - v_now))::int;
    RETURN jsonb_build_object(
      'ok', false, 'reason', 'blocked', 'plan', v_plan,
      'retry_after_seconds', v_retry
    );
  END IF;

  -- Daily cap (skip if -1 = unlimited)
  IF v_daily_limit >= 0 AND v_rl.count_today >= v_daily_limit THEN
    v_retry := EXTRACT(EPOCH FROM ((v_rl.day_window_start + interval '1 day') - v_now))::int;
    RETURN jsonb_build_object(
      'ok', false, 'reason', 'daily_limit', 'plan', v_plan,
      'daily_used', v_rl.count_today, 'daily_limit', v_daily_limit,
      'retry_after_seconds', GREATEST(v_retry, 0)
    );
  END IF;

  -- Hourly cap
  IF v_hourly_limit >= 0 AND v_rl.count_this_hour >= v_hourly_limit THEN
    v_retry := EXTRACT(EPOCH FROM ((v_rl.hour_window_start + interval '1 hour') - v_now))::int;
    RETURN jsonb_build_object(
      'ok', false, 'reason', 'hourly_limit', 'plan', v_plan,
      'hourly_used', v_rl.count_this_hour, 'hourly_limit', v_hourly_limit,
      'retry_after_seconds', GREATEST(v_retry, 0)
    );
  END IF;

  -- Credit gate (only for credit-costing actions)
  IF _credit_cost > 0 THEN
    SELECT build_credits INTO v_balance FROM public.profiles WHERE id = _uid FOR UPDATE;
    IF v_balance IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'no_profile');
    END IF;
    IF v_balance < _credit_cost THEN
      RETURN jsonb_build_object(
        'ok', false, 'reason', 'no_credits', 'plan', v_plan, 'balance_after', v_balance
      );
    END IF;
    -- Deduct
    UPDATE public.profiles
      SET build_credits = GREATEST(0, build_credits - _credit_cost)
      WHERE id = _uid;

    INSERT INTO public.credit_transactions
      (user_id, transaction_type, credit_kind, credits_before, credits_after,
       amount_changed, reason, metadata)
    VALUES
      (_uid, 'deduction', 'build', v_balance, v_balance - _credit_cost,
       -_credit_cost, _action::text,
       jsonb_build_object('action', _action::text));

    -- Mirror into legacy ledger for backward-compat
    INSERT INTO public.credit_ledger (user_id, kind, amount, reason, description)
    VALUES (_uid, 'build', -_credit_cost, 'generate', _action::text);
    v_balance := v_balance - _credit_cost;
  END IF;

  -- Bump counters
  UPDATE public.rate_limits SET
    count_today = v_rl.count_today + 1,
    count_this_hour = v_rl.count_this_hour + 1,
    day_window_start = v_rl.day_window_start,
    hour_window_start = v_rl.hour_window_start,
    updated_at = v_now
  WHERE user_id = _uid AND action_type = _action;

  RETURN jsonb_build_object(
    'ok', true, 'plan', v_plan, 'balance_after', v_balance,
    'daily_used', v_rl.count_today + 1, 'daily_limit', v_daily_limit,
    'hourly_used', v_rl.count_this_hour + 1, 'hourly_limit', v_hourly_limit
  );
END $$;

-- ---------- refund (used when a job permanently fails) ----------
CREATE OR REPLACE FUNCTION public.refund_credits(
  _uid uuid, _amount int, _reason text, _description text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_before int; v_after int;
BEGIN
  IF _amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  END IF;
  SELECT build_credits INTO v_before FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF v_before IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_profile');
  END IF;
  v_after := v_before + _amount;
  UPDATE public.profiles SET build_credits = v_after WHERE id = _uid;
  INSERT INTO public.credit_transactions
    (user_id, transaction_type, credit_kind, credits_before, credits_after,
     amount_changed, reason, metadata)
  VALUES (_uid, 'refund', 'build', v_before, v_after, _amount, _reason,
          jsonb_build_object('description', _description));
  RETURN jsonb_build_object('ok', true, 'balance_after', v_after);
END $$;

-- ---------- storage cap enforcement ----------
CREATE OR REPLACE FUNCTION public.enforce_storage_caps()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_caps public.plan_caps%ROWTYPE;
  v_count int;
  v_limit int;
BEGIN
  -- Admins bypass
  IF public.is_admin(NEW.user_id) THEN RETURN NEW; END IF;

  v_plan := COALESCE((SELECT plan::text FROM public.profiles WHERE id = NEW.user_id), 'free');
  SELECT * INTO v_caps FROM public.plan_caps WHERE plan = v_plan;

  IF TG_TABLE_NAME = 'sites' THEN
    v_limit := v_caps.max_sites;
    IF v_limit < 0 THEN RETURN NEW; END IF;
    SELECT COUNT(*) INTO v_count FROM public.sites WHERE user_id = NEW.user_id;
    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'storage_limit:sites:%:%', v_limit, v_plan
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF TG_TABLE_NAME = 'optimization_projects' THEN
    -- max sites = optimization-project count cap, mirrors max_sites for now
    v_limit := v_caps.max_sites;
    IF v_limit < 0 THEN RETURN NEW; END IF;
    SELECT COUNT(*) INTO v_count FROM public.optimization_projects WHERE user_id = NEW.user_id;
    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'storage_limit:optimization_projects:%:%', v_limit, v_plan
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF TG_TABLE_NAME = 'optimization_reports' THEN
    v_limit := v_caps.max_optimization_reports;
    IF v_limit < 0 THEN RETURN NEW; END IF;
    SELECT COUNT(*) INTO v_count FROM public.optimization_reports WHERE user_id = NEW.user_id;
    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'storage_limit:optimization_reports:%:%', v_limit, v_plan
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS sites_storage_cap ON public.sites;
CREATE TRIGGER sites_storage_cap
  BEFORE INSERT ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.enforce_storage_caps();

DROP TRIGGER IF EXISTS optimization_projects_storage_cap ON public.optimization_projects;
CREATE TRIGGER optimization_projects_storage_cap
  BEFORE INSERT ON public.optimization_projects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_storage_caps();

DROP TRIGGER IF EXISTS optimization_reports_storage_cap ON public.optimization_reports;
CREATE TRIGGER optimization_reports_storage_cap
  BEFORE INSERT ON public.optimization_reports
  FOR EACH ROW EXECUTE FUNCTION public.enforce_storage_caps();

-- ---------- updated_at trigger ----------
DROP TRIGGER IF EXISTS rate_limits_updated_at ON public.rate_limits;
CREATE TRIGGER rate_limits_updated_at
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS job_queue_updated_at ON public.job_queue;
CREATE TRIGGER job_queue_updated_at
  BEFORE UPDATE ON public.job_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();