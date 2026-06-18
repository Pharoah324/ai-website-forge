// Plan change for an EXISTING subscriber. Modifies the customer's single
// subscription via subscriptions.update — NEVER creates a new subscription.
// (New customers with no active sub go through create-checkout instead.)
//
// Body: { planTier, interval?, action: 'preview' | 'apply' }
//   - preview: returns the prorated amount charged today + new monthly price
//              (used by the frontend to require explicit confirmation before
//               an immediate upgrade charge fires). No change is made.
//   - apply:   upgrade   -> proration_behavior 'always_invoice' (charge prorated
//                           difference now) + grant new tier's full credits now.
//              downgrade -> proration_behavior 'none' (no charge now; next cycle
//                           bills the lower price) + stash scheduled_plan; the
//                           webhook renewal applies it at period end.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Must match the webhook's PLAN_LIMITS exactly.
const PLAN_LIMITS: Record<string, { build: number; runtime: number; rollover: boolean }> = {
  free:    { build: 20,   runtime: 300,    rollover: false },
  starter: { build: 100,  runtime: 2500,   rollover: false },
  builder: { build: 300,  runtime: 10000,  rollover: true },
  pro:     { build: 800,  runtime: 30000,  rollover: true },
  agency:  { build: 2000, runtime: 100000, rollover: true },
};

// Tier ordering to decide upgrade vs downgrade.
const RANK: Record<string, number> = { free: 0, starter: 1, builder: 2, pro: 3, agency: 4 };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Authn the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const user = userData.user;

    const { planTier, interval = "monthly", action = "preview" } = await req.json();

    if (!planTier || !PLAN_LIMITS[planTier]) return json({ error: "Invalid planTier" }, 400);
    if (planTier === "free") {
      // Downgrade-to-free is a cancellation (no $0 price to swap to), handled by
      // the cancel/portal flow — not here.
      return json({ error: "Use the cancel flow to move to the free plan." }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load the caller's billing state.
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_id, plan, billing_interval, scheduled_plan")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.stripe_subscription_id) {
      // No existing subscription — caller must use create-checkout to subscribe.
      return json({ error: "no_active_subscription", message: "No active subscription. Use checkout to subscribe." }, 409);
    }

    const currentTier = profile.plan ?? "free";
    const currentRank = RANK[currentTier] ?? 0;
    const targetRank = RANK[planTier] ?? 0;

    // Resolve the target Stripe price.
    const { data: priceRow, error: priceErr } = await admin
      .from("stripe_products")
      .select("stripe_price_id")
      .eq("active", true)
      .eq("kind", "subscription")
      .eq("plan_tier", planTier)
      .eq("interval", interval)
      .maybeSingle();
    if (priceErr || !priceRow) {
      return json({ error: "Price not found for target plan/interval." }, 404);
    }
    const targetPriceId = priceRow.stripe_price_id as string;

    // Retrieve the subscription to get the item we mutate + its current price.
    const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const item = sub.items.data[0];
    if (!item) return json({ error: "Subscription has no items." }, 500);

    const targetPrice = await stripe.prices.retrieve(targetPriceId);
    const newMonthlyAmount = targetPrice.unit_amount ?? 0;
    const currency = targetPrice.currency ?? "usd";

    const isUpgrade = targetRank > currentRank;
    const isSameTier = targetRank === currentRank;

    // ---- PREVIEW -----------------------------------------------------------
    if (action === "preview") {
      if (isSameTier) {
        // Selecting current tier again = offer to cancel a pending downgrade.
        return json({
          isUpgrade: false,
          sameTier: true,
          hasPendingDowngrade: !!profile.scheduled_plan,
          amount_due_today: 0,
          new_monthly_amount: newMonthlyAmount,
          currency,
        });
      }
      if (isUpgrade) {
        // Compute the exact prorated charge that would hit the card today.
        const upcoming = await stripe.invoices.retrieveUpcoming({
          customer: profile.stripe_customer_id as string,
          subscription: sub.id,
          subscription_items: [{ id: item.id, price: targetPriceId }],
          subscription_proration_behavior: "always_invoice",
        });
        return json({
          isUpgrade: true,
          amount_due_today: upcoming.amount_due, // cents, charged immediately on apply
          new_monthly_amount: newMonthlyAmount,
          currency,
        });
      }
      // Downgrade: no charge today, applies at period end.
      return json({
        isUpgrade: false,
        amount_due_today: 0,
        new_monthly_amount: newMonthlyAmount,
        currency,
        effective: "period_end",
        current_period_end: sub.current_period_end,
      });
    }

    // ---- APPLY -------------------------------------------------------------
    if (action !== "apply") return json({ error: "Invalid action" }, 400);

    // Cancel a pending downgrade: re-select the current tier while one is scheduled.
    if (isSameTier && profile.scheduled_plan) {
      const { data: curPriceRow } = await admin
        .from("stripe_products")
        .select("stripe_price_id")
        .eq("active", true).eq("kind", "subscription")
        .eq("plan_tier", currentTier).eq("interval", profile.billing_interval ?? "monthly")
        .maybeSingle();
      if (curPriceRow) {
        await stripe.subscriptions.update(sub.id, {
          items: [{ id: item.id, price: curPriceRow.stripe_price_id }],
          proration_behavior: "none",
        });
      }
      await admin.from("profiles").update({ scheduled_plan: null }).eq("id", user.id);
      return json({ ok: true, applied: "downgrade_cancelled", plan: currentTier });
    }

    if (isSameTier) return json({ error: "Already on this plan." }, 400);

    if (isUpgrade) {
      // Charge the prorated difference NOW. error_if_incomplete ensures a failed
      // charge throws here so we never grant credits without payment.
      await stripe.subscriptions.update(sub.id, {
        items: [{ id: item.id, price: targetPriceId }],
        proration_behavior: "always_invoice",
        payment_behavior: "error_if_incomplete",
      });
      const limits = PLAN_LIMITS[planTier];
      await admin.from("profiles").update({
        plan: planTier,
        billing_interval: interval,
        monthly_build_limit: limits.build,
        monthly_runtime_limit: limits.runtime,
        build_credits: limits.build,       // immediate full grant of new tier
        runtime_credits: limits.runtime,
        scheduled_plan: null,              // clear any pending downgrade
      }).eq("id", user.id);
      return json({ ok: true, applied: "immediate", plan: planTier });
    }

    // Downgrade: no charge now; next cycle bills the lower price. Keep current
    // plan + credits this cycle; webhook renewal applies scheduled_plan.
    await stripe.subscriptions.update(sub.id, {
      items: [{ id: item.id, price: targetPriceId }],
      proration_behavior: "none",
    });
    await admin.from("profiles").update({ scheduled_plan: planTier }).eq("id", user.id);
    return json({ ok: true, applied: "period_end", scheduled_plan: planTier });
  } catch (err: any) {
    console.error("change-subscription error", err);
    return json({ error: err.message ?? "change-subscription failed" }, 500);
  }
});
