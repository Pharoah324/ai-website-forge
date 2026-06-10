import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Plus, Wand2, Globe, Search, Calendar, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function Projects() {
  const { user } = useAuth();
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const workspaceFilterId = activeWorkspace ? activeWorkspaceId : null;
  const [search, setSearch] = useState("");

  const { data: sites, isLoading } = useQuery({
    queryKey: ["sites", user?.id, workspaceFilterId ?? "personal"],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("sites")
        .select("id, name, prompt, created_at, workspace_id, site_data")
        .order("created_at", { ascending: false });
      if (workspaceFilterId) q = q.eq("workspace_id", workspaceFilterId);
      else q = q.eq("user_id", user!.id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const filtered = (sites ?? []).filter(
    (s) =>
      !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.prompt ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderOpen className="h-7 w-7 text-primary" />
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sites ? `${sites.length} site${sites.length !== 1 ? "s" : ""} generated` : "All your generated sites"}
          </p>
        </div>
        <Button asChild>
          <Link to="/app/new">
            <Plus className="mr-1 h-4 w-4" /> New Site
          </Link>
        </Button>
      </div>

      {/* Search */}
      {sites && sites.length > 0 && (
        <div className="mt-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-card pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
        </div>
      )}

      {/* Content */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-lg border bg-muted" />
            ))}
          </div>
        ) : !sites || sites.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card py-20 text-center">
            <Globe className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-semibold">No projects yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate your first site and it will appear here.
            </p>
            <Button asChild className="mt-6">
              <Link to="/app/new">
                <Plus className="mr-1 h-4 w-4" /> Generate your first site
              </Link>
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card py-16 text-center">
            <Search className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 font-medium">No results for "{search}"</p>
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => {
              const siteData = s.site_data as { primaryColor?: string; name?: string } | null;
              const accent = siteData?.primaryColor ?? null;
              return (
                <Link
                  key={s.id}
                  to={"/app/sites/" + s.id}
                  className="group relative flex flex-col rounded-xl border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  {/* Color bar */}
                  <div
                    className="h-1.5 w-full rounded-t-xl"
                    style={{ background: accent ? "hsl(" + accent + ")" : "hsl(var(--primary))" }}
                  />

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-base font-semibold group-hover:text-primary leading-tight">
                        {s.name}
                      </h3>
                      <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                      {s.prompt || "No description"}
                    </p>

                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(s.created_at), "MMM d, yyyy")}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors group-hover:border-primary/50 group-hover:text-primary">
                        <Wand2 className="h-3.5 w-3.5" />
                        Open &amp; edit
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
