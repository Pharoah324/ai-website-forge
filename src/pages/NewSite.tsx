import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Loader2,
  Monitor,
  Tablet,
  Smartphone,
  Wand2,
  AlertTriangle,
  LayoutTemplate,
  Mic,
  MicOff,
} from "lucide-react";
import { SitePreview, computeDesignScore } from "@/components/SitePreview";
import { TopUpModal } from "@/components/TopUpModal";
import { RefinementChat } from "@/components/RefinementChat";
import type { SiteContent } from "@/types/site";
import { toast } from "sonner";
import { TEMPLATES, type Template } from "@/data/templates";
import { streamGenerateSite } from "@/lib/streamGenerate";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const VIEWPORTS = {
  desktop: { width: "100%", icon: Monitor, label: "Desktop" },
  tablet: { width: "768px", icon: Tablet, label: "Tablet" },
  mobile: { width: "390px", icon: Smartphone, label: "Mobile" },
} as const;

const FUNNEL_TYPES = [
  { id: "website", label: "Business Website", desc: "Full multi-section site" },
  { id: "lead_capture", label: "Lead Capture", desc: "Single-page form, no nav" },
  { id: "sales_landing", label: "Sales Landing", desc: "Long-form, urgency-driven" },
  { id: "appointment", label: "Appointment", desc: "Booking-focused page" },
  { id: "coming_soon", label: "Coming Soon", desc: "Email capture + countdown" },
  { id: "link_in_bio", label: "Link in Bio", desc: "Vertical card stack" },
] as const;

const SAMPLES = [
  "A modern coffee shop in Brooklyn serving single-origin pour-overs and pastries, with online ordering and a loyalty program.",
  "A boutique law firm specializing in startup contracts, with consultation booking and case study examples.",
  "A yoga studio offering classes, teacher training, and a 7-day free trial.",
];

function tryParsePartial(s: string): SiteContent | null {
  if (!s.trim().startsWith("{")) return null;
  // Best-effort: try the accumulated string, then close braces progressively.
  for (let extra = 0; extra <= 6; extra++) {
    const candidate = s + "}".repeat(extra) + "]".repeat(extra);
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && parsed.name) return parsed as SiteContent;
    } catch { /* continue */ }
  }
  return null;
}

