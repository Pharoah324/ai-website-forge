-- Profile billing fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS billing_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS payment_failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS grace_period_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_invoice_id text,
  ADD COLUMN IF NOT EXISTS plan_before_downgrade text;

-- Extend admin_alert_type enum with new variants if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'payment_failed' AND enumtypid = 'public.admin_alert_type'::regtype) THEN
    ALTER TYPE public.admin_alert_type ADD VALUE 'payment_failed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'dispute' AND enumtypid = 'public.admin_alert_type'::regtype) THEN
    ALTER TYPE public.admin_alert_type ADD VALUE 'dispute';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'grace_period_expired' AND enumtypid = 'public.admin_alert_type'::regtype) THEN
    ALTER TYPE public.admin_alert_type ADD VALUE 'grace_period_expired';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'subscription_canceled' AND enumtypid = 'public.admin_alert_type'::regtype) THEN
    ALTER TYPE public.admin_alert_type ADD VALUE 'subscription_canceled';
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Daily downgrader for expired grace periods
CREATE OR REPLACE FUNCTION public.downgrade_past_due_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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