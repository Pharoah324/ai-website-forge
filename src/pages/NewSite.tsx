import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Loader2,
  Monitor,
  Tablet,
  Smartphone,
  Wand2,
  AlertTriangle,
} from "lucide-react";
import { SitePreview } from "@/components/SitePreview";
import type { SiteContent } from "@/types/site";
import { toast } from "sonner";

const VIEWPORTS = {
  desktop: { width: "100%", icon: Monitor, label: "Desktop" },
  tablet: { width: "768px", icon: Tablet, label: "Tablet" },
  mobile: { width: "390px", icon: Smartphone, label: "Mobile" },
} as const;

const SAMPLES = [
  "A modern coffee shop in Brooklyn serving single-origin pour-overs and pastries, with online ordering and a loyalty program.",
  "A boutique law firm specializing in startup contracts, with consultation booking and case study examples.",
  "A yoga studio offering classes, teacher training, and a 7-day free trial.",
];

export default function NewSite() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [viewport, setViewport] = useState<keyof typeof VIEWPORTS>("desktop");
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const isUnlimited = profile?.plan === "agency";
  const noCredits = profile && !isUnlimited && profile.build_credits <= 0;

  const generate = async () => {
    if (!prompt.trim()) {
      toast.error("Describe your business first");
      return;
    }
    if (noCredits) {
      toast.error("Out of build credits");
      return;
    }
    setGenerating(true);
    setContent(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-site", {
        body: { prompt },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setContent(data.site.content as SiteContent);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Site generated", {
        action: {
          label: "Open",
          onClick: () => navigate(`/app/sites/${data.site.id}`),
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const v = VIEWPORTS[viewport];

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[420px_1fr]">
      {/* Prompt panel */}
      <div className="flex flex-col gap-4 overflow-y-auto border-r bg-card p-6">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-xl font-bold">Describe your site</h1>
            {profile?.brand_voice_active && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                BRAND VOICE ON
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Plain English. The more detail, the better the site.
          </p>
        </div>

        {noCredits && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <span>Out of build credits. Upgrade or buy a top-up pack.</span>
          </div>
        )}

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A modern dental practice in Austin focused on cosmetic dentistry, with online booking and patient testimonials."
          className="min-h-40 resize-none"
          maxLength={4000}
        />

        <Button
          onClick={generate}
          disabled={generating || noCredits || !prompt.trim()}
          size="lg"
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" /> Generate
              <span className="ml-2 text-xs opacity-80">
                {isUnlimited ? "(unlimited)" : "(1 credit)"}
              </span>
            </>
          )}
        </Button>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Need inspiration?
          </p>
          <div className="space-y-2">
            {SAMPLES.map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                disabled={generating}
                className="block w-full rounded-md border bg-background p-3 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview panel */}
      <div className="flex min-w-0 flex-col bg-muted/30">
        <div className="flex items-center justify-between border-b bg-card px-4 py-2">
          <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
            {(Object.keys(VIEWPORTS) as Array<keyof typeof VIEWPORTS>).map(
              (k) => {
                const VP = VIEWPORTS[k];
                const active = viewport === k;
                return (
                  <button
                    key={k}
                    onClick={() => setViewport(k)}
                    className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <VP.icon className="h-3.5 w-3.5" />
                    {VP.label}
                  </button>
                );
              },
            )}
          </div>
          {content && (
            <span className="text-xs text-muted-foreground">{content.name}</span>
          )}
        </div>

        <div className="flex flex-1 items-start justify-center overflow-y-auto p-6">
          {!content && !generating && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <p className="font-medium">Your generated site appears here</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Type a description and hit Generate.
              </p>
            </div>
          )}
          {generating && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
              <p className="font-medium">Building your site…</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Picking sections, writing copy, choosing colors.
              </p>
            </div>
          )}
          {content && (
            <div
              className="overflow-hidden rounded-lg border bg-card shadow-elevated transition-all"
              style={{ width: v.width, maxWidth: "100%" }}
            >
              <SitePreview content={content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