export default function NewSite() {
  const { t, lang } = useI18n();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [viewport, setViewport] = useState<keyof typeof VIEWPORTS>("desktop");
  const [templateModal, setTemplateModal] = useState<Template | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [bizName, setBizName] = useState("");
  const [bizCity, setBizCity] = useState("");
  const accumulatedRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [liveFinal, setLiveFinal] = useState("");
  const [liveInterim, setLiveInterim] = useState("");
  const [funnelType, setFunnelType] = useState<typeof FUNNEL_TYPES[number]["id"]>("website");
  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;
  const speechSupported = !!SpeechRecognition;

  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
    };
  }, []);

  const toggleDictation = () => {
    if (!speechSupported) {
      toast.error("Voice input not supported", {
        description: "Try Chrome or Safari on desktop.",
      });
      return;
    }
    if (listening) {
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    setLiveFinal("");
    setLiveInterim("");
    rec.onstart = () => setListening(true);
    rec.onerror = (e: any) => {
      setListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast.error("Microphone permission denied");
      } else if (e.error !== "aborted" && e.error !== "no-speech") {
        toast.error(`Voice input error: ${e.error}`);
      }
    };
    rec.onend = () => {
      setListening(false);
      setLiveInterim("");
    };
    rec.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setLiveFinal(finalText);
      setLiveInterim(interimText);
    };
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const appendTranscript = () => {
    const text = (liveFinal + " " + liveInterim).trim();
    if (!text) return;
    setPrompt((p) => (p ? p.trimEnd() + " " : "") + text);
    setLiveFinal("");
    setLiveInterim("");
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
  };

  const discardTranscript = () => {
    setLiveFinal("");
    setLiveInterim("");
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
  };

  const { data: profile } = useProfile();
  const { activeWorkspaceId, refresh: refreshWorkspaces } = useWorkspace();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const isUnlimited = profile?.plan === "agency";
  const noCredits = profile && !isUnlimited && profile.build_credits <= 0;

  const runGeneration = async (body: {
    prompt: string;
    template_draft?: SiteContent | null;
    business_name?: string;
    business_city?: string;
  }) => {
    setGenerating(true);
    setContent(null);
    accumulatedRef.current = "";
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    await streamGenerateSite(
      { ...body, language: lang, funnel_type: funnelType },
      {
        onDelta: (chunk) => {
          accumulatedRef.current += chunk;
          const partial = tryParsePartial(accumulatedRef.current);
          if (partial) setContent(partial);
        },
        onDone: (site) => {
          setContent(site.content);
          setSiteId(site.id);
          setGeneratedPrompt(body.prompt);
          setMobileTab("preview");
          // If user is in an agency workspace, tag the site and bump the workspace counter.
          if (activeWorkspaceId) {
            void (async () => {
              await supabase
                .from("sites")
                .update({ workspace_id: activeWorkspaceId } as never)
                .eq("id", site.id);
              await supabase.rpc(
                "consume_workspace_credits" as never,
                { _workspace_id: activeWorkspaceId, _kind: "build", _amount: 1 } as never,
              );
              refreshWorkspaces();
            })();
          }
          qc.invalidateQueries({ queryKey: ["profile"] });
          qc.invalidateQueries({ queryKey: ["sites"] });
          toast.success(t("newsite.success"), {
            action: { label: t("newsite.open"), onClick: () => navigate(`/app/sites/${site.id}`) },
          });
          setGenerating(false);
          // Fire-and-forget SEO analysis (Search Atlas keywords + meta + score).
          supabase.functions.invoke("seo-analyze", { body: { site_id: site.id } })
            .then(() => qc.invalidateQueries({ queryKey: ["site-seo", site.id] }))
            .catch((e) => console.warn("seo-analyze failed", e));
        },
        onError: (msg, code) => {
          setGenerating(false);
          if (code === "aborted") return; // user cancelled — no toast
          if (code === "no_credits") {
            toast.error("Out of build credits", {
              description: "Top up to keep generating.",
              action: { label: "Buy credits", onClick: () => setTopUpOpen(true) },
            });
            setTopUpOpen(true);
            return;
          }
          if (code === "rate_limited") {
            toast.error("Rate limited", {
              description: "Too many requests. Wait a moment and try again.",
            });
            return;
          }
          if (code === "stalled") {
            toast.error("Generation stalled", {
              description: "The AI took too long. Retry?",
              action: { label: "Retry", onClick: () => runGeneration(body) },
            });
            return;
          }
          toast.error(msg, {
            action: { label: "Retry", onClick: () => runGeneration(body) },
          });
        },
      },
      ctrl.signal,
    );
  };

  const cancelGeneration = () => {
    abortRef.current?.abort();
  };

  const generate = () => {
    if (!prompt.trim()) return toast.error(t("newsite.describeFirst"));
    if (noCredits) {
      toast.error(t("newsite.outOfCredits"), {
        action: { label: t("newsite.buyCredits"), onClick: () => setTopUpOpen(true) },
      });
      setTopUpOpen(true);
      return;
    }
    runGeneration({ prompt });
  };

  const startTemplate = () => {
    if (!templateModal) return;
    if (!bizName.trim() || !bizCity.trim()) {
      toast.error("Business name and city required");
      return;
    }
    if (noCredits) {
      toast.error("Out of build credits", {
        action: { label: "Buy credits", onClick: () => setTopUpOpen(true) },
      });
      setTopUpOpen(true);
      return;
    }

    // Replace placeholders in the draft
    const replaced: SiteContent = JSON.parse(
      JSON.stringify(templateModal.draft)
        .split("{{BUSINESS_NAME}}").join(bizName.trim())
        .split("{{CITY}}").join(bizCity.trim()),
    );
    const tplPrompt = `${templateModal.industry}: ${bizName} in ${bizCity}. ${templateModal.description}`;
    setPrompt(tplPrompt);
    const tpl = templateModal;
    setTemplateModal(null);
    runGeneration({
      prompt: tplPrompt,
      template_draft: replaced,
      business_name: bizName.trim(),
      business_city: bizCity.trim(),
    });
    setBizName("");
    setBizCity("");
    void tpl;
  };

  const v = VIEWPORTS[viewport];
  const showChat = !!siteId && !!content;

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[420px_1fr]">
      {/* Mobile tab switcher */}
      {showChat && (
        <div className="flex border-b bg-card lg:hidden">
          {(["chat", "preview"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                mobileTab === tab ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      <div
        className={`${showChat ? (mobileTab === "chat" ? "flex" : "hidden lg:flex") : "flex"} flex-col gap-4 overflow-y-auto border-r bg-card ${showChat ? "p-0" : "p-6"}`}
      >
        {showChat && siteId && content ? (
          <RefinementChat
            siteId={siteId}
            originalPrompt={generatedPrompt}
            onContentUpdated={setContent}
            onTopUp={() => setTopUpOpen(true)}
          />
        ) : (
          <div className="flex flex-col gap-4 p-6">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-xl font-bold">{t("newsite.title")}</h1>
            {profile?.brand_voice_active && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                BRAND VOICE ON
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("newsite.hint")}
          </p>
        </div>

        {noCredits && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="font-medium text-foreground">{t("newsite.outOfCredits")}</p>
              <p className="mt-0.5 text-muted-foreground">
                {t("newsite.topup")}
              </p>
              <Button
                size="sm"
                variant="default"
                className="mt-2 h-7 px-2 text-xs"
                onClick={() => setTopUpOpen(true)}
              >
                {t("newsite.buyCredits")}
              </Button>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What are you building?
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {FUNNEL_TYPES.map((f) => {
              const active = funnelType === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFunnelType(f.id)}
                  disabled={generating}
                  className={`rounded-md border p-2 text-left text-xs transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <div className="font-semibold">{f.label}</div>
                  <div className="mt-0.5 text-[10px] opacity-80">{f.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("newsite.placeholder")}
          className="min-h-40 resize-none"
          maxLength={4000}
          disabled={generating}
        />
        {(listening || liveFinal || liveInterim) && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                {listening && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                )}
                {listening ? t("newsite.recording") : t("newsite.transcriptReady")}
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={discardTranscript} type="button">{t("newsite.discard")}</Button>
                <Button size="sm" className="h-7 px-2 text-xs" onClick={appendTranscript} disabled={!liveFinal.trim() && !liveInterim.trim()} type="button">{t("newsite.append")}</Button>
              </div>
            </div>
            <p className="min-h-[2.5rem] text-sm leading-relaxed">
              <span className="text-foreground">{liveFinal}</span>
              {liveInterim && (<span className="italic text-muted-foreground"> {liveInterim}</span>)}
              {!liveFinal && !liveInterim && (<span className="italic text-muted-foreground">{t("newsite.startSpeaking")}</span>)}
            </p>
          </div>
        )}


        <div className="flex gap-2">
          <Button
            onClick={generate}
            disabled={generating || !!noCredits || !prompt.trim()}
            size="lg"
            className="flex-1"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("newsite.generating")}
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" /> {t("newsite.generate")}
                <span className="ml-2 text-xs opacity-80">
                  {isUnlimited ? t("newsite.unlimited") : t("newsite.oneCredit")}
                </span>
              </>
            )}
          </Button>
          {!generating && (
            <Button
              onClick={toggleDictation}
              size="lg"
              variant={listening ? "destructive" : "outline"}
              type="button"
              title={
                !speechSupported
                  ? "Voice input not supported in this browser"
                  : listening
                    ? "Stop recording"
                    : "Dictate prompt"
              }
              aria-label={listening ? "Stop voice input" : "Start voice input"}
              aria-pressed={listening}
            >
              {listening ? (
                <MicOff className="h-4 w-4 animate-pulse" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
          {generating && (
            <Button
              onClick={cancelGeneration}
              size="lg"
              variant="outline"
              type="button"
            >
              {t("newsite.cancel")}
            </Button>
          )}
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <LayoutTemplate className="h-3.5 w-3.5" />
            Or start from a template
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplateModal(t)}
                disabled={generating}
                className="flex flex-col items-start rounded-md border bg-background p-3 text-left transition-colors hover:border-primary/50 disabled:opacity-50"
              >
                <span className="text-lg">{t.emoji}</span>
                <span className="mt-1 text-xs font-semibold">{t.name}</span>
                <span className="text-[10px] text-muted-foreground">{t.industry}</span>
              </button>
            ))}
          </div>
        </div>

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
        )}
      </div>

      {/* Preview */}
      <div className={`${showChat && mobileTab === "chat" ? "hidden lg:flex" : "flex"} min-w-0 flex-col bg-muted/30`}>
        <div className="flex items-center justify-between border-b bg-card px-4 py-2">
          <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
            {(Object.keys(VIEWPORTS) as Array<keyof typeof VIEWPORTS>).map((k) => {
              const VP = VIEWPORTS[k];
              const active = viewport === k;
              return (
                <button
                  key={k}
                  onClick={() => setViewport(k)}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <VP.icon className="h-3.5 w-3.5" />
                  {VP.label}
                </button>
              );
            })}
          </div>
          {content && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {generating && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>{content.name}</span>
              <DesignScoreBadge content={content} />
            </div>
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
                Type a description, pick a template, then hit Generate.
              </p>
            </div>
          )}
          {generating && !content && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
              <p className="font-medium">Building your site…</p>
              <p className="mt-1 text-sm text-muted-foreground">Streaming sections live.</p>
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

      <Dialog open={!!templateModal} onOpenChange={(o) => !o && setTemplateModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {templateModal?.emoji} {templateModal?.name} template
            </DialogTitle>
            <DialogDescription>
              What's your business name and city? We'll personalize the copy and
              run it through AI.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="biz-name">Business name</Label>
              <Input
                id="biz-name"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                placeholder="e.g. Atlas Coffee"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="biz-city">City</Label>
              <Input
                id="biz-city"
                value={bizCity}
                onChange={(e) => setBizCity(e.target.value)}
                placeholder="e.g. Austin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateModal(null)}>
              Cancel
            </Button>
            <Button onClick={startTemplate} disabled={!bizName.trim() || !bizCity.trim()}>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate (1 credit)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />
    </div>
  );
}

function DesignScoreBadge({ content }: { content: SiteContent }) {
  const score = computeDesignScore(content);
  const tone =
    score.total >= 80
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : score.total >= 60
        ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
        : "bg-orange-500/15 text-orange-400 border-orange-500/30";
  const tip = score.notes.length ? score.notes.join(" • ") : "Great design";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tone}`}
      title={tip}
    >
      UX {score.total}/100
    </span>
  );
}
