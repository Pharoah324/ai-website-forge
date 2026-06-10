-- The app (RefinementChat reads it; refine-site writes it) used a
-- site_chat_messages table that never existed in the database, so refine
-- conversation history silently failed to persist. Create it with the columns
-- the code expects, RLS enabled, and ON DELETE CASCADE so messages clean up
-- with their site.

CREATE TABLE IF NOT EXISTS public.site_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  summary text,
  credits_used integer NOT NULL DEFAULT 0,
  version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS site_chat_messages_site_id_created_at_idx
  ON public.site_chat_messages (site_id, created_at);

DROP POLICY IF EXISTS "Users can view own chat messages" ON public.site_chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.site_chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.site_chat_messages;

CREATE POLICY "Users can view own chat messages" ON public.site_chat_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON public.site_chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat messages" ON public.site_chat_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
