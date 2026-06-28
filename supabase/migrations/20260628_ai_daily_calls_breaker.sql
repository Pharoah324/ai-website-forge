-- Global daily circuit breaker for Anthropic calls (abuse/runaway backstop).
-- A single counter row per day; the breaker function increments atomically and
-- reports whether the day's total has exceeded the caller-supplied limit. Wired
-- (this session) into the two anonymous functions (chat-assistant, translate-batch)
-- which have no auth and no credit gate. Authed functions are a separate follow-up.

CREATE TABLE IF NOT EXISTS public.ai_daily_calls (
  day   date PRIMARY KEY,
  count integer NOT NULL DEFAULT 0
);

-- Locked down: only the SECURITY DEFINER function / service role touch it.
ALTER TABLE public.ai_daily_calls ENABLE ROW LEVEL SECURITY;

-- Atomic increment-and-check. Returns { ok, count, over }.
-- Increment-then-check: the call that trips the limit is still counted (harmless —
-- it keeps the breaker tripped) but the caller returns 503 without calling Anthropic.
-- So exactly `_limit` Anthropic calls/day are allowed, then blocked.
CREATE OR REPLACE FUNCTION public.bump_ai_calls(_limit integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  INSERT INTO public.ai_daily_calls (day, count)
  VALUES (current_date, 1)
  ON CONFLICT (day) DO UPDATE SET count = public.ai_daily_calls.count + 1
  RETURNING count INTO _count;

  RETURN jsonb_build_object('ok', true, 'count', _count, 'over', _count > _limit);
END;
$$;
