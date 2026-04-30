import { Link } from "react-router-dom";
import { useProfile, PLAN_LIMITS } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { TopUpModal } from "@/components/TopUpModal";

export default function Billing() {
  const { data: profile } = useProfile();
  const [topupOpen, setTopupOpen] = useState(false);
  if (!profile) return null;

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your plan and credit packs.
      </p>

      <div className="mt-6 rounded-lg border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current plan
            </p>
            <p className="mt-1 text-2xl font-bold">
              {PLAN_LIMITS[profile.plan].label}
            </p>
            <p className="text-sm text-muted-foreground">
              {profile.plan === "agency"
                ? "Unlimited build credits"
                : `${profile.build_credits} build credits remaining`}
            </p>
          </div>
          <Button onClick={() => setTopupOpen(true)} variant="outline">
            <Sparkles className="mr-1 h-4 w-4" /> Buy credits
          </Button>
        </div>
      </div>

      <h2 className="mt-10 text-xl font-bold">Plans</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(PLAN_LIMITS) as Array<keyof typeof PLAN_LIMITS>).map(
          (key) => {
            const p = PLAN_LIMITS[key];
            const current = profile.plan === key;
            return (
              <div
                key={key}
                className={`rounded-lg border bg-card p-5 ${
                  current ? "border-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.label}</h3>
                  {current && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      CURRENT
                    </span>
                  )}
                </div>
                <p className="mt-2 text-2xl font-bold">
                  ${p.price}
                  {p.price > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  )}
                </p>
                <ul className="mt-3 space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {p.build === -1
                      ? "Unlimited build credits"
                      : `${p.build} build credits/mo`}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {p.runtime.toLocaleString()} runtime credits
                  </li>
                </ul>
                <Button
                  className="mt-4 w-full"
                  variant={current ? "outline" : "default"}
                  disabled={current}
                  onClick={() => {
                    /* Stripe checkout in next phase */
                    alert("Stripe subscription checkout will be wired in the next build.");
                  }}
                >
                  {current ? "Current plan" : p.price === 0 ? "Free" : "Upgrade"}
                </Button>
              </div>
            );
          },
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Stripe checkout (subscriptions + top-up packs) wired in next build. Plan
        switching, credit math, and rollover logic are already live in the
        database. <Link to="/app" className="underline">Back to dashboard</Link>
      </p>

      <TopUpModal open={topupOpen} onOpenChange={setTopupOpen} />
    </div>
  );
}
