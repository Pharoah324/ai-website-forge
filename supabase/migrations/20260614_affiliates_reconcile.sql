-- Reconcile the live `affiliates` table with what the code expects. The live
-- table was a stripped stub (referral_code/is_active/total_earned/total_paid)
-- while the code uses a full affiliate-program schema (affiliate_code, status,
-- tier, paypal_email, pending_payout, etc.) — so apply/dashboard/admin were all
-- broken. Table is empty (0 rows) so this is purely additive (no backfill).
-- Chose to align the DB to the code (no frontend changes / redeploy).

BEGIN;

ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS affiliate_code text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS paypal_email text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS promotion_plan text,
  ADD COLUMN IF NOT EXISTS expected_referrals text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS total_earnings numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_payout numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_out_total numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_subscribers int NOT NULL DEFAULT 0;

-- The apply-form insert omits referral_code (NOT NULL, no default) — give it one
-- so applications succeed. The app uses affiliate_code; referral_code is legacy.
ALTER TABLE public.affiliates
  ALTER COLUMN referral_code SET DEFAULT 'VEB-' || upper(substr(md5(random()::text), 1, 6));

-- Missing policies: public affiliate application (INSERT) + admin read/manage.
DROP POLICY IF EXISTS "Public can apply affiliate" ON public.affiliates;
CREATE POLICY "Public can apply affiliate" ON public.affiliates
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins view all affiliates" ON public.affiliates;
CREATE POLICY "Admins view all affiliates" ON public.affiliates
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage affiliates" ON public.affiliates;
CREATE POLICY "Admins manage affiliates" ON public.affiliates
  FOR UPDATE USING (public.is_admin(auth.uid()));

COMMIT;
