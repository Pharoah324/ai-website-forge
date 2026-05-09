import { supabase } from "@/integrations/supabase/client";
import type { SiteBranding } from "@/components/SitePreview";

export async function fetchSiteBranding(siteId: string): Promise<SiteBranding | null> {
  const { data, error } = await supabase.rpc("get_site_branding" as never, {
    p_site_id: siteId,
  } as never);
  if (error) return null;
  return (data as SiteBranding | null) ?? null;
}
