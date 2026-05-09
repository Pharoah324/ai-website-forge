import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SitePreview } from "@/components/SitePreview";
import type { SiteContent } from "@/types/site";
import { fetchSiteBranding } from "@/lib/siteBranding";

export default function SubdomainPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["subdomain", subdomain],
    enabled: !!subdomain,
    queryFn: async () => {
      const { data: site, error } = await supabase
        .from("sites")
        .select("*")
        .eq("subdomain", subdomain!)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      if (!site) return null;
      const branding = await fetchSiteBranding(site.id);
      return { site, branding };
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">This site is not available.</p>
      </div>
    );
  }
  const content = data.site.content as unknown as SiteContent;
  return <SitePreview content={content} branding={data.branding} />;
}
