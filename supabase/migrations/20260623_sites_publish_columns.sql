-- Schema-drift fix: the publish/subdomain feature (publish-site fn, LiveSite,
-- getCustomerSubdomain) reads/writes sites.subdomain/published/published_url/
-- published_at, but the live sites table never had them — so publish-site's
-- SELECT errored on the missing columns and returned a misleading 404
-- "Site not found". Additive: existing rows get published=false, subdomain=null.
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS subdomain text;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS published_url text;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Case-insensitive uniqueness for published subdomains (the fn's collision
-- handling expects a DB-level guard; partial so multiple unpublished/null rows ok).
CREATE UNIQUE INDEX IF NOT EXISTS sites_subdomain_lower_uidx
  ON public.sites (lower(subdomain)) WHERE subdomain IS NOT NULL;
