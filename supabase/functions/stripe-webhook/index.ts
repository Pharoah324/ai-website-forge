// Stripe webhook handler — verifies signature, dedupes events, applies credit/plan changes.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const PLAN_LIMITS: Record<string, { build: number; runtime: number }> = {
  free: { build: 20, runtime: 300 },
  starter: { build: 100, runtime: 2500 },
  builder: { build: 300, runtime: 12000 },
  pro: { build: 750, runtime: 35000 },
  agency: { build: 2147483647, runtime: 100000 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const sig = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!sig || !webhookSecret) {
    return new Response("Missing signature/secret", { status: 400 });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  });
  const cryptoProvider = Stripe.createSubtleCryptoProvider();
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, webhookSecret, undefined, cryptoProvider);
  } catch (err: any) {
    console.error("Signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Idempotency
  const { error: dupErr } = await admin
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });
  if (dupErr) {
    // already processed
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        if (session.mode === "payment") {
          // Top-up — add to top_up_* columns
          const packId = session.metadata?.pack_id;
          if (packId) {
            const { data: pack } = await admin
              .from("stripe_products")
              .select("build_credits, runtime_credits")
              .eq("kind", "topup")
              .eq("pack_id", packId)
              .maybeSingle();
            if (pack) {
              const { data: prof } = await admin
                .from("profiles")
                .select("top_up_build_credits, top_up_runtime_credits")
                .eq("id", userId)
                .single();
              await admin.from("profiles").update({
                top_up_build_credits: (prof?.top_up_build_credits ?? 0) + pack.build_credits,
                top_up_runtime_credits: (prof?.top_up_runtime_credits ?? 0) + pack.runtime_credits,
              }).eq("id", userId);
              await admin.from("credit_ledger").insert({
                user_id: userId,
                kind: "build",
                amount: pack.build_credits,
                reason: "topup",
                description: `Top-up pack: ${packId}`,
              });
            }
          }
        } else if (session.mode === "subscription") {
          // Subscription created/upgraded — set plan and reset monthly credits
          const planTier = session.metadata?.plan_tier;
          const interval = session.metadata?.interval ?? "monthly";
          const limits = PLAN_LIMITS[planTier ?? "free"];
          if (planTier && limits) {
            await admin.from("profiles").update({
              plan: planTier,
              billing_interval: interval,
              stripe_subscription_id: session.subscription as string,
              subscription_status: "active",
              monthly_build_limit: limits.build,
              monthly_runtime_limit: limits.runtime,
              build_credits: limits.build,
              runtime_credits: limits.runtime,
              billing_cycle_start: new Date().toISOString(),
            }).eq("id", userId);
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;
        const update: Record<string, any> = { subscription_status: status };
        if (event.type === "customer.subscription.deleted") {
          update.plan = "free";
          update.monthly_build_limit = PLAN_LIMITS.free.build;
          update.monthly_runtime_limit = PLAN_LIMITS.free.runtime;
        }
        await admin.from("profiles").update(update).eq("stripe_customer_id", customerId);
        break;
      }

      case "invoice.paid": {
        // Recurring renewal — refresh monthly credits, run rollover
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason !== "subscription_cycle") break;
        const customerId = invoice.customer as string;
        const { data: prof } = await admin
          .from("profiles")
          .select("id, build_credits, runtime_credits, monthly_build_limit, monthly_runtime_limit")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (!prof) break;

        const buildUnused = Math.max(0, prof.build_credits);
        const runtimeUnused = Math.max(0, prof.runtime_credits);
        const buildRollover = Math.min(prof.monthly_build_limit, Math.floor(buildUnused / 2));
        const runtimeRollover = Math.min(prof.monthly_runtime_limit, Math.floor(runtimeUnused / 2));

        await admin.from("profiles").update({
          build_credits: prof.monthly_build_limit,
          runtime_credits: prof.monthly_runtime_limit,
          rollover_build_credits: buildRollover,
          rollover_runtime_credits: runtimeRollover,
          billing_cycle_start: new Date().toISOString(),
        }).eq("id", prof.id);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
