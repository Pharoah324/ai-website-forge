// Stripe webhook handler — full lifecycle: subscriptions, invoices, grace period, disputes.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Build / runtime monthly grants per plan, and which plans get build-credit rollover.
// Runtime credits NEVER roll over on any plan. Rollover capped at one full month.
const PLAN_LIMITS: Record<string, { build: number; runtime: number; rollover: boolean }> = {
  free:    { build: 20,   runtime: 300,    rollover: false },
  starter: { build: 100,  runtime: 2500,   rollover: false },
  builder: { build: 300,  runtime: 10000,  rollover: true },
  pro:     { build: 800,  runtime: 30000,  rollover: true },
  agency:  { build: 2000, runtime: 100000, rollover: true },
};

const GRACE_PERIOD_DAYS = 3;

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
  } catch (err) {
    const msg = err instanceof Error ? err.message : "verify failed";
    console.error("Signature verification failed:", msg);
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  // Idempotency
  const { error: dupErr } = await admin
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });
  if (dupErr) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Resolve a profile by stripe customer id
  const findProfileByCustomer = async (customerId: string) => {
    const { data } = await admin
      .from("profiles")
      .select("id, email, plan, scheduled_plan, billing_status, monthly_build_limit, monthly_runtime_limit, build_credits, runtime_credits")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    return data;
  };

  const logAlert = async (
    alert_type: string,
    severity: "critical" | "warning" | "info",
    description: string,
    affected_user_id: string | null,
    affected_user_email: string | null,
    metadata: Record<string, unknown> = {},
  ) => {
    await admin.from("admin_alerts").insert({
      alert_type, severity, description,
      affected_user_id, affected_user_email,
      metadata,
    });
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        if (session.mode === "payment") {
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
                .eq("id", userId).single();
              await admin.from("profiles").update({
                top_up_build_credits: (prof?.top_up_build_credits ?? 0) + pack.build_credits,
                top_up_runtime_credits: (prof?.top_up_runtime_credits ?? 0) + pack.runtime_credits,
              }).eq("id", userId);
              await admin.from("credit_ledger").insert({
                user_id: userId, kind: "build", amount: pack.build_credits,
                reason: "topup", description: `Top-up pack: ${packId}`,
              });
            }
          }
        } else if (session.mode === "subscription") {
          const planTier = session.metadata?.plan_tier;
          const interval = session.metadata?.interval ?? "monthly";
          const limits = PLAN_LIMITS[planTier ?? "free"];
          if (planTier && limits) {
            await admin.from("profiles").update({
              plan: planTier,
              billing_interval: interval,
              stripe_subscription_id: session.subscription as string,
              stripe_customer_id: session.customer as string,
              subscription_status: "active",
              billing_status: "active",
              payment_failed_at: null,
              grace_period_ends_at: null,
              plan_before_downgrade: null,
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

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const update: Record<string, unknown> = {
          subscription_status: sub.status,
          stripe_subscription_id: sub.id,
        };
        // If Stripe says status active and we'd been past_due, recover.
        if (sub.status === "active") {
          update.billing_status = "active";
          update.payment_failed_at = null;
          update.grace_period_ends_at = null;
        } else if (sub.status === "past_due" || sub.status === "unpaid") {
          update.billing_status = "past_due";
        } else if (sub.status === "paused") {
          update.billing_status = "paused";
        } else if (sub.status === "canceled") {
          update.billing_status = "canceled";
        }
        await admin.from("profiles").update(update).eq("stripe_customer_id", customerId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const prof = await findProfileByCustomer(customerId);
        await admin.from("profiles").update({
          subscription_status: "canceled",
          billing_status: "canceled",
          plan: "free",
          monthly_build_limit: PLAN_LIMITS.free.build,
          monthly_runtime_limit: PLAN_LIMITS.free.runtime,
          plan_before_downgrade: prof?.plan ?? null,
        }).eq("stripe_customer_id", customerId);
        if (prof) {
          await logAlert("subscription_canceled", "info",
            `Subscription canceled — downgraded to free.`,
            prof.id, prof.email, { previous_plan: prof.plan });
        }
        break;
      }

      case "customer.subscription.paused": {
        const sub = event.data.object as Stripe.Subscription;
        await admin.from("profiles").update({
          subscription_status: "paused",
          billing_status: "paused",
        }).eq("stripe_customer_id", sub.customer as string);
        break;
      }

      case "customer.subscription.resumed": {
        const sub = event.data.object as Stripe.Subscription;
        await admin.from("profiles").update({
          subscription_status: sub.status,
          billing_status: "active",
          payment_failed_at: null,
          grace_period_ends_at: null,
        }).eq("stripe_customer_id", sub.customer as string);
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const prof = await findProfileByCustomer(customerId);
        if (!prof) break;

        // Always clear past_due on successful payment
        const baseUpdate: Record<string, unknown> = {
          billing_status: "active",
          payment_failed_at: null,
          grace_period_ends_at: null,
          last_invoice_id: invoice.id,
        };

        if (invoice.billing_reason === "subscription_cycle") {
          // Renewal — refresh credits.
          //
          // Deferred downgrade: if scheduled_plan is set, this cycle is the one
          // where the downgrade takes effect. The plan/limits/rollover for this
          // renewal MUST use the DESTINATION tier (not the origin) — so e.g. a
          // Builder->Starter downgrade rolls over using Starter's rule (none),
          // and no rollover credits leak into a non-rollover tier.
          const effectivePlan = (prof.scheduled_plan ?? prof.plan ?? "free") as string;
          const planCfg = PLAN_LIMITS[effectivePlan] ?? PLAN_LIMITS.free;
          const monthlyBuild = planCfg.build;       // destination-tier monthly grant
          const monthlyRuntime = planCfg.runtime;

          // Rollover: BUILD credits only, 50% of unused, only on rollover tiers,
          // capped at one full (destination) month. Runtime never rolls over.
          const buildUnused = Math.max(0, prof.build_credits ?? 0);
          let buildRollover = 0;
          if (planCfg.rollover) {
            buildRollover = Math.min(
              monthlyBuild,                          // ≤ one full (destination) month
              Math.floor(buildUnused / 2),           // 50% of unused
            );
          }
          Object.assign(baseUpdate, {
            build_credits: monthlyBuild + buildRollover,
            runtime_credits: monthlyRuntime,
            rollover_build_credits: buildRollover,
            rollover_runtime_credits: 0,
            billing_cycle_start: new Date().toISOString(),
          });
          // If a downgrade was pending, commit the plan switch now and clear it.
          if (prof.scheduled_plan) {
            Object.assign(baseUpdate, {
              plan: effectivePlan,
              monthly_build_limit: monthlyBuild,
              monthly_runtime_limit: monthlyRuntime,
              scheduled_plan: null,
            });
          }
        }
        await admin.from("profiles").update(baseUpdate).eq("id", prof.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const prof = await findProfileByCustomer(customerId);
        if (!prof) break;

        // Set grace period only on first failure (don't keep extending it)
        const { data: existing } = await admin
          .from("profiles")
          .select("payment_failed_at, grace_period_ends_at")
          .eq("id", prof.id).single();

        const update: Record<string, unknown> = {
          billing_status: "past_due",
          last_invoice_id: invoice.id,
        };
        if (!existing?.payment_failed_at) {
          const failedAt = new Date();
          const graceEnd = new Date(failedAt.getTime() + GRACE_PERIOD_DAYS * 86400_000);
          update.payment_failed_at = failedAt.toISOString();
          update.grace_period_ends_at = graceEnd.toISOString();
        }
        await admin.from("profiles").update(update).eq("id", prof.id);

        await logAlert("payment_failed", "warning",
          `Payment failed for ${prof.email}. ${GRACE_PERIOD_DAYS}-day grace period started. Amount: ${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency?.toUpperCase()}.`,
          prof.id, prof.email,
          { invoice_id: invoice.id, amount_due: invoice.amount_due, currency: invoice.currency });
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const customerId = (dispute.charge && typeof dispute.charge === "string"
          ? (await stripe.charges.retrieve(dispute.charge)).customer
          : null) as string | null;
        let prof = customerId ? await findProfileByCustomer(customerId) : null;

        if (prof) {
          await admin.from("profiles").update({
            dispute_flagged: true,
            billing_status: "disputed",
          }).eq("id", prof.id);
        }

        await logAlert("dispute", "critical",
          `🚨 CHARGE DISPUTE: ${prof?.email ?? "unknown user"} disputed ${(dispute.amount / 100).toFixed(2)} ${dispute.currency.toUpperCase()}. Reason: ${dispute.reason}.`,
          prof?.id ?? null, prof?.email ?? null,
          {
            dispute_id: dispute.id,
            amount: dispute.amount,
            currency: dispute.currency,
            reason: dispute.reason,
            status: dispute.status,
            charge_id: dispute.charge,
          });
        break;
      }

      default:
        // Unhandled — already logged in stripe_events
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "handler error";
    console.error("Webhook handler error:", msg, event.type);
    // Log handler errors as critical alerts so we don't lose them silently
    await admin.from("admin_alerts").insert({
      alert_type: "server_error",
      severity: "critical",
      description: `Stripe webhook handler error on ${event.type}: ${msg}`,
      metadata: { event_id: event.id, event_type: event.type },
    }).catch(() => {});
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
