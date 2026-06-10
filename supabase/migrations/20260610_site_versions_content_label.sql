-- site_versions carried a legacy HTML-based schema (html_content/css_content/
-- js_content/change_summary/is_current) that never matched the JSON-based app.
-- The app (generate-site, refine-site, RefinementChat) reads/writes `content`
-- (the full site JSON) and `label`, which did not exist — so every version
-- insert failed silently and version history / restore never worked.
-- Add the columns the code expects. Non-destructive; legacy columns are kept.

ALTER TABLE public.site_versions ADD COLUMN IF NOT EXISTS content jsonb;
ALTER TABLE public.site_versions ADD COLUMN IF NOT EXISTS label text;

-- Legacy html_content was NOT NULL in some environments; the JSON app never
-- populates it, so relax it to allow version inserts to succeed.
ALTER TABLE public.site_versions ALTER COLUMN html_content DROP NOT NULL;
