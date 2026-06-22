-- Affiliate earnings (Stage 4): the missing link that turns tracked referrals
-- into accrued commission. Called from the Stripe webhook on each successful
-- recurring payment (initial + renewals) and on cancellation.
--
-- Model: 30% (the conversion's stored commission_rate) of the plan's MONTHLY
-- price, accrued every paid month for the life of the referred subscription.
-- Payout disbursement stays a manual admin action (affiliate_payouts).

CREATE OR REPLACE FUNCTION public.record_affiliate_commission(
  p_referred_user uuid,
  p_plan text,
  p_monthly numeric,
  p_is_first boolean
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.referral_conversions;
  v_rate numeric;
  v_commission numeric;
BEGIN
  -- Most recent referral conversion for this user (if they were referred).
  SELECT * INTO v_conv
  FROM public.referral_conversions
  WHERE referred_user_id = p_referred_user
  ORDER BY created_at DESC
  LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;

  v_rate := coalesce(v_conv.commission_rate, 30);
  v_commission := round(p_monthly * v_rate / 100.0, 2);

  -- Confirm the conversion + record the per-month figures.
  UPDATE public.referral_conversions
  SET plan_subscribed = p_plan,
      monthly_value = p_monthly,
      commission_amount = v_commission,
      status = 'confirmed'
  WHERE id = v_conv.id;

  -- Accrue this month's commission to the affiliate. active_subscribers only
  -- bumps on the first paid month of a subscription.
  UPDATE public.affiliates
  SET total_earnings = coalesce(total_earnings, 0) + v_commission,
      pending_payout = coalesce(pending_payout, 0) + v_commission,
      total_earned   = coalesce(total_earned, 0) + v_commission,
      active_subscribers = coalesce(active_subscribers, 0) + (CASE WHEN p_is_first THEN 1 ELSE 0 END),
      updated_at = now()
  WHERE id = v_conv.affiliate_id;
EXCEPTION WHEN OTHERS THEN
  -- Never let commission accounting break the webhook / billing.
  RAISE WARNING 'record_affiliate_commission failed: %', SQLERRM;
END $$;

CREATE OR REPLACE FUNCTION public.release_affiliate_subscriber(p_referred_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.referral_conversions;
BEGIN
  SELECT * INTO v_conv
  FROM public.referral_conversions
  WHERE referred_user_id = p_referred_user
  ORDER BY created_at DESC
  LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;

  -- Subscription ended: stop counting as active. Already-earned commission stays.
  UPDATE public.affiliates
  SET active_subscribers = GREATEST(coalesce(active_subscribers, 0) - 1, 0),
      updated_at = now()
  WHERE id = v_conv.affiliate_id;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'release_affiliate_subscriber failed: %', SQLERRM;
END $$;
