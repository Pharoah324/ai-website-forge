import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Zap,
  ArrowRight,
  ArrowDown,
  Star,
  Users,
  Globe,
  Timer,
  Quote,
  Link2,
  TrendingUp,
  Languages,
  Mic,
  Rocket,
  Search,
  BarChart3,
  PenTool,
  CalendarDays,
  Check,
  X,
  CheckCircle2,
  Settings2,
  DollarSign,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PLAN_LIMITS } from "@/hooks/useProfile";
import { ChatWidget } from "@/components/ChatWidget";
import { LanguageSelector } from "@/components/LanguageSelector";

const PLAN_TAGLINES: Record<string, string> = {
  free: "Try it out",
  starter: "Beginner & testing",
  builder: "Best for serious growth",
  pro: "Advanced scaling",
  agency: "Client work & white-label",
};

const PLAN_FEATURES: Record<string, string[]> = {
  free: ["20 build credits/mo", "300 runtime credits", "Live preview", "1 user"],
  starter: ["100 build credits/mo", "2,500 runtime credits", "All templates", "Email support"],
  builder: [
    "300 build credits/mo",
    "10,000 runtime credits",
    "50% build credit rollover",
    "Search Atlas SEO included",
    "Brand voice training",
  ],
  pro: [
    "800 build credits/mo",
    "30,000 runtime credits",
    "50% build credit rollover",
    "Search Atlas SEO included",
    "Priority generation queue",
  ],
  agency: [
    "2,000 build credits/mo",
    "100,000 runtime credits",
    "50% build credit rollover",
    "Search Atlas + client reports",
    "White-label & client workspaces",
  ],
};

const PLAN_TRUST: Record<string, string[]> = {
  free: ["GoHighLevel ready", "Cancel anytime"],
  starter: ["GoHighLevel ready", "Cancel anytime"],
  builder: ["GoHighLevel ready", "Credits roll over 50% monthly", "Search Atlas SEO included", "Cancel anytime"],
  pro: ["GoHighLevel ready", "Credits roll over 50% monthly", "Search Atlas SEO included", "Cancel anytime"],
  agency: ["GoHighLevel ready", "Credits roll over 50% monthly", "Search Atlas SEO included", "Cancel anytime"],
};

const ROTATING_PROMPTS = [
  "A luxury medspa in Miami called Glow Aesthetics offering Botox, facials, and online booking…",
  "A real estate agent in Atlanta specializing in luxury condos with IDX listings and lead capture…",
  "Un restaurante de mariscos en Ciudad de México con menú, reservas online y reseñas de clientes…",
  "Uma academia de fitness em São Paulo chamada Forma Total com aulas, planos e agendamento…",
];

function RotatingPrompt() {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const full = ROTATING_PROMPTS[idx];
    let i = 0;
    setTyped("");
    const tick = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(tick);
        setTimeout(() => setIdx((p) => (p + 1) % ROTATING_PROMPTS.length), 2400);
      }
    }, 28);
    return () => clearInterval(tick);
  }, [idx]);

  return (
    <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-primary/25 bg-navy-muted/60 p-4 text-left shadow-glow">
      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-primary-glow">
        <Mic className="h-3 w-3" />
        Try a prompt
      </div>
      <p className="min-h-[3.5rem] text-sm leading-relaxed text-navy-foreground/90">
        {typed}
        <span className="animate-type-cursor ml-0.5 inline-block h-4 w-[2px] bg-primary align-middle" />
      </p>
    </div>
  );
}

const STATS = [
  { value: "50+", label: "Languages Supported", icon: Languages },
  { value: "190+", label: "Countries Served", icon: Globe },
  { value: "60 sec", label: "Avg Build Time", icon: Timer },
  { value: "4.9★", label: "Rating", icon: Star },
  { value: "8B+", label: "Potential Customers", icon: Users },
];

