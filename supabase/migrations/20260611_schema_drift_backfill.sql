-- Schema-drift backfill. Audit found the live DB was never built from these
-- migrations: 11 code-referenced tables and several functions were missing,
-- causing recurring "feature broken / failed to fetch" bugs. All required enum
-- types and FK targets already exist live, so this creates the missing tables +
-- foundational/read-only functions. Idempotent (safe to re-run).
-- NOTE: 5 mutating functions (redeem_access_code, refund_credits,
-- detect_abuse_and_pause, resume_account, downgrade_past_due_users) are
-- intentionally NOT included here — they mutate profiles/credits/billing and
-- need per-function validation against the live schema before deploying.

BEGIN;

-- ---------- foundational functions ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $fn$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $fn$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn$ SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _user_id) $fn$;

-- ---------- credit_ledger ----------
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.credit_kind NOT NULL,
  amount integer NOT NULL,
  reason public.ledger_reason NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON public.credit_ledger(user_id, created_at DESC);
DROP POLICY IF EXISTS "Users can view own ledger" ON public.credit_ledger;
CREATE POLICY "Users can view own ledger" ON public.credit_ledger
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ---------- plan_caps ----------
CREATE TABLE IF NOT EXISTS public.plan_caps (
  plan text PRIMARY KEY,
  daily_site_generations int NOT NULL,
  daily_optimization_runs int NOT NULL,
  hourly_api_calls int NOT NULL,
  max_sites int NOT NULL,
  max_optimization_reports int NOT NULL,
  max_upload_mb int NOT NULL,
  search_atlas_enabled boolean NOT NULL DEFAULT false,
  gsc_enabled boolean NOT NULL DEFAULT false
);
ALTER TABLE public.plan_caps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads plan caps" ON public.plan_caps;
CREATE POLICY "Anyone reads plan caps" ON public.plan_caps FOR SELECT USING (true);
INSERT INTO public.plan_caps
  (plan, daily_site_generations, daily_optimization_runs, hourly_api_calls,
   max_sites, max_optimization_reports, max_upload_mb, search_atlas_enabled, gsc_enabled)
VALUES
  ('free',3,1,20,1,5,0,false,false),
  ('starter',10,3,100,3,20,10,false,false),
  ('builder',30,10,500,10,100,50,true,false),
  ('pro',75,30,2000,25,-1,200,true,true),
  ('agency',200,-1,5000,-1,-1,1024,true,true)
ON CONFLICT (plan) DO NOTHING;

-- ---------- site_seo ----------
CREATE TABLE IF NOT EXISTS public.site_seo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  meta_title text,
  meta_description text,
  keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  blog_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  industry text,
  location text,
  source text NOT NULL DEFAULT 'search_atlas',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_seo ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_site_seo_user ON public.site_seo(user_id);
DROP POLICY IF EXISTS "Owner reads seo" ON public.site_seo;
DROP POLICY IF EXISTS "Owner inserts seo" ON public.site_seo;
DROP POLICY IF EXISTS "Owner updates seo" ON public.site_seo;
CREATE POLICY "Owner reads seo" ON public.site_seo FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Owner inserts seo" ON public.site_seo FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner updates seo" ON public.site_seo FOR UPDATE USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS site_seo_updated_at ON public.site_seo;
CREATE TRIGGER site_seo_updated_at BEFORE UPDATE ON public.site_seo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- launch_test_results ----------
CREATE TABLE IF NOT EXISTS public.launch_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_key text NOT NULL,
  section text NOT NULL,
  status text NOT NULL CHECK (status IN ('pass','fail','not_tested','running')),
  details jsonb,
  error_message text,
  run_by_admin uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_launch_test_key_created ON public.launch_test_results (test_key, created_at DESC);
ALTER TABLE public.launch_test_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read launch tests" ON public.launch_test_results;
DROP POLICY IF EXISTS "Admins insert launch tests" ON public.launch_test_results;
CREATE POLICY "Admins read launch tests" ON public.launch_test_results FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert launch tests" ON public.launch_test_results FOR INSERT WITH CHECK (public.is_admin(auth.uid()) AND run_by_admin = auth.uid());

-- ---------- stripe_products / stripe_events ----------
CREATE TABLE IF NOT EXISTS public.stripe_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  plan_tier text,
  interval text,
  pack_id text,
  stripe_product_id text NOT NULL,
  stripe_price_id text NOT NULL UNIQUE,
  amount_cents integer NOT NULL,
  build_credits integer NOT NULL DEFAULT 0,
  runtime_credits integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stripe_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view stripe products" ON public.stripe_products;
