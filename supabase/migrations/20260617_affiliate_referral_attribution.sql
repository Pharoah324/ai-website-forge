-- Stage 2 (affiliate flow): attribute a referred signup to the affiliate.
-- The frontend captures ?ref=VEB-XXXX and carries it into the new user's auth
-- metadata as affiliate_ref, but nothing converted that into a tracked referral.
-- This AFTER INSERT trigger on auth.users records a referral_conversions row
-- (status 'pending') and bumps the affiliate's total_referrals.
--
-- Safety: SECURITY DEFINER, isolated from the existing on_auth_user_created
-- trigger, and wrapped in EXCEPTION WHEN OTHERS so attribution can NEVER block
-- account creation. No money is moved here — commission stays 0/'pending' until
-- a subscription is confirmed (handled separately in the Stripe webhook later).

CREATE OR REPLACE FUNCTION public.attribute_affiliate_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref text;
  v_aff public.affiliates;
BEGIN
  v_ref := upper(coalesce(NEW.raw_user_meta_data->>'affiliate_ref', ''));
  IF v_ref = '' THEN RETURN NEW; END IF;

  SELECT * INTO v_aff FROM public.affiliates WHERE upper(affiliate_code) = v_ref LIMIT 1;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- No self-referral.
  IF v_aff.user_id = NEW.id THEN RETURN NEW; END IF;

  -- Idempotent: don't double-attribute the same user to the same affiliate.
  IF EXISTS (
    SELECT 1 FROM public.referral_conversions
    WHERE affiliate_id = v_aff.id AND referred_user_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.referral_conversions
    (affiliate_id, referred_user_id, plan_subscribed, monthly_value, commission_rate, commission_amount, status)
  VALUES
    (v_aff.id, NEW.id, 'signup', 0, coalesce(v_aff.commission_rate, 30), 0, 'pending');

  UPDATE public.affiliates
    SET total_referrals = coalesce(total_referrals, 0) + 1, updated_at = now()
    WHERE id = v_aff.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Attribution must never break signup.
  RAISE WARNING 'attribute_affiliate_referral failed: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_referral ON auth.users;
CREATE TRIGGER on_auth_user_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.attribute_affiliate_referral();
