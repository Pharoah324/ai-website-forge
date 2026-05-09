
-- 1. agency_workspaces
CREATE TABLE public.agency_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_user_id uuid NOT NULL,
  name text NOT NULL,
  client_email text,
  client_user_id uuid,
  monthly_build_allocation int NOT NULL DEFAULT 50,
  monthly_runtime_allocation int NOT NULL DEFAULT 1000,
  used_build_this_cycle int NOT NULL DEFAULT 0,
  used_runtime_this_cycle int NOT NULL DEFAULT 0,
  cycle_start timestamptz NOT NULL DEFAULT now(),
  client_invited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agency_workspaces_owner ON public.agency_workspaces(agency_user_id);
CREATE INDEX idx_agency_workspaces_client ON public.agency_workspaces(client_user_id);

ALTER TABLE public.agency_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owner manages workspaces"
  ON public.agency_workspaces FOR ALL
  USING (auth.uid() = agency_user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = agency_user_id);

CREATE POLICY "Linked client views workspace"
  ON public.agency_workspaces FOR SELECT
  USING (auth.uid() = client_user_id);

CREATE TRIGGER trg_agency_workspaces_updated
  BEFORE UPDATE ON public.agency_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. workspace_invites
CREATE TABLE public.workspace_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.agency_workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);
CREATE INDEX idx_workspace_invites_workspace ON public.workspace_invites(workspace_id);
CREATE INDEX idx_workspace_invites_token ON public.workspace_invites(token);

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owner manages invites"
  ON public.workspace_invites FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.agency_workspaces w
    WHERE w.id = workspace_invites.workspace_id AND w.agency_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.agency_workspaces w
    WHERE w.id = workspace_invites.workspace_id AND w.agency_user_id = auth.uid()
  ));

-- 3. sites.workspace_id
ALTER TABLE public.sites ADD COLUMN workspace_id uuid REFERENCES public.agency_workspaces(id) ON DELETE SET NULL;
CREATE INDEX idx_sites_workspace ON public.sites(workspace_id);

CREATE POLICY "Agency owner reads workspace sites"
  ON public.sites FOR SELECT
  USING (workspace_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.agency_workspaces w
    WHERE w.id = sites.workspace_id AND w.agency_user_id = auth.uid()
  ));

CREATE POLICY "Agency owner updates workspace sites"
  ON public.sites FOR UPDATE
  USING (workspace_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.agency_workspaces w
    WHERE w.id = sites.workspace_id AND w.agency_user_id = auth.uid()
  ));

CREATE POLICY "Agency owner deletes workspace sites"
  ON public.sites FOR DELETE
  USING (workspace_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.agency_workspaces w
    WHERE w.id = sites.workspace_id AND w.agency_user_id = auth.uid()
  ));

-- 4. consume_workspace_credits RPC
CREATE OR REPLACE FUNCTION public.consume_workspace_credits(
  _workspace_id uuid, _kind text, _amount int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  w public.agency_workspaces%ROWTYPE;
  v_alloc int; v_used int; v_remain int; v_pool int; v_take_alloc int; v_take_pool int;
BEGIN
  SELECT * INTO w FROM public.agency_workspaces WHERE id = _workspace_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'no_workspace'); END IF;

  -- reset cycle if >30 days
  IF w.cycle_start < now() - interval '30 days' THEN
    UPDATE public.agency_workspaces SET cycle_start = now(),
      used_build_this_cycle = 0, used_runtime_this_cycle = 0
      WHERE id = _workspace_id;
    w.used_build_this_cycle := 0; w.used_runtime_this_cycle := 0;
  END IF;

  IF _kind = 'build' THEN
    v_alloc := w.monthly_build_allocation;
    v_used := w.used_build_this_cycle;
  ELSE
    v_alloc := w.monthly_runtime_allocation;
    v_used := w.used_runtime_this_cycle;
  END IF;

  v_remain := GREATEST(v_alloc - v_used, 0);
  v_take_alloc := LEAST(v_remain, _amount);
  v_take_pool := _amount - v_take_alloc;

  IF v_take_pool > 0 THEN
    IF _kind = 'build' THEN
      SELECT build_credits INTO v_pool FROM public.profiles WHERE id = w.agency_user_id FOR UPDATE;
    ELSE
      SELECT runtime_credits INTO v_pool FROM public.profiles WHERE id = w.agency_user_id FOR UPDATE;
    END IF;
    IF v_pool < v_take_pool THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'no_credits',
        'allocation_remaining', v_remain, 'pool', v_pool);
    END IF;
    IF _kind = 'build' THEN
      UPDATE public.profiles SET build_credits = build_credits - v_take_pool WHERE id = w.agency_user_id;
    ELSE
      UPDATE public.profiles SET runtime_credits = runtime_credits - v_take_pool WHERE id = w.agency_user_id;
    END IF;
  END IF;

  IF _kind = 'build' THEN
    UPDATE public.agency_workspaces
      SET used_build_this_cycle = used_build_this_cycle + _amount
      WHERE id = _workspace_id;
  ELSE
    UPDATE public.agency_workspaces
      SET used_runtime_this_cycle = used_runtime_this_cycle + _amount
      WHERE id = _workspace_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'from_allocation', v_take_alloc, 'from_pool', v_take_pool);
END $$;

-- 5. accept_workspace_invite RPC
CREATE OR REPLACE FUNCTION public.accept_workspace_invite(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inv public.workspace_invites%ROWTYPE;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated'); END IF;
  SELECT * INTO v_inv FROM public.workspace_invites WHERE token = _token AND status = 'pending';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_or_used'); END IF;

  UPDATE public.agency_workspaces SET client_user_id = v_uid WHERE id = v_inv.workspace_id;
  UPDATE public.workspace_invites SET status = 'accepted', accepted_at = now() WHERE id = v_inv.id;
  RETURN jsonb_build_object('ok', true, 'workspace_id', v_inv.workspace_id);
END $$;
