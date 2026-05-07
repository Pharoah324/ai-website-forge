import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Search, TrendingUp, FileText } from "lucide-react";
import { toast } from "sonner";

type Keyword = { keyword: string; volume: number; difficulty?: number };
type SeoRow = {
  id: string;
  site_id: string;
  score: number;
  meta_title: string | null;
  meta_description: string | null;
  keywords: Keyword[];
  blog_topics: string[];
  industry: string | null;
  location: string | null;
  source: string;
  updated_at: string;
};

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color =
    score >= 80 ? "hsl(var(--primary))" :
    score >= 50 ? "hsl(var(--accent))" :
    "hsl(var(--destructive))";
  return (
    <div className="relative h-24 w-24">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle
          cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{score}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">SEO</span>
      </div>
    </div>
  );
}

export function SeoPanel({ siteId }: { siteId: string }) {
  const qc = useQueryClient();
  const [editTitle, setEditTitle] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState<string | null>(null);

  const { data: seo, isLoading } = useQuery({
    queryKey: ["site-seo", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_seo").select("*").eq("site_id", siteId).maybeSingle();
      if (error) throw error;
      return data as SeoRow | null;
    },
  });

  const optimize = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("seo-analyze", {
        body: { site_id: siteId },
      });
      if (error || (data as any)?.error) throw new Error(error?.message || (data as any).error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-seo", siteId] });
      toast.success("SEO refreshed");
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  const saveMeta = useMutation({
    mutationFn: async () => {
      const patch: any = {};
      if (editTitle !== null) patch.meta_title = editTitle;
      if (editDesc !== null) patch.meta_description = editDesc;
      const { error } = await supabase.from("site_seo").update(patch).eq("site_id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-seo", siteId] });
      setEditTitle(null); setEditDesc(null);
      toast.success("Saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading SEO…
      </div>
    );
  }

  if (!seo) {
    return (
      <div className="space-y-3 rounded-lg border bg-card p-6 text-center">
        <Search className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No SEO analysis yet.</p>
        <Button onClick={() => optimize.mutate()} disabled={optimize.isPending}>
          {optimize.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Analyze with Search Atlas
        </Button>
      </div>
    );
  }

  const title = editTitle ?? seo.meta_title ?? "";
  const desc = editDesc ?? seo.meta_description ?? "";

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div className="flex items-center gap-4">
          <ScoreRing score={seo.score} />
          <div>
            <p className="text-sm font-semibold">SEO Score</p>
            <p className="text-xs text-muted-foreground">
              {seo.industry} {seo.location && `· ${seo.location}`}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Source: {seo.source.replace("_", " ")}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => optimize.mutate()} disabled={optimize.isPending}>
          {optimize.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Optimize for SEO
        </Button>
      </div>

      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-primary" /> Meta tags
        </h3>
        <div className="space-y-2 rounded-lg border bg-card p-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Meta title ({title.length}/60)</label>
            <Input
              value={title}
              maxLength={70}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Meta description ({desc.length}/160)</label>
            <Textarea
              value={desc}
              maxLength={180}
              rows={3}
              onChange={(e) => setEditDesc(e.target.value)}
            />
          </div>
          {(editTitle !== null || editDesc !== null) && (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setEditTitle(null); setEditDesc(null); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => saveMeta.mutate()} disabled={saveMeta.isPending}>
                {saveMeta.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Save
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" /> Target keywords
        </h3>
        {seo.keywords.length === 0 ? (
          <p className="rounded-lg border bg-card p-4 text-xs text-muted-foreground">
            No keywords returned from Search Atlas yet. Click Optimize to retry.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {seo.keywords.map((k, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="font-medium">{k.keyword}</span>
                <span className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{k.volume.toLocaleString()}/mo</span>
                  {k.difficulty !== undefined && (
                    <span className="rounded bg-muted px-1.5 py-0.5">KD {k.difficulty}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> Blog topics to rank for
        </h3>
        {seo.blog_topics.length === 0 ? (
          <p className="rounded-lg border bg-card p-4 text-xs text-muted-foreground">No suggestions yet.</p>
        ) : (
          <ol className="space-y-1.5 rounded-lg border bg-card p-4 text-sm">
            {seo.blog_topics.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground">{i + 1}.</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
