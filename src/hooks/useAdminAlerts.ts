import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminAlert = {
  id: string;
  alert_type:
    | "dispute" | "abuse" | "server_error" | "credit_anomaly"
    | "signup_abuse" | "account_paused" | "grace_period_expired" | "other";
  severity: "critical" | "warning" | "info";
  affected_user_id: string | null;
  affected_user_email: string | null;
  description: string;
  metadata: any;
  status: "new" | "reviewed" | "resolved";
  action_notes: string | null;
  reviewed_at: string | null;
  resolved_at: string | null;
  created_at: string;
};

export function useAdminAlerts() {
  return useQuery({
    queryKey: ["admin_alerts"],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("admin_alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);
        
        if (error) {
          console.warn("Error fetching admin alerts:", error);
          return [];
        }
        return (data ?? []) as AdminAlert[];
      } catch (err) {
        console.warn("Exception fetching admin alerts:", err);
        return [];
      }
    },
    refetchInterval: 30_000,
    throwOnError: false,
  });
}

export function useUnreadAlertCount() {
  return useQuery({
    queryKey: ["admin_alerts_unread_count"],
    queryFn: async () => {
      try {
        const { count, error } = await (supabase as any)
          .from("admin_alerts")
          .select("*", { count: "exact", head: true })
          .eq("status", "new");
        
        if (error) {
          console.warn("Error fetching alert count:", error);
          return 0;
        }
        return count ?? 0;
      } catch (err) {
        console.warn("Exception fetching alert count:", err);
        return 0;
      }
    },
    refetchInterval: 30_000,
    throwOnError: false,
  });
}

export function useUpdateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; patch: Partial<AdminAlert> }) => {
      const { data: u } = await supabase.auth.getUser();
      const patch: any = { ...vars.patch };
      if (patch.status === "reviewed" && !patch.reviewed_at) {
        patch.reviewed_at = new Date().toISOString();
        patch.reviewed_by = u.user?.id;
      }
      if (patch.status === "resolved" && !patch.resolved_at) {
        patch.resolved_at = new Date().toISOString();
        patch.resolved_by = u.user?.id;
        if (!patch.reviewed_at) {
          patch.reviewed_at = new Date().toISOString();
          patch.reviewed_by = u.user?.id;
        }
      }
      const { error } = await (supabase as any).from("admin_alerts").update(patch).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_alerts"] });
      qc.invalidateQueries({ queryKey: ["admin_alerts_unread_count"] });
    },
  });
}
