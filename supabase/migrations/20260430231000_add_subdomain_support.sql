-- Add subdomain support to sites table
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

-- Index for fast subdomain lookups
CREATE INDEX IF NOT EXISTS idx_sites_subdomain ON public.sites(subdomain) WHERE subdomain IS NOT NULL;

-- Update RLS policies to allow public access to published sites
CREATE POLICY "Anyone can view published sites by subdomain"
  ON public.sites FOR SELECT
  USING (is_published = true AND subdomain IS NOT NULL);