import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Search, BarChart3, Zap, CheckCircle2, Globe } from "lucide-react";
import { toast } from "sonner";

export default function Optimize() {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmitting(true);
    // Placeholder — wire to real analyzer when ready
    setTimeout(() => {
      toast.success("Site queued for analysis. We'll email you a full report.");
      setSubmitting(false);
      setUrl("");
    }, 900);
  };

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Optimize an existing website</h1>
        <p className="mt-2 text-muted-foreground">
          Connect your existing site and let Virtual Engine analyze SEO performance, identify growth
          opportunities, and recommend improvements powered by Search Atlas.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={onAnalyze} className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-md border bg-background px-3">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <input
              type="url"
              required
              placeholder="https://yourwebsite.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-11 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <Button type="submit" disabled={submitting} className="h-11">
            {submitting ? "Analyzing…" : "Analyze site"} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </form>
      </Card>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Search, title: "SEO audit", body: "Real keyword data, on-page issues, and ranking gaps." },
          { icon: BarChart3, title: "Growth report", body: "Traffic, conversion, and lead-flow opportunities." },
          { icon: Zap, title: "Recommendations", body: "Actionable fixes — copy, structure, and automation." },
        ].map((b) => (
          <div key={b.title} className="rounded-lg border bg-card p-5">
            <b.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-semibold">{b.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-6">
        <h3 className="font-semibold">Connect your systems for full optimization</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get the most out of optimization by connecting Google Search Console, Google Analytics,
          Search Atlas, GoHighLevel, and Stripe.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {["Google Search Console", "Google Analytics", "Search Atlas", "GoHighLevel", "Stripe"].map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1">
              <CheckCircle2 className="h-3 w-3 text-primary" /> {s}
            </span>
          ))}
        </div>
        <Button asChild variant="outline" size="sm" className="mt-5">
          <Link to="/app/integrations">Manage integrations <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    </div>
  );
}
