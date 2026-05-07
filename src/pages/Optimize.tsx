import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Globe, ArrowRight, Plus, Trash2, BarChart3, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useProfile } from "@/hooks/useProfile";
import { useAdmin } from "@/hooks/useAdmin";
import { getAccess } from "@/lib/optimizationAccess";

type OptimizationProject = {
  id: string;
  user_id: string;
  website_url: string;
  name: string;
  status: string;
  last_analyzed_at: string | null;
  created_at: string;
};

export default function Optimize() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const { data: profile } = useProfile();
  const { data: adminLevel } = useAdmin();
  const access = getAccess(profile?.plan ?? "free", !!adminLevel);

  const { data: projects } = useQuery({
    queryKey: ["optimization-projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("optimization_projects")
        .select("id, user_id, website_url, name, status, last_analyzed_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OptimizationProject[];
    },
  });

  const createMut = useMutation({
    mutationFn: async (websiteUrl: string) => {
      if (!user) throw new Error("Not signed in");
      // Multi-client gate: only Agency (or admin) can manage more than one site
      if (!access.multiClient && (projects?.length ?? 0) >= 1) {
        throw new Error("Multi-site management is an Agency feature. Upgrade to add unlimited client sites.");
      }
      let normalized = websiteUrl.trim();
      if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
      const host = new URL(normalized).hostname.replace(/^www\./, "");
      const { data, error } = await supabase
        .from("optimization_projects")
        .insert({ user_id: user.id, website_url: normalized, name: host })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (p) => {
      setUrl("");
      qc.invalidateQueries({ queryKey: ["optimization-projects"] });
      toast.success("Site added");
      window.location.href = `/app/optimize/${p.id}`;
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add site"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("optimization_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["optimization-projects"] });
      toast.success("Removed");
    },
  });

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Website optimization</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your existing site and let AI analyze SEO, growth opportunities, and automation gaps.
        </p>
      </div>

      <Card className="p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!url.trim()) return;
            createMut.mutate(url);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="flex flex-1 items-center gap-2 rounded-md border bg-background px-3">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="yourwebsite.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <Button type="submit" disabled={createMut.isPending}>
            <Plus className="mr-1 h-4 w-4" />
            {createMut.isPending ? "Adding…" : "Add site"}
          </Button>
        </form>
      </Card>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Connected sites</h2>
        {!projects || projects.length === 0 ? (
          <Card className="border-dashed py-14 text-center">
            <BarChart3 className="mx-auto h-9 w-9 text-muted-foreground" />
            <p className="mt-3 font-medium">No sites yet</p>
            <p className="text-sm text-muted-foreground">
              Add a website above to get an AI optimization report.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <Card key={p.id} className="group p-5 transition-shadow hover:shadow-elevated">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link to={`/app/optimize/${p.id}`} className="block">
                      <h3 className="truncate font-semibold group-hover:text-primary">{p.name}</h3>
                      <p className="truncate text-xs text-muted-foreground">{p.website_url}</p>
                    </Link>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <StatusPill status={p.status} />
                      {p.last_analyzed_at && (
                        <span className="text-muted-foreground">
                          Last run {format(new Date(p.last_analyzed_at), "MMM d, h:mm a")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/app/optimize/${p.id}`}>
                        Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMut.mutate(p.id)}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Not analyzed", className: "bg-muted text-muted-foreground" },
    analyzing: { label: "Analyzing…", className: "bg-warning/15 text-warning" },
    ready: { label: "Ready", className: "bg-primary/15 text-primary" },
    error: { label: "Error", className: "bg-destructive/15 text-destructive" },
  };
  const v = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${v.className}`}>
      {v.label}
    </span>
  );
}
