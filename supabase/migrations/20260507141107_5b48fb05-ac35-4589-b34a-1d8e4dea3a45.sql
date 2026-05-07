
CREATE TABLE public.site_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  summary text,
  credits_used integer NOT NULL DEFAULT 0,
  version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_site_chat_site ON public.site_chat_messages(site_id, created_at);
ALTER TABLE public.site_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads chat" ON public.site_chat_messages
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Owner inserts chat" ON public.site_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.site_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  version_number integer NOT NULL,
  label text,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site_id, version_number)
);
CREATE INDEX idx_site_versions_site ON public.site_versions(site_id, version_number DESC);
ALTER TABLE public.site_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads versions" ON public.site_versions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Owner inserts versions" ON public.site_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