CREATE POLICY "Anyone can view stripe products" ON public.stripe_products FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- no policies: service-role only

-- ---------- access_codes (+ redemptions) ----------
CREATE TABLE IF NOT EXISTS public.access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  plan_granted text NOT NULL DEFAULT 'starter',
  credits_granted int NOT NULL DEFAULT 0,
  runtime_credits_granted int NOT NULL DEFAULT 0,
  max_uses int NOT NULL DEFAULT 1,
  times_used int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage codes" ON public.access_codes;
CREATE POLICY "Admins manage codes" ON public.access_codes FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.access_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.access_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.access_code_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User views own redemptions" ON public.access_code_redemptions;
CREATE POLICY "User views own redemptions" ON public.access_code_redemptions FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ---------- account_flags ----------
CREATE TABLE IF NOT EXISTS public.account_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  flag_type public.account_flag_type NOT NULL,
  triggered_by text NOT NULL DEFAULT 'system',
  reason text NOT NULL,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by_admin uuid,
  resolved_at timestamptz,
  notes text,
  metadata jsonb
);
ALTER TABLE public.account_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage flags" ON public.account_flags;
DROP POLICY IF EXISTS "Users read own flags" ON public.account_flags;
CREATE POLICY "Admins manage flags" ON public.account_flags FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Users read own flags" ON public.account_flags FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ---------- affiliate_payouts / referral_conversions (affiliates already exists) ----------
CREATE TABLE IF NOT EXISTS public.referral_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL,
  plan_subscribed text NOT NULL,
  monthly_value numeric(10,2) NOT NULL DEFAULT 0,
  commission_rate numeric(5,2) NOT NULL DEFAULT 30,
  commission_amount numeric(10,2) NOT NULL DEFAULT 0,
  status public.conversion_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_conversions_affiliate ON public.referral_conversions(affiliate_id);
DROP POLICY IF EXISTS "Affiliate views own conversions" ON public.referral_conversions;
DROP POLICY IF EXISTS "Admins manage conversions" ON public.referral_conversions;
CREATE POLICY "Affiliate views own conversions" ON public.referral_conversions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage conversions" ON public.referral_conversions FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  method text NOT NULL DEFAULT 'paypal',
  status public.payout_status NOT NULL DEFAULT 'pending',
  notes text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_payouts_affiliate ON public.affiliate_payouts(affiliate_id);
DROP POLICY IF EXISTS "Affiliate views own payouts" ON public.affiliate_payouts;
DROP POLICY IF EXISTS "Affiliate requests payout" ON public.affiliate_payouts;
DROP POLICY IF EXISTS "Admins manage payouts" ON public.affiliate_payouts;
CREATE POLICY "Affiliate views own payouts" ON public.affiliate_payouts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Affiliate requests payout" ON public.affiliate_payouts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid() AND a.is_active = true));
CREATE POLICY "Admins manage payouts" ON public.affiliate_payouts FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ---------- workspace_invites ----------
CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.agency_workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace ON public.workspace_invites(workspace_id);
DROP POLICY IF EXISTS "Agency owner manages invites" ON public.workspace_invites;
CREATE POLICY "Agency owner manages invites" ON public.workspace_invites FOR ALL
  USING (EXISTS (SELECT 1 FROM public.agency_workspaces w WHERE w.id = workspace_invites.workspace_id AND w.agency_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.agency_workspaces w WHERE w.id = workspace_invites.workspace_id AND w.agency_user_id = auth.uid()));

-- ---------- get_site_branding (read-only) ----------
CREATE OR REPLACE FUNCTION public.get_site_branding(p_site_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT CASE
    WHEN w.id IS NULL OR w.wl_enabled = false THEN NULL
    ELSE jsonb_build_object(
      'brand_name', w.wl_brand_name, 'logo_url', w.wl_logo_url,
      'primary_color', w.wl_primary_color, 'accent_color', w.wl_accent_color,
      'hide_branding', w.wl_hide_branding, 'footer_text', w.wl_footer_text,
      'support_email', w.wl_support_email)
  END
  FROM public.sites s
  LEFT JOIN public.agency_workspaces w ON w.id = s.workspace_id
  WHERE s.id = p_site_id;
$fn$;

COMMIT;
