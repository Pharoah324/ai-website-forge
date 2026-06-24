-- Allow anonymous (and authenticated) visitors to read PUBLISHED sites only, so
-- LiveSite can serve published subdomains to logged-out visitors. Unpublished
-- sites stay owner-only (existing "Users can view own sites" policy). No tokens/
-- secrets live in sites; exposed fields are the public site content/name/subdomain.
DROP POLICY IF EXISTS "Public can view published sites" ON public.sites;
CREATE POLICY "Public can view published sites" ON public.sites
  FOR SELECT TO anon, authenticated
  USING (published = true);
