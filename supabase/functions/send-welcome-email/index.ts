// Welcome email — sent once per user after first sign-in.
// Uses Resend. Fails silently if RESEND_API_KEY missing or send fails.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Update FROM_EMAIL once a verified Resend domain is configured.
// Until then, Resend's onboarding sender works for testing.
const FROM_EMAIL = Deno.env.get("WELCOME_FROM_EMAIL") ??
  "Virtual Engine Builder <onboarding@resend.dev>";
const APP_URL = Deno.env.get("APP_PUBLIC_URL") ?? "https://virtualengine.ai";

function html(name: string) {
  const safe = name.replace(/[<>&"']/g, "");
  return `<!doctype html>
<html><body style="margin:0;background:#ffffff;font-family:Inter,Arial,sans-serif;color:#0a1a0f;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="background:linear-gradient(135deg,#0A1A0F,#0d2417);color:#fff;border-radius:14px;padding:28px;">
      <h1 style="margin:0 0 8px;font-size:24px;">Welcome${safe ? ", " + safe : ""} 👋</h1>
      <p style="margin:0;color:#a7f3d0;">Your AI website builder, backed by Virtual Engine.</p>
    </div>
    <div style="padding:24px 4px;">
      <p style="font-size:16px;line-height:1.55;margin:0 0 16px;">
        You're in. Here's how to get the most out of Virtual Engine Builder:
      </p>
      <ul style="padding-left:20px;line-height:1.7;font-size:15px;">
        <li>Describe your business and we'll generate a complete site in ~60 seconds.</li>
        <li>Refine copy, layout, and SEO with the live AI editor.</li>
        <li>Publish to your own subdomain or push to GitHub.</li>
      </ul>
      <p style="margin:28px 0 8px;">
        <a href="${APP_URL}" style="display:inline-block;background:#10B981;color:#0A1A0F;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:10px;">
          Start building
        </a>
      </p>
      <p style="font-size:12px;color:#6b7a72;margin-top:32px;">
        A Virtual Engine product · <a style="color:#6b7a72;" href="https://virtualengine.ai">virtualengine.ai</a>
      </p>
    </div>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userRes.user;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: profile } = await admin
      .from("profiles")
      .select("email, display_name, welcome_email_sent_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.welcome_email_sent_at) {
      return new Response(JSON.stringify({ skipped: "already_sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const to = profile?.email ?? user.email;
    const name =
      profile?.display_name ??
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      "";

    if (!to) {
      return new Response(JSON.stringify({ skipped: "no_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY missing — skipping welcome email");
      return new Response(JSON.stringify({ skipped: "no_api_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject: "Welcome to Virtual Engine Builder",
          html: html(name),
        }),
      });
      if (!r.ok) {
        const body = await r.text();
        console.error("Resend send failed", r.status, body);
        return new Response(JSON.stringify({ error: "send_failed", status: r.status }), {
          status: 200, // do not block client
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (e) {
      console.error("Resend network error", e);
      return new Response(JSON.stringify({ error: "network" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark sent (only if column exists; ignore errors if migration hasn't run yet).
    await admin
      .from("profiles")
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq("id", user.id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("welcome email handler error", e);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
