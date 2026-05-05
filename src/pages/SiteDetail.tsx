import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Share2,
  Trash2,
  Copy,
  Check,
  Wand2,
  Loader2,
  Github,
  ExternalLink,
  Globe,
  Rocket,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { PUBLISH_ROOT } from "@/lib/subdomain";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SitePreview } from "@/components/SitePreview";
import type { SiteContent, SiteSection } from "@/types/site";
import { toast } from "sonner";

const VIEWPORTS = {
  desktop: { width: "100%", icon: Monitor, label: "Desktop" },
  tablet: { width: "768px", icon: Tablet, label: "Tablet" },
  mobile: { width: "390px", icon: Smartphone, label: "Mobile" },
} as const;

type Variation = Partial<SiteSection>;

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const [viewport, setViewport] = useState<keyof typeof VIEWPORTS>("desktop");
  const [copied, setCopied] = useState(false);
  const [rewriteIdx, setRewriteIdx] = useState<number | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [rewriting, setRewriting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [subdomainInput, setSubdomainInput] = useState("");
  const [publishError, setPublishError] = useState<string | null>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: ghIntegration } = useQuery({
    queryKey: ["integration", "github-for-push"],
    queryFn: async () => {
      const { data } = await supabase
        .from("integrations").select("metadata").eq("platform", "github").maybeSingle();
      return data;
    },
  });

  const ghConnected = !!ghIntegration;
  const existingRepoUrl: string | null =
    (ghIntegration?.metadata as any)?.sites?.[id ?? ""]?.html_url ?? null;
  const effectiveRepoUrl = repoUrl ?? existingRepoUrl;

  const { data: site, isLoading } = useQuery({
    queryKey: ["site", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const shareToggle = useMutation({
    mutationFn: async (next: boolean) => {
      const { error } = await supabase
        .from("sites").update({ is_shared: next }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site", id] }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sites").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sites"] });
      navigate("/app");
      toast.success("Site deleted");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!site) {
    return <div className="container py-10"><p>Site not found.</p></div>;
  }

  const content = site.content as unknown as SiteContent;
  const v = VIEWPORTS[viewport];
  const shareUrl = site.is_shared
    ? `${window.location.origin}/share/${site.share_token}`
    : null;
  const liveUrl =
    site.published && site.subdomain
      ? `https://${site.subdomain}.${PUBLISH_ROOT}`
      : null;

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 63);

  const openPublish = () => {
    setPublishError(null);
    setSubdomainInput(site.subdomain || slugify(site.name || "my-site"));
    setPublishOpen(true);
  };

  const submitPublish = async () => {
    setPublishing(true);
    setPublishError(null);
    const { data, error } = await supabase.functions.invoke("publish-site", {
      body: { site_id: id, subdomain: subdomainInput },
    });
    setPublishing(false);
    const errMsg = error?.message || (data as any)?.error;
    if (errMsg) {
      setPublishError(errMsg);
      return;
    }
    qc.invalidateQueries({ queryKey: ["site", id] });
    toast.success("Site published!", {
      description: (data as any).url,
      action: { label: "Open", onClick: () => window.open((data as any).url, "_blank") },
    });
    setPublishOpen(false);
  };

  const unpublish = async () => {
    if (!confirm("Take this site offline?")) return;
    const { error } = await supabase.functions.invoke("publish-site", {
      body: { site_id: id, action: "unpublish" },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["site", id] });
    toast.success("Site unpublished");
  };

  const copyShare = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const openRewrite = async (idx: number) => {
    setRewriteIdx(idx);
    setVariations([]);
    setRewriting(true);
    const { data, error } = await supabase.functions.invoke("rewrite-section", {
      body: {
        section: content.sections[idx],
        business_context: `${content.name} — ${content.tagline}. Original prompt: ${site.prompt}`,
      },
    });
    setRewriting(false);
    if (error || data?.error) {
      toast.error(error?.message || data?.error || "Rewrite failed");
      setRewriteIdx(null);
      return;
    }
    setVariations(data.variations || []);
  };

  const pushToGithub = async () => {
    if (!ghConnected) {
      toast.error("Connect GitHub first", {
        description: "Open Integrations to connect your GitHub account.",
        action: { label: "Open", onClick: () => navigate("/app/integrations") },
      });
      return;
    }
    setPushing(true);
    const { data, error } = await supabase.functions.invoke("github-push", {
      body: { site_id: id },
    });
    setPushing(false);
    if (error || (data as any)?.error) {
      toast.error("Push failed", { description: error?.message || (data as any)?.error });
      return;
    }
    const url = (data as any).html_url as string;
    setRepoUrl(url);
    qc.invalidateQueries({ queryKey: ["integration", "github-for-push"] });
    toast.success("Pushed to GitHub", {
      description: url,
      action: { label: "Open repo", onClick: () => window.open(url, "_blank") },
    });
  };

  const applyVariation = async (variation: Variation) => {
    if (rewriteIdx === null) return;
    const next: SiteContent = JSON.parse(JSON.stringify(content));
    next.sections[rewriteIdx] = { ...next.sections[rewriteIdx], ...variation };
    const { error } = await supabase
      .from("sites").update({ content: next }).eq("id", id!);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["site", id] });
    toast.success("Section updated");
    setRewriteIdx(null);
    setVariations([]);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/app">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-sm font-semibold">{site.name}</h1>
            <p className="line-clamp-1 text-xs text-muted-foreground">{site.prompt}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
            {(Object.keys(VIEWPORTS) as Array<keyof typeof VIEWPORTS>).map((k) => {
              const VP = VIEWPORTS[k];
              const active = viewport === k;
              return (
                <button
                  key={k}
                  onClick={() => setViewport(k)}
                  className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <VP.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{VP.label}</span>
                </button>
              );
            })}
          </div>
          {shareUrl ? (
            <Button size="sm" variant="outline" onClick={copyShare}>
              {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
              Copy share link
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => shareToggle.mutate(true)}>
              <Share2 className="mr-1 h-3.5 w-3.5" /> Share preview
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={pushToGithub} disabled={pushing}>
            {pushing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Github className="mr-1 h-3.5 w-3.5" />}
            {effectiveRepoUrl ? "Push update" : "Push to GitHub"}
          </Button>
          {effectiveRepoUrl && (
            <Button size="sm" variant="ghost" asChild>
              <a href={effectiveRepoUrl} target="_blank" rel="noreferrer" title="Open GitHub repo">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this site?")) remove.mutate(); }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[240px_1fr]">
        {/* Section list with rewrite buttons */}
        <aside className="overflow-y-auto border-r bg-card p-3">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sections · Rewrite is free
          </p>
          <ul className="space-y-1">
            {content.sections.map((s, i) => (
              <li key={i} className="group flex items-center justify-between rounded-md p-2 hover:bg-muted">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">{s.type}</p>
                  <p className="truncate text-xs font-medium">{s.heading}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => openRewrite(i)}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex flex-1 items-start justify-center overflow-y-auto bg-muted/30 p-6">
          <div
            className="overflow-hidden rounded-lg border bg-card shadow-elevated transition-all"
            style={{ width: v.width, maxWidth: "100%" }}
          >
            <SitePreview content={content} />
          </div>
        </div>
      </div>

      <Dialog open={rewriteIdx !== null} onOpenChange={(o) => !o && setRewriteIdx(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Rewrite copy — pick a variation</DialogTitle>
            <DialogDescription>
              Free refinement. Click one to apply it to your site.
            </DialogDescription>
          </DialogHeader>
          {rewriting ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating 3 variations…</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {variations.map((v, i) => (
                <button
                  key={i}
                  onClick={() => applyVariation(v)}
                  className="rounded-lg border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md"
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
                    Variation {i + 1}
                  </p>
                  <h3 className="font-semibold leading-tight">{v.heading}</h3>
                  {v.subheading && (
                    <p className="mt-2 text-xs text-muted-foreground">{v.subheading}</p>
                  )}
                  {v.cta && (
                    <p className="mt-2 inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {v.cta}
                    </p>
                  )}
                  {v.items && v.items.length > 0 && (
                    <ul className="mt-3 space-y-1.5 text-xs">
                      {v.items.slice(0, 3).map((it, j) => (
                        <li key={j}>
                          <span className="font-medium">{it.title}</span>
                          {it.body && <span className="text-muted-foreground"> — {it.body}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
