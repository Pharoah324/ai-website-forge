import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Circle, Loader2, Play, FlaskConical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type Status = "pass" | "fail" | "not_tested" | "running";

type TestDef = { key: string; label: string; description: string };
type SectionDef = { id: string; title: string; tests: TestDef[] };

const SECTIONS: SectionDef[] = [
  {
    id: "billing",
    title: "Account & Billing",
    tests: [
      { key: "signup_trigger", label: "New user profile creation", description: "Verifies signup trigger creates profile with default credits (free plan)." },
      { key: "plan_caps_seeded", label: "Plan caps configured", description: "All 5 plans (free/starter/builder/pro/agency) have correct credit allocations." },
      { key: "feature_gates", label: "Feature gate matrix", description: "Search Atlas/priority queue/white label unlocked at correct tiers." },
      { key: "stripe_products", label: "Stripe subscription products active", description: "All 4 paid tiers have active Stripe products configured." },
      { key: "topup_packs", label: "Top-up packs configured", description: "Starter ($19), Growth ($39), Agency ($69) packs match spec." },
      { key: "stripe_events_idempotency", label: "Webhook idempotency table", description: "stripe_events table prevents duplicate webhook processing." },
      { key: "grace_period_function", label: "Grace period downgrade job", description: "downgrade_past_due_users RPC is callable (cron daily)." },
    ],
  },
  {
    id: "credits",
    title: "Credits & Audit Trail",
    tests: [
      { key: "credit_consume_rpc", label: "Atomic credit consumption", description: "check_and_consume RPC handles plan/rate/credit checks in one transaction." },
      { key: "refund_credits_rpc", label: "Refund credits RPC", description: "refund_credits writes audit row and updates balance." },
      { key: "credit_transactions_audit", label: "Credit transaction audit log", description: "All deductions/refunds logged with before/after balances." },
    ],
  },
  {
    id: "abuse",
    title: "Admin & Abuse Detection",
    tests: [
      { key: "admin_alerts_table", label: "Admin alerts pipeline", description: "Critical events route to /admin/alerts." },
      { key: "account_flags_table", label: "Account flag system", description: "Pause/suspend mechanism wired up." },
      { key: "abuse_detection", label: "Hourly abuse detection", description: "detect_abuse_and_pause RPC runs without errors." },
    ],
  },
  {
    id: "security",
    title: "Security",
    tests: [
      { key: "secrets_present", label: "Required secrets configured", description: "Stripe, AI gateway, and service role keys present in edge runtime." },
      { key: "rls_anonymous_blocked", label: "RLS blocks anonymous reads", description: "Anonymous clients cannot read profiles or admin_alerts." },
    ],
  },
];

type ResultRow = {
  test_key: string;
  status: Status;
  error_message: string | null;
  details: any;
  created_at: string;
};

function StatusBadge({ s }: { s: Status }) {
  if (s === "pass") return <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15"><CheckCircle2 className="mr-1 h-3 w-3" />Pass</Badge>;
  if (s === "fail") return <Badge className="bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/15"><XCircle className="mr-1 h-3 w-3" />Fail</Badge>;
  if (s === "running") return <Badge variant="secondary"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Running</Badge>;
  return <Badge variant="outline" className="text-muted-foreground"><Circle className="mr-1 h-3 w-3" />Not tested</Badge>;
}