const WHY_CARDS = [
  {
    icon: Link2,
    emoji: "🔗",
    title: "Built FOR GoHighLevel",
    body:
      "Every form submission on your site automatically creates a contact and drops them into your GHL pipeline. No Zapier. No setup. No copy-paste. The only AI builder with native GHL integration.",
    badge: "Available in GHL Marketplace",
  },
  {
    icon: TrendingUp,
    emoji: "📈",
    title: "SEO Built In — Powered by Search Atlas",
    body:
      "Every site we generate is automatically optimized with real keyword data from Search Atlas — the same professional SEO platform agencies pay $200/month for. Your site doesn't just look good. It gets found.",
    badge: "Exclusive Feature",
  },
  {
    icon: Globe,
    emoji: "🌍",
    title: "Built for Every Country Worldwide",
    body:
      "Generate websites in 50+ languages — English, Spanish, Mandarin, Arabic, Hindi, Japanese, French, German, and any other major world language. Type your description in any language and get a fully native website in that same language. RTL support for Arabic, Hebrew, Persian, and Urdu.",
    badge: "50+ Languages",
  },
];

const COMPARISON_ROWS: Array<{ feature: string; base: string | boolean; lov: string | boolean; veb: string }> = [
  { feature: "Native GHL Integration", base: false, lov: false, veb: "Native" },
  { feature: "Search Atlas SEO", base: false, lov: false, veb: "Builder & up" },
  { feature: "Credits Roll Over", base: false, lov: false, veb: "Builder & up (50%)" },
  { feature: "Buy Extra Credits", base: false, lov: false, veb: "Anytime" },
  { feature: "Multi-Language", base: false, lov: false, veb: "50+ Languages + RTL" },
  { feature: "Agency Sub-Accounts", base: false, lov: false, veb: "Included" },
  { feature: "White-Label Mode", base: false, lov: false, veb: "Agency Plan" },
  { feature: "Voice Prompt Input", base: false, lov: false, veb: "Built In" },
  { feature: "SEO Optimization", base: false, lov: false, veb: "Search Atlas" },
  { feature: "GHL Marketplace Listed", base: false, lov: false, veb: "Official" },
  { feature: "Starting Price", base: "$16/mo", lov: "$20/mo", veb: "$19/mo ✅" },
];

const STEPS = [
  {
    icon: Mic,
    emoji: "🎤",
    title: "Describe or Say It",
    body:
      "Type your business description or tap the microphone and speak it. Any language. Any industry. The more detail you give, the better the result.",
  },
  {
    icon: Zap,
    emoji: "⚡",
    title: "AI Builds It Live",
    body:
      "Watch your website generate in real time. Real copy. Real colors. Real pages. SEO optimized automatically with Search Atlas keyword data.",
  },
  {
    icon: Rocket,
    emoji: "🚀",
    title: "Publish and Connect",
    body:
      "Hit publish. Your site goes live instantly. Connect your GoHighLevel account and every lead flows straight into your pipeline automatically.",
  },
];

const GHL_COLS = [
  { icon: Link2, emoji: "🔗", title: "Pipeline Auto-Sync", body: "New form submission = new GHL contact. Automatically. Every time." },
  { icon: CalendarDays, emoji: "📅", title: "Calendar Embed", body: "Drop your GHL booking calendar into any page. One click. No code." },
  { icon: Settings2, emoji: "⚙️", title: "Workflow Triggers", body: "Site events fire your GHL automations. Form fills, purchases, signups — all connected." },
];

const SEO_BOXES = [
  { icon: Search, emoji: "🔍", title: "Keyword Research", body: "Real search volume data for your industry and location — built into every site." },
  { icon: BarChart3, emoji: "📊", title: "SEO Score", body: "Every site gets an SEO score out of 100 with specific improvement suggestions." },
  { icon: PenTool, emoji: "✍️", title: "Optimized Copy", body: "Headlines, descriptions, and page copy written around your highest-value search keywords." },
  { icon: CalendarDays, emoji: "📅", title: "Content Calendar", body: "5 blog topic suggestions ranked by difficulty so you can keep growing your organic traffic." },
];

