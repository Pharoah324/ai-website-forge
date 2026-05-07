
CREATE TABLE IF NOT EXISTS public.launch_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_key text NOT NULL,
  section text NOT NULL,
  status text NOT NULL CHECK (status IN ('pass','fail','not_tested','running')),
  details jsonb,
  error_message text,
  run_by_admin uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_launch_test_key_created ON public.launch_test_results (test_key, created_at DESC);

ALTER TABLE public.launch_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read launch tests"
  ON public.launch_test_results FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins insert launch tests"
  ON public.launch_test_results FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()) AND run_by_admin = auth.uid());
