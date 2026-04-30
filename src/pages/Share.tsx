import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SitePreview } from "@/components/SitePreview";
import type { SiteContent } from "@/types/site";
import { Eye } from "lucide-react";

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["share", token],
    enabled: !!token,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .eq("share_token", token!)
        .eq("is_shared", true)
        .maybeSingle();
      if (error) throw error;
      return data;
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
  const content = data.content as unknown as SiteContent;

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-navy px-4 py-2 text-navy-foreground">
        <span className="text-xs font-medium opacity-80">
          Read-only preview · {data.name}
        </span>
        <span className="flex items-center gap-1 text-[10px] opacity-60">
          <Eye className="h-3 w-3" /> Powered by VirtualEngine
        </span>
      </div>
      <SitePreview content={content} />
    </div>
  );
}
