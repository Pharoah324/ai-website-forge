
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wl_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wl_brand_name text,
  ADD COLUMN IF NOT EXISTS wl_logo_url text,
  ADD COLUMN IF NOT EXISTS wl_primary_color text,
  ADD COLUMN IF NOT EXISTS wl_accent_color text,
  ADD COLUMN IF NOT EXISTS wl_hide_branding boolean NOT NULL DEFAULT false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('agency-branding', 'agency-branding', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read agency branding" ON storage.objects;
CREATE POLICY "Public read agency branding"
ON storage.objects FOR SELECT
USING (bucket_id = 'agency-branding');

DROP POLICY IF EXISTS "Owner uploads agency branding" ON storage.objects;
CREATE POLICY "Owner uploads agency branding"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'agency-branding' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owner updates agency branding" ON storage.objects;
CREATE POLICY "Owner updates agency branding"
ON storage.objects FOR UPDATE
USING (bucket_id = 'agency-branding' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owner deletes agency branding" ON storage.objects;
CREATE POLICY "Owner deletes agency branding"
ON storage.objects FOR DELETE
USING (bucket_id = 'agency-branding' AND auth.uid()::text = (storage.foldername(name))[1]);
