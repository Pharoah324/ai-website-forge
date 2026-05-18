import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  TreePine,
  Images,
  BookOpen,
  CalendarHeart,
  Shield,
  Sparkles,
  ArrowRight,
  Quote,
} from "lucide-react";

const SECTIONS = [
  {
    icon: Shield,
    title: "Family Crest",
    body: "Display your crest — or design one — as the emblem that ties every generation together.",
  },
  {
    icon: BookOpen,
    title: "Family History & Story",
    body: "A long-form chapter for the people, places, and turning points that shaped your line.",
  },
  {
    icon: Images,
    title: "Photo Gallery",
    body: "A timeless gallery for vintage portraits, reunions, weddings, and everyday moments worth keeping.",
  },
  {
    icon: CalendarHeart,
    title: "Reunion Info",
    body: "Dates, directions, what to bring — everything the cousins need to actually show up.",
  },
  {
    icon: TreePine,
    title: "Family Tree",
    body: "Branches for each generation, with room to honor those no longer with us.",
  },
];

export default function FamilyLegacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            Virtual Engine <span className="text-primary">Builder</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link to="/auth">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, hsl(var(--primary) / 0.25), transparent 70%)",
          }}
        />
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Family Legacy Template
            </span>
            <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight md:text-6xl">
              Your family's story,{" "}
              <span className="text-primary">preserved for generations</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              A warm, elegant website built for any family — a place to gather your crest,
              your history, your photos, your reunion details, and your family tree in one
              beautiful home online.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-w-[200px]">
                <Link to="/auth">
                  Build your family site
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/app/new">See the template</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              60 seconds to your first draft · No design skills required
            </p>
          </div>
        </div>
      </section>

      {/* Sections grid */}
      <section className="border-t border-border/60 bg-accent/30">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold md:text-4xl">
              Everything a family legacy site should hold
            </h2>
            <p className="mt-3 text-muted-foreground">
              Five thoughtfully designed sections, ready the moment you type in your family name.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((s) => (
              <Card
                key={s.title}
                className="p-6 transition-all hover:border-primary/50 hover:shadow-elevated"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section>
        <div className="container py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl font-semibold md:text-4xl">
                A heirloom-quality home for the people you love
              </h2>
              <p className="mt-4 text-muted-foreground">
                The Family Legacy template uses a warm, elegant aesthetic — deep forest
                greens, antique gold accents, and classic serif typography — so your
                family's story feels as timeless as it is.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Works for any family — no template lock-in",
                  "Photos, stories, and reunion details in one place",
                  "Private link to share only with relatives, or publish publicly",
                  "Edit and add to it for years as your family grows",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild size="lg">
                  <Link to="/auth">
                    Start your family site
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <Card className="relative overflow-hidden border-primary/20 p-8">
              <Quote className="absolute right-6 top-6 h-10 w-10 text-primary/20" />
              <p className="font-serif text-xl leading-relaxed">
                "We made a site for the family reunion in an afternoon. My grandmother
                cried when she saw the photo wall. Every cousin has the link now — even
                the ones we'd lost touch with."
              </p>
              <p className="mt-6 text-sm text-muted-foreground">
                — A family who built theirs with Virtual Engine Builder
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 bg-primary/5">
        <div className="container py-20 text-center">
          <h2 className="mx-auto max-w-2xl font-serif text-3xl font-semibold md:text-4xl">
            The stories worth keeping deserve a home.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Build a beautiful family legacy site in under a minute. Add to it for a lifetime.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-w-[220px]">
              <Link to="/auth">
                Create your family site
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        A Virtual Engine product ·{" "}
        <a
          href="https://virtualengine.ai"
          className="hover:text-foreground"
          target="_blank"
          rel="noreferrer"
        >
          virtualengine.ai
        </a>
      </footer>
    </div>
  );
}
