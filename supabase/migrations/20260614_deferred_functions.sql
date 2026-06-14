-- Deploy 4 of the 5 previously-deferred functions, validated against the LIVE
-- schema (profiles cols, enum values, dependent tables all confirmed present).
-- refund_credits is adapted to the live conventions: the deployed check_and_consume
-- does NOT log to credit_transactions (and the live credit_transactions schema
-- differs from the old migration), so refund_credits just adjusts build_credits.
-- detect_abuse_and_pause stays deferred — it needs rate_limits, pause_account,
-- is_account_paused and plan_caps.monthly_runtime_credits, none of which exist.

BEGIN;

-- ---------- redeem_access_code (user-facing: AccessCodeRedeem) ----------
CREATE OR REPLACE FUNCTION public.redeem_access_code(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.access_codes;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Not authenticated'); END IF;
  SELECT * INTO c FROM public.access_codes WHERE code = upper(_code) AND active = true LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Invalid code'); END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN RETURN jsonb_build_object('ok',false,'error','Code expired'); END IF;
  IF c.max_uses > 0 AND c.times_used >= c.max_uses THEN RETURN jsonb_build_object('ok',false,'error','Code fully used'); END IF;
  IF EXISTS (SELECT 1 FROM public.access_code_redemptions WHERE code_id = c.id AND user_id = uid) THEN
    RETURN jsonb_build_object('ok',false,'error','Already redeemed');
  END IF;
  UPDATE public.profiles
    SET plan = c.plan_granted::plan_tier,
        build_credits = build_credits + c.credits_granted,
        runtime_credits = runtime_credits + c.runtime_credits_granted
    WHERE id = uid;
  INSERT INTO public.access_code_redemptions (code_id, user_id) VALUES (c.id, uid);
  UPDATE public.access_codes SET times_used = times_used + 1,
    active = CASE WHEN max_uses > 0 AND times_used + 1 >= max_uses THEN false ELSE active END
    WHERE id = c.id;
  RETURN jsonb_build_object('ok',true,'plan',c.plan_granted,'credits',c.credits_granted);
END $$;

-- ---------- resume_account (admin: AdminAlerts / AdminUsage) ----------
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

-- ---------- downgrade_past_due_users (admin/cron: launch-tests) ----------
CREATE OR REPLACE FUNCTION public.downgrade_past_due_users()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row RECORD;
  v_count int := 0;
BEGIN
  FOR v_row IN
    SELECT id, email, plan::text AS plan
    FROM public.profiles
    WHERE billing_status = 'past_due'
      AND grace_period_ends_at IS NOT NULL
      AND grace_period_ends_at <= now()
      AND plan::text <> 'free'
  LOOP
    UPDATE public.profiles SET
      plan_before_downgrade = v_row.plan,
      plan = 'free',
      billing_status = 'canceled',
      monthly_build_limit = 20,
      monthly_runtime_limit = 300
    WHERE id = v_row.id;

    INSERT INTO public.admin_alerts (alert_type, severity, affected_user_id, affected_user_email, description, metadata)
    VALUES ('grace_period_expired', 'warning', v_row.id, v_row.email,
            'Grace period expired — user downgraded to free. Data retained.',
            jsonb_build_object('previous_plan', v_row.plan));
    v_count := v_count + 1;
  END LOOP;
  RETURN jsonb_build_object('downgraded', v_count);
END $$;

-- ---------- refund_credits (launch-tests; live-compatible) ----------
CREATE OR REPLACE FUNCTION public.refund_credits(_uid uuid, _amount int, _reason text, _description text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_before int; v_after int;
BEGIN
  IF _amount <= 0 THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount'); END IF;
  SELECT build_credits INTO v_before FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF v_before IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'no_profile'); END IF;
  v_after := v_before + _amount;
  UPDATE public.profiles SET build_credits = v_after, updated_at = now() WHERE id = _uid;
  RETURN jsonb_build_object('ok', true, 'balance_after', v_after);
END $$;

COMMIT;
