DROP POLICY IF EXISTS "Anyone can view shared sites" ON public.sites;
DROP POLICY IF EXISTS "Agency owner reads workspace sites" ON public.sites;
DROP POLICY IF EXISTS "Agency owner updates workspace sites" ON public.sites;
DROP POLICY IF EXISTS "Agency owner deletes workspace sites" ON public.sites;
DROP POLICY IF EXISTS "Users can insert own sites" ON public.sites;

DROP POLICY IF EXISTS "Users can view own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can create own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can update own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can delete own sites" ON public.sites;

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