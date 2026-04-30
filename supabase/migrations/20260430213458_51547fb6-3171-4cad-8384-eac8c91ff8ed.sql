-- Profile-level Stripe fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS billing_interval text NOT NULL DEFAULT 'monthly';

-- Stripe price catalog (populated by setup-stripe-products edge function on first run)
CREATE TABLE IF NOT EXISTS public.stripe_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,                   -- 'subscription' | 'topup'
  plan_tier text,                       -- free/starter/builder/pro/agency  (subscription only)
  interval text,                        -- monthly/annual                   (subscription only)
  pack_id text,                         -- starter_boost/growth_pack/agency_burst (topup only)
  stripe_product_id text NOT NULL,
  stripe_price_id text NOT NULL UNIQUE,
  amount_cents integer NOT NULL,
  build_credits integer NOT NULL DEFAULT 0,
  runtime_credits integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stripe products"
  ON public.stripe_products FOR SELECT
  USING (true);

-- Webhook idempotency log
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,                  -- Stripe event id (evt_...)
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- No policies = only service role can read/write