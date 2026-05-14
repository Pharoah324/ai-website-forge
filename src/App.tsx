import type { RouteRecord } from "vite-react-ssg";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Dashboard from "./pages/Dashboard";
import NewSite from "./pages/NewSite";
import SiteDetail from "./pages/SiteDetail";
import Billing from "./pages/Billing";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import Share from "./pages/Share";
import LiveSite from "./pages/LiveSite";
import AppLayout from "./layouts/AppLayout";
import NotFound from "./pages/NotFound";
import Affiliates from "./pages/Affiliates";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import AdminAffiliates from "./pages/AdminAffiliates";
import AdminLayout from "./layouts/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSites from "./pages/admin/AdminSites";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminAccessCodes from "./pages/admin/AdminAccessCodes";
import AdminAdmins from "./pages/admin/AdminAdmins";
import AdminAlerts from "./pages/admin/AdminAlerts";
import AdminUsage from "./pages/admin/AdminUsage";
import AdminLaunchTests from "./pages/admin/AdminLaunchTests";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Optimize from "./pages/Optimize";
import OptimizeDashboard from "./pages/OptimizeDashboard";
import Onboarding from "./pages/Onboarding";
import Agency from "./pages/Agency";
import InviteAccept from "./pages/InviteAccept";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { getCustomerSubdomain } from "./lib/subdomain";
import { I18nProvider } from "./lib/i18n";
import { captureRefFromUrl } from "./lib/affiliateTracking";
import { usePageTranslator } from "./hooks/usePageTranslator";
import { useEffect } from "react";

function TranslatorMount() {
  usePageTranslator();
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

function RootLayout() {
  useEffect(() => { captureRefFromUrl(); }, []);
  // Customer-subdomain branch only runs in the browser (uses window). Safe for SSG.
  if (typeof window !== "undefined") {
    const customerSubdomain = getCustomerSubdomain();
    if (customerSubdomain) {
      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <LiveSite subdomain={customerSubdomain} />
          </TooltipProvider>
        </QueryClientProvider>
      );
    }
  }
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <I18nProvider>
          <TranslatorMount />
          <AuthProvider>
            <WorkspaceProvider>
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </WorkspaceProvider>
          </AuthProvider>
        </I18nProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export const routes: RouteRecord[] = [
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Landing },
      { path: "auth", Component: Auth },
      { path: "privacy", Component: Privacy },
      { path: "terms", Component: Terms },
      { path: "contact", Component: Contact },
      { path: "help", Component: Help },
      { path: "invite/:token", Component: InviteAccept },
      { path: "share/:token", Component: Share },
      { path: "affiliates", Component: Affiliates },
      { path: "affiliates/:lang", Component: Affiliates, getStaticPaths: () => ["affiliates/es", "affiliates/pt"] },
      {
        path: "admin",
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminOverview },
          { path: "users", Component: AdminUsers },
          { path: "sites", Component: AdminSites },
          { path: "affiliates", Component: AdminAffiliates },
          { path: "announcements", Component: AdminAnnouncements },
          { path: "codes", Component: AdminAccessCodes },
          { path: "admins", Component: AdminAdmins },
          { path: "alerts", Component: AdminAlerts },
          { path: "usage", Component: AdminUsage },
          { path: "launch-tests", Component: AdminLaunchTests },
        ],
      },
      {
        path: "app",
        Component: AppLayout,
        children: [
          { index: true, Component: Dashboard },
          { path: "onboarding", Component: Onboarding },
          { path: "optimize", Component: Optimize },
          { path: "optimize/:id", Component: OptimizeDashboard },
          { path: "new", Component: NewSite },
          { path: "sites/:id", Component: SiteDetail },
          { path: "billing", Component: Billing },
          { path: "integrations", Component: Integrations },
          { path: "settings", Component: Settings },
          { path: "affiliate", Component: AffiliateDashboard },
          { path: "agency", Component: Agency },
        ],
      },
      { path: "*", Component: NotFound },
    ],
  },
];

export default routes;
