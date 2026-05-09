
-- Auto-promote admins to Agency plan with full access; whitelist owner emails

-- 1. Promote any current admin to agency plan with generous credits
UPDATE public.profiles p
SET plan = 'agency',
    build_credits = GREATEST(build_credits, 100000),
    runtime_credits = GREATEST(runtime_credits, 1000000),
    monthly_build_limit = 100000,
    monthly_runtime_limit = 1000000,
    billing_status = 'active'
WHERE EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = p.id);

-- 2. Function: when a user becomes admin, upgrade their profile
CREATE OR REPLACE FUNCTION public.promote_admin_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET plan = 'agency',
      build_credits = GREATEST(build_credits, 100000),
      runtime_credits = GREATEST(runtime_credits, 1000000),
      monthly_build_limit = 100000,
      monthly_runtime_limit = 1000000,
      billing_status = 'active'
  WHERE id = NEW.user_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_promote_admin_profile ON public.admin_users;
CREATE TRIGGER trg_promote_admin_profile
AFTER INSERT ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.promote_admin_profile();

-- 3. Owner email whitelist: auto-grant admin + agency on profile creation
CREATE OR REPLACE FUNCTION public.auto_grant_owner_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND lower(NEW.email) IN ('admin@virtualengine.ai','pharaohowens@gmail.com') THEN
    INSERT INTO public.admin_users (user_id, email, name, access_level, notes)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.display_name, 'Owner'), 'super_admin', 'Auto-granted owner access')
    ON CONFLICT (user_id) DO UPDATE SET access_level = 'super_admin';

    NEW.plan := 'agency';
    NEW.build_credits := GREATEST(COALESCE(NEW.build_credits,0), 100000);
    NEW.runtime_credits := GREATEST(COALESCE(NEW.runtime_credits,0), 1000000);
    NEW.monthly_build_limit := 100000;
    NEW.monthly_runtime_limit := 1000000;
    NEW.billing_status := 'active';
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_auto_grant_owner_admin ON public.profiles;
CREATE TRIGGER trg_auto_grant_owner_admin
BEFORE INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_grant_owner_admin();

-- 4. Add unique constraint on admin_users.user_id if missing (needed for ON CONFLICT)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_users_user_id_key'
  ) THEN
    ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 5. If pharaohowens@gmail.com profile already exists, promote now
UPDATE public.profiles
SET plan = 'agency',
    build_credits = GREATEST(build_credits, 100000),
    runtime_credits = GREATEST(runtime_credits, 1000000),
    monthly_build_limit = 100000,
    monthly_runtime_limit = 1000000,
    billing_status = 'active',
    role = 'admin'
WHERE lower(email) IN ('admin@virtualengine.ai','pharaohowens@gmail.com');

INSERT INTO public.admin_users (user_id, email, name, access_level, notes)
SELECT p.id, p.email, COALESCE(p.display_name,'Owner'), 'super_admin', 'Auto-granted owner access'
FROM public.profiles p
WHERE lower(p.email) IN ('admin@virtualengine.ai','pharaohowens@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET access_level = 'super_admin';