const LANGUAGES = [
  { flag: "🇺🇸", name: "English", body: "The US, Canada, and English-speaking Caribbean" },
  { flag: "🇲🇽", name: "Español", body: "Mexico, Colombia, Argentina, Chile, and all of Latin America" },
  { flag: "🇧🇷", name: "Português", body: "Brazil — the largest economy in South America with 215 million people" },
  { flag: "🇫🇷", name: "Français", body: "Canada, Haiti, and French-speaking markets" },
];

const TESTIMONIALS = [
  {
    quote:
      "I described my medspa and had a fully designed website with online booking in under 2 minutes. The GoHighLevel connection is everything — leads go straight into my pipeline without me touching anything.",
    name: "Jessica R.",
    role: "Glow Aesthetics Miami",
  },
  {
    quote:
      "I manage 14 client websites from one dashboard. The white-label mode makes me look like I built a proprietary platform. My clients have no idea this exists and I charge premium prices.",
    name: "Marcus D.",
    role: "MD Digital Agency",
  },
  {
    quote:
      "Switched from Base44. The credit rollover alone saves me $40 a month. And the Search Atlas SEO built in means my clients actually rank on Google now. Nothing else does this.",
    name: "Tanya K.",
    role: "Real Estate Coach Atlanta",
  },
  {
    quote:
      "Creé el sitio web de mi restaurante en español en 60 segundos. Nunca pensé que algo así fuera posible para un negocio pequeño como el mío.",
    name: "Carlos M.",
    role: "Restaurante El Fogón, Ciudad de México",
  },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-primary" />;
  if (value === false) return <X className="mx-auto h-4 w-4 text-muted-foreground/50" />;
  return <span className="text-sm">{value}</span>;
}

