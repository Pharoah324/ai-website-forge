-- Layer 3: per-visitor (per-IP) throttle for the two anonymous AI functions
-- (chat-assistant, translate-batch). Sits ABOVE the global daily breaker so one
-- actor can't exhaust the shared 5,000/day budget and darken the public features
-- for everyone. Self-resetting fixed window, one row per IP. Mirrors the breaker.

CREATE TABLE IF NOT EXISTS public.ai_ip_calls (
  ip           text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count        integer NOT NULL DEFAULT 0
);

-- Locked down: only the SECURITY DEFINER RPC / service role touch it.
ALTER TABLE public.ai_ip_calls ENABLE ROW LEVEL SECURITY;

-- Atomic upsert: if the existing window is older than _window_secs, reset it
-- (count=1, window_start=now()); otherwise increment within the current window.
-- (Inside ON CONFLICT DO UPDATE, references to ai_ip_calls.* are the OLD row.)
-- Returns { ok, count, over } where over = count > _limit. Caller passes the
-- limit/window from env so they're tunable without a code change.
CREATE OR REPLACE FUNCTION public.bump_ip_calls(_ip text, _limit integer, _window_secs integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  INSERT INTO public.ai_ip_calls (ip, window_start, count)
  VALUES (_ip, now(), 1)
  ON CONFLICT (ip) DO UPDATE SET
    window_start = CASE
      WHEN now() - public.ai_ip_calls.window_start > make_interval(secs => _window_secs)
      THEN now() ELSE public.ai_ip_calls.window_start END,
    count = CASE
      WHEN now() - public.ai_ip_calls.window_start > make_interval(secs => _window_secs)
      THEN 1 ELSE public.ai_ip_calls.count + 1 END
  RETURNING count INTO _count;

  RETURN jsonb_build_object('ok', true, 'count', _count, 'over', _count > _limit);
END;
$$;
