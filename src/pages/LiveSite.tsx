import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SitePreview, type SiteBranding } from "@/components/SitePreview";
import type { SiteContent } from "@/types/site";
import { fetchSiteBranding } from "@/lib/siteBranding";

type Props = { subdomain: string };

export default function LiveSite({ subdomain }: Props) {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "notfound" }
    | { kind: "ok"; content: SiteContent; name: string; branding: SiteBranding | null }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("sites")
        .select("id, name, content, published")
        .ilike("subdomain", subdomain)
        .eq("published", true)
        .maybeSingle();
      if (cancelled) return;
      if (!data || !data.content) {
        setState({ kind: "notfound" });
        return;
      }
      const branding = await fetchSiteBranding(data.id);
      if (cancelled) return;
      document.title = branding?.brand_name
        ? `${data.name} · ${branding.brand_name}`
        : data.name || subdomain;
      setState({
        kind: "ok",
        content: data.content as unknown as SiteContent,
        name: data.name,
        branding,
      });
    })();
    return () => { cancelled = true; };
  }, [subdomain]);

  if (state.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (state.kind === "notfound") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-2xl font-semibold">Site not found</h1>
        <p className="text-muted-foreground">
          No published site exists at <code>{subdomain}.builder.virtualengine.ai</code>.
        </p>
        <a href="https://builder.virtualengine.ai" className="text-primary underline">
          Build your own →
        </a>
      </div>
    );
  }
  return <SitePreview content={state.content} branding={state.branding} />;
}
