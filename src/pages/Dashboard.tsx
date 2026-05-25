import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, PLAN_LIMITS } from "@/hooks/useProfile";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Globe, AlertTriangle, Wand2, Briefcase } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const workspaceFilterId = activeWorkspace ? activeWorkspaceId : null;

  const { data: sites } = useQuery({
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

  // Show loading state while profile is being fetched
  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if profile fetch failed
  if (profileError && !profile) {
    return (
      <div className="container max-w-2xl py-8">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <h2 className="text-lg font-semibold text-destructive">Unable to Load Dashboard</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We encountered an error loading your profile. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Safety check: if profile is still null/undefined, show loading
  if (!profile) return null;
  const limits = PLAN_LIMITS[profile.plan];
  const isUnlimited = profile.plan === "agency";
  const totalCap = limits.build + profile.build_credits_rollover;
  const pct = isUnlimited
    ? 100
    : Math.round((profile.build_credits / Math.max(totalCap, 1)) * 100);

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {activeWorkspace ? activeWorkspace.name : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeWorkspace
              ? `Client workspace · ${activeWorkspace.used_build_this_cycle}/${activeWorkspace.monthly_build_allocation} build credits used`
              : `Welcome back, ${profile.display_name || profile.email}.`}
          </p>
        </div>
        <Button asChild>
          <Link to="/app/new">
            <Plus className="mr-1 h-4 w-4" /> New Site
          </Link>
        </Button>
      </div>

      {activeWorkspace && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <Briefcase className="mt-0.5 h-4 w-4 text-primary" />
          <div className="flex-1">
            <p className="font-medium">Working in {activeWorkspace.name}</p>
            <p className="text-xs text-muted-foreground">
              Sites you create here will be tagged to this client workspace and billed against
              its allocation. Switch back to Personal anytime from the workspace dropdown.
            </p>
          </div>
        </div>
      )}

      {/* Banners */}
      {!isUnlimited && profile.build_credits === 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div className="flex-1">
            <p className="font-medium text-destructive">You're out of build credits.</p>
            <p className="text-muted-foreground">
              Buy a top-up pack or upgrade your plan to keep generating sites.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/app/billing">Upgrade</Link>
          </Button>
        </div>
      )}
      {!isUnlimited && profile.build_credits > 0 && pct < 20 && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
          <div className="flex-1">
            <p className="font-medium text-warning">Running low on credits.</p>
            <p className="text-muted-foreground">
              {profile.build_credits} of {totalCap} build credits remaining this month.
            </p>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Plan"
          value={limits.label}
          sub={limits.price === 0 ? "Free" : `$${limits.price}/mo`}
          icon={Sparkles}
        />
        <StatCard
          label="Build credits"
          value={isUnlimited ? "∞" : profile.build_credits.toString()}
          sub={
            isUnlimited
              ? "Agency plan"
              : `of ${totalCap} this month${
                  profile.build_credits_rollover > 0
                    ? ` (incl. ${profile.build_credits_rollover} rollover)`
                    : ""
                }`
          }
        />
        <StatCard
          label="Runtime credits"
          value={profile.runtime_credits.toLocaleString()}
          sub={`of ${limits.runtime.toLocaleString()}`}
        />
      </div>

      {/* Sites */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Your sites</h2>
        {!sites || sites.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card py-16 text-center">
            <Globe className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 font-medium">No sites yet</p>
            <p className="text-sm text-muted-foreground">
              Describe a business and watch it come to life.
            </p>
            <Button asChild className="mt-4">
              <Link to="/app/new">
                <Plus className="mr-1 h-4 w-4" /> Generate your first site
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((s) => (
              <div
                key={s.id}
                className="group rounded-lg border bg-card p-4 shadow-card transition-shadow hover:shadow-elevated"
              >
                <Link to={`/app/sites/${s.id}`} className="block">
                  <h3 className="truncate font-semibold group-hover:text-primary">{s.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.prompt}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {format(new Date(s.created_at), "MMM d, yyyy")}
                  </p>
                </Link>
                <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                  <Link to={`/app/sites/${s.id}`}>
                    <Wand2 className="mr-1 h-3.5 w-3.5" /> Edit with AI
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
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
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
