import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AgencyWorkspace = {
  id: string;
  agency_user_id: string;
  name: string;
  client_email: string | null;
  client_user_id: string | null;
  monthly_build_allocation: number;
  monthly_runtime_allocation: number;
  used_build_this_cycle: number;
  used_runtime_this_cycle: number;
  cycle_start: string;
  client_invited_at: string | null;
  wl_enabled?: boolean;
  wl_brand_name?: string | null;
  wl_logo_url?: string | null;
  wl_primary_color?: string | null;
  wl_accent_color?: string | null;
  wl_hide_branding?: boolean;
  wl_footer_text?: string | null;
  wl_support_email?: string | null;
};

type WorkspaceCtx = {
  activeWorkspaceId: string | null; // null = personal
  setActiveWorkspaceId: (id: string | null) => void;
  workspaces: AgencyWorkspace[];
  activeWorkspace: AgencyWorkspace | null;
  loading: boolean;
  refresh: () => void;
};

const Ctx = createContext<WorkspaceCtx>({
  activeWorkspaceId: null,
  setActiveWorkspaceId: () => {},
  workspaces: [],
  activeWorkspace: null,
  loading: true,
  refresh: () => {},
});

const STORAGE_KEY = "veb_active_workspace";

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [activeWorkspaceId, setActive] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["agency-workspaces", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_workspaces" as never)
        .select("*")
        .eq("agency_user_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as AgencyWorkspace[];
    },
  });

  const workspaces = data ?? [];

  // Clear active if it no longer exists
  useEffect(() => {
    if (activeWorkspaceId && workspaces.length > 0 && !workspaces.find((w) => w.id === activeWorkspaceId)) {
      setActive(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [workspaces, activeWorkspaceId]);

  const setActiveWorkspaceId = useCallback((id: string | null) => {
    setActive(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? null;

  return (
    <Ctx.Provider
      value={{
        activeWorkspaceId,
        setActiveWorkspaceId,
        workspaces,
        activeWorkspace,
        loading: isLoading,
        refresh: () => refetch(),
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useWorkspace = () => useContext(Ctx);
