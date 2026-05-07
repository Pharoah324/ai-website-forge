import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Image as ImageIcon,
  Link2,
  Target,
  FileText,
  Zap,
  Layers,
  ChevronRight,
  Search,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const INTEGRATIONS = [
  { key: "google_search_console", label: "Google Search Console" },
  { key: "google_analytics", label: "Google Analytics" },
  { key: "search_atlas", label: "Search Atlas" },
  { key: "gohighlevel", label: "GoHighLevel" },
  { key: "stripe", label: "Stripe" },
];

type Report = {
  scores: { seo: number; mobile: number; speed: number; conversion: number };
  summary: string;
  topPages: { url: string; clicks: number; impressions: number; ctr: number; position: number }[];
  lowPages: { url: string; issue: string }[];
  keywordRankings: { keyword: string; position: number; volume: number; intent: string }[];
  keywordOpportunities: { keyword: string; volume: number; difficulty: number; why: string }[];
  missingMetadata: { url: string; missing: string }[];
  missingAltText: { url: string; count: number }[];
  internalLinking: { from: string; to: string; anchor: string }[];
  ctaSuggestions: string[];
  contentGaps: string[];
  suggestedServicePages: string[];
  blogClusters: { pillar: string; posts: string[] }[];
  leadCapture: string[];
  conversionOptimization: string[];
  aiRecommendations: { title: string; body: string; impact: "low" | "medium" | "high" }[];
  automationInsights: { title: string; body: string }[];
  trafficTrend: { month: string; organic: number; direct: number; referral: number }[];
};

