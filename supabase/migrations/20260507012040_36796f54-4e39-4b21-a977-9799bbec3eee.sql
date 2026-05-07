-- Enums
CREATE TYPE public.affiliate_tier AS ENUM ('starter', 'pro', 'elite', 'agency_partner');
CREATE TYPE public.affiliate_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE public.conversion_status AS ENUM ('pending', 'confirmed', 'paid');
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'paid', 'failed');

-- Admin users table (separate from profiles to avoid privilege escalation)
CREATE TABLE public.admin_users (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _user_id) $$;

CREATE POLICY "Admins view admin list" ON public.admin_users FOR SELECT USING (public.is_admin(auth.uid()));

-- Affiliate code generator
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT;
  i INT;
BEGIN
  LOOP
    code := 'VEB-';
    FOR i IN 1..4 LOOP
      code := code || substr(chars, (floor(random() * length(chars))::int + 1), 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliates WHERE affiliate_code = code);
  END LOOP;
  RETURN code;
END;
$$;

-- Affiliates table
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  affiliate_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  website_url TEXT,
  promotion_plan TEXT,
  expected_referrals TEXT,
  paypal_email TEXT NOT NULL,
  tier public.affiliate_tier NOT NULL DEFAULT 'starter',
  status public.affiliate_status NOT NULL DEFAULT 'pending',
  total_referrals INT NOT NULL DEFAULT 0,
  active_subscribers INT NOT NULL DEFAULT 0,
  total_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_payout NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_out_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can apply" ON public.affiliates FOR INSERT WITH CHECK (true);
CREATE POLICY "Affiliates view self" ON public.affiliates FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Affiliates update own paypal" ON public.affiliates FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage affiliates" ON public.affiliates FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete affiliates" ON public.affiliates FOR DELETE USING (public.is_admin(auth.uid()));

CREATE TRIGGER affiliates_updated BEFORE UPDATE ON public.affiliates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Referral conversions
CREATE TABLE public.referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL,
  plan_subscribed TEXT NOT NULL,
  monthly_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 30,
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.conversion_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate views own conversions" ON public.referral_conversions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "Admins manage conversions" ON public.referral_conversions FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Payouts
CREATE TABLE public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'paypal',
  status public.payout_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate views own payouts" ON public.affiliate_payouts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "Affiliate requests payout" ON public.affiliate_payouts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid() AND a.status = 'active')
);
CREATE POLICY "Admins manage payouts" ON public.affiliate_payouts FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_affiliates_code ON public.affiliates(affiliate_code);
CREATE INDEX idx_affiliates_user ON public.affiliates(user_id);
CREATE INDEX idx_conversions_affiliate ON public.referral_conversions(affiliate_id);
CREATE INDEX idx_payouts_affiliate ON public.affiliate_payouts(affiliate_id);