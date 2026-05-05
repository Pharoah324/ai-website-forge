
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS subdomain text,
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;

CREATE UNIQUE INDEX IF NOT EXISTS sites_subdomain_unique_idx
  ON public.sites (lower(subdomain))
  WHERE subdomain IS NOT NULL;

CREATE INDEX IF NOT EXISTS sites_published_idx
  ON public.sites (published)
  WHERE published = true;

ALTER TABLE public.sites
  ADD CONSTRAINT sites_subdomain_format_chk
  CHECK (subdomain IS NULL OR subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$');
