import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useAdmin } from "@/hooks/useAdmin";
import { getAccess } from "@/lib/optimizationAccess";
import { exportReportPDF } from "@/lib/exportReportPDF";
import { ScoreRing } from "@/components/optimize/ScoreRing";
import { ClusterMap } from "@/components/optimize/ClusterMap";
import { LockedOverlay } from "@/components/optimize/LockedOverlay";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Sparkles, RefreshCw, TrendingUp, AlertTriangle,
  Image as ImageIcon, Target, FileText, Zap, Layers, Search,
  CheckCircle2, Download, ExternalLink, ShieldCheck, ShieldAlert,
  Plug, Globe, Cpu,
} from "lucide-react";
import { toast } from "sonner";

const INTEGRATIONS = [
  { key: "google_search_console", label: "Search Console", icon: Search, gateKey: "gscIntegration" as const },
  { key: "google_analytics", label: "Google Analytics", icon: TrendingUp, gateKey: "gaIntegration" as const },
  { key: "search_atlas", label: "Search Atlas", icon: Cpu, gateKey: null },
  { key: "gohighlevel", label: "GoHighLevel", icon: Zap, gateKey: null },
  { key: "stripe", label: "Stripe", icon: ShieldCheck, gateKey: null },
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
  const { data: profile } = useProfile();
  const { data: adminLevel } = useAdmin();
  const access = getAccess(profile?.plan ?? "free", !!adminLevel);

  const { data: project, refetch } = useQuery({
    queryKey: ["optimization-project", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("optimization_projects").select("*").eq("id", id!).maybeSingle();
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
      const { error } = await supabase.from("optimization_projects")
        .update({ integrations: next }).eq("id", id!);
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
    onSuccess: () => { toast.success("Analysis complete"); refetch(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Analysis failed"),
  });

  useEffect(() => {
    if (project && project.status === "pending" && !project.latest_report && !analyzeMut.isPending) {
      analyzeMut.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const isRunning = project?.status === "analyzing" || analyzeMut.isPending;

  if (!project) {
    return (
      <div className="min-h-screen bg-[#080D18] text-white">
        <div className="container py-10 text-sm text-white/50">Loading…</div>
      </div>
    );
  }

  const ghlConnected = !!integrations["gohighlevel"];

  return (
    <div className="min-h-screen bg-[#080D18] text-white" style={{
      backgroundImage: "radial-gradient(ellipse at top, rgba(16,185,129,0.08), transparent 60%)",
    }}>
      <div className="container max-w-7xl py-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to="/app/optimize" className="inline-flex items-center text-xs text-white/50 hover:text-white">
              <ArrowLeft className="mr-1 h-3 w-3" /> All sites
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{project.name}</h1>
            <a href={project.website_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-emerald-400">
              <Globe className="h-3 w-3" /> {project.website_url} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            {access.pdfExport && report && (
              <button
                onClick={() => exportReportPDF({ siteName: project.name, websiteUrl: project.website_url, report })}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium hover:bg-white/[0.08]"
              >
                <Download className="h-3.5 w-3.5" /> Export PDF
              </button>
            )}
            <button onClick={() => analyzeMut.mutate()} disabled={isRunning}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold hover:bg-emerald-400 disabled:opacity-50">
              {isRunning ? (<><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Analyzing…</>)
                : (<><Sparkles className="h-3.5 w-3.5" /> Re-run analysis</>)}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="space-y-6">
            {/* Empty / loading */}
            {!report && (
              <Panel>
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                  {isRunning ? (
                    <>
                      <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
                      <p className="font-medium">Generating your AI optimization report…</p>
                      <p className="text-xs text-white/50">Crawling, scoring, and benchmarking — usually 15-30s.</p>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-8 w-8 text-emerald-400" />
                      <p className="font-medium">Ready to analyze your site.</p>
                      <button onClick={() => analyzeMut.mutate()}
                        className="rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold hover:bg-emerald-400">
                        Run analysis
                      </button>
                    </>
                  )}
                </div>
              </Panel>
            )}

            {report && (
              <ReportView
                report={report}
                access={access}
                ghlConnected={ghlConnected}
                onConnectGhl={() => toggleMut.mutate({ key: "gohighlevel", value: true })}
              />
            )}
          </div>

          {/* Sidebar */}
          <Sidebar
            integrations={integrations}
            access={access}
            onToggle={(k, v) => toggleMut.mutate({ key: k, value: v })}
            project={project}
          />
        </div>
      </div>
    </div>
  );
}

/* ============= Sidebar ============= */
function Sidebar({
  integrations, access, onToggle, project,
}: {
  integrations: Record<string, boolean>;
  access: ReturnType<typeof getAccess>;
  onToggle: (k: string, v: boolean) => void;
  project: { status: string; last_analyzed_at: string | null };
}) {
  const connectedCount = Object.values(integrations).filter(Boolean).length;
  return (
    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Connected systems</h3>
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-300">
            {connectedCount}/{INTEGRATIONS.length}
          </Badge>
        </div>
        <ul className="space-y-2">
          {INTEGRATIONS.map((i) => {
            const on = !!integrations[i.key];
            const locked = i.gateKey ? !access[i.gateKey] : false;
            const Icon = i.icon;
            return (
              <li key={i.key} className="flex items-center justify-between gap-2 rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${on ? "text-emerald-400" : "text-white/40"}`} />
                  <span className="truncate text-xs">{i.label}</span>
                  {locked && (
                    <span className="ml-1 rounded bg-white/5 px-1 py-0.5 text-[9px] uppercase text-white/40">Pro</span>
                  )}
                </div>
                <Switch
                  checked={on}
                  disabled={locked}
                  onCheckedChange={(v) => onToggle(i.key, v)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/50">Plan</h3>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold capitalize">{access.plan}</span>
          {access.isAdmin && <Badge className="bg-emerald-500/15 text-emerald-300">Admin</Badge>}
        </div>
        <p className="mt-2 text-[11px] text-white/50">
          AI recommendations: {access.aiRecommendationsPerMonth === -1 ? "Unlimited" : `${access.aiRecommendationsPerMonth}/mo`}
        </p>
        {access.upgradeTo && (
          <Link to="/app/billing" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300">
            <Sparkles className="h-3 w-3" /> Upgrade to unlock more →
          </Link>
        )}
      </Panel>

      <Panel>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/50">Last run</h3>
        <p className="text-xs text-white/70">
          {project.last_analyzed_at ? new Date(project.last_analyzed_at).toLocaleString() : "—"}
        </p>
        <p className="mt-1 text-[11px] capitalize text-white/40">Status: {project.status}</p>
      </Panel>
    </aside>
  );
}

/* ============= Report ============= */
function ReportView({
  report, access, ghlConnected, onConnectGhl,
}: {
  report: Report;
  access: ReturnType<typeof getAccess>;
  ghlConnected: boolean;
  onConnectGhl: () => void;
}) {
  const trend = useMemo(() => report.trafficTrend ?? [], [report]);
  const visibleRecs = access.aiRecommendationsPerMonth === -1
    ? report.aiRecommendations
    : (report.aiRecommendations || []).slice(0, Math.max(access.aiRecommendationsPerMonth, access.visibleIssues));

  // priority bucket for AI recs
  const buckets = {
    Critical: visibleRecs?.filter(r => r.impact === "high") ?? [],
    Important: visibleRecs?.filter(r => r.impact === "medium") ?? [],
    Suggested: visibleRecs?.filter(r => r.impact === "low") ?? [],
  };

  const keywordChartData = (report.keywordRankings || []).slice(0, 8).map(k => ({
    name: k.keyword.length > 14 ? k.keyword.slice(0, 12) + "…" : k.keyword,
    pos: k.position,
  }));

  return (
    <>
      {/* Score row */}
      <Panel>
        <SectionHeader icon={Target} title="Performance scores" />
        {access.fullScores ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <ScoreRing label="SEO" value={report.scores.seo} />
            <ScoreRing label="Speed" value={report.scores.speed} />
            <ScoreRing label="Mobile" value={report.scores.mobile} />
            <ScoreRing label="Conversion" value={report.scores.conversion} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <ScoreRing label="SEO" value={report.scores.seo} />
            <LockedScore label="Speed" upgrade={access.upgradeTo} />
            <LockedScore label="Mobile" upgrade={access.upgradeTo} />
            <LockedScore label="Conversion" upgrade={access.upgradeTo} />
          </div>
        )}
        <p className="mt-6 border-t border-white/5 pt-4 text-sm leading-relaxed text-white/70">{report.summary}</p>
      </Panel>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeader icon={Search} title="Keyword rankings" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={keywordChartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
                <YAxis reversed tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
                <Tooltip contentStyle={{ background: "#0E1A2B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
                <Bar dataKey="pos" fill="#10B981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel>
          <SectionHeader icon={TrendingUp} title="Traffic trend (6mo)" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="ot" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
                <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
                <Tooltip contentStyle={{ background: "#0E1A2B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
                <Area type="monotone" dataKey="organic" stroke="#10B981" fill="url(#ot)" strokeWidth={2} />
                <Area type="monotone" dataKey="direct" stroke="#84CC16" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="referral" stroke="rgba(255,255,255,0.4)" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* AI Recommendations */}
      <Panel>
        <SectionHeader icon={Sparkles} title="AI recommendations" right={
          <span className="text-[10px] uppercase tracking-wider text-white/40">
            {access.aiRecommendationsPerMonth === -1 ? "Unlimited" : `${visibleRecs?.length ?? 0}/${access.aiRecommendationsPerMonth} this month`}
          </span>
        } />
        {(["Critical", "Important", "Suggested"] as const).map((b) => (
          buckets[b].length > 0 && (
            <div key={b} className="mb-4 last:mb-0">
              <div className="mb-2 flex items-center gap-2">
                <PriorityDot bucket={b} />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/70">{b}</h4>
                <span className="text-[10px] text-white/40">({buckets[b].length})</span>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {buckets[b].map((r, i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <h5 className="text-sm font-semibold text-white">{r.title}</h5>
                    <p className="mt-1 text-xs text-white/60">{r.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
        {access.aiRecommendationsPerMonth !== -1 &&
          (report.aiRecommendations?.length ?? 0) > (visibleRecs?.length ?? 0) && (
          <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center text-xs text-emerald-200">
            {(report.aiRecommendations.length - visibleRecs.length)} more recommendations available on{" "}
            <Link to="/app/billing" className="font-semibold underline">Pro</Link>.
          </div>
        )}
      </Panel>

      {/* Pages */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="relative">
          <SectionHeader icon={TrendingUp} title="Top performing pages" />
          {access.topAndLowPages ? (
            <DataTable
              headers={["URL", "Clicks", "Impr", "CTR", "Pos"]}
              rows={(report.topPages || []).map(p => [
                truncUrl(p.url),
                fmtNum(p.clicks),
                fmtNum(p.impressions),
                `${(p.ctr * 100).toFixed(1)}%`,
                p.position?.toFixed(1),
              ])}
            />
          ) : (
            <Locked feature="Top performing pages" plan={access.plan} upgrade={access.upgradeTo} />
          )}
        </Panel>
        <Panel className="relative">
          <SectionHeader icon={AlertTriangle} title="Low performing pages" />
          {access.topAndLowPages ? (
            <ul className="divide-y divide-white/5 text-sm">
              {(report.lowPages || []).map((p, i) => (
                <li key={i} className="flex items-start justify-between gap-3 py-2">
                  <span className="truncate font-medium text-white/80">{truncUrl(p.url)}</span>
                  <span className="shrink-0 text-[11px] text-amber-300">{p.issue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Locked feature="Low performing pages" plan={access.plan} upgrade={access.upgradeTo} />
          )}
        </Panel>
      </div>

      {/* Keyword opportunities & technical */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="relative">
          <SectionHeader icon={Target} title="Keyword opportunities" />
          {access.keywordOpportunities ? (
            <DataTable
              headers={["Keyword", "Volume", "Diff", "Why"]}
              rows={(report.keywordOpportunities || []).map(k => [
                k.keyword,
                fmtNum(k.volume),
                <span key={k.keyword} className="text-[11px]">{k.difficulty?.toFixed(0)}</span>,
                <span key={k.keyword + "w"} className="text-[11px] text-white/50">{k.why}</span>,
              ])}
            />
          ) : <Locked feature="Keyword opportunities" plan={access.plan} upgrade={access.upgradeTo} />}
        </Panel>
        <Panel className="relative">
          <SectionHeader icon={FileText} title="Technical audit" />
          {access.technicalAudit ? (
            <div className="space-y-4">
              <div>
                <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">Missing metadata</h4>
                <BulletList items={(report.missingMetadata || []).map(m => `${truncUrl(m.url)} — ${m.missing}`)} />
              </div>
              <div>
                <h4 className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  <ImageIcon className="h-3 w-3" /> Missing alt text
                </h4>
                <BulletList items={(report.missingAltText || []).map(m => `${truncUrl(m.url)} — ${m.count} images`)} />
              </div>
            </div>
          ) : <Locked feature="Technical audit" plan={access.plan} upgrade={access.upgradeTo} />}
        </Panel>
      </div>

      {/* Content Cluster Engine */}
      <Panel className="relative">
        <SectionHeader icon={Layers} title="Content cluster engine" right={
          <Badge className="bg-emerald-500/15 text-emerald-300">Mind-map</Badge>
        } />
        {access.contentClusterEngine ? (
          <ClusterMap
            clusters={report.blogClusters || []}
            onGenerate={(topic) => toast.info(`Drafting page: ${topic}`, {
              description: "AI is generating a brief — this will appear in Sites soon.",
            })}
          />
        ) : <Locked feature="Content cluster engine" plan={access.plan} upgrade={access.upgradeTo} />}
      </Panel>

      {/* Internal linking + blog clusters */}
      {access.internalLinkingMap && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <SectionHeader icon={Plug} title="Internal linking opportunities" />
            <ul className="space-y-2 text-sm">
              {(report.internalLinking || []).map((l, i) => (
                <li key={i} className="rounded-md border border-white/5 bg-white/[0.02] p-2.5">
                  <div className="text-[11px] text-white/50">
                    <span className="text-white/80">{truncUrl(l.from)}</span> →{" "}
                    <span className="text-emerald-300">{truncUrl(l.to)}</span>
                  </div>
                  <div className="mt-1 text-[11px]">Anchor: <span className="font-medium text-white/80">"{l.anchor}"</span></div>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <SectionHeader icon={FileText} title="Blog cluster suggestions" />
            <BulletList items={(report.suggestedServicePages || []).concat(report.contentGaps || [])} />
          </Panel>
        </div>
      )}

      {/* Conversion */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel><SectionHeader icon={Target} title="CTA suggestions" />
          <BulletList items={report.ctaSuggestions || []} /></Panel>
        <Panel><SectionHeader icon={Zap} title="Lead capture" />
          <BulletList items={report.leadCapture || []} /></Panel>
        <Panel><SectionHeader icon={CheckCircle2} title="Conversion optimization" />
          <BulletList items={report.conversionOptimization || []} /></Panel>
      </div>

      {/* Automation insights */}
      <Panel className="relative">
        <SectionHeader icon={Zap} title="Automation opportunities (GoHighLevel)" right={
          ghlConnected
            ? <Badge className="bg-emerald-500/15 text-emerald-300">GHL connected</Badge>
            : <Badge variant="outline" className="border-amber-400/30 text-amber-300">GHL not connected</Badge>
        } />
        {access.automationInsights ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(report.automationInsights || []).map((a, i) => (
              <div key={i} className="flex flex-col rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-lime-500/10">
                  <Zap className="h-4 w-4 text-lime-400" />
                </div>
                <h4 className="text-sm font-semibold text-white">{a.title}</h4>
                <p className="mt-1 flex-1 text-xs text-white/60">{a.body}</p>
                {ghlConnected ? (
                  <button
                    onClick={() => toast.success("Queued for GHL", { description: a.title })}
                    className="mt-3 inline-flex items-center justify-center gap-1 rounded-md bg-lime-500 px-2.5 py-1.5 text-xs font-semibold text-[#0a1a0f] hover:bg-lime-400"
                  >
                    <Plug className="h-3 w-3" /> Add to GHL
                  </button>
                ) : (
                  <button
                    onClick={onConnectGhl}
                    className="mt-3 inline-flex items-center justify-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/5 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/10"
                  >
                    Connect GoHighLevel to activate
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : <Locked feature="Automation insights" plan={access.plan} upgrade={access.upgradeTo} />}
      </Panel>
    </>
  );
}

/* ============= Primitives ============= */

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm ${className}`}
      style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset" }}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  icon: Icon, title, right,
}: { icon: React.ElementType; title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-emerald-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80">{title}</h3>
      </div>
      {right}
    </div>
  );
}

function PriorityDot({ bucket }: { bucket: "Critical" | "Important" | "Suggested" }) {
  const c = bucket === "Critical" ? "#EF4444" : bucket === "Important" ? "#F59E0B" : "#10B981";
  return <span className="h-2 w-2 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />;
}

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="border-b border-white/5 pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-white/40">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-white/[0.03] last:border-0">
              {r.map((c, j) => <td key={j} className="py-2 text-xs text-white/80">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items?.length) return <p className="text-xs text-white/40">—</p>;
  return (
    <ul className="space-y-1.5 text-sm text-white/70">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function LockedScore({ label, upgrade }: { label: string; upgrade: "builder" | "pro" | "agency" | null }) {
  return (
    <div className="flex flex-col items-center gap-2 opacity-60">
      <div className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full border border-dashed border-white/15 bg-white/[0.02]">
        <span className="text-2xl">🔒</span>
      </div>
      <span className="text-xs font-medium uppercase tracking-wider text-white/50">{label}</span>
      {upgrade && <Link to="/app/billing" className="text-[10px] text-emerald-400 hover:underline">Upgrade</Link>}
    </div>
  );
}

function Locked({ feature, plan, upgrade }: { feature: string; plan: string; upgrade: "builder" | "pro" | "agency" | null }) {
  return (
    <div className="relative min-h-[180px]">
      <div className="opacity-30 blur-sm">
        <BulletList items={["Sample row one to give a sense of layout", "Another locked example value", "And a third example placeholder"]} />
      </div>
      <LockedOverlay plan={plan} feature={feature} upgradeTo={upgrade} />
    </div>
  );
}

function truncUrl(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname;
    const s = `${u.hostname}${path}`;
    return s.length > 40 ? s.slice(0, 38) + "…" : s;
  } catch {
    return url?.slice(0, 40) ?? "";
  }
}

function fmtNum(n: number) { return (n ?? 0).toLocaleString(); }
