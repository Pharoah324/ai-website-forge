import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useProfile, PLAN_LIMITS } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, Loader2, Settings as SettingsIcon, Webhook, Copy } from "lucide-react";
import { TopUpModal } from "@/components/TopUpModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { AccessCodeRedeem } from "@/components/AccessCodeRedeem";

type Interval = "monthly" | "annual";

export default function Billing() {
  const { t } = useI18n();
  const { data: profile, refetch, isLoading: profileLoading } = useProfile();
  const [topupOpen, setTopupOpen] = useState(false);
  const [interval, setInterval] = useState<Interval>("monthly");
  const [busyTier, setBusyTier] = useState<string | null>(null);
  const [setupBusy, setSetupBusy] = useState(false);
  const [webhookBusy, setWebhookBusy] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{ secret?: string; url?: string; alreadyExists?: boolean; message?: string } | null>(null);
  // Plan-change confirmation (existing subscribers). preview holds the result of
  // change-subscription's `preview` action so we can show the exact prorated
  // charge BEFORE an immediate upgrade hits the card.
  const [changeDialog, setChangeDialog] = useState<{ tier: string; preview: any } | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast.success("Payment successful", { description: "Your credits/plan have been updated." });
      refetch();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("checkout") === "cancelled") {
      toast.info("Checkout cancelled");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refetch]);

  const { user, loading: authLoading } = useAuth();

  // Show loading while auth session or profile data is being fetched.
  if (authLoading || profileLoading) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span>Loading account…</span>
        </div>
      </div>
    );
  }

  // If there's no authenticated user, prompt to sign in.
  if (!user) {
    return (
      <div className="container max-w-5xl py-8">
        <p className="text-center">Please sign in to view billing.</p>
      </div>
    );
  }

  // If user is signed in but profile missing, show a friendly message.
  if (!profile) {
    return (
      <div className="container max-w-5xl py-8">
        <p className="text-center">Account not found. Contact support if this persists.</p>
      </div>
    );
  }

  // Defensive helpers: new project may have slightly different column names or missing values.
  const safeNumber = (v: unknown, alt = 0) => (typeof v === "number" ? v : alt);
  const totalCredits =
    safeNumber(profile.build_credits) +
    safeNumber((profile as any).rollover_build_credits ?? (profile as any).build_credits_rollover) +
    safeNumber((profile as any).top_up_build_credits);

  const currentPlan = (profile.plan && PLAN_LIMITS[profile.plan]) ? PLAN_LIMITS[profile.plan] : PLAN_LIMITS.free;

  // Does the user already have a live subscription? If so, plan clicks must
  // MODIFY that subscription (change-subscription), not create a new one.
  const isSubscriber = !!(profile as any).stripe_subscription_id && !!profile.plan && profile.plan !== "free";

  // New customer, first paid plan → Stripe Checkout (collects payment method,
  // creates the single subscription).
  const subscribeCheckout = async (tier: string) => {
    setBusyTier(tier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          kind: "subscription",
          planTier: tier,
          interval,
          returnUrl: window.location.origin,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned");
    } catch (err: any) {
      toast.error("Checkout failed", {
        description: err?.message ?? "Make sure Stripe products are set up first.",
      });
      setBusyTier(null);
    }
  };

  // Plan click handler — routes new vs existing subscriber.
  const onPlanClick = async (tier: string) => {
    if (!isSubscriber) {
      await subscribeCheckout(tier);
      return;
    }
    // Existing subscriber → preview the change, then require explicit confirmation.
    setBusyTier(tier);
    try {
      const { data, error } = await supabase.functions.invoke("change-subscription", {
        body: { planTier: tier, interval, action: "preview" },
      });
      if (error) throw error;
      setChangeDialog({ tier, preview: data });
    } catch (err: any) {
      toast.error("Couldn't load plan change", { description: err?.message });
    } finally {
      setBusyTier(null);
    }
  };

  // Confirmed by the user in the dialog → actually apply the change (this is
  // where an upgrade charge fires).
  const confirmChange = async () => {
    if (!changeDialog) return;
    setApplying(true);
    try {
      const { data, error } = await supabase.functions.invoke("change-subscription", {
        body: { planTier: changeDialog.tier, interval, action: "apply" },
      });
      if (error) throw error;
      if (data?.applied === "immediate") {
        toast.success("Plan upgraded", { description: "Your new plan and credits are active." });
      } else if (data?.applied === "period_end") {
        toast.success("Downgrade scheduled", { description: "Your plan changes at the end of this billing period." });
      } else if (data?.applied === "downgrade_cancelled") {
        toast.success("Downgrade cancelled", { description: "You'll stay on your current plan." });
      }
      setChangeDialog(null);
      refetch();
    } catch (err: any) {
      toast.error("Plan change failed", { description: err?.message });
    } finally {
      setApplying(false);
    }
  };

  const setupProducts = async () => {
    setSetupBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-stripe-products");
      if (error) throw error;
      toast.success("Stripe products ready", {
        description: `Created ${data?.created?.length ?? 0} new products.`,
      });
    } catch (err: any) {
      toast.error("Setup failed", { description: err?.message });
    } finally {
      setSetupBusy(false);
    }
  };

  const setupWebhook = async () => {
    setWebhookBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-stripe-webhook");
      if (error) throw error;
      setWebhookResult({
        secret: data?.webhookSecret,
        url: data?.url,
        alreadyExists: data?.alreadyExists,
        message: data?.message,
      });
    } catch (err: any) {
      toast.error("Webhook setup failed", { description: err?.message });
    } finally {
      setWebhookBusy(false);
    }
  };

  const annualPrice = (monthly: number) => Math.round(monthly * 0.8);

  return (
    <div className="container max-w-5xl py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("billing.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("billing.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={setupWebhook} disabled={webhookBusy}>
            {webhookBusy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Webhook className="mr-1 h-3.5 w-3.5" />}
            Create Stripe webhook
          </Button>
          <Button variant="ghost" size="sm" onClick={setupProducts} disabled={setupBusy}>
            {setupBusy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <SettingsIcon className="mr-1 h-3.5 w-3.5" />}
            Sync Stripe products
          </Button>
        </div>
      </div>

      <div className="mt-6"><AccessCodeRedeem /></div>

      <div className="mt-6 rounded-lg border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("billing.current")}</p>
            <p className="mt-1 text-2xl font-bold">{currentPlan.label}</p>
            <p className="text-sm text-muted-foreground">
              {t("billing.totalCredits", { n: totalCredits })}
            </p>
            {(profile.top_up_build_credits ?? 0) > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Includes {profile.top_up_build_credits ?? 0} top-up credits
              </p>
            )}
          </div>
          <Button onClick={() => setTopupOpen(true)} variant="outline">
            <Sparkles className="mr-1 h-4 w-4" /> {t("billing.buyCredits")}
          </Button>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("billing.plans")}</h2>
        <div className="inline-flex rounded-md border bg-card p-1 text-xs">
          <button
            onClick={() => setInterval("monthly")}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              interval === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t("billing.monthly")}
          </button>
          <button
            onClick={() => setInterval("annual")}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              interval === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t("billing.annual")} <span className="ml-1 opacity-70">−20%</span>
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(PLAN_LIMITS) as Array<keyof typeof PLAN_LIMITS>).map((key) => {
          const p = PLAN_LIMITS[key] || { build: 0, runtime: 0, price: 0, label: key } as any;
          const current = profile.plan === key;
          const price = interval === "annual" && (p.price ?? 0) > 0 ? annualPrice(p.price ?? 0) : (p.price ?? 0);
          return (
            <div key={key} className={`rounded-lg border bg-card p-5 ${current ? "border-primary" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.label}</h3>
                {current && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{t("billing.current_chip")}</span>
                )}
              </div>
              <p className="mt-2 text-2xl font-bold">
                ${price ?? 0}
                {(p.price ?? 0) > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                )}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {p.build} build credits/mo
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {(p.runtime ?? 0).toLocaleString()} runtime credits
                </li>
              </ul>
              <Button
                className="mt-4 w-full"
                variant={current ? "outline" : "default"}
                disabled={current || busyTier !== null || key === "free"}
                onClick={() => onPlanClick(key)}
              >
                {busyTier === key ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : null}
                {current ? t("billing.currentBtn") : key === "free" ? t("billing.free") : t("billing.upgrade")}
              </Button>
            </div>
          );
        })}
      </div>

      <GlobalCurrencyNote />

      <p className="mt-6 text-center text-xs text-muted-foreground">
        First-time setup: click <strong>Sync Stripe products</strong> above to create all plans &amp; packs in your Stripe account.
        After that, configure the webhook endpoint in Stripe pointing at <code className="rounded bg-muted px-1">/functions/v1/stripe-webhook</code>{" "}
        and paste the signing secret as <code className="rounded bg-muted px-1">STRIPE_WEBHOOK_SECRET</code>.
        <br />
        <Link to="/app" className="underline">Back to dashboard</Link>
      </p>

      <TopUpModal open={topupOpen} onOpenChange={setTopupOpen} />

      {/* Plan-change confirmation. For upgrades this shows the exact prorated
          amount charged TODAY before the user confirms — no silent charge. */}
      <Dialog open={!!changeDialog} onOpenChange={(o) => !o && !applying && setChangeDialog(null)}>
        <DialogContent>
          {(() => {
            if (!changeDialog) return null;
            const pv = changeDialog.preview ?? {};
            const targetLabel = PLAN_LIMITS[changeDialog.tier as keyof typeof PLAN_LIMITS]?.label ?? changeDialog.tier;
            const money = (cents: number) => `$${((cents ?? 0) / 100).toFixed(2)}`;
            const monthly = money(pv.new_monthly_amount);

            // Re-selecting current tier while a downgrade is pending → cancel it.
            if (pv.sameTier) {
              return (
                <>
                  <DialogHeader>
                    <DialogTitle>Keep your {targetLabel} plan</DialogTitle>
                    <DialogDescription>
                      {pv.hasPendingDowngrade
                        ? `You have a downgrade scheduled for the end of this billing period. Confirm to cancel it and stay on ${targetLabel}.`
                        : `You're already on the ${targetLabel} plan.`}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setChangeDialog(null)} disabled={applying}>Close</Button>
                    {pv.hasPendingDowngrade && (
                      <Button onClick={confirmChange} disabled={applying}>
                        {applying && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                        Cancel downgrade
                      </Button>
                    )}
                  </div>
                </>
              );
            }

            if (pv.isUpgrade) {
              return (
                <>
                  <DialogHeader>
                    <DialogTitle>Upgrade to {targetLabel}</DialogTitle>
                    <DialogDescription>
                      Your plan upgrades immediately and you get {targetLabel}'s full monthly credits right away.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Charged today (prorated)</span>
                      <span className="text-lg font-bold">{money(pv.amount_due_today)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-muted-foreground">New monthly price</span>
                      <span className="font-medium">{monthly}/mo</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setChangeDialog(null)} disabled={applying}>Cancel</Button>
                    <Button onClick={confirmChange} disabled={applying}>
                      {applying && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                      Confirm &amp; pay {money(pv.amount_due_today)}
                    </Button>
                  </div>
                </>
              );
            }

            // Downgrade — applies at period end, no charge today.
            const periodEnd = pv.current_period_end
              ? new Date(pv.current_period_end * 1000).toLocaleDateString()
              : "the end of your billing period";
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Downgrade to {targetLabel}</DialogTitle>
                  <DialogDescription>
                    No charge today. You keep your current plan and credits until {periodEnd},
                    then switch to {targetLabel} at {monthly}/mo. Your credit allowance changes to
                    the new plan starting next cycle.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setChangeDialog(null)} disabled={applying}>Cancel</Button>
                  <Button onClick={confirmChange} disabled={applying}>
                    {applying && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                    Schedule downgrade
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={!!webhookResult} onOpenChange={(o) => !o && setWebhookResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stripe webhook {webhookResult?.alreadyExists ? "already exists" : "created"}</DialogTitle>
            <DialogDescription>
              {webhookResult?.alreadyExists
                ? webhookResult?.message
                : "Copy the signing secret below and save it as STRIPE_WEBHOOK_SECRET in your project secrets. Stripe only shows this once."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Endpoint URL</p>
              <code className="mt-1 block break-all rounded bg-muted px-2 py-1 text-xs">{webhookResult?.url}</code>
            </div>
            {webhookResult?.secret && (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Signing secret</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-muted px-2 py-1 text-xs">{webhookResult.secret}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookResult.secret!);
                      toast.success("Copied");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Approximate USD→local conversion rates (refreshed periodically; for reference only).
const FX: Array<{ code: string; symbol: string; flag: string; rate: number; name: string }> = [
  { code: "USD", symbol: "$",  flag: "🇺🇸", rate: 1,    name: "US Dollar" },
  { code: "EUR", symbol: "€",  flag: "🇪🇺", rate: 0.92, name: "Euro" },
  { code: "GBP", symbol: "£",  flag: "🇬🇧", rate: 0.79, name: "British Pound" },
  { code: "BRL", symbol: "R$", flag: "🇧🇷", rate: 5.10, name: "Brazilian Real" },
  { code: "MXN", symbol: "$",  flag: "🇲🇽", rate: 17.5, name: "Mexican Peso" },
  { code: "INR", symbol: "₹",  flag: "🇮🇳", rate: 83.5, name: "Indian Rupee" },
  { code: "JPY", symbol: "¥",  flag: "🇯🇵", rate: 150,  name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", flag: "🇦🇺", rate: 1.52, name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", flag: "🇨🇦", rate: 1.36, name: "Canadian Dollar" },
];

function GlobalCurrencyNote() {
  const [country, setCountry] = useState("USD");
  const fx = FX.find((f) => f.code === country) || FX[0];
  const sample = (usd: number) => {
    const v = usd * fx.rate;
    if (fx.code === "JPY") return `${fx.symbol}${Math.round(v).toLocaleString()}`;
    return `${fx.symbol}${v.toFixed(2)}`;
  };
  return (
    <div className="mt-8 rounded-lg border bg-muted/30 p-5 text-sm">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="font-semibold">🌍 Global pricing</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Prices shown in USD. Your card will be charged in USD. Stripe handles currency conversion automatically for all countries.
          </p>
        </div>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-md border bg-background px-2 py-1.5 text-xs"
          aria-label="Show approximate prices in"
        >
          {FX.map((f) => (
            <option key={f.code} value={f.code}>{f.flag} {f.code} — {f.name}</option>
          ))}
        </select>
      </div>
      {country !== "USD" && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-5">
          {[
            { label: "Starter", usd: 19 },
            { label: "Builder", usd: 49 },
            { label: "Pro", usd: 99 },
            { label: "Agency", usd: 199 },
            { label: "Top-up Starter", usd: 9 },
          ].map((p) => (
            <div key={p.label} className="rounded border bg-card px-2 py-1.5">
              <div className="text-muted-foreground">{p.label}</div>
              <div className="font-semibold">≈ {sample(p.usd)}</div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">
        Approximate prices for reference. Final charge in USD.
      </p>
    </div>
  );
}
