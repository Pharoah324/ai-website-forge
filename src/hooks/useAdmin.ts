import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AdminLevel = "super_admin" | "admin" | "support";

export function useAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["adminLevel", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_users")
        .select("access_level, name, email")
        .eq("user_id", user!.id)
        .maybeSingle();
      return (data as { access_level: AdminLevel; name: string | null; email: string | null } | null) ?? null;
    },
  });
}
