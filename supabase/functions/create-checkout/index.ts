// Creates a Stripe Checkout session for either a subscription or a one-time top-up.
// Body: { kind: 'subscription' | 'topup', planTier?, interval?, packId?, returnUrl }
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Authn the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
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
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const body = await req.json();
    const { kind, planTier, interval, packId, returnUrl } = body;

    // Service-role client to read stripe_products + write profile
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Look up the price id
    const query = admin.from("stripe_products").select("stripe_price_id").eq("active", true);
    const { data: priceRow, error: priceErr } = kind === "subscription"
      ? await query.eq("kind", "subscription").eq("plan_tier", planTier).eq("interval", interval).maybeSingle()
      : await query.eq("kind", "topup").eq("pack_id", packId).maybeSingle();
    if (priceErr || !priceRow) {
      return new Response(JSON.stringify({ error: "Price not found. Run setup-stripe-products first." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get or create Stripe customer
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();
    let customerId = profile?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const origin = returnUrl ?? req.headers.get("origin") ?? "https://example.com";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: kind === "subscription" ? "subscription" : "payment",
      line_items: [{ price: priceRow.stripe_price_id, quantity: 1 }],
      success_url: `${origin}/app/billing?checkout=success`,
      cancel_url: `${origin}/app/billing?checkout=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        kind,
        plan_tier: planTier ?? "",
        interval: interval ?? "",
        pack_id: packId ?? "",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("create-checkout error", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
