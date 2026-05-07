
CREATE TABLE public.site_seo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  meta_title text,
  meta_description text,
  keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  blog_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  industry text,
  location text,
  source text NOT NULL DEFAULT 'search_atlas',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_seo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads seo" ON public.site_seo
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Owner inserts seo" ON public.site_seo
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner updates seo" ON public.site_seo
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER site_seo_updated_at BEFORE UPDATE ON public.site_seo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_site_seo_user ON public.site_seo(user_id);
