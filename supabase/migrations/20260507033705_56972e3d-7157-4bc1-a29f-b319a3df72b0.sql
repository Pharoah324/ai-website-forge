-- Enums
DO $$ BEGIN
  CREATE TYPE public.admin_alert_type AS ENUM ('dispute','abuse','server_error','credit_anomaly','signup_abuse','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.admin_alert_severity AS ENUM ('critical','warning','info');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.admin_alert_status AS ENUM ('new','reviewed','resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type public.admin_alert_type NOT NULL,
  severity public.admin_alert_severity NOT NULL DEFAULT 'warning',
  affected_user_id uuid,
  affected_user_email text,
  description text NOT NULL,
  metadata jsonb,
  status public.admin_alert_status NOT NULL DEFAULT 'new',
  action_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_alerts_created_idx ON public.admin_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_alerts_status_idx ON public.admin_alerts (status);

ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read alerts" ON public.admin_alerts;
CREATE POLICY "Admins read alerts" ON public.admin_alerts
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update alerts" ON public.admin_alerts;
CREATE POLICY "Admins update alerts" ON public.admin_alerts
  FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins insert alerts" ON public.admin_alerts;
CREATE POLICY "Admins insert alerts" ON public.admin_alerts
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS admin_alerts_set_updated_at ON public.admin_alerts;
CREATE TRIGGER admin_alerts_set_updated_at
  BEFORE UPDATE ON public.admin_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();