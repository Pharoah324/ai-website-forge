-- Fix 1 / capture-first lead storage. Every submission is persisted before delivery
-- is attempted, so a lead is never lost to a GHL/refresh failure or a not-connected owner.
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         uuid        NOT NULL,
  user_id         uuid        NOT NULL,          -- the site owner
  fields          jsonb       NOT NULL,
  delivery_status text        NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending','delivered','failed','no_integration')),
  ghl_contact_id  text,
  error           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS form_submissions_user_created_idx
  ON public.form_submissions (user_id, created_at DESC);

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Owners read their own submissions. No INSERT/UPDATE policy: only the service-role
-- webhook writes (service role bypasses RLS).
CREATE POLICY "Owners can view own form submissions"
  ON public.form_submissions FOR SELECT
  USING (auth.uid() = user_id);
