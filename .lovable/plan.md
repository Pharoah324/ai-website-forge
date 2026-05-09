
# Agency Sub-Accounts — Implementation Plan

Scope: feature 1 of 4. Agency-plan users can create client workspaces, switch between them from a dropdown, allocate monthly credits per workspace with overflow to the agency's shared pool, and optionally invite clients to log in directly.

## Data model (new tables)

```text
agency_workspaces
  id, agency_user_id (owner), name, client_email (nullable),
  monthly_build_allocation (int), monthly_runtime_allocation (int),
  used_build_this_cycle, used_runtime_this_cycle,
  cycle_start, client_invited_at, client_user_id (nullable), created_at

workspace_invites
  id, workspace_id, email, token, status (pending|accepted|revoked),
  invited_at, accepted_at
```

Add nullable column `workspace_id` to `sites` so sites can be scoped to a sub-account workspace. NULL = agency owner's personal workspace.

RLS:
- `agency_workspaces`: agency owner full access; linked client sees own row only.
- `workspace_invites`: agency owner manages; invitee can read by token.
- `sites`: extend existing policies so the agency owner of a workspace can SELECT/UPDATE/DELETE sites where `workspace_id` belongs to them, in addition to existing `user_id = auth.uid()`.

## Credit accounting (RPC `consume_workspace_credits`)

Server-side function called by edge functions before deducting:
1. If site has `workspace_id` and workspace allocation remaining → deduct from workspace.
2. Else if agency owner of that workspace has shared-pool credits → deduct from `profiles.build_credits` of agency owner, increment workspace `used_*` past allocation (for reporting).
3. Else → 402 / no credits.

Personal (no workspace) sites continue using existing `check_and_consume`.

## Frontend

- `WorkspaceContext` (new): tracks active `workspaceId` (null = personal), persisted in localStorage. Wraps `AppLayout`.
- `WorkspaceSwitcher` dropdown in app header: lists "Personal" + each agency workspace + "+ New client workspace".
- Filter Dashboard sites query by active workspace.
- New `/app/agency` page (agency-plan only):
  - Table of workspaces: name, client email, allocation, used, % of allocation, sites count, action menu.
  - Shared pool widget: agency monthly credits remaining.
  - Create workspace modal (name, allocation sliders, optional invite email).
  - Per-row actions: Edit allocation, Invite client, Revoke invite, Delete workspace.
- New `/invite/:token` public page → after auth, links `auth.uid()` to workspace as `client_user_id`.
- Gate `/app/agency` and switcher visibility on `profile.plan === 'agency'` OR being a linked client.

## Edge function changes

- `generate-site`, `refine-site`, `rewrite-section`: accept optional `workspace_id`, call `consume_workspace_credits` instead of `check_and_consume` when present, and stamp `workspace_id` on inserted sites.
- New `invite-workspace-client` function: sends email via Resend with magic invite link.
- New `accept-workspace-invite` function: validates token, attaches `client_user_id`.

## What's NOT in this slice

- White-label theming per workspace (feature 2).
- Brand voice per workspace (feature 3).
- Industry templates (feature 4).
- Per-workspace billing or Stripe sub-customers (out of scope; agency pays once).

## Sequencing

1. DB migration (tables, columns, RLS, RPC).
2. Backend: edge function updates + invite/accept functions.
3. Frontend: WorkspaceContext + switcher + Agency page + invite acceptance.
4. Verify with type check; show user; await sign-off before feature 2.

After approval I'll execute the migration first, then ship code in one pass.
