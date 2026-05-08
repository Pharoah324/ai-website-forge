// Creates a Stripe webhook endpoint pointing at our stripe-webhook function
// and returns the whsec_ signing secret so the user can paste it as STRIPE_WEBHOOK_SECRET.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENABLED_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/stripe-webhook`;

    // If a webhook for this URL already exists, return it (idempotent-ish).
    // Note: Stripe only returns the signing secret on creation, so existing
    // endpoints will not include `secret`. The user must create a new one
    // (or roll the secret in the dashboard) to retrieve it.
    const existing = await stripe.webhookEndpoints.list({ limit: 100 });
    const match = existing.data.find((e) => e.url === url);
    if (match) {
      if (typeof stripe.webhookEndpoints.rotateSecret === "function") {
        const rotated = await (stripe.webhookEndpoints as any).rotateSecret(match.id);
        return new Response(
          JSON.stringify({
            alreadyExists: true,
            webhookId: match.id,
            url: match.url,
            webhookSecret: rotated.secret,
            message:
              "A webhook for this URL already exists. The signing secret was rotated and returned so you can update STRIPE_WEBHOOK_SECRET.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          alreadyExists: true,
          webhookId: match.id,
          url: match.url,
          message:
            "A webhook for this URL already exists. Stripe only returns the signing secret at creation time. Delete it in the Stripe dashboard and re-run, or rotate its secret to retrieve a new whsec_.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const endpoint = await stripe.webhookEndpoints.create({
      url,
      enabled_events: ENABLED_EVENTS,
      description: "Virtual Engine Builder — auto-created",
    });

    return new Response(
      JSON.stringify({
        webhookId: endpoint.id,
        url: endpoint.url,
        webhookSecret: endpoint.secret, // whsec_...
        enabledEvents: endpoint.enabled_events,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("setup-stripe-webhook error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
