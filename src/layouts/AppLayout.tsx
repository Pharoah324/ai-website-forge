import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, PLAN_LIMITS } from "@/hooks/useProfile";
import { useAdmin } from "@/hooks/useAdmin";
import {
  LayoutDashboard,
  Plus,
  Settings,
  CreditCard,
  LogOut,
  Sparkles,
  Zap,
  Plug,
  DollarSign,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditBadge } from "@/components/CreditBadge";
import { LanguageSelector } from "@/components/LanguageSelector";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { BillingStatusBanner } from "@/components/BillingStatusBanner";
import { useI18n } from "@/lib/i18n";

export default function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: admin } = useAdmin();
  const { t } = useI18n();
  const navigate = useNavigate();

  const nav = [
    { to: "/app", label: t("nav.dashboard"), icon: LayoutDashboard, end: true },
    { to: "/app/new", label: t("nav.newsite"), icon: Plus },
    { to: "/app/optimize", label: "Optimize Site", icon: TrendingUp },
    { to: "/app/integrations", label: t("nav.integrations"), icon: Plug },
    { to: "/app/affiliate", label: "Affiliate Program", icon: DollarSign },
    { to: "/app/billing", label: t("nav.billing"), icon: CreditCard },
    { to: "/app/settings", label: t("nav.settings"), icon: Settings },
    ...(admin ? [{ to: "/admin", label: "Admin Panel", icon: ShieldCheck }] : []),
  ];

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  const planLabel = profile ? PLAN_LIMITS[profile.plan].label : "Free";

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <Link to="/" className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-accent-foreground">
            Virtual Engine <span className="text-sidebar-primary">Builder</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 px-3">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                }`
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-sidebar-border p-4">
          <div className="rounded-md bg-sidebar-accent/60 p-3 text-xs">
            <div className="flex items-center gap-2 text-sidebar-accent-foreground">
              <Sparkles className="h-3 w-3" />
              <span className="font-medium">{planLabel} {t("common.plan")}</span>
            </div>
            <p className="mt-1 text-sidebar-foreground">
              {profile?.plan === "agency"
                ? t("common.unlimitedBuilds")
                : t("common.creditsLeft", { n: profile?.build_credits ?? 0 })}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/60"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.signout")}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card px-6">
          <div className="md:hidden">
            <Link to="/app" className="font-semibold">
              Virtual Engine <span className="text-primary">Builder</span>
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <LanguageSelector />
            <CreditBadge />
            <Button asChild size="sm">
              <Link to="/app/new">
                <Plus className="mr-1 h-4 w-4" /> {t("nav.newsite")}
              </Link>
            </Button>
          </div>
        </header>
        <AnnouncementBanner />
        <BillingStatusBanner />

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
