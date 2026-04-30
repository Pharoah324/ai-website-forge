import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Share2,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { SitePreview } from "@/components/SitePreview";
import type { SiteContent } from "@/types/site";
import { toast } from "sonner";

const VIEWPORTS = {
  desktop: { width: "100%", icon: Monitor, label: "Desktop" },
  tablet: { width: "768px", icon: Tablet, label: "Tablet" },
  mobile: { width: "390px", icon: Smartphone, label: "Mobile" },
} as const;

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const [viewport, setViewport] = useState<keyof typeof VIEWPORTS>("desktop");
  const [copied, setCopied] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: site, isLoading } = useQuery({
    queryKey: ["site", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const shareToggle = useMutation({
    mutationFn: async (next: boolean) => {
      const { error } = await supabase
        .from("sites")
        .update({ is_shared: next })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site", id] }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sites").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sites"] });
      navigate("/app");
      toast.success("Site deleted");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!site) {
    return (
      <div className="container py-10">
        <p>Site not found.</p>
      </div>
    );
  }

  const content = site.content as unknown as SiteContent;
  const v = VIEWPORTS[viewport];
  const shareUrl = site.is_shared
    ? `${window.location.origin}/share/${site.share_token}`
    : null;

  const copyShare = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/app">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-sm font-semibold">{site.name}</h1>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {site.prompt}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
            {(Object.keys(VIEWPORTS) as Array<keyof typeof VIEWPORTS>).map(
              (k) => {
                const VP = VIEWPORTS[k];
                const active = viewport === k;
                return (
                  <button
                    key={k}
                    onClick={() => setViewport(k)}
                    className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <VP.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{VP.label}</span>
                  </button>
                );
              },
            )}
          </div>

          {shareUrl ? (
            <Button size="sm" variant="outline" onClick={copyShare}>
              {copied ? (
                <Check className="mr-1 h-3.5 w-3.5" />
              ) : (
                <Copy className="mr-1 h-3.5 w-3.5" />
              )}
              Copy share link
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => shareToggle.mutate(true)}
            >
              <Share2 className="mr-1 h-3.5 w-3.5" /> Share preview
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm("Delete this site?")) remove.mutate();
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-y-auto bg-muted/30 p-6">
        <div
          className="overflow-hidden rounded-lg border bg-card shadow-elevated transition-all"
          style={{ width: v.width, maxWidth: "100%" }}
        >
          <SitePreview content={content} />
        </div>
      </div>
    </div>
  );
}
