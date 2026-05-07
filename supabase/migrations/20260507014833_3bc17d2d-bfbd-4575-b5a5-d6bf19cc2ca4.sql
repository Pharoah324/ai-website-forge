
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('user','admin','agency','affiliate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'user';

DO $$ BEGIN
  CREATE TYPE public.admin_access_level AS ENUM ('super_admin','admin','support');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS access_level public.admin_access_level NOT NULL DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS added_by uuid,
  ADD COLUMN IF NOT EXISTS last_active timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE OR REPLACE FUNCTION public.get_admin_level(_user_id uuid)
RETURNS public.admin_access_level
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT access_level FROM public.admin_users WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _user_id AND access_level = 'super_admin');
$$;

DROP POLICY IF EXISTS "Super admin manages admins" ON public.admin_users;
CREATE POLICY "Super admin manages admins" ON public.admin_users
  FOR ALL USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.admin_usage_log (
  log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action_type text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_usage_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read usage" ON public.admin_usage_log;
CREATE POLICY "Admins read usage" ON public.admin_usage_log
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  plan_granted text NOT NULL DEFAULT 'starter',
  credits_granted int NOT NULL DEFAULT 0,
  runtime_credits_granted int NOT NULL DEFAULT 0,
  max_uses int NOT NULL DEFAULT 1,
  times_used int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage codes" ON public.access_codes;
CREATE POLICY "Admins manage codes" ON public.access_codes
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.access_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.access_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.access_code_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User views own redemptions" ON public.access_code_redemptions;
CREATE POLICY "User views own redemptions" ON public.access_code_redemptions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  variant text NOT NULL DEFAULT 'info',
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads active announcements" ON public.announcements;
CREATE POLICY "Anyone reads active announcements" ON public.announcements
  FOR SELECT USING (active = true AND (expires_at IS NULL OR expires_at > now()));
DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
CREATE POLICY "Admins manage announcements" ON public.announcements
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.redeem_access_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.access_codes;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Not authenticated'); END IF;
  SELECT * INTO c FROM public.access_codes WHERE code = upper(_code) AND active = true LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Invalid code'); END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN RETURN jsonb_build_object('ok',false,'error','Code expired'); END IF;
  IF c.max_uses > 0 AND c.times_used >= c.max_uses THEN RETURN jsonb_build_object('ok',false,'error','Code fully used'); END IF;
  IF EXISTS (SELECT 1 FROM public.access_code_redemptions WHERE code_id = c.id AND user_id = uid) THEN
    RETURN jsonb_build_object('ok',false,'error','Already redeemed');
  END IF;
  UPDATE public.profiles
    SET plan = c.plan_granted::plan_tier,
        build_credits = build_credits + c.credits_granted,
        runtime_credits = runtime_credits + c.runtime_credits_granted
    WHERE id = uid;
  INSERT INTO public.access_code_redemptions (code_id, user_id) VALUES (c.id, uid);
  UPDATE public.access_codes SET times_used = times_used + 1,
    active = CASE WHEN max_uses > 0 AND times_used + 1 >= max_uses THEN false ELSE active END
    WHERE id = c.id;
  RETURN jsonb_build_object('ok',true,'plan',c.plan_granted,'credits',c.credits_granted);
END $$;

DO $$
DECLARE u uuid; BEGIN
  SELECT id INTO u FROM auth.users WHERE email = 'pharoahowens@gmail.com' LIMIT 1;
  IF u IS NOT NULL THEN
    INSERT INTO public.admin_users (user_id, email, name, access_level, notes)
    VALUES (u, 'pharoahowens@gmail.com', 'Pharoah Owens', 'super_admin', 'Platform owner')
    ON CONFLICT (user_id) DO UPDATE SET access_level = 'super_admin', email = EXCLUDED.email, name = EXCLUDED.name;
    UPDATE public.profiles SET role = 'admin' WHERE id = u;
  END IF;
  SELECT id INTO u FROM auth.users WHERE email = 'admin@virtualengine.ai' LIMIT 1;
  IF u IS NOT NULL THEN
    INSERT INTO public.admin_users (user_id, email, name, access_level, notes)
    VALUES (u, 'admin@virtualengine.ai', 'Admin', 'super_admin', 'Platform admin')
    ON CONFLICT (user_id) DO UPDATE SET access_level = 'super_admin', email = EXCLUDED.email;
    UPDATE public.profiles SET role = 'admin' WHERE id = u;
  END IF;
END $$;

ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_user_id_unique UNIQUE (user_id);
