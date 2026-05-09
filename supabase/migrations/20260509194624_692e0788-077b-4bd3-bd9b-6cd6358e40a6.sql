ALTER TABLE public.agency_workspaces
  ADD COLUMN IF NOT EXISTS brand_voice_samples text,
  ADD COLUMN IF NOT EXISTS brand_voice_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS voice_rules jsonb;