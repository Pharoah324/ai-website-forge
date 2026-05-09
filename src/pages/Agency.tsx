import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useWorkspace, AgencyWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Briefcase, Plus, Mail, Trash2, Pencil, Copy, Users, Palette } from "lucide-react";
import { WhiteLabelDialog } from "@/components/WhiteLabelDialog";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

type Invite = {
  id: string;
  workspace_id: string;
  email: string;
  token: string;
  status: string;
  invited_at: string;
};

export default function Agency() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { workspaces, refresh } = useWorkspace();
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AgencyWorkspace | null>(null);
  const [inviteTarget, setInviteTarget] = useState<AgencyWorkspace | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgencyWorkspace | null>(null);
  const [brandTarget, setBrandTarget] = useState<AgencyWorkspace | null>(null);

  const { data: siteCounts } = useQuery({
    queryKey: ["workspace-site-counts", user?.id],
    enabled: !!user && workspaces.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("workspace_id")
        .not("workspace_id", "is", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r: { workspace_id: string | null }) => {
        if (r.workspace_id) counts[r.workspace_id] = (counts[r.workspace_id] ?? 0) + 1;
      });
      return counts;
    },
  });

  const { data: invites } = useQuery({
    queryKey: ["workspace-invites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (workspaces.length === 0) return [] as Invite[];
      const { data, error } = await supabase
        .from("workspace_invites" as never)
        .select("*")
        .in("workspace_id", workspaces.map((w) => w.id))
        .eq("status", "pending");
      if (error) throw error;
      return (data ?? []) as unknown as Invite[];
    },
  });

  if (!profile) return null;
  if (profile.plan !== "agency") return <Navigate to="/app" replace />;

  const totalAllocated = workspaces.reduce((a, w) => a + w.monthly_build_allocation, 0);
  const totalUsed = workspaces.reduce((a, w) => a + w.used_build_this_cycle, 0);

  const refreshAll = () => {
    refresh();
    qc.invalidateQueries({ queryKey: ["workspace-site-counts"] });
    qc.invalidateQueries({ queryKey: ["workspace-invites"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const inviteFor = (id: string) => invites?.find((i) => i.workspace_id === id);

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Workspaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create isolated workspaces for each client. Allocate credits, invite them to log in,
            and manage their sites from one dashboard.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> New workspace
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Workspaces" value={workspaces.length.toString()} icon={Briefcase} />
        <Stat
          label="Allocated build credits"
          value={`${totalUsed} / ${totalAllocated}`}
          sub="this billing cycle"
        />
        <Stat
          label="Agency shared pool"
          value={profile.build_credits.toLocaleString()}
          sub="overflow available"
        />
      </div>

      <div className="mt-8 rounded-lg border bg-card shadow-card overflow-hidden">
        {workspaces.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 font-medium">No client workspaces yet</p>
            <p className="text-sm text-muted-foreground">
              Spin up your first one and start building for clients.
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Create workspace
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Build credits</th>
                <th className="px-4 py-3 text-left">Sites</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((w) => {
                const inv = inviteFor(w.id);
                const usedPct = Math.round(
                  (w.used_build_this_cycle / Math.max(w.monthly_build_allocation, 1)) * 100,
                );
                return (
                  <tr key={w.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{w.name}</td>
                    <td className="px-4 py-3">
                      {w.client_user_id ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          Active
                        </span>
                      ) : inv ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Invited
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No client</span>
                      )}
                      {w.client_email && (
                        <div className="mt-0.5 text-xs text-muted-foreground truncate max-w-[180px]">
                          {w.client_email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums">
                          {w.used_build_this_cycle}/{w.monthly_build_allocation}
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${Math.min(usedPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{siteCounts?.[w.id] ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setBrandTarget(w)}
                          title="White-label branding"
                          className={w.wl_enabled ? "text-primary" : ""}
                        >
                          <Palette className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditTarget(w)}
                          title="Edit allocation"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {inv ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const url = `${window.location.origin}/invite/${inv.token}`;
                              navigator.clipboard.writeText(url);
                              toast.success("Invite link copied");
                            }}
                            title="Copy invite link"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          !w.client_user_id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setInviteTarget(w)}
                              title="Invite client"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                          )
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(w)}
                          title="Delete workspace"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <CreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refreshAll}
        userId={user!.id}
      />
      <EditDialog
        workspace={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={refreshAll}
      />
      <InviteDialog
        workspace={inviteTarget}
        onClose={() => setInviteTarget(null)}
        onInvited={refreshAll}
      />
      <DeleteDialog
        workspace={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={refreshAll}
      />
      <WhiteLabelDialog
        workspace={brandTarget}
        onClose={() => setBrandTarget(null)}
        onSaved={refreshAll}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function CreateDialog({
  open,
  onClose,
  onCreated,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  userId: string;
}) {
  const [name, setName] = useState("");
  const [build, setBuild] = useState(50);
  const [runtime, setRuntime] = useState(1000);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return toast.error("Name required");
    setBusy(true);
    const { error } = await supabase.from("agency_workspaces" as never).insert({
      agency_user_id: userId,
      name: name.trim(),
      client_email: email.trim() || null,
      monthly_build_allocation: build,
      monthly_runtime_allocation: runtime,
    } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Workspace created");
    setName("");
    setEmail("");
    setBuild(50);
    setRuntime(1000);
    onCreated();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New client workspace</DialogTitle>
          <DialogDescription>
            Create an isolated workspace for a client. You'll manage it directly. You can invite
            the client to log in later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Workspace name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Coffee Roasters"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Monthly build credits</Label>
              <Input type="number" min={0} value={build} onChange={(e) => setBuild(+e.target.value)} />
            </div>
            <div>
              <Label>Monthly runtime credits</Label>
              <Input
                type="number"
                min={0}
                value={runtime}
                onChange={(e) => setRuntime(+e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            When a workspace exhausts its allocation, it draws from your agency's shared pool.
          </p>
          <div>
            <Label>Client email (optional)</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@company.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Creating…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  workspace,
  onClose,
  onSaved,
}: {
  workspace: AgencyWorkspace | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(workspace?.name ?? "");
  const [build, setBuild] = useState(workspace?.monthly_build_allocation ?? 50);
  const [runtime, setRuntime] = useState(workspace?.monthly_runtime_allocation ?? 1000);
  const [busy, setBusy] = useState(false);

  // sync when target changes
  useState(() => {
    if (workspace) {
      setName(workspace.name);
      setBuild(workspace.monthly_build_allocation);
      setRuntime(workspace.monthly_runtime_allocation);
    }
  });

  if (!workspace) return null;

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("agency_workspaces" as never)
      .update({
        name: name.trim(),
        monthly_build_allocation: build,
        monthly_runtime_allocation: runtime,
      } as never)
      .eq("id", workspace.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Workspace updated");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={!!workspace} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit workspace</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Workspace name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Build allocation</Label>
              <Input type="number" min={0} value={build} onChange={(e) => setBuild(+e.target.value)} />
            </div>
            <div>
              <Label>Runtime allocation</Label>
              <Input
                type="number"
                min={0}
                value={runtime}
                onChange={(e) => setRuntime(+e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InviteDialog({
  workspace,
  onClose,
  onInvited,
}: {
  workspace: AgencyWorkspace | null;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState(workspace?.client_email ?? "");
  const [busy, setBusy] = useState(false);

  if (!workspace) return null;

  const submit = async () => {
    if (!email.trim()) return toast.error("Email required");
    setBusy(true);
    const { data, error } = await supabase
      .from("workspace_invites" as never)
      .insert({
        workspace_id: workspace.id,
        email: email.trim(),
      } as never)
      .select("token")
      .single();
    if (!error) {
      await supabase
        .from("agency_workspaces" as never)
        .update({ client_email: email.trim(), client_invited_at: new Date().toISOString() } as never)
        .eq("id", workspace.id);
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    const token = (data as unknown as { token: string }).token;
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url).catch(() => {});
    toast.success("Invite link copied to clipboard");
    onInvited();
    onClose();
  };

  return (
    <Dialog open={!!workspace} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite client to {workspace.name}</DialogTitle>
          <DialogDescription>
            We'll generate an invite link they can use to sign up and access this workspace
            directly. The link is copied to your clipboard.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label>Client email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@company.com"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Generating…" : "Generate invite link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  workspace,
  onClose,
  onDeleted,
}: {
  workspace: AgencyWorkspace | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  if (!workspace) return null;
  const remove = async () => {
    const { error } = await supabase
      .from("agency_workspaces" as never)
      .delete()
      .eq("id", workspace.id);
    if (error) return toast.error(error.message);
    toast.success("Workspace deleted");
    onDeleted();
    onClose();
  };
  return (
    <AlertDialog open={!!workspace} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {workspace.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Sites in this workspace will lose their workspace assignment but remain in your
            account. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
