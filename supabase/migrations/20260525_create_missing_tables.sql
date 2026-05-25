-- Create missing tables for production Supabase
-- This migration consolidates admin_users, admin_alerts, and agency_workspaces

-- ============================================================================
-- 1. ADMIN_USERS TABLE (if not already created)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY,
  access_level TEXT NOT NULL DEFAULT 'admin',
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Function to check admin status (if not already created)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _user_id) $$;

-- Admin policy (if not already exists)
DO $$ BEGIN
  CREATE POLICY "Admins view admin list" ON public.admin_users FOR SELECT USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 2. ADMIN_ALERTS TABLE (if not already created)
-- ============================================================================

-- Create enum types (if not already created)
DO $$ BEGIN
  CREATE TYPE public.admin_alert_type AS ENUM ('dispute','abuse','server_error','credit_anomaly','signup_abuse','frontend_crash','other');
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

-- Admin alert policies (if not already exist)
DO $$ BEGIN
  CREATE POLICY "Admins read alerts" ON public.admin_alerts FOR SELECT USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins update alerts" ON public.admin_alerts FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins insert alerts" ON public.admin_alerts FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin alert trigger (if not already created)
DO $$ BEGIN
  DROP TRIGGER IF EXISTS admin_alerts_set_updated_at ON public.admin_alerts;
  CREATE TRIGGER admin_alerts_set_updated_at
    BEFORE UPDATE ON public.admin_alerts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- 3. AGENCY_WORKSPACES TABLE (if not already created)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agency_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_user_id uuid NOT NULL,
  name text NOT NULL,
  client_email text,
  client_user_id uuid,
  monthly_build_allocation int NOT NULL DEFAULT 50,
  monthly_runtime_allocation int NOT NULL DEFAULT 1000,
  used_build_this_cycle int NOT NULL DEFAULT 0,
  used_runtime_this_cycle int NOT NULL DEFAULT 0,
  cycle_start timestamptz NOT NULL DEFAULT now(),
  client_invited_at timestamptz,
  wl_enabled boolean DEFAULT false,
  wl_brand_name text,
  wl_logo_url text,
  wl_primary_color text,
  wl_accent_color text,
  wl_hide_branding boolean DEFAULT false,
  wl_footer_text text,
  wl_support_email text,
  brand_voice_samples text,
  brand_voice_active boolean DEFAULT false,
  voice_rules text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_workspaces_owner ON public.agency_workspaces(agency_user_id);
CREATE INDEX IF NOT EXISTS idx_agency_workspaces_client ON public.agency_workspaces(client_user_id);

ALTER TABLE public.agency_workspaces ENABLE ROW LEVEL SECURITY;

-- Agency workspace policies (if not already exist)
DO $$ BEGIN
  CREATE POLICY "Agency owner manages workspaces" ON public.agency_workspaces FOR ALL
    USING (auth.uid() = agency_user_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = agency_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Linked client views workspace" ON public.agency_workspaces FOR SELECT
    USING (auth.uid() = client_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Agency workspace trigger (if not already created)
DO $$ BEGIN
  DROP TRIGGER IF EXISTS trg_agency_workspaces_updated ON public.agency_workspaces;
  CREATE TRIGGER trg_agency_workspaces_updated
    BEFORE UPDATE ON public.agency_workspaces
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- 4. WORKSPACE_INVITES TABLE (if not already created)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.agency_workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace ON public.workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON public.workspace_invites(token);

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- Workspace invite policies (if not already exist)
DO $$ BEGIN
  CREATE POLICY "Agency owner manages invites" ON public.workspace_invites FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.agency_workspaces w
      WHERE w.id = workspace_invites.workspace_id AND w.agency_user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.agency_workspaces w
      WHERE w.id = workspace_invites.workspace_id AND w.agency_user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 5. ADD WORKSPACE_ID TO SITES (if not already added)
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE public.sites ADD COLUMN workspace_id uuid REFERENCES public.agency_workspaces(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_sites_workspace ON public.sites(workspace_id);

-- Sites workspace policies (if not already exist)
DO $$ BEGIN
  CREATE POLICY "Agency owner reads workspace sites" ON public.sites FOR SELECT
    USING (workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.agency_workspaces w
      WHERE w.id = sites.workspace_id AND w.agency_user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Agency owner updates workspace sites" ON public.sites FOR UPDATE
    USING (workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.agency_workspaces w
      WHERE w.id = sites.workspace_id AND w.agency_user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Agency owner deletes workspace sites" ON public.sites FOR DELETE
    USING (workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.agency_workspaces w
      WHERE w.id = sites.workspace_id AND w.agency_user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
