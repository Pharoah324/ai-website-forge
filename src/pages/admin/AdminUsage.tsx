import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Activity, Users, Zap, TrendingUp, Pause } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const PLAN_LIMITS: Record<string, { build: number; runtime: number }> = {
  free: { build: 20, runtime: 300 },
  starter: { build: 100, runtime: 2500 },
  builder: { build: 300, runtime: 10000 },
  pro: { build: 800, runtime: 30000 },
  agency: { build: 2000, runtime: 100000 },
};

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-cta" />
      </div>
    </Card>
  );
}

export default function AdminUsage() {
  // Profiles + sites count
  const { data: users = [] } = useQuery({
    queryKey: ["admin-usage-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, plan, build_credits, runtime_credits, monthly_build_limit, monthly_runtime_limit, updated_at, created_at")
        .order("updated_at", { ascending: false })
        .limit(500);
      return data ?? [];
    },
  });

  const { data: siteCounts = {} } = useQuery({
    queryKey: ["admin-usage-sites"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("user_id").limit(5000);
      const m: Record<string, number> = {};
      (data ?? []).forEach((r: any) => { m[r.user_id] = (m[r.user_id] ?? 0) + 1; });
      return m;
    },
  });

  // Last 30 days aggregates from credit_transactions
  const { data: txns = [] } = useQuery({
    queryKey: ["admin-usage-txns"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400_000).toISOString();
      const { data } = await (supabase as any)
        .from("credit_transactions")
        .select("user_id, credit_kind, transaction_type, amount_changed, created_at")
        .gte("created_at", since)
        .limit(10000);
      return data ?? [];
    },
  });

  // Active flags
  const { data: pauses = [] } = useQuery({
    queryKey: ["admin-usage-pauses"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("account_flags")
        .select("user_id, flag_type, reason, triggered_at")
        .is("resolved_at", null)
        .limit(50);
      return data ?? [];
    },
  });

  // Per-user runtime + api this month
  const monthAgo = Date.now() - 30 * 86400_000;
  const userStats = useMemo(() => {
    const stats: Record<string, { runtime: number; api: number; lastActive: number }> = {};
    txns.forEach((t: any) => {
      const ts = new Date(t.created_at).getTime();
      if (ts < monthAgo) return;
      stats[t.user_id] = stats[t.user_id] ?? { runtime: 0, api: 0, lastActive: 0 };
      if (t.credit_kind === "runtime" && t.transaction_type === "deduction") {
        stats[t.user_id].runtime += -(t.amount_changed ?? 0);
      }
      stats[t.user_id].api += 1;
      if (ts > stats[t.user_id].lastActive) stats[t.user_id].lastActive = ts;
    });
    return stats;
  }, [txns]);

  // Top 20 users (by sites built, then runtime)
  const topUsers = useMemo(() => {
    return [...users]
      .map((u: any) => ({
        ...u,
        sites: siteCounts[u.id] ?? 0,
        runtimeUsed: userStats[u.id]?.runtime ?? 0,
        apiCalls: userStats[u.id]?.api ?? 0,
        lastActive: userStats[u.id]?.lastActive ?? new Date(u.updated_at).getTime(),
      }))
      .sort((a, b) => b.sites - a.sites || b.runtimeUsed - a.runtimeUsed)
      .slice(0, 20);
  }, [users, siteCounts, userStats]);

  // High-usage alerts: >80% of plan limits, top 1% runtime, >500 api/hr is system-handled
  const highUsageUsers = useMemo(() => {
    const flagged: any[] = [];
    const sorted = [...users].map((u: any) => ({
      ...u,
      runtime: userStats[u.id]?.runtime ?? 0,
    })).sort((a, b) => b.runtime - a.runtime);
    const top1pctCutoff = Math.max(1, Math.floor(sorted.length * 0.01));
    const top1pct = new Set(sorted.slice(0, top1pctCutoff).map((u) => u.id));

    users.forEach((u: any) => {
      const lim = PLAN_LIMITS[u.plan] ?? PLAN_LIMITS.free;
      const runtimeUsed = userStats[u.id]?.runtime ?? 0;
      const reasons: string[] = [];
      if (runtimeUsed > 0.8 * lim.runtime) reasons.push(`${Math.round(100 * runtimeUsed / lim.runtime)}% runtime`);
      if (top1pct.has(u.id) && runtimeUsed > 0) reasons.push("Top 1% runtime");
      const buildPct = (lim.build - u.build_credits) / lim.build;
      if (buildPct > 0.8) reasons.push(`${Math.round(100 * buildPct)}% build`);
      if (reasons.length) flagged.push({ ...u, reasons, runtimeUsed });
    });
    return flagged.slice(0, 12);
  }, [users, userStats]);

  // Charts
  const dailySeries = useMemo(() => {
    const buckets: Record<string, { date: string; gens: number; runtime: number; users: Set<string> }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      buckets[d] = { date: d.slice(5), gens: 0, runtime: 0, users: new Set() };
    }
    txns.forEach((t: any) => {
      const d = t.created_at.slice(0, 10);
      const b = buckets[d];
      if (!b) return;
      b.users.add(t.user_id);
      if (t.transaction_type === "deduction") {
        if (t.credit_kind === "build") b.gens += 1;
        if (t.credit_kind === "runtime") b.runtime += -(t.amount_changed ?? 0);
      }
    });
    return Object.values(buckets).map((b) => ({
      date: b.date, gens: b.gens, runtime: b.runtime, dau: b.users.size,
    }));
  }, [txns]);

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const today = txns.filter((t: any) => new Date(t.created_at) >= todayStart);
  const todayGens = today.filter((t: any) => t.credit_kind === "build" && t.transaction_type === "deduction").length;
  const todayRuntime = today.filter((t: any) => t.credit_kind === "runtime" && t.transaction_type === "deduction")
    .reduce((s: number, t: any) => s + -(t.amount_changed ?? 0), 0);

  const resumeUser = async (userId: string) => {
    const notes = prompt("Resume notes (optional):", "");
    const { error } = await (supabase as any).rpc("resume_account", { _uid: userId, _notes: notes });
    if (error) toast.error(error.message);
    else toast.success("Account resumed");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usage Analytics</h1>
        <p className="text-sm text-muted-foreground">Platform health, top users, abuse signals.</p>
      </div>

      {/* Auto-paused accounts banner */}
      {pauses.length > 0 && (
        <Card className="border-red-500/40 bg-red-500/[0.06] p-4">
          <div className="flex items-center gap-2 text-red-300">
            <Pause className="h-4 w-4" />
            <span className="font-semibold">{pauses.length} account(s) auto-paused — needs review</span>
          </div>
          <div className="mt-3 space-y-1.5 text-sm">
            {pauses.slice(0, 5).map((p: any) => (
              <div key={p.user_id + p.triggered_at} className="flex items-center justify-between gap-2">
                <span className="text-red-100">
                  <code className="text-xs">{p.user_id.slice(0, 8)}…</code> — {p.reason}
                </span>
                <Button size="sm" variant="outline" onClick={() => resumeUser(p.user_id)}>Resume</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* High-usage warnings */}
      {highUsageUsers.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/[0.05] p-4">
          <div className="mb-3 flex items-center gap-2 text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-semibold">High usage signals</span>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {highUsageUsers.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between rounded border border-amber-500/20 bg-background/40 p-2 text-xs">
                <div>
                  <p className="font-medium">{u.email}</p>
                  <p className="text-muted-foreground">Plan: {u.plan}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.reasons.map((r: string) => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Platform metrics */}
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Generations today" value={todayGens} icon={Zap} />
        <StatCard label="Runtime credits today" value={todayRuntime.toLocaleString()} icon={Activity} />
        <StatCard label="Total users" value={users.length} icon={Users} />
        <StatCard label="Avg credits / user / day" value={(txns.length / Math.max(1, users.length) / 30).toFixed(1)} icon={TrendingUp} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <p className="mb-2 text-sm font-semibold">Daily generations — last 30 days</p>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="gens" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-sm font-semibold">Daily runtime credits — last 30 days</p>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="runtime" stroke="hsl(var(--cta))" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top users table */}
      <Card className="p-0">
        <div className="border-b p-4">
          <h2 className="font-semibold">Top 20 users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Email</th><th>Plan</th><th>Sites</th>
                <th>Runtime used</th><th>API calls</th><th>Last active</th><th></th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((u: any) => (
                <tr key={u.id} className="border-b border-border/40">
                  <td className="p-3">{u.email}</td>
                  <td className="capitalize">{u.plan}</td>
                  <td>{u.sites}</td>
                  <td>{u.runtimeUsed.toLocaleString()}</td>
                  <td>{u.apiCalls}</td>
                  <td className="text-xs text-muted-foreground">
                    {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : "—"}
                  </td>
                  <td className="space-x-2 py-2">
                    <Link to="/admin/users" className="text-xs text-cta underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
