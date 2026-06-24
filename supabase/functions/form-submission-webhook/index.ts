import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function refreshIfNeeded(admin: any, integration: any) {
  const expiresAt = integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : 0;
  if (expiresAt > Date.now() + 30_000) return integration;

  const r = await fetch("https://services.leadconnectorhq.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GHL_CLIENT_ID")!,
      client_secret: Deno.env.get("GHL_CLIENT_SECRET")!,
      grant_type: "refresh_token",
      refresh_token: integration.refresh_token,
      user_type: "Location",
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
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { site_id, fields } = body as { site_id?: string; fields?: Record<string, any> };
    if (!site_id || !fields || typeof fields !== "object") {
      return new Response(JSON.stringify({ error: "site_id and fields are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Look up site owner — must be a real, published site
    const { data: site, error: siteErr } = await admin.from("sites")
      .select("id, user_id, published").eq("id", site_id).maybeSingle();
    if (siteErr || !site) {
      return new Response(JSON.stringify({ error: "Site not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!site.published) {
      return new Response(JSON.stringify({ error: "Site is not published" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up owner's GHL integration
    const { data: integration, error: intErr } = await admin.from("integrations")
      .select("*").eq("user_id", site.user_id).eq("platform", "gohighlevel").maybeSingle();
    if (intErr || !integration || !integration.access_token) {
      return new Response(JSON.stringify({ error: "Owner has not connected GoHighLevel" }), {
        status: 412, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fresh = await refreshIfNeeded(admin, integration);

    // Map common form fields → GHL contact
    const f = fields as Record<string, any>;
    const fullName = (f.name || f.full_name || `${f.first_name ?? ""} ${f.last_name ?? ""}`).toString().trim();
    const [firstName, ...rest] = fullName.split(/\s+/);
    const lastName = rest.join(" ");

    const contactPayload: Record<string, any> = {
      locationId: fresh.location_id,
      firstName: f.first_name || firstName || undefined,
      lastName: f.last_name || lastName || undefined,
      email: f.email || undefined,
      phone: f.phone || undefined,
      source: f.source || "Virtual Engine Builder form",
      customFields: Object.entries(f)
        .filter(([k]) => !["name","full_name","first_name","last_name","email","phone","source"].includes(k))
        .map(([k, v]) => ({ key: k, field_value: String(v) })),
    };

    const ghlRes = await fetch("https://services.leadconnectorhq.com/contacts/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${fresh.access_token}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(contactPayload),
    });
    const ghlJson = await ghlRes.json().catch(() => ({}));

    if (!ghlRes.ok) {
      console.error("GHL contact create failed", ghlRes.status, ghlJson);
      return new Response(JSON.stringify({ error: "GHL API error", status: ghlRes.status, details: ghlJson }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contactId = ghlJson?.contact?.id ?? ghlJson?.id;

    // Optionally create an opportunity in the chosen pipeline
    if (fresh.pipeline_id && contactId) {
      try {
        // fetch first stage of pipeline
        const pipeRes = await fetch(`https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${fresh.location_id}`, {
          headers: { "Authorization": `Bearer ${fresh.access_token}`, "Version": "2021-07-28", "Accept": "application/json" },
        });
        const pipeJson = await pipeRes.json().catch(() => ({}));
        if (!pipeRes.ok) {
          console.warn("Opportunity skipped — pipelines fetch failed", pipeRes.status, pipeJson);
        }
        const pipe = (pipeJson.pipelines ?? []).find((p: any) => p.id === fresh.pipeline_id);
        const stageId = pipe?.stages?.[0]?.id;
        if (!pipe) {
          console.warn(`Opportunity skipped — pipeline not found for pipeline_id ${fresh.pipeline_id} (location ${fresh.location_id})`);
        } else if (!stageId) {
          console.warn(`Opportunity skipped — no first stage on pipeline ${fresh.pipeline_id}`);
        }
        if (stageId) {
          const oppRes = await fetch("https://services.leadconnectorhq.com/opportunities/", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${fresh.access_token}`,
              "Version": "2021-07-28",
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify({
              pipelineId: fresh.pipeline_id,
              locationId: fresh.location_id,
              pipelineStageId: stageId,
              name: fullName || f.email || "New website lead",
              status: "open",
              contactId,
            }),
          });
          const oppJson = await oppRes.json().catch(() => ({}));
          if (oppRes.ok) {
            const oppId = oppJson?.opportunity?.id ?? oppJson?.id;
            console.log(`Opportunity created ${oppId} (pipeline ${fresh.pipeline_id}, stage ${stageId}, contact ${contactId})`);
          } else if (oppRes.status === 400 && typeof oppJson?.message === "string" && oppJson.message.includes("duplicate opportunity")) {
            // Benign: contact already has an opportunity (e.g. a resubmission). Not a failure.
            console.warn(`Opportunity skipped — contact ${contactId} already has opportunity ${oppJson?.meta?.existingId} (duplicate guard)`);
          } else {
            console.error("GHL opportunity create failed", oppRes.status, oppJson);
          }
        }
      } catch (e) {
        console.warn("Opportunity create failed (non-fatal)", e);
      }
    }

    // Deduct 1 runtime credit
    const { data: profile } = await admin.from("profiles")
      .select("runtime_credits").eq("id", site.user_id).maybeSingle();
    if (profile && profile.runtime_credits > 0) {
      await admin.from("profiles")
        .update({ runtime_credits: profile.runtime_credits - 1 })
        .eq("id", site.user_id);
      await admin.from("credit_ledger").insert({
        user_id: site.user_id,
        kind: "runtime",
        reason: "generate",
        amount: -1,
        description: `Form submission → GHL contact (site ${site.id})`,
      });
    }

    return new Response(JSON.stringify({ ok: true, contactId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
