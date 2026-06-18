-- Deferred-downgrade support for the single-subscription-per-customer model.
-- When a customer downgrades, we keep their current (higher) plan + credits for
-- the cycle they paid for and stash the target tier here; the Stripe-webhook
-- renewal handler applies it at the next billing cycle, then clears it.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS scheduled_plan text;