export default function OptimizeDashboard() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: project, refetch } = useQuery({
    queryKey: ["optimization-project", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("optimization_projects")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: (q) => (q.state.data?.status === "analyzing" ? 3000 : false),
  });

  const integrations = (project?.integrations as Record<string, boolean>) || {};
  const report = project?.latest_report as Report | null;

  const toggleMut = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      const next = { ...integrations, [key]: value };
      const { error } = await supabase
        .from("optimization_projects")
        .update({ integrations: next })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["optimization-project", id] }),
  });

  const analyzeMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("analyze-website", {
        body: { projectId: id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Analysis complete");
      refetch();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Analysis failed"),
  });

  // Auto-run on first visit if never analyzed
  useEffect(() => {
    if (project && project.status === "pending" && !project.latest_report && !analyzeMut.isPending) {
      analyzeMut.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const isRunning = project?.status === "analyzing" || analyzeMut.isPending;

  if (!project) {
    return <div className="container py-10 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/app/optimize"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-3 w-3" /> All sites
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{project.name}</h1>
          <a
            href={project.website_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground hover:text-primary"
          >
            {project.website_url}
          </a>
        </div>
        <Button onClick={() => analyzeMut.mutate()} disabled={isRunning}>
          {isRunning ? (
            <>
              <RefreshCw className="mr-1 h-4 w-4 animate-spin" /> Analyzing…
            </>
          ) : (
            <>
              <Sparkles className="mr-1 h-4 w-4" /> Re-run analysis
            </>
          )}
        </Button>
      </div>

      {/* Connections */}
      <Card className="mt-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Connected systems
          </h2>
          <span className="text-xs text-muted-foreground">
            Toggle the systems you've connected — analysis tailors to them.
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {INTEGRATIONS.map((i) => (
            <div
              key={i.key}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2.5"
            >
              <span className="text-sm font-medium">{i.label}</span>
              <Switch
                checked={!!integrations[i.key]}
                onCheckedChange={(v) => toggleMut.mutate({ key: i.key, value: v })}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Empty / loading */}
      {!report && (
        <Card className="mt-6 flex flex-col items-center justify-center gap-3 py-16 text-center">
          {isRunning ? (
            <>
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="font-medium">Generating your AI optimization report…</p>
              <p className="text-xs text-muted-foreground">This usually takes 15–30 seconds.</p>
            </>
          ) : (
            <>
              <Sparkles className="h-8 w-8 text-primary" />
              <p className="font-medium">Ready to analyze your site.</p>
              <Button onClick={() => analyzeMut.mutate()}>Run analysis</Button>
            </>
          )}
        </Card>
      )}

      {report && <ReportView report={report} />}
    </div>
  );
}

function ReportView({ report }: { report: Report }) {
  const trend = useMemo(() => report.trafficTrend ?? [], [report]);

  return (
    <div className="mt-8 space-y-8">
      {/* Score row */}
      <div className="grid gap-4 md:grid-cols-4">
        <ScoreCard label="SEO score" value={report.scores.seo} />
        <ScoreCard label="Mobile" value={report.scores.mobile} />
        <ScoreCard label="Speed" value={report.scores.speed} />
        <ScoreCard label="Conversion" value={report.scores.conversion} />
      </div>

      {/* Summary + traffic chart */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Traffic trend (6mo)
            </h3>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="organic"
                  stroke="hsl(var(--primary))"
                  fill="url(#g1)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="direct"
                  stroke="hsl(var(--cta))"
                  fill="transparent"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="referral"
                  stroke="hsl(var(--muted-foreground))"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            AI summary
          </h3>
          <p className="text-sm leading-relaxed text-foreground">{report.summary}</p>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Section title="AI recommendations" icon={Sparkles}>
        <div className="grid gap-3 md:grid-cols-2">
          {report.aiRecommendations?.map((r, i) => (
            <Card key={i} className="p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">{r.title}</h4>
                <ImpactBadge impact={r.impact} />
              </div>
              <p className="text-sm text-muted-foreground">{r.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Pages */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Top performing pages" icon={TrendingUp} compact>
          <Table
            headers={["URL", "Clicks", "Impr", "CTR", "Pos"]}
            rows={
              report.topPages?.map((p) => [
                truncUrl(p.url),
                p.clicks?.toLocaleString(),
                p.impressions?.toLocaleString(),
                `${(p.ctr * 100).toFixed(1)}%`,
                p.position?.toFixed(1),
              ]) ?? []
            }
          />
        </Section>
        <Section title="Low performing pages" icon={AlertTriangle} compact>
          <ul className="divide-y text-sm">
            {report.lowPages?.map((p, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-2.5">
                <span className="truncate font-medium">{truncUrl(p.url)}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{p.issue}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Keywords */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Keyword rankings" icon={Search} compact>
          <Table
            headers={["Keyword", "Pos", "Vol", "Intent"]}
            rows={
              report.keywordRankings?.map((k) => [
                k.keyword,
                k.position?.toFixed(0),
                k.volume?.toLocaleString(),
                <Badge key={k.keyword} variant="outline" className="text-[10px]">
                  {k.intent}
                </Badge>,
              ]) ?? []
            }
          />
        </Section>
        <Section title="Keyword opportunities" icon={Target} compact>
          <Table
            headers={["Keyword", "Vol", "Diff", "Why"]}
            rows={
              report.keywordOpportunities?.map((k) => [
                k.keyword,
                k.volume?.toLocaleString(),
                k.difficulty?.toFixed(0),
                <span key={k.keyword} className="text-xs text-muted-foreground">
                  {k.why}
                </span>,
              ]) ?? []
            }
          />
        </Section>
      </div>

      {/* Technical issues */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Missing metadata" icon={FileText} compact>
          <BulletList
            items={report.missingMetadata?.map((m) => `${truncUrl(m.url)} — ${m.missing}`) ?? []}
          />
        </Section>
        <Section title="Missing alt text" icon={ImageIcon} compact>
          <BulletList
            items={report.missingAltText?.map((m) => `${truncUrl(m.url)} — ${m.count} images`) ?? []}
          />
        </Section>
        <Section title="Internal linking" icon={Link2} compact>
          <ul className="space-y-2 text-sm">
            {report.internalLinking?.map((l, i) => (
              <li key={i} className="rounded-md border bg-card p-2.5">
                <div className="text-xs text-muted-foreground">
                  {truncUrl(l.from)} <ChevronRight className="inline h-3 w-3" /> {truncUrl(l.to)}
                </div>
                <div className="mt-1 text-xs">
                  Anchor: <span className="font-medium">"{l.anchor}"</span>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Conversion + lead capture + CTA */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="CTA suggestions" icon={Target} compact>
          <BulletList items={report.ctaSuggestions ?? []} />
        </Section>
        <Section title="Lead capture" icon={Zap} compact>
          <BulletList items={report.leadCapture ?? []} />
        </Section>
        <Section title="Conversion optimization" icon={CheckCircle2} compact>
          <BulletList items={report.conversionOptimization ?? []} />
        </Section>
      </div>

      {/* Content engine */}
      <Section title="Content cluster engine" icon={Layers}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {report.blogClusters?.map((c, i) => (
            <Card key={i} className="p-4">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                Pillar
              </div>
              <h4 className="mb-3 text-sm font-semibold">{c.pillar}</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {c.posts.map((p, j) => (
                  <li key={j} className="flex items-start gap-1.5">
                    <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {p}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Suggested service pages" icon={FileText} compact>
          <BulletList items={report.suggestedServicePages ?? []} />
        </Section>
        <Section title="Content gaps" icon={FileText} compact>
          <BulletList items={report.contentGaps ?? []} />
        </Section>
      </div>

      {/* Automation */}
      <Section title="Automation insights" icon={Zap}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {report.automationInsights?.map((a, i) => (
            <Card key={i} className="p-4">
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-cta/15">
                <Zap className="h-4 w-4 text-cta" />
              </div>
              <h4 className="text-sm font-semibold">{a.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ---------- helpers ---------- */

function ScoreCard({ label, value }: { label: string; value: number }) {
  const data = [{ name: label, value: Math.max(0, Math.min(100, value || 0)) }];
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className="h-20 w-20 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={8} fill="hsl(var(--primary))" background />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold">{value ?? 0}<span className="text-base text-muted-foreground">/100</span></p>
      </div>
    </Card>
  );
}

function Section({
  title,
  icon: Icon,
  children,
  compact,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      {compact ? <Card className="p-4">{children}</Card> : children}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {headers.map((h) => (
              <th key={h} className="py-2 pr-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0">
              {r.map((c, j) => (
                <td key={j} className="py-2 pr-3">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2">
          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="text-muted-foreground">{it}</span>
        </li>
      ))}
    </ul>
  );
}

function ImpactBadge({ impact }: { impact: "low" | "medium" | "high" }) {
  const map = {
    high: "bg-cta/15 text-cta",
    medium: "bg-primary/15 text-primary",
    low: "bg-muted text-muted-foreground",
  } as const;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${map[impact] ?? map.low}`}>
      {impact} impact
    </span>
  );
}

function truncUrl(u: string) {
  try {
    const { pathname } = new URL(u);
    return pathname || "/";
  } catch {
    return u;
  }
}
