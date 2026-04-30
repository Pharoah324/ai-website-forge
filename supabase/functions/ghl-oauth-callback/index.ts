import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_ORIGIN = "https://id-preview--673536a3-867c-4ffd-9bd1-5a6b16cd2017.lovable.app";

function html(body: string, status = 200) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>GoHighLevel</title>
     <style>body{font-family:system-ui;background:#0a0f1f;color:#e8eefc;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
     .card{max-width:480px;padding:32px;background:#111a33;border:1px solid #1f2a4a;border-radius:12px;text-align:center}
     a{color:#3b82f6}</style></head><body><div class="card">${body}</div></body></html>`,
    { status, headers: { "Content-Type": "text/html" } }
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const errorParam = url.searchParams.get("error");

    if (errorParam) return html(`<h2>Connection cancelled</h2><p>${errorParam}</p><p><a href="${APP_ORIGIN}/app/integrations">Back to Integrations</a></p>`, 400);
    if (!code || !state) return html(`<h2>Missing code or state</h2>`, 400);

    let userId: string;
    try {
      const parsed = JSON.parse(atob(state));
      userId = parsed.userId;
      if (!userId) throw new Error("no userId in state");
    } catch {
      return html(`<h2>Invalid state parameter</h2>`, 400);
    }

    const clientId = Deno.env.get("GHL_CLIENT_ID");
    const clientSecret = Deno.env.get("GHL_CLIENT_SECRET");
    if (!clientId || !clientSecret) return html(`<h2>GHL credentials not configured</h2>`, 500);

    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ghl-oauth-callback`;

    const tokenRes = await fetch("https://services.leadconnectorhq.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        user_type: "Location",
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("GHL token exchange failed", tokenJson);
      return html(`<h2>Token exchange failed</h2><pre>${JSON.stringify(tokenJson, null, 2)}</pre>`, 400);
    }

    const accessToken: string = tokenJson.access_token;
    const refreshToken: string = tokenJson.refresh_token;
    const expiresIn: number = tokenJson.expires_in ?? 3600;
    const locationId: string | null = tokenJson.locationId ?? null;
    const expiresAt = new Date(Date.now() + (expiresIn - 60) * 1000).toISOString();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: upsertError } = await admin.from("integrations").upsert({
      user_id: userId,
      platform: "gohighlevel",
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: expiresAt,
      location_id: locationId,
      metadata: { scope: tokenJson.scope, companyId: tokenJson.companyId ?? null, userType: tokenJson.userType ?? null },
    }, { onConflict: "user_id,platform" });

    if (upsertError) {
      console.error("Upsert failed", upsertError);
      return html(`<h2>Failed to save connection</h2><pre>${upsertError.message}</pre>`, 500);
    }

    return html(`<h2 style="color:#3b82f6">✓ GoHighLevel connected</h2>
      <p>You can close this tab and return to your dashboard.</p>
      <p><a href="${APP_ORIGIN}/app/integrations">Back to Integrations</a></p>
      <script>setTimeout(()=>{window.close();window.location.href="${APP_ORIGIN}/app/integrations"},1500)</script>`);
  } catch (e) {
    console.error(e);
    return html(`<h2>Unexpected error</h2><pre>${(e as Error).message}</pre>`, 500);
  }
});
