import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function refreshIfNeeded(admin: any, integration: any) {
  const expiresAt = integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : 0;
  if (expiresAt > Date.now() + 30_000) return integration;

  const clientId = Deno.env.get("GHL_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GHL_CLIENT_SECRET")!;
  const r = await fetch("https://services.leadconnectorhq.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
    body: new URLSearchParams({
      client_id: clientId, client_secret: clientSecret,
      grant_type: "refresh_token", refresh_token: integration.refresh_token, user_type: "Location",
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error("Refresh failed: " + JSON.stringify(j));

  const expires = new Date(Date.now() + ((j.expires_in ?? 3600) - 60) * 1000).toISOString();
  await admin.from("integrations").update({
    access_token: j.access_token,
    refresh_token: j.refresh_token ?? integration.refresh_token,
    token_expires_at: expires,
  }).eq("id", integration.id);
  return { ...integration, access_token: j.access_token, token_expires_at: expires };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: integration, error } = await admin.from("integrations")
      .select("*").eq("user_id", userId).eq("platform", "gohighlevel").maybeSingle();

    if (error) throw error;
    if (!integration) {
      return new Response(JSON.stringify({ error: "Not connected" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fresh = await refreshIfNeeded(admin, integration);

    const r = await fetch(`https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${fresh.location_id}`, {
      headers: {
        "Authorization": `Bearer ${fresh.access_token}`,
        "Version": "2021-07-28",
        "Accept": "application/json",
      },
    });
    const j = await r.json();
    if (!r.ok) {
      return new Response(JSON.stringify({ error: "GHL API error", details: j }), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ pipelines: j.pipelines ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
