-- The "Optimize Site" feature reads/writes optimization_projects and
-- optimization_reports, but neither table existed in this database — so adding a
-- site failed ("Failed to add site") and the list always showed "No sites yet".
-- The original 20260507 migration depended on is_admin()/set_updated_at()/
-- enforce_storage_caps(), none of which exist in this project (schema drift), so
-- this is a self-contained version with own-row RLS and no missing dependencies.

CREATE TABLE IF NOT EXISTS public.optimization_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_optimization_projects_user
  ON public.optimization_projects(user_id, created_at DESC);

DROP POLICY IF EXISTS "opt_projects_select" ON public.optimization_projects;
DROP POLICY IF EXISTS "opt_projects_insert" ON public.optimization_projects;
DROP POLICY IF EXISTS "opt_projects_update" ON public.optimization_projects;
DROP POLICY IF EXISTS "opt_projects_delete" ON public.optimization_projects;
CREATE POLICY "opt_projects_select" ON public.optimization_projects
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "opt_projects_insert" ON public.optimization_projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "opt_projects_update" ON public.optimization_projects
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "opt_projects_delete" ON public.optimization_projects
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.optimization_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.optimization_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.optimization_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_optimization_reports_project
  ON public.optimization_reports(project_id, created_at DESC);

DROP POLICY IF EXISTS "opt_reports_select" ON public.optimization_reports;
DROP POLICY IF EXISTS "opt_reports_insert" ON public.optimization_reports;
CREATE POLICY "opt_reports_select" ON public.optimization_reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "opt_reports_insert" ON public.optimization_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
