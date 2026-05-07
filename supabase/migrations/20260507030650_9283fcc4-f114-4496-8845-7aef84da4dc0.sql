
CREATE TABLE public.optimization_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  website_url text NOT NULL,
  name text NOT NULL DEFAULT 'Untitled site',
  integrations jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  latest_report jsonb,
  last_analyzed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.optimization_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own optimization projects" ON public.optimization_projects
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users insert own optimization projects" ON public.optimization_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own optimization projects" ON public.optimization_projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own optimization projects" ON public.optimization_projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_optimization_projects_updated_at
  BEFORE UPDATE ON public.optimization_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_optimization_projects_user ON public.optimization_projects(user_id, created_at DESC);

CREATE TABLE public.optimization_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.optimization_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  report jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.optimization_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own optimization reports" ON public.optimization_reports
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users insert own optimization reports" ON public.optimization_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_optimization_reports_project ON public.optimization_reports(project_id, created_at DESC);
