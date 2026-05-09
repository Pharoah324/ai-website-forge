-- White-label columns on agency_workspaces
ALTER TABLE public.agency_workspaces
  ADD COLUMN IF NOT EXISTS wl_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wl_brand_name text,
  ADD COLUMN IF NOT EXISTS wl_logo_url text,
  ADD COLUMN IF NOT EXISTS wl_primary_color text,
  ADD COLUMN IF NOT EXISTS wl_accent_color text,
  ADD COLUMN IF NOT EXISTS wl_hide_branding boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wl_footer_text text,
  ADD COLUMN IF NOT EXISTS wl_support_email text;

-- Storage bucket for white-label logos (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-branding', 'workspace-branding', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view logos
CREATE POLICY "Workspace branding logos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'workspace-branding');

-- Agency owner uploads under their user-id folder
CREATE POLICY "Agency owner uploads workspace branding"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'workspace-branding'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Agency owner updates workspace branding"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'workspace-branding'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Agency owner deletes workspace branding"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'workspace-branding'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public lookup of branding for a given site (used by share/subdomain/live pages).
-- Returns null/empty when site has no workspace or white-label is disabled.
CREATE OR REPLACE FUNCTION public.get_site_branding(p_site_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN w.id IS NULL OR w.wl_enabled = false THEN NULL
    ELSE jsonb_build_object(
      'brand_name', w.wl_brand_name,
      'logo_url', w.wl_logo_url,
      'primary_color', w.wl_primary_color,
      'accent_color', w.wl_accent_color,
      'hide_branding', w.wl_hide_branding,
      'footer_text', w.wl_footer_text,
      'support_email', w.wl_support_email
    )
  END
  FROM public.sites s
  LEFT JOIN public.agency_workspaces w ON w.id = s.workspace_id
  WHERE s.id = p_site_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_site_branding(uuid) TO anon, authenticated;