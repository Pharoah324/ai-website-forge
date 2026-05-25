import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAffiliate() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["affiliate", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["isAdmin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        // is_admin function is service-role only; check via admin_users SELECT (RLS = is_admin)
        const { data, error } = await supabase.from("admin_users").select("user_id").eq("user_id", user!.id).maybeSingle();
        if (error) {
          console.warn("Error checking admin status:", error);
          return false;
        }
        return !!data;
      } catch (err) {
        console.warn("Exception checking admin status:", err);
        return false;
      }
    },
    throwOnError: false,
  });
}

export const TIERS = {
  starter: { label: "Starter", range: "1-10 referrals", rate: 20 },
  pro: { label: "Pro", range: "11-50 referrals", rate: 30 },
  elite: { label: "Elite", range: "51+ referrals", rate: 40 },
  agency_partner: { label: "Agency Partner", range: "Custom", rate: 50 },
} as const;

export function commissionFor(refs: number): keyof typeof TIERS {
  if (refs >= 51) return "elite";
  if (refs >= 11) return "pro";
  return "starter";
}
