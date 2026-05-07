-- Replace permissive insert with strict check
DROP POLICY "Public can apply" ON public.affiliates;
CREATE POLICY "Public can apply" ON public.affiliates FOR INSERT WITH CHECK (
  status = 'pending'
  AND tier = 'starter'
  AND total_referrals = 0
  AND active_subscribers = 0
  AND total_earnings = 0
  AND pending_payout = 0
  AND paid_out_total = 0
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_affiliate_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_affiliate_code() TO service_role;