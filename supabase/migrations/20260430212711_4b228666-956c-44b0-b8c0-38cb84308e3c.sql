ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS billing_cycle_start timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS monthly_build_limit integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS monthly_runtime_limit integer NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS rollover_build_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rollover_runtime_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS top_up_build_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS top_up_runtime_credits integer NOT NULL DEFAULT 0;

-- Backfill monthly limits based on existing plan for current rows
UPDATE public.profiles SET
  monthly_build_limit = CASE plan
    WHEN 'free' THEN 20
    WHEN 'starter' THEN 100
    WHEN 'builder' THEN 300
    WHEN 'pro' THEN 750
    WHEN 'agency' THEN 2147483647
    ELSE 20
  END,
  monthly_runtime_limit = CASE plan
    WHEN 'free' THEN 300
    WHEN 'starter' THEN 2500
    WHEN 'builder' THEN 12000
    WHEN 'pro' THEN 35000
    WHEN 'agency' THEN 100000
    ELSE 300
  END
WHERE monthly_build_limit = 20 AND monthly_runtime_limit = 300;