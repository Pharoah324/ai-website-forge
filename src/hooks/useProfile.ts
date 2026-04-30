import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  plan: "free" | "starter" | "builder" | "pro" | "agency";
  build_credits: number;
  runtime_credits: number;
  build_credits_rollover: number;
  brand_voice_samples: string | null;
  brand_voice_active: boolean;
  voice_rules: string[] | null;
};

export const PLAN_LIMITS: Record<
  Profile["plan"],
  { build: number; runtime: number; price: number; label: string }
> = {
  free: { build: 20, runtime: 300, price: 0, label: "Free" },
  starter: { build: 100, runtime: 2500, price: 19, label: "Starter" },
  builder: { build: 300, runtime: 12000, price: 49, label: "Builder" },
  pro: { build: 750, runtime: 35000, price: 99, label: "Pro" },
  agency: { build: -1, runtime: 100000, price: 199, label: "Agency" },
};

export const useProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });
};
