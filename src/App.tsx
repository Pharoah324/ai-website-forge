import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
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
import Optimize from "./pages/Optimize";
import Onboarding from "./pages/Onboarding";
import { getCustomerSubdomain } from "./lib/subdomain";
import { I18nProvider } from "./lib/i18n";
import { captureRefFromUrl } from "./lib/affiliateTracking";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

const App = () => {
  useEffect(() => { captureRefFromUrl(); }, []);
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
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <I18nProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/share/:token" element={<Share />} />
            <Route path="/affiliates" element={<Affiliates />} />
            <Route path="/affiliates/:lang" element={<Affiliates />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="sites" element={<AdminSites />} />
              <Route path="affiliates" element={<AdminAffiliates />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="codes" element={<AdminAccessCodes />} />
              <Route path="admins" element={<AdminAdmins />} />
            </Route>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="optimize" element={<Optimize />} />
              <Route path="new" element={<NewSite />} />
              <Route path="sites/:id" element={<SiteDetail />} />
              <Route path="billing" element={<Billing />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="settings" element={<Settings />} />
              <Route path="affiliate" element={<AffiliateDashboard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      </I18nProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
