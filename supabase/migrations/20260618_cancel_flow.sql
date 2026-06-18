-- In-app cancellation (Blocker #2). Cancel is "at period end": the user keeps
-- their paid plan until the current period ends, then the webhook drops them to
-- free. These columns let the UI reflect the pending cancellation + end date and
-- offer a Resume action before it takes effect.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_period_end timestamptz;
