// In-app cancel / resume for an existing subscriber (Blocker #2).
// Cancel is "at period end": we set cancel_at_period_end on the ONE subscription
// (no immediate cancel, no proration/refund). The user keeps their paid plan
// until the period ends; the stripe-webhook customer.subscription.deleted handler
// then drops them to free and caps credits. Resume clears the pending cancel.
//
// Body: { action: 'cancel' | 'resume' }
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { action = "cancel" } = await req.json();
    if (action !== "cancel" && action !== "resume") return json({ error: "Invalid action" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.stripe_subscription_id) {
      return json({ error: "no_active_subscription", message: "No active subscription to cancel." }, 409);
    }

    const sub = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: action === "cancel",
    });

    // current_period_end is top-level in older API versions, on the item in newer.
    const cpe = sub.current_period_end ?? (sub as any).items?.data?.[0]?.current_period_end ?? null;

    // Reflect immediately so the UI updates without waiting for the webhook.
    await admin.from("profiles").update({
      cancel_at_period_end: sub.cancel_at_period_end ?? (action === "cancel"),
      current_period_end: cpe ? new Date(cpe * 1000).toISOString() : null,
    }).eq("id", user.id);

    return json({
      ok: true,
      action,
      cancel_at_period_end: sub.cancel_at_period_end ?? (action === "cancel"),
      current_period_end: cpe,
    });
  } catch (err: any) {
    console.error("cancel-subscription error", err);
    return json({ error: err.message ?? "cancel-subscription failed" }, 500);
  }
});
