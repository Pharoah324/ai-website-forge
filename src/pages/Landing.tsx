import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Zap,
  Code2,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Star,
  Users,
  Globe,
  Timer,
  Quote,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PLAN_LIMITS } from "@/hooks/useProfile";
import { ChatWidget } from "@/components/ChatWidget";
import { useI18n } from "@/lib/i18n";
import { LanguageSelector } from "@/components/LanguageSelector";

const PLAN_FEATURES: Record<string, string[]> = {
  free: ["20 build credits/mo", "300 runtime credits", "Live preview", "1 user"],
  starter: ["100 build credits/mo", "2,500 runtime credits", "All templates", "Email support"],
  builder: ["300 build credits/mo", "12,000 runtime credits", "Brand voice training", "Share preview links"],
  pro: ["750 build credits/mo", "35,000 runtime credits", "Performance auditor", "Priority support"],
  agency: ["Unlimited build credits", "100,000 runtime credits", "White-label mode", "Client workspaces"],
};

const TYPED_PROMPT =
  "A modern MedSpa in Miami offering Botox, facials, and online booking with HIPAA-friendly intake forms.";

const TESTIMONIALS = [
  {
    name: "Jessica R.",
    role: "MedSpa owner",
    quote:
      "I described my business and had a fully designed website with booking in under 2 minutes. The GoHighLevel connection is everything.",
  },
  {
    name: "Marcus D.",
    role: "Agency owner",
    quote:
      "I manage 12 client sites from one dashboard. The white-label mode makes me look like I built my own platform.",
  },
  {
    name: "Tanya K.",
    role: "Real Estate Coach",
    quote:
      "Switched from Base44. The credit rollover alone saves me $40 a month.",
  },
];

function TypingDemo() {
  const [typed, setTyped] = useState("");
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    let i = 0;
    setTyped("");
    setGenerated(false);
    const id = setInterval(() => {
      i++;
      setTyped(TYPED_PROMPT.slice(0, i));
      if (i >= TYPED_PROMPT.length) {
        clearInterval(id);
        setTimeout(() => setGenerated(true), 600);
        setTimeout(() => {
          setTyped("");
          setGenerated(false);
        }, 6000);
      }
    }, 35);
    const loop = setInterval(() => {
      let j = 0;
      setTyped("");
      setGenerated(false);
      const id2 = setInterval(() => {
        j++;
        setTyped(TYPED_PROMPT.slice(0, j));
        if (j >= TYPED_PROMPT.length) {
          clearInterval(id2);
          setTimeout(() => setGenerated(true), 600);
        }
      }, 35);
    }, 9000);
    return () => { clearInterval(id); clearInterval(loop); };
  }, []);

  return (
    <div className="grid gap-6 rounded-2xl border border-primary/20 bg-navy/50 p-6 backdrop-blur md:grid-cols-2">
      {/* Prompt side */}
      <div className="rounded-xl border border-primary/20 bg-navy-muted/60 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs text-navy-foreground/60">
          <span className="h-2 w-2 rounded-full bg-cta" />
          <span>Describe your business</span>
        </div>
        <p className="min-h-[7rem] text-sm leading-relaxed text-navy-foreground">
          {typed}
          <span className="animate-type-cursor ml-0.5 inline-block h-4 w-[2px] bg-primary align-middle" />
        </p>
        <Button className="mt-4 w-full bg-cta text-cta-foreground hover:bg-cta/90">
          <Sparkles className="mr-2 h-4 w-4" /> Generate
        </Button>
      </div>

      {/* Output side */}
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-white p-4 text-foreground">
        {!generated ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">Generating site…</p>
          </div>
        ) : (
          <div className="animate-fade-in space-y-3">
            <div className="h-3 w-2/3 rounded bg-primary/30" />
            <div className="h-6 w-5/6 rounded bg-foreground/80" />
            <div className="h-2 w-full rounded bg-muted-foreground/30" />
            <div className="h-2 w-4/5 rounded bg-muted-foreground/30" />
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="h-12 rounded bg-primary/10" />
              <div className="h-12 rounded bg-primary/10" />
              <div className="h-12 rounded bg-primary/10" />
            </div>
            <div className="h-8 w-1/3 rounded bg-cta" />
          </div>
        )}
      </div>
    </div>
  );
}

const STATS = [
  { value: "12,400+", label: "Websites Built", icon: Globe },
  { value: "3,200+", label: "Active Users", icon: Users },
  { value: "60 sec", label: "Average Build Time", icon: Timer },
  { value: "4.9★", label: "Customer Rating", icon: Star },
];

