import { useEffect, useMemo, useState } from "react";
import { useAdminAlerts, useUpdateAlert, type AdminAlert } from "@/hooks/useAdminAlerts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Eye, Play, Ban } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const sevStyle: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  info: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

const sevIcon = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const typeLabel: Record<string, string> = {
  dispute: "Dispute",
  abuse: "Abuse",
  server_error: "500 Error",
  credit_anomaly: "Credit Anomaly",
  signup_abuse: "Signup Abuse",
  account_paused: "Account Paused",
  grace_period_expired: "Grace Expired",
  other: "Other",
};

const statusStyle: Record<string, string> = {
  new: "bg-cta/15 text-cta border-cta/30",
  reviewed: "bg-muted text-muted-foreground border-border",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export default function AdminAlerts() {
  const { data: alerts, isLoading } = useAdminAlerts();
  const update = useUpdateAlert();
  const [filter, setFilter] = useState<"all" | "new" | "reviewed" | "resolved">("all");
  const [selected, setSelected] = useState<AdminAlert | null>(null);
  const [notes, setNotes] = useState("");

  const filtered = useMemo(
    () => (alerts ?? []).filter((a) => (filter === "all" ? true : a.status === filter)),
    [alerts, filter],
  );

  // Auto-mark as reviewed when opened
  useEffect(() => {
    if (selected && selected.status === "new") {
      update.mutate({ id: selected.id, patch: { status: "reviewed" } });
    }
    setNotes(selected?.action_notes ?? "");
  }, [selected?.id]);

  const counts = useMemo(() => {
    const c = { all: 0, new: 0, reviewed: 0, resolved: 0 };
    (alerts ?? []).forEach((a) => {
      c.all++;
      c[a.status]++;
    });
    return c;
  }, [alerts]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="text-sm text-muted-foreground">
          System alerts for disputes, abuse, errors and anomalies. Newest first.
        </p>
      </div>

      <div className="flex gap-2">
        {(["all", "new", "reviewed", "resolved"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
            className="capitalize"
          >
            {s} <span className="ml-2 text-xs opacity-70">{counts[s]}</span>
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No alerts. Everything looks good.
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const Icon = sevIcon[a.severity];
            return (
              <Card
                key={a.id}
                className={`flex cursor-pointer items-start gap-3 p-4 transition hover:border-cta/40 ${
                  a.status === "new" ? "border-cta/30 bg-cta/[0.02]" : ""
                }`}
                onClick={() => setSelected(a)}
              >
                <div className={`mt-0.5 rounded-md border p-1.5 ${sevStyle[a.severity]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={sevStyle[a.severity]}>
                      {a.severity}
                    </Badge>
                    <Badge variant="outline">{typeLabel[a.alert_type]}</Badge>
                    <Badge variant="outline" className={statusStyle[a.status]}>
                      {a.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm">{a.description}</p>
                  {a.affected_user_email && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      User: {a.affected_user_email}
                      {a.affected_user_id ? ` · ${a.affected_user_id.slice(0, 8)}…` : ""}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Alert detail
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={sevStyle[selected.severity]}>
                    {selected.severity}
                  </Badge>
                  <Badge variant="outline">{typeLabel[selected.alert_type]}</Badge>
                  <Badge variant="outline" className={statusStyle[selected.status]}>
                    {selected.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">What happened</div>
                  <p className="mt-1">{selected.description}</p>
                </div>
                {selected.affected_user_email && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Affected user</div>
                    <p className="mt-1 font-mono text-xs">
                      {selected.affected_user_email}
                      {selected.affected_user_id ? ` · ${selected.affected_user_id}` : ""}
                    </p>
                  </div>
                )}
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Created</div>
                  <p className="mt-1">{new Date(selected.created_at).toLocaleString()}</p>
                </div>
                {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Metadata</div>
                    <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted/40 p-2 text-xs">
                      {JSON.stringify(selected.metadata, null, 2)}
                    </pre>
                  </div>
                )}
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Action notes</div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What did you do about this?"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="flex-wrap gap-2">
                {selected.alert_type === "account_paused" && selected.affected_user_id && (
                  <>
                    <Button
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                      onClick={async () => {
                        const { error } = await (supabase as any).rpc("resume_account", {
                          _uid: selected.affected_user_id, _notes: notes || null,
                        });
                        if (error) return toast.error(error.message);
                        toast.success("Account resumed");
                        update.mutate(
                          { id: selected.id, patch: { status: "resolved", action_notes: notes || "Resumed" } },
                          { onSuccess: () => setSelected(null) },
                        );
                      }}
                    >
                      <Play className="mr-2 h-4 w-4" /> Resume Account
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-500/40 text-red-300 hover:bg-red-500/10"
                      onClick={async () => {
                        if (!confirm("Permanently suspend this account?")) return;
                        const { error } = await (supabase as any)
                          .from("account_flags")
                          .insert({
                            user_id: selected.affected_user_id,
                            flag_type: "suspended",
                            triggered_by: "admin",
                            reason: notes || "Manual suspension",
                          });
                        if (error) return toast.error(error.message);
                        toast.success("Account suspended");
                        update.mutate(
                          { id: selected.id, patch: { status: "resolved", action_notes: `Suspended. ${notes}` } },
                          { onSuccess: () => setSelected(null) },
                        );
                      }}
                    >
                      <Ban className="mr-2 h-4 w-4" /> Suspend Account
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() =>
                    update.mutate(
                      { id: selected.id, patch: { action_notes: notes } },
                      { onSuccess: () => setSelected(null) },
                    )
                  }
                >
                  Save notes
                </Button>
                <Button
                  onClick={() =>
                    update.mutate(
                      { id: selected.id, patch: { status: "resolved", action_notes: notes } },
                      { onSuccess: () => setSelected(null) },
                    )
                  }
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Resolve
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