function FadeIn({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setShown(true), io.disconnect()),
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ${shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="absolute z-20 w-full">
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
              Sign in
            </Link>
            <Button asChild size="sm" className="bg-cta text-cta-foreground hover:bg-cta/90">
              <Link to="/auth?mode=signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero pb-24 pt-36 text-navy-foreground">
        <div className="container relative z-10 mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary-glow">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            ✦ Now Available in the GoHighLevel Marketplace
          </div>
          <h1 className="text-balance text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl">
            Build. Optimize.
            <br />
            <span className="text-gradient">Automate. Scale.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-navy-foreground/75">
            AI-powered business infrastructure for companies that want more visibility, better systems, and smarter
            growth. Most websites never get found — Virtual Engine helps businesses build smarter sites, optimize SEO,
            automate lead flow, and connect the systems that drive growth.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-cta text-cta-foreground shadow-glow-cta hover:bg-cta/90">
              <Link to="/auth?mode=signup">
                Build a New Website <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-navy-foreground/20 bg-transparent text-navy-foreground hover:bg-navy-foreground/10"
            >
              <Link to="/auth?mode=signup&intent=optimize">
                Optimize an Existing Website <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-5 text-xs text-navy-foreground/60">
            For startups, local businesses, agencies, and enterprise brands · No credit card required
          </p>
          <RotatingPrompt />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[500px] -translate-y-1/2 bg-gradient-glow" />
      </section>

      {/* STATS BAR */}
      <section className="border-y border-primary/20 bg-navy py-8 text-navy-foreground">
        <div className="container">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
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

      {/* WHY */}
      <section className="bg-background py-24">
        <div className="container max-w-6xl">
          <FadeIn className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Not Just Another AI Builder.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every other AI website builder builds a site and stops there. We build a site that ranks on Google, flows
              leads into your CRM, and works in any language. That is a completely different product.
            </p>
          </FadeIn>
          <div className="grid gap-6 md:grid-cols-3">
            {WHY_CARDS.map((c, i) => (
              <FadeIn key={c.title} className={`delay-[${i * 100}ms]`}>
                <div
                  className="group h-full rounded-2xl border border-primary/20 p-7 shadow-card transition-all hover:border-primary/50 hover:shadow-glow"
                  style={{ background: "rgba(16,185,129,0.05)" }}
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-2xl">
                    {c.emoji}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold">{c.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                  <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    <CheckCircle2 className="h-3 w-3" /> {c.badge}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* INFRASTRUCTURE FEATURES */}
      <section className="bg-background py-24">
        <div className="container max-w-6xl">
          <FadeIn className="mx-auto mb-14 max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              Business Growth Infrastructure
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              Everything you need to grow — in one platform.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Websites, SEO, CRM, and automation working together. Not a stack of disconnected tools.
            </p>
          </FadeIn>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "AI Website Building", body: "Generate complete, on-brand sites from a single description." },
              { title: "Existing Website Optimization", body: "Connect what you already have. Audit, improve, and grow." },
              { title: "SEO Optimization", body: "On-page, technical, and content SEO baked into every build." },
              { title: "Search Atlas Integration", body: "Real keyword data and ranking insights from a $200/mo SEO platform." },
              { title: "CRM Connectivity", body: "Sync contacts, leads, and pipeline stages — automatically." },
              { title: "GoHighLevel Ready", body: "Native GHL pipeline sync, calendars, and workflow triggers." },
              { title: "AI Automation", body: "Trigger flows from form fills, purchases, and site events." },
              { title: "Lead Capture", body: "Smart forms, exit intent, and instant CRM hand-off." },
              { title: "AI Business Intelligence", body: "Growth recommendations from your traffic, leads, and revenue." },
            ].map((f) => (
              <FadeIn key={f.title}>
                <div className="h-full rounded-xl border border-primary/15 bg-card p-6 shadow-card transition-all hover:border-primary/40 hover:shadow-elevated">
                  <h3 className="text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* "Already have a website?" feature card */}
          <FadeIn className="mt-10">
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-8 md:flex md:items-center md:justify-between md:gap-8">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cta/40 bg-cta/10 px-2.5 py-1 text-[11px] font-semibold text-cta">
                  Already have a website?
                </span>
                <h3 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                  Connect it. Optimize it. Scale it.
                </h3>
                <p className="mt-2 text-sm text-muted-foreground md:text-base">
                  Connect your existing website and let Virtual Engine analyze SEO performance, identify growth
                  opportunities, recommend improvements, and optimize your business systems.
                </p>
              </div>
              <Button asChild size="lg" className="mt-5 bg-cta text-cta-foreground hover:bg-cta/90 md:mt-0">
                <Link to="/auth?mode=signup&intent=optimize">
                  Optimize my website <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CONNECT YOUR SYSTEMS */}
      <section className="bg-navy py-24 text-navy-foreground">
        <div className="container max-w-5xl">
          <FadeIn className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Connect your systems.</h2>
            <p className="mt-3 text-lg text-navy-foreground/70">
              Plug in the tools your business already runs on. Virtual Engine ties them into one growth engine.
            </p>
          </FadeIn>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {[
              "Google Search Console",
              "Google Analytics",
              "Search Atlas",
              "GoHighLevel",
              "Stripe",
            ].map((s) => (
              <div
                key={s}
                className="flex h-24 items-center justify-center rounded-xl border border-primary/25 px-4 text-center text-sm font-semibold"
                style={{ background: "rgba(16,185,129,0.06)" }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="bg-navy py-24 text-navy-foreground">

        <div className="container max-w-5xl">
          <FadeIn className="mb-12 text-center">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">We Built What They Forgot.</h2>
          </FadeIn>
          <FadeIn>
            <div className="overflow-hidden rounded-2xl border border-primary/30 shadow-glow">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-navy-muted/80 text-navy-foreground">
                      <th className="px-4 py-4 text-left font-semibold">Feature</th>
                      <th className="px-4 py-4 text-center font-semibold text-navy-foreground/70">Base44</th>
                      <th className="px-4 py-4 text-center font-semibold text-navy-foreground/70">Lovable</th>
                      <th className="px-4 py-4 text-center font-bold text-primary-foreground" style={{ background: "hsl(var(--primary))" }}>
                        Virtual Engine Builder
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((r, i) => (
                      <tr key={r.feature} className={i % 2 ? "bg-navy/40" : "bg-navy-muted/30"}>
                        <td className="px-4 py-3.5 text-navy-foreground/90">{r.feature}</td>
                        <td className="px-4 py-3.5 text-center text-navy-foreground/60">
                          <Cell value={r.base} />
                        </td>
                        <td className="px-4 py-3.5 text-center text-navy-foreground/60">
                          <Cell value={r.lov} />
                        </td>
                        <td
                          className="px-4 py-3.5 text-center font-semibold text-primary-glow"
                          style={{ background: "rgba(16,185,129,0.12)" }}
                        >
                          {typeof r.veb === "string" ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Check className="h-4 w-4 text-primary" />
                              {r.veb}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-8 text-center text-2xl font-bold md:text-3xl">
              Same price. <span className="text-gradient">Ten features they don't have.</span>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-background py-24">
        <div className="container max-w-6xl">
          <FadeIn className="mb-14 text-center">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Three Steps. A Real Business Website.</h2>
          </FadeIn>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <FadeIn key={s.title}>
                <div className="relative h-full rounded-2xl border bg-card p-7 shadow-card">
                  <div className="absolute -top-4 left-7 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cta text-sm font-bold text-cta-foreground">
                    {i + 1}
                  </div>
                  <div className="mb-4 text-3xl">{s.emoji}</div>
                  <h3 className="mb-2 text-xl font-semibold">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* GHL SECTION */}
      <section className="relative bg-navy py-24 text-navy-foreground">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-primary" />
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-primary" />
        <div className="container max-w-6xl">
          <FadeIn className="mb-14 text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary-glow">
              <CheckCircle2 className="h-3 w-3" /> Available in GHL Marketplace
            </div>
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">GoHighLevel User?</h2>
            <p className="mt-3 text-lg text-navy-foreground/75">This was built for you specifically.</p>
          </FadeIn>
          <div className="grid gap-6 md:grid-cols-3">
            {GHL_COLS.map((c) => (
              <FadeIn key={c.title}>
                <div
                  className="h-full rounded-2xl border border-primary/25 p-7"
                  style={{ background: "rgba(16,185,129,0.06)" }}
                >
                  <div className="mb-4 text-3xl">{c.emoji}</div>
                  <h3 className="mb-2 text-lg font-semibold">{c.title}</h3>
                  <p className="text-sm leading-relaxed text-navy-foreground/70">{c.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn className="mt-10 text-center">
            <Button asChild size="lg" className="bg-cta text-cta-foreground hover:bg-cta/90">
              <a href="https://marketplace.gohighlevel.com" target="_blank" rel="noopener noreferrer">
                ✦ Find Us in the GHL Marketplace <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* SEARCH ATLAS SEO */}
      <section className="bg-background py-24">
        <div className="container max-w-6xl">
          <FadeIn className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Most Websites Never Get Found on Google.
              <br />
              <span className="text-gradient">Yours Will Be Different.</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every site generated on Virtual Engine Builder is automatically optimized using real keyword data from
              Search Atlas — the professional SEO platform used by thousands of agencies worldwide.
            </p>
          </FadeIn>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {SEO_BOXES.map((b) => (
              <FadeIn key={b.title}>
                <div
                  className="h-full rounded-xl border border-primary/20 p-6 transition-all hover:border-primary/50 hover:shadow-glow"
                  style={{ background: "rgba(16,185,129,0.04)" }}
                >
                  <div className="mb-3 text-2xl">{b.emoji}</div>
                  <h3 className="mb-2 text-base font-semibold">{b.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{b.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* MULTILINGUAL */}
      <section className="bg-navy py-24 text-navy-foreground">
        <div className="container max-w-6xl">
          <FadeIn className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              One Platform. Four Languages.
              <br />
              <span className="text-gradient">1.2 Billion Potential Customers.</span>
            </h2>
          </FadeIn>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {LANGUAGES.map((l) => (
              <FadeIn key={l.name}>
                <div
                  className="h-full rounded-xl border border-primary/25 p-6 text-center"
                  style={{ background: "rgba(16,185,129,0.08)" }}
                >
                  <div className="mb-3 text-4xl">{l.flag}</div>
                  <h3 className="mb-2 text-lg font-semibold">{l.name}</h3>
                  <p className="text-sm leading-relaxed text-navy-foreground/70">{l.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn className="mx-auto mt-10 max-w-2xl text-center text-base text-navy-foreground/75">
            Type your description in any language. Get your complete website in that same language. No translation
            needed. No extra steps.
          </FadeIn>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-background py-24">
        <div className="container max-w-6xl">
          <FadeIn className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Real Results. Real Business Owners.</h2>
          </FadeIn>
          <div className="grid gap-6 md:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <FadeIn key={t.name}>
                <div
                  className="h-full rounded-xl border border-primary/15 p-7 shadow-card transition-shadow hover:shadow-elevated"
                  style={{ background: "rgba(16,185,129,0.04)" }}
                >
                  <Quote className="mb-3 h-5 w-5 text-primary" />
                  <p className="text-base leading-relaxed text-foreground">"{t.quote}"</p>
                  <div className="mt-4 flex items-center gap-1 text-cta">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <div className="mt-3 text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-card py-24">
        <div className="container">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Start Free. Scale When Ready.</h2>
            <p className="mt-3 text-muted-foreground">
              Every plan connects to your own GoHighLevel account. Advanced SEO, credit rollover, and growth tools
              unlock starting at <span className="font-semibold text-primary">Builder ($49)</span>.
            </p>
          </FadeIn>
          <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {(Object.keys(PLAN_LIMITS) as Array<keyof typeof PLAN_LIMITS>).map((key) => {
              const p = PLAN_LIMITS[key];
              const featured = key === "builder";
              return (
                <div
                  key={key}
                  className={`relative flex flex-col rounded-xl border bg-background p-6 ${
                    featured ? "border-primary shadow-elevated lg:scale-105 ring-2 ring-primary/40" : "shadow-card"
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-cta px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cta-foreground shadow-glow-cta">
                      ★ Most Popular
                    </span>
                  )}
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{p.label}</h3>
                  <p className="mt-1 text-[11px] text-muted-foreground/80">{PLAN_TAGLINES[key]}</p>
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
                    <Link to="/auth?mode=signup">{p.price === 0 ? "Start Free" : featured ? "Get Builder" : "Choose plan"}</Link>
                  </Button>
                  <ul className="mt-5 space-y-1.5 text-[11px] text-muted-foreground">
                    {PLAN_TRUST[key].map((t) => (
                      <li key={t} className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-primary" /> {t}
                        </span>
                        {t === "GoHighLevel ready" && (
                          <span className="ml-4 text-[10px] text-muted-foreground/70">
                            Connect your own GoHighLevel account seamlessly.
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* CRM SETUP UPSELL */}
          <FadeIn className="mt-10">
            <div className="mx-auto max-w-3xl rounded-xl border border-primary/30 bg-primary/5 p-5 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
              <div>
                <p className="text-sm font-semibold">Need a CRM setup?</p>
                <p className="text-xs text-muted-foreground">
                  Virtual Engine can help connect and configure your GoHighLevel account.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-3 sm:mt-0">
                <a href="https://virtualengine.ai/contact" target="_blank" rel="noopener noreferrer">
                  Talk to our team <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </FadeIn>

          {/* Top-up packs */}
          <FadeIn className="mt-16">
            <div className="mx-auto max-w-3xl rounded-2xl border border-primary/25 p-7 text-center" style={{ background: "rgba(16,185,129,0.05)" }}>
              <h3 className="text-xl font-bold">Need more credits? Top up anytime.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Buy extra build credits whenever you need them. They never expire.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { credits: 50, price: 9 },
                  { credits: 200, price: 29 },
                  { credits: 500, price: 59 },
                ].map((pk) => (
                  <div key={pk.credits} className="rounded-lg border bg-background p-4">
                    <div className="text-2xl font-bold">{pk.credits}</div>
                    <div className="text-xs text-muted-foreground">build credits</div>
                    <div className="mt-2 text-base font-semibold text-primary">${pk.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-gradient-hero py-24 text-navy-foreground">
        <div className="container relative z-10 max-w-4xl text-center">
          <FadeIn>
            <h2 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Your website should be more than a digital brochure.
              <br />
              <span className="text-gradient">It should be your business growth engine.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-navy-foreground/75">
              Build, optimize, automate, and scale on one AI-powered platform.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-cta text-cta-foreground shadow-glow-cta hover:bg-cta/90">
                <Link to="/auth?mode=signup">
                  Start Building <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-navy-foreground/20 bg-transparent text-navy-foreground hover:bg-navy-foreground/10"
              >
                <Link to="/auth?mode=signup&intent=optimize">
                  Optimize Existing Website <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-xs text-navy-foreground/60">
              Free plan available · No credit card · English, Español, Português & Français
            </p>
          </FadeIn>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[400px] -translate-y-1/2 bg-gradient-glow" />
      </section>

      {/* AFFILIATE CTA */}
      <section className="border-y border-primary/15 bg-primary/5 py-16">
        <div className="container max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cta/40 bg-cta/10 px-3 py-1 text-xs font-medium text-cta">
            <DollarSign className="h-3 w-3" /> Affiliate Program
          </span>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">Know Someone Who Needs This?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join our affiliate program and earn 30% recurring commission for every customer you refer.
            Influencers, agencies, and marketers welcome.
          </p>
          <Button asChild size="lg" className="mt-6 bg-cta text-cta-foreground hover:bg-cta/90">
            <Link to="/affiliates">Become an Affiliate <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-primary/20 bg-navy py-14 text-navy-foreground">
        <div className="container">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary">
                  <Zap className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">
                  Virtual Engine <span className="text-primary-glow">Builder</span>
                </span>
              </div>
              <p className="text-xs text-navy-foreground/60">
                AI website builder with native GoHighLevel integration and Search Atlas SEO.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-foreground/80">Products</h4>
              <ul className="space-y-2 text-sm text-navy-foreground/70">
                <li><Link to="/app" className="hover:text-primary-glow">Dashboard</Link></li>
                <li><Link to="/app" className="hover:text-primary-glow">Templates</Link></li>
                <li><Link to="/app/integrations" className="hover:text-primary-glow">Integrations</Link></li>
                <li><a href="https://marketplace.gohighlevel.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-glow">GHL Marketplace</a></li>
                <li><a href="#pricing" className="hover:text-primary-glow">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-foreground/80">Languages</h4>
              <ul className="space-y-2 text-sm text-navy-foreground/70">
                <li>🇺🇸 English</li>
                <li>🇲🇽 Español</li>
                <li>🇧🇷 Português</li>
                <li>🇫🇷 Français</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-foreground/80">Support</h4>
              <ul className="space-y-2 text-sm text-navy-foreground/70">
                <li><Link to="/affiliates" className="hover:text-primary-glow">Affiliate Program</Link></li>
                <li><a href="#" className="hover:text-primary-glow">Help Center</a></li>
                <li><a href="#" className="hover:text-primary-glow">Contact</a></li>
                <li><a href="#" className="hover:text-primary-glow">Status</a></li>
                <li><a href="#" className="hover:text-primary-glow">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-glow">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-primary/15 pt-6 text-sm md:flex-row">
            <span className="text-navy-foreground/60">© {new Date().getFullYear()} Virtual Engine Builder</span>
            <div className="flex flex-col items-center gap-1 text-center md:items-end">
              <a
                href="https://virtualengine.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline"
                style={{ color: "hsl(var(--parent-brand))" }}
              >
                A Virtual Engine product — virtualengine.ai
              </a>
              <span className="text-[11px] text-navy-foreground/50">
                Serving North America and South America in English, Español, Português & Français
              </span>
            </div>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