export default function Landing() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="absolute z-10 w-full">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-navy-foreground">
              Virtual Engine <span className="text-primary-glow">Builder</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link to="/auth" className="text-sm text-navy-foreground/80 hover:text-navy-foreground">
              {t("nav.signin")}
            </Link>
            <Button asChild size="sm" className="bg-cta text-cta-foreground hover:bg-cta/90">
              <Link to="/auth?mode=signup">{t("nav.getstarted")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero pb-20 pt-32 text-navy-foreground">
        <div className="container relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary-glow">
            <Sparkles className="h-3 w-3" />
            {t("hero.badge")}
          </div>
          <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            {t("hero.title1")}
            <br />
            <span className="text-gradient">{t("hero.title2")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-navy-foreground/75">
            {t("hero.subtitle")}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-cta text-cta-foreground shadow-glow-cta hover:bg-cta/90"
            >
              <Link to="/auth?mode=signup">
                {t("hero.cta")} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-navy-foreground/20 bg-transparent text-navy-foreground hover:bg-navy-foreground/10"
            >
              <a href="#pricing">{t("hero.seePricing")}</a>
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-navy-foreground/60">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary-glow" /> {t("hero.bullet1")}</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary-glow" /> {t("hero.bullet2")}</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary-glow" /> {t("hero.bullet3")}</span>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[500px] -translate-y-1/2 bg-gradient-glow" />
      </section>

      {/* Stats */}
      <section className="border-y border-primary/20 bg-navy py-8 text-navy-foreground">
        <div className="container">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center text-center">
                <s.icon className="mb-2 h-5 w-5 text-primary-glow" />
                <div className="text-2xl font-bold md:text-3xl">{s.value}</div>
                <div className="text-xs text-navy-foreground/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Animated demo */}
      <section className="bg-navy py-20 text-navy-foreground">
        <div className="container max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t("demo.title")}</h2>
            <p className="mt-3 text-navy-foreground/60">
              {t("demo.subtitle")}
            </p>
          </div>
          <TypingDemo />
        </div>
      </section>

      {/* Features */}
      <section className="border-y bg-card py-20">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Sparkles, title: "Plain English in", body: "Type what you want. Skip the wireframes, the briefs, the back-and-forth." },
              { icon: Code2, title: "Real site out", body: "Structured, conversion-focused pages with copy, sections, and styling tuned to your industry." },
              { icon: Smartphone, title: "Preview anywhere", body: "Toggle Desktop, Tablet and Mobile in real time. Share a read-only link with clients." },
            ].map((f) => (
              <div key={f.title} className="rounded-lg border bg-background p-6 shadow-card">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-background py-20">
        <div className="container max-w-6xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t("testimonials.title")}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-primary/15 bg-card p-6 shadow-card transition-shadow hover:shadow-elevated"
                style={{ background: "rgba(16,185,129,0.04)" }}
              >
                <Quote className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm leading-relaxed text-foreground">"{t.quote}"</p>
                <div className="mt-4 flex items-center gap-1 text-cta">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <div className="mt-3 text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-card py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight">{t("pricing.title")}</h2>
            <p className="mt-3 text-muted-foreground">
              {t("pricing.subtitle")}
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {(Object.keys(PLAN_LIMITS) as Array<keyof typeof PLAN_LIMITS>).map((key) => {
              const p = PLAN_LIMITS[key];
              const featured = key === "builder";
              return (
                <div
                  key={key}
                  className={`relative rounded-xl border bg-background p-6 ${
                    featured ? "border-primary shadow-elevated lg:scale-105" : "shadow-card"
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                      {t("pricing.popular")}
                    </span>
                  )}
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {p.label}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${p.price}</span>
                    {p.price > 0 && <span className="text-sm text-muted-foreground">/mo</span>}
                  </div>
                  <ul className="mt-6 space-y-2 text-sm">
                    {PLAN_FEATURES[key].map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`mt-6 w-full ${featured ? "bg-cta text-cta-foreground hover:bg-cta/90" : ""}`}
                    variant={featured ? "default" : "outline"}
                  >
                    <Link to="/auth?mode=signup">
                      {p.price === 0 ? t("pricing.startFree") : t("pricing.choose")}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t bg-navy py-10 text-navy-foreground">
        <div className="container flex flex-col items-center justify-between gap-3 text-sm md:flex-row">
          <span className="text-navy-foreground/60">
            © {new Date().getFullYear()} Virtual Engine Builder
          </span>
          <a
            href="https://virtualengine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-parent-brand hover:underline"
            style={{ color: "hsl(var(--parent-brand))" }}
          >
            {t("footer.product")}
          </a>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
