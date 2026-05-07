import { Navigate, NavLink, Outlet, Link } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadAlertCount } from "@/hooks/useAdminAlerts";
import { ShieldCheck, LayoutDashboard, Users, Globe, DollarSign, Megaphone, KeyRound, UserCog, ArrowLeft, Bell } from "lucide-react";

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const { data: admin, isLoading } = useAdmin();
  const { data: unreadAlerts = 0 } = useUnreadAlertCount();

  if (loading || isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!admin) return <Navigate to="/app" replace />;

  const isSuper = admin.access_level === "super_admin";

  const nav = [
    { to: "/admin", end: true, label: "Overview", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/sites", label: "Sites", icon: Globe },
    { to: "/admin/affiliates", label: "Affiliates", icon: DollarSign },
    { to: "/admin/alerts", label: "Alerts", icon: Bell, badge: unreadAlerts },
    { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { to: "/admin/codes", label: "Access Codes", icon: KeyRound },
    ...(isSuper ? [{ to: "/admin/admins", label: "Admin Users", icon: UserCog }] : []),
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 flex-col border-r border-primary/10 bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cta">
            <ShieldCheck className="h-4 w-4 text-cta-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold">Admin Console</div>
            <div className="text-[10px] uppercase tracking-wider text-cta">{admin.access_level.replace("_", " ")}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"
                }`
              }>
              <n.icon className="h-4 w-4" />
              <span className="flex-1">{n.label}</span>
              {"badge" in n && (n as any).badge > 0 && (
                <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cta px-1.5 text-[10px] font-bold text-cta-foreground">
                  {(n as any).badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <Link to="/app" className="m-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent/60">
          <ArrowLeft className="h-4 w-4" /> Back to app
        </Link>
      </aside>
      <main className="min-w-0 flex-1 overflow-x-hidden p-6">
        <Outlet />
      </main>
    </div>
  );
}
