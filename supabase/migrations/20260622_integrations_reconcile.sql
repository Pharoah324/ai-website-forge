-- Schema-drift fix: the live integrations table (type / credentials / account_id,
-- unique on user_id,type) never matched what ALL the code expects (oauth-callback,
-- form-submission-webhook, ghl-list-pipelines, Integrations.tsx all use
-- platform / access_token / refresh_token / token_expires_at / location_id /
-- pipeline_id / metadata, onConflict user_id,platform). So connecting GHL/GitHub
-- failed the upsert and lead delivery errored on .eq("platform"). Table is empty
-- (0 rows), so this is purely additive — align the table to the code.

ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS platform text;
ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS access_token text;
ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS refresh_token text;
ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;
ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS location_id text;
ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS pipeline_id text;
ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Legacy required column the code never sets (superseded by platform).
ALTER TABLE public.integrations ALTER COLUMN type DROP NOT NULL;

-- The upsert uses onConflict (user_id, platform); swap the stale (user_id, type) key.
ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_user_id_type_key;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.integrations'::regclass AND conname = 'integrations_user_id_platform_key'
  ) THEN
    ALTER TABLE public.integrations ADD CONSTRAINT integrations_user_id_platform_key UNIQUE (user_id, platform);
  END IF;
END $$;
