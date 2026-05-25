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
      try {
        const { data, error } = await supabase
          .from("admin_users")
          .select("access_level, name, email")
          .eq("user_id", user!.id)
          .maybeSingle();
        
        if (error) {
          console.warn("Error checking admin status:", error);
          // Table may not exist yet; return null
          return null;
        }
        return (data as { access_level: AdminLevel; name: string | null; email: string | null } | null) ?? null;
      } catch (err) {
        console.warn("Exception checking admin status:", err);
        return null;
      }
    },
    throwOnError: false,
  });
}
