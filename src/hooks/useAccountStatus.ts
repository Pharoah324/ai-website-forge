import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AccountFlag = {
  id: string;
  user_id: string;
  flag_type: "emergency_pause" | "abuse_suspected" | "dispute_flagged" | "manual_review" | "suspended";
  triggered_by: string;
  reason: string;
  triggered_at: string;
  resolved_at: string | null;
  notes: string | null;
};

export function useActivePause() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["account_pause", user?.id],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("account_flags")
        .select("*")
        .eq("user_id", user!.id)
        .is("resolved_at", null)
        .in("flag_type", ["emergency_pause", "suspended"])
        .order("triggered_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as AccountFlag | null) ?? null;
    },
  });
}
