import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { addProjectDomain } from "../_shared/vercel.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESERVED = new Set([
  "www", "app", "api", "admin", "builder", "dashboard", "auth", "login",
  "signup", "mail", "email", "ftp", "blog", "shop", "store", "help",
  "support", "docs", "status", "about", "contact", "static", "assets",
  "cdn", "media", "img", "images", "files", "download", "downloads",
  "test", "staging", "dev", "preview", "demo", "lovable", "supabase",
  "virtualengine", "ve",
]);

const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

function validateSubdomain(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const v = (raw || "").trim().toLowerCase();
  if (!v) return { ok: false, error: "Subdomain is required" };
  if (v.length < 3) return { ok: false, error: "Subdomain must be at least 3 characters" };
  if (v.length > 63) return { ok: false, error: "Subdomain is too long (max 63 characters)" };
  if (!SUBDOMAIN_RE.test(v)) {
    return {
      ok: false,
      error: "Use only lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.",
    };
  }
  if (RESERVED.has(v)) return { ok: false, error: "That subdomain is reserved. Please pick another." };
  return { ok: true, value: v };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { site_id, subdomain, action } = await req.json();
    if (!site_id) {
      return new Response(JSON.stringify({ error: "site_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load the site (RLS scopes to owner)
    const { data: site, error: siteErr } = await supabase
      .from("sites")
      .select("id, user_id, site_data, content, subdomain, published")
      .eq("id", site_id)
      .single();

    if (siteErr || !site) {
      return new Response(JSON.stringify({ error: "Site not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ROOT = "builder.virtualengine.ai";

    // Unpublish path
    if (action === "unpublish") {
      const { error } = await supabase
        .from("sites")
        .update({ published: false })
        .eq("id", site_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, published: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine subdomain to use: provided value, or existing one
    const desired = subdomain ?? site.subdomain;
    const v = validateSubdomain(desired ?? "");
    if (!v.ok) {
      return new Response(JSON.stringify({ error: v.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!(site.site_data ?? site.content)) {
      return new Response(JSON.stringify({ error: "Generate site content before publishing." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Uniqueness check (case-insensitive)
    const { data: clash } = await supabase
      .from("sites")
      .select("id")
      .ilike("subdomain", v.value)
      .neq("id", site_id)
      .maybeSingle();
    if (clash) {
      return new Response(JSON.stringify({ error: "That subdomain is taken." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updErr } = await supabase
      .from("sites")
      .update({
        subdomain: v.value,
        published: true,
        published_url: `https://${v.value}.${ROOT}`,
        published_at: new Date().toISOString(),
      })
      .eq("id", site_id);

    if (updErr) {
      const msg = updErr.message?.includes("subdomain")
        ? "That subdomain is taken."
        : updErr.message;
      return new Response(JSON.stringify({ error: msg }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Option B SSL: register this specific subdomain on the Vercel project so it
    // auto-verifies against the wildcard CNAME and gets a per-host cert. The site
    // row is already published above; domain provisioning is reported separately so
    // the UI can flag "saved, but domain pending/failed" without falsely reporting
    // success. Logging + bounded retry + idempotency live in the vercel client.
    const fullDomain = `${v.value}.${ROOT}`;
    const domainResult = await addProjectDomain(fullDomain);

    return new Response(
      JSON.stringify({
        ok: true,
        published: true,
        subdomain: v.value,
        url: `https://${v.value}.${ROOT}`,
        domain: {
          name: fullDomain,
          registered: domainResult.ok,
          alreadyExists: domainResult.alreadyExists ?? false,
          status: domainResult.status,
          ...(domainResult.ok ? {} : { error: domainResult.body?.error?.message ?? "Domain registration failed" }),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
