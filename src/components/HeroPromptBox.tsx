import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2, Mic, MicOff, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ROTATING_PROMPTS = [
  "A medspa in Miami called Glow Aesthetics. Botox, fillers, laser treatments. Luxury feel, online booking required…",
  "Un restaurante de mariscos en Ciudad de México llamado El Rincón del Mar. Ambiente familiar, reservaciones en línea…",
  "Uma clínica de estética em São Paulo chamada Bella Vita. Tratamentos faciais, agendamento online obrigatório…",
  "A boutique law firm in Chicago focused on startup contracts, with consultation booking and case studies…",
];

const PENDING_KEY = "veb_pending_prompt";

const FAKE_STEPS = [
  "Reading your description…",
  "Designing brand palette…",
  "Writing hero copy & CTAs…",
  "Composing services & pricing…",
  "Optimizing SEO & metadata…",
];

export function HeroPromptBox() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [teasing, setTeasing] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const userTouched = useRef(false);

  // Rotating placeholder typewriter — pauses once user starts typing.
  useEffect(() => {
    if (userTouched.current) return;
    const full = ROTATING_PROMPTS[placeholderIdx];
    let i = 0;
    setTyped("");
    const tick = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(tick);
        setTimeout(
          () => setPlaceholderIdx((p) => (p + 1) % ROTATING_PROMPTS.length),
          2400,
        );
      }
    }, 32);
    return () => clearInterval(tick);
  }, [placeholderIdx]);

  // Step the fake build progress while teasing.
  useEffect(() => {
    if (!teasing) return;
    setStepIdx(0);
    const id = setInterval(() => {
      setStepIdx((s) => Math.min(s + 1, FAKE_STEPS.length - 1));
    }, 700);
    return () => clearInterval(id);
  }, [teasing]);

  const submit = () => {
    const prompt = value.trim() || typed.trim();
    if (!prompt) return;
    try {
      localStorage.setItem(PENDING_KEY, prompt);
    } catch {
      /* ignore */
    }
    setTeasing(true);
    // Brief teaser then hand off to signup, where /app/new will auto-resume.
    setTimeout(() => {
      navigate("/auth?mode=signup&intent=build");
    }, 3600);
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-2xl text-left">
      <div className="rounded-2xl border border-primary/30 bg-navy-muted/70 p-3 shadow-glow backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary-glow">
            <Sparkles className="h-3 w-3" />
            Describe your business
          </span>
          <span className="hidden text-[11px] text-navy-foreground/60 sm:inline">
            Free preview · No credit card
          </span>
        </div>
        <Textarea
          value={value}
          onChange={(e) => {
            userTouched.current = true;
            setValue(e.target.value);
          }}
          placeholder={typed + (typed.length ? "▍" : "")}
          disabled={teasing}
          maxLength={1000}
          className="min-h-[110px] resize-none border-0 bg-transparent px-2 text-sm leading-relaxed text-navy-foreground placeholder:text-navy-foreground/55 focus-visible:ring-0"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1 pt-2">
          <span className="flex items-center gap-1.5 text-[11px] text-navy-foreground/55">
            <Mic className="h-3 w-3" /> Voice input available after signup
          </span>
          <Button
            onClick={submit}
            disabled={teasing || (!value.trim() && !typed.trim())}
            size="lg"
            className="bg-cta text-cta-foreground shadow-glow-cta hover:bg-cta/90"
          >
            {teasing ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Building preview…
              </>
            ) : (
              <>
                Generate preview <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {teasing && (
        <div className="mt-4 overflow-hidden rounded-xl border border-primary/30 bg-navy-muted/80 p-4 shadow-glow">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary-glow">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Live preview · streaming
          </div>
          {/* Fake skeleton */}
          <div className="space-y-3">
            <div className="h-7 w-3/4 animate-pulse rounded-md bg-primary/20" />
            <div className="h-3 w-5/6 animate-pulse rounded-md bg-navy-foreground/10" />
            <div className="h-3 w-2/3 animate-pulse rounded-md bg-navy-foreground/10" />
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="h-20 animate-pulse rounded-md bg-navy-foreground/10" />
              <div className="h-20 animate-pulse rounded-md bg-navy-foreground/10" />
              <div className="h-20 animate-pulse rounded-md bg-navy-foreground/10" />
            </div>
            <div className="h-9 w-40 animate-pulse rounded-md bg-cta/40" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-navy-foreground/80">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span>{FAKE_STEPS[stepIdx]}</span>
          </div>
          <p className="mt-3 text-[11px] text-navy-foreground/60">
            Create a free account in the next step to see your real, fully
            generated site — we've saved your prompt.
          </p>
        </div>
      )}
    </div>
  );
}

export const PENDING_PROMPT_KEY = PENDING_KEY;
