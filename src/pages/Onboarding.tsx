import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Sparkles, Search, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const choose = async (path: string) => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true } as never)
        .eq("id", user.id);
    }
    navigate(path);
  };
  return (
    <div className="container max-w-4xl py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">What would you like to do first?</h1>
        <p className="mt-3 text-muted-foreground">
          Pick a path. You can always switch later from your dashboard.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Card
          onClick={() => navigate("/app/new")}
          className="group cursor-pointer p-7 transition-all hover:border-primary hover:shadow-elevated"
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Build a new website</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Describe your business and Virtual Engine generates a complete, SEO-optimized site in 60 seconds.
          </p>
          <div className="mt-5 inline-flex items-center text-sm font-medium text-primary">
            Start building <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Card>

        <Card
          onClick={() => navigate("/app/optimize")}
          className="group cursor-pointer p-7 transition-all hover:border-primary hover:shadow-elevated"
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Optimize an existing website</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect your existing site and let our AI analyze SEO, identify growth opportunities, and recommend
            improvements.
          </p>
          <div className="mt-5 inline-flex items-center text-sm font-medium text-primary">
            Optimize my site <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Link to="/app" className="text-xs text-muted-foreground hover:text-foreground">
          Skip for now
        </Link>
      </div>
    </div>
  );
}
