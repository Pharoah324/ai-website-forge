import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SitePreview } from "@/components/SitePreview";
import type { SiteContent } from "@/types/site";
import { Eye } from "lucide-react";
import { fetchSiteBranding } from "@/lib/siteBranding";

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["share", token],
    enabled: !!token,
    queryFn: async () => {
      const { data: site, error } = await supabase
        .from("sites")
        .select("*")
        .eq("share_token", token!)
        .eq("is_shared", true)
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
        <p className="text-muted-foreground">This preview link is no longer active.</p>
      </div>
    );
  }
  const content = data.site.content as unknown as SiteContent;
  const branding = data.branding;
  const brandLabel = branding?.brand_name || "VirtualEngine";
  const hideBadge = !!branding?.hide_branding;

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-navy px-4 py-2 text-navy-foreground">
        <span className="text-xs font-medium opacity-80">
          Read-only preview · {data.site.name}
        </span>
        {!hideBadge && (
          <span className="flex items-center gap-1 text-[10px] opacity-60">
            <Eye className="h-3 w-3" /> Powered by {brandLabel}
          </span>
        )}
      </div>
      <SitePreview content={content} branding={branding} />
    </div>
  );
}
