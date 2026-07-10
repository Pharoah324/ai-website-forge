-- Part B / B1 — per-user daily cap counter for analyze-website (optimization runs).
-- Mirrors ai_daily_calls's CALENDAR-DAY model (resets at UTC midnight; NOT
-- ai_ip_calls's rolling window) and bump_ip_calls's SECURITY DEFINER /
-- search_path / default-grant style. Additive; no existing object touched.

CREATE TABLE IF NOT EXISTS public.ai_user_calls (
  user_id uuid    NOT NULL,
  day     date    NOT NULL DEFAULT current_date,
  fn      text    NOT NULL,
  count   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day, fn)
);

-- RLS on, no policy: only the SECURITY DEFINER RPC (called by the service-role
-- edge client) ever reads/writes this table. Mirrors ai_daily_calls.
ALTER TABLE public.ai_user_calls ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.bump_user_calls(_uid uuid, _fn text, _limit integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role  user_role;
  _count integer;
BEGIN
  -- Admin exemption in-RPC (handler never loads profiles): admins never bump.
  SELECT role INTO _role FROM public.profiles WHERE id = _uid;
  IF _role = 'admin' THEN
    RETURN jsonb_build_object('ok', true, 'over', false, 'count', 0, 'admin_bypass', true);
  END IF;

  -- Increment-then-check, calendar-day bucket keyed (user_id, current_date, fn).
  INSERT INTO public.ai_user_calls (user_id, day, fn, count)
  VALUES (_uid, current_date, _fn, 1)
  ON CONFLICT (user_id, day, fn) DO UPDATE SET
    count = public.ai_user_calls.count + 1
  RETURNING count INTO _count;

  -- over = count > _limit  ->  limit 10 allows the 10th, trips the 11th.
  RETURN jsonb_build_object('ok', true, 'over', _count > _limit, 'count', _count, 'admin_bypass', false);
END;
$function$;
