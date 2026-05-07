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
import { AccessCodeRedeem } from "@/components/AccessCodeRedeem";

type Interval = "monthly" | "annual";

export default function Billing() {
  const { t } = useI18n();
  const { data: profile, refetch } = useProfile();
  const [topupOpen, setTopupOpen] = useState(false);
  const [interval, setInterval] = useState<Interval>("monthly");
  const [busyTier, setBusyTier] = useState<string | null>(null);
  const [setupBusy, setSetupBusy] = useState(false);
  const [webhookBusy, setWebhookBusy] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{ secret?: string; url?: string; alreadyExists?: boolean; message?: string } | null>(null);

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

  if (!profile) return null;

  const upgrade = async (tier: string) => {
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
            <p className="mt-1 text-2xl font-bold">{PLAN_LIMITS[profile.plan].label}</p>
            <p className="text-sm text-muted-foreground">
              {profile.plan === "agency"
                ? t("billing.unlimited")
                : t("billing.totalCredits", { n: profile.build_credits + profile.rollover_build_credits + profile.top_up_build_credits })}
            </p>
            {profile.top_up_build_credits > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Includes {profile.top_up_build_credits} top-up credits
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
          const p = PLAN_LIMITS[key];
          const current = profile.plan === key;
          const price = interval === "annual" && p.price > 0 ? annualPrice(p.price) : p.price;
          return (
            <div key={key} className={`rounded-lg border bg-card p-5 ${current ? "border-primary" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.label}</h3>
                {current && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{t("billing.current_chip")}</span>
                )}
              </div>
              <p className="mt-2 text-2xl font-bold">
                ${price}
                {p.price > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                )}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {p.build === -1 ? "Unlimited build credits" : `${p.build} build credits/mo`}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {p.runtime.toLocaleString()} runtime credits
                </li>
              </ul>
              <Button
                className="mt-4 w-full"
                variant={current ? "outline" : "default"}
                disabled={current || busyTier !== null || key === "free"}
                onClick={() => upgrade(key)}
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

      <p className="mt-6 text-center text-xs text-muted-foreground">
        First-time setup: click <strong>Sync Stripe products</strong> above to create all plans &amp; packs in your Stripe account.
        After that, configure the webhook endpoint in Stripe pointing at <code className="rounded bg-muted px-1">/functions/v1/stripe-webhook</code>{" "}
        and paste the signing secret as <code className="rounded bg-muted px-1">STRIPE_WEBHOOK_SECRET</code>.
        <br />
        <Link to="/app" className="underline">Back to dashboard</Link>
      </p>

      <TopUpModal open={topupOpen} onOpenChange={setTopupOpen} />

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
