CREATE TABLE IF NOT EXISTS public.sites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Untitled Site',
  prompt text NOT NULL,
  site_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  published_url text,
  workspace_id uuid
);

ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Untitled Site',
  ADD COLUMN IF NOT EXISTS prompt text,
  ADD COLUMN IF NOT EXISTS site_data jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS published_url text,
  ADD COLUMN IF NOT EXISTS workspace_id uuid;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sites' AND column_name = 'content'
  ) THEN
    EXECUTE 'UPDATE public.sites SET site_data = COALESCE(site_data, content) WHERE site_data IS NULL';
  END IF;
END $$;

UPDATE public.sites SET name = 'Untitled Site' WHERE name IS NULL;
UPDATE public.sites SET prompt = '' WHERE prompt IS NULL;
ALTER TABLE public.sites ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.sites ALTER COLUMN name SET NOT NULL;
ALTER TABLE public.sites ALTER COLUMN prompt SET NOT NULL;
ALTER TABLE public.sites ALTER COLUMN site_data SET DEFAULT '{}'::jsonb;
UPDATE public.sites SET site_data = '{}'::jsonb WHERE site_data IS NULL;
ALTER TABLE public.sites ALTER COLUMN site_data SET NOT NULL;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_sites_updated_at ON public.sites;
CREATE TRIGGER set_sites_updated_at
BEFORE UPDATE ON public.sites
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can create own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can update own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can delete own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can view their own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can insert their own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can update their own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can delete their own sites" ON public.sites;

CREATE POLICY "Users can view own sites"
ON public.sites
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sites"
ON public.sites
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sites"
ON public.sites
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sites"
ON public.sites
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS sites_user_id_created_at_idx ON public.sites (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sites_workspace_id_idx ON public.sites (workspace_id);