// One-shot: creates all Stripe products + prices in test mode and writes them to stripe_products.
// Idempotent — safe to run multiple times. Skips entries that already exist.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PLANS = [
  { tier: "starter", name: "Starter", monthly: 1900, annual: 1500, build: 100, runtime: 2500 },
  { tier: "builder", name: "Builder", monthly: 4900, annual: 3900, build: 300, runtime: 12000 },
  { tier: "pro", name: "Pro", monthly: 9900, annual: 7900, build: 750, runtime: 35000 },
  { tier: "agency", name: "Agency", monthly: 19900, annual: 15900, build: 2147483647, runtime: 100000 },
];

const TOPUPS = [
  { id: "starter_boost", name: "Starter Boost", price: 900, build: 50, runtime: 1000 },
  { id: "growth_pack", name: "Growth Pack", price: 2400, build: 150, runtime: 5000 },
  { id: "agency_burst", name: "Agency Burst", price: 6900, build: 500, runtime: 20000 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: existing } = await supabase
      .from("stripe_products")
      .select("kind, plan_tier, interval, pack_id");
    const has = (k: string) => existing?.some((e) => {
      if (e.kind === "subscription") return `sub:${e.plan_tier}:${e.interval}` === k;
      return `topup:${e.pack_id}` === k;
    });

    const created: any[] = [];

    // Subscriptions
    for (const plan of PLANS) {
      for (const interval of ["monthly", "annual"] as const) {
        const key = `sub:${plan.tier}:${interval}`;
        if (has(key)) continue;
        const product = await stripe.products.create({
          name: `${plan.name} (${interval})`,
          metadata: { kind: "subscription", plan_tier: plan.tier, interval },
        });
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: interval === "monthly" ? plan.monthly : plan.annual,
          currency: "usd",
          recurring: { interval: interval === "monthly" ? "month" : "year" },
        });
        await supabase.from("stripe_products").insert({
          kind: "subscription",
          plan_tier: plan.tier,
          interval,
          stripe_product_id: product.id,
          stripe_price_id: price.id,
          amount_cents: price.unit_amount!,
          build_credits: plan.build,
          runtime_credits: plan.runtime,
        });
        created.push(key);
      }
    }

    // Top-ups
    for (const t of TOPUPS) {
      const key = `topup:${t.id}`;
      if (has(key)) continue;
      const product = await stripe.products.create({
        name: t.name,
        metadata: { kind: "topup", pack_id: t.id },
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: t.price,
        currency: "usd",
      });
      await supabase.from("stripe_products").insert({
        kind: "topup",
        pack_id: t.id,
        stripe_product_id: product.id,
        stripe_price_id: price.id,
        amount_cents: price.unit_amount!,
        build_credits: t.build,
        runtime_credits: t.runtime,
      });
      created.push(key);
    }

    return new Response(JSON.stringify({ ok: true, created, skipped_existing: existing?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("setup-stripe-products error", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