export default function AdminLaunchTests() {
  const [results, setResults] = useState<Record<string, ResultRow & { status: Status }>>({});
  const [running, setRunning] = useState<Set<string>>(new Set());

  const { data: latest, refetch } = useQuery({
    queryKey: ["launch-test-latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("launch_test_results" as any)
        .select("test_key,status,error_message,details,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as any as ResultRow[];
    },
  });

  useEffect(() => {
    if (!latest) return;
    const map: Record<string, ResultRow> = {};
    for (const row of latest) if (!map[row.test_key]) map[row.test_key] = row;
    setResults((prev) => ({ ...map, ...prev }));
  }, [latest]);

  async function runTest(test_key: string, section: string) {
    setRunning((s) => new Set(s).add(test_key));
    setResults((r) => ({ ...r, [test_key]: { ...(r[test_key] ?? {} as any), test_key, status: "running", error_message: null, details: null, created_at: new Date().toISOString() } }));
    try {
      const { data, error } = await supabase.functions.invoke("launch-tests", {
        body: { test_key, section },
      });
      if (error) throw error;
      const r = data as { status: Status; details: any; error?: string };
      setResults((prev) => ({
        ...prev,
        [test_key]: { test_key, status: r.status, error_message: r.error ?? null, details: r.details, created_at: new Date().toISOString() },
      }));
    } catch (e: any) {
      setResults((prev) => ({
        ...prev,
        [test_key]: { test_key, status: "fail", error_message: e?.message ?? String(e), details: null, created_at: new Date().toISOString() },
      }));
    } finally {
      setRunning((s) => { const n = new Set(s); n.delete(test_key); return n; });
      refetch();
    }
  }

  async function runSection(section: SectionDef) {
    for (const t of section.tests) await runTest(t.key, section.id);
  }

  async function runAll() {
    for (const s of SECTIONS) await runSection(s);
  }

  const total = SECTIONS.reduce((n, s) => n + s.tests.length, 0);
  const passed = Object.values(results).filter((r) => r.status === "pass").length;
  const failed = Object.values(results).filter((r) => r.status === "fail").length;
  const tested = Object.values(results).filter((r) => r.status === "pass" || r.status === "fail").length;
  const pct = Math.round((passed / total) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FlaskConical className="h-6 w-6 text-cta" />
            Launch Tests
          </h1>
          <p className="text-sm text-muted-foreground">Pre-launch QA control center. Read-only diagnostics against the live system.</p>
        </div>
        <Button onClick={runAll} className="bg-cta text-cta-foreground hover:bg-cta/90">
          <Play className="mr-2 h-4 w-4" />Run all tests
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="Total" value={total} />
        <SummaryCard label="Passed" value={passed} tone="pass" />
        <SummaryCard label="Failed" value={failed} tone="fail" />
        <SummaryCard label="Coverage" value={`${tested}/${total} (${pct}%)`} />
      </div>

      {SECTIONS.map((section) => {
        const sPass = section.tests.filter((t) => results[t.key]?.status === "pass").length;
        return (
          <Card key={section.id} className="border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {section.title}
                <span className="ml-2 text-xs font-normal text-muted-foreground">{sPass}/{section.tests.length} passing</span>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => runSection(section)}>
                <Play className="mr-2 h-3 w-3" />Run section
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {section.tests.map((t) => {
                const r = results[t.key];
                const status: Status = running.has(t.key) ? "running" : (r?.status ?? "not_tested");
                return (
                  <div key={t.key} className="rounded-md border border-primary/10 bg-card/50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t.label}</span>
                          <StatusBadge s={status} />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                        {r?.error_message && (
                          <p className="mt-2 rounded bg-red-500/10 px-2 py-1 text-xs text-red-400">{r.error_message}</p>
                        )}
                        {r?.details && Object.keys(r.details).length > 0 && (
                          <details className="mt-1 text-xs text-muted-foreground">
                            <summary className="cursor-pointer">Details</summary>
                            <pre className="mt-1 overflow-x-auto rounded bg-background/50 p-2 text-[11px]">{JSON.stringify(r.details, null, 2)}</pre>
                          </details>
                        )}
                        {r?.created_at && (
                          <p className="mt-1 text-[10px] text-muted-foreground/70">Last run: {new Date(r.created_at).toLocaleString()}</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => runTest(t.key, section.id)} disabled={running.has(t.key)}>
                        {running.has(t.key) ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Play className="mr-1 h-3 w-3" />Run</>}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string | number; tone?: "pass" | "fail" }) {
  const color = tone === "pass" ? "text-emerald-400" : tone === "fail" ? "text-red-400" : "text-foreground";
  return (
    <Card className="border-primary/10">
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
