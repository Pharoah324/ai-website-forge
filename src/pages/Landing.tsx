import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Zap,
  Code2,
  Smartphone,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { PLAN_LIMITS } from "@/hooks/useProfile";

const PLAN_FEATURES: Record<string, string[]> = {
  free: ["20 build credits/mo", "300 runtime credits", "Live preview", "1 user"],
  starter: [
    "100 build credits/mo",
    "2,500 runtime credits",
    "All templates",
    "Email support",
  ],
  builder: [
    "300 build credits/mo",
    "12,000 runtime credits",
    "Brand voice training",
    "Share preview links",
  ],
  pro: [
    "750 build credits/mo",
    "35,000 runtime credits",
    "Performance auditor",
    "Priority support",
  ],
  agency: [
    "Unlimited build credits",
    "100,000 runtime credits",
    "White-label mode",
    "Client workspaces",
  ],
};

export default function Landing() {
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
            <Link
              to="/auth"
              className="text-sm text-navy-foreground/80 hover:text-navy-foreground"
            >
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link to="/auth?mode=signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero pb-24 pt-32 text-navy-foreground">
        <div className="container relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary-glow">
            <Sparkles className="h-3 w-3" />
            AI-powered site generation
          </div>
          <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            Describe your business.{" "}
            <span className="text-gradient">Get a website.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-navy-foreground/70">
            Your website. Built by AI. Backed by Virtual Engine.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-navy-foreground/50">
            Describe your business in plain English and watch a production-ready
            site generate live.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth?mode=signup">
                Start free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-navy-foreground/20 bg-transparent text-navy-foreground hover:bg-navy-foreground/10"
            >
              <a href="#pricing">See pricing</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-navy-foreground/50">
            20 free build credits. No credit card required.
          </p>
        </div>
        {/* Decorative glow */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[500px] -translate-y-1/2 bg-gradient-glow" />
      </section>

      {/* Features */}
      <section className="border-y bg-card py-20">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "Plain English in",
                body: "Type what you want. Skip the wireframes, the briefs, the back-and-forth.",
              },
              {
                icon: Code2,
                title: "Real site out",
                body: "Structured, conversion-focused pages with copy, sections, and styling tuned to your industry.",
              },
              {
                icon: Smartphone,
                title: "Preview anywhere",
                body: "Toggle Desktop, Tablet and Mobile in real time. Share a read-only link with clients.",
              },
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

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight">Simple pricing</h2>
            <p className="mt-3 text-muted-foreground">
              Pay for what you build. Unused credits roll over (50%, capped at one
              month).
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {(Object.keys(PLAN_LIMITS) as Array<keyof typeof PLAN_LIMITS>).map(
              (key) => {
                const p = PLAN_LIMITS[key];
                const featured = key === "builder";
                return (
                  <div
                    key={key}
                    className={`relative rounded-xl border bg-card p-6 ${
                      featured
                        ? "border-primary shadow-elevated lg:scale-105"
                        : "shadow-card"
                    }`}
                  >
                    {featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                        Most popular
                      </span>
                    )}
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {p.label}
                    </h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">${p.price}</span>
                      {p.price > 0 && (
                        <span className="text-sm text-muted-foreground">/mo</span>
                      )}
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
                      className="mt-6 w-full"
                      variant={featured ? "default" : "outline"}
                    >
                      <Link to="/auth?mode=signup">
                        {p.price === 0 ? "Start free" : "Choose plan"}
                      </Link>
                    </Button>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </section>

      <footer className="border-t bg-card py-8">
        <div className="container flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} Virtual Engine Builder</span>
          <a
            href="https://virtualengine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:text-primary"
          >
            A Virtual Engine product →
          </a>
        </div>
      </footer>
    </div>
  );
}
