import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are refining an existing website based on the user's instruction.
Rules for refinement:
- Only change what the user asked to change
- Keep everything else exactly the same
- If instruction is vague interpret it generously and make the most likely desired improvement
- Always return the COMPLETE updated site JSON via the build_site tool, not just changed parts
- Provide a short plain-English "summary" field describing exactly what changed
- Never start from scratch unless the user explicitly asks to start over
- Preserve the original language of the site unless asked to translate
- Color values must be raw HSL triples like "221 83% 53%" (no hsl() wrapper, no commas)`;

const TOOL = {
  type: "function" as const,
  function: {
    name: "build_site",
    description: "Return the complete refined site definition plus a short change summary.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Brief plain-English description of what changed." },
        name: { type: "string" },
        tagline: { type: "string" },
        lang: { type: "string" },
        dir: { type: "string", enum: ["ltr", "rtl"] },
        theme: {
          type: "object",
          properties: {
            primary: { type: "string" },
            background: { type: "string" },
            foreground: { type: "string" },
            accent: { type: "string" },
          },
          required: ["primary", "background", "foreground", "accent"],
        },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["hero","features","about","testimonials","pricing","faq","cta","contact"] },
              heading: { type: "string" },
              subheading: { type: "string" },
              cta: { type: "string" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    body: { type: "string" },
                    price: { type: "string" },
                    author: { type: "string" },
                  },
                  required: ["title"],
                },
              },
            },
            required: ["type","heading"],
          },
        },
      },
      required: ["summary","name","tagline","theme","sections"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: ud } = await supabase.auth.getUser();
    const user = ud?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const siteId: string = body.site_id;
    const message: string = (body.message || "").toString().slice(0, 2000);
    if (!siteId || !message.trim()) return json({ error: "site_id and message required" }, 400);

    // Load site (RLS enforces ownership)
    const { data: site, error: sErr } = await supabase
      .from("sites").select("id,user_id,content,name,workspace_id").eq("id", siteId).single();
    if (sErr || !site) return json({ error: "Site not found" }, 404);

    // Resolve brand voice: workspace voice (if active) overrides personal voice.
    const adminEarly = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: prof } = await adminEarly
      .from("profiles")
      .select("brand_voice_active, voice_rules, brand_voice_samples")
      .eq("id", user.id)
      .maybeSingle();
    let vActive = !!prof?.brand_voice_active;
    let vRules: unknown = prof?.voice_rules;
    let vSamples: string | null = prof?.brand_voice_samples ?? null;
    if (site.workspace_id) {
      const { data: ws } = await adminEarly
        .from("agency_workspaces")
        .select("brand_voice_active, voice_rules, brand_voice_samples")
        .eq("id", site.workspace_id)
        .maybeSingle();
      if (ws?.brand_voice_active) {
        vActive = true; vRules = ws.voice_rules; vSamples = ws.brand_voice_samples;
      }
    }
    let voiceAddon = "";
    if (vActive) {
      const rules = Array.isArray(vRules) ? vRules : null;
      if (rules && rules.length) {
        voiceAddon = `\n\nFollow this brand voice. Rules:\n- ${rules.join("\n- ")}`;
      } else if (vSamples) {
        voiceAddon = `\n\nMirror the tone of these samples:\n${String(vSamples).slice(0, 1500)}`;
      }
    }

    // Load chat history
    const { data: history } = await supabase
      .from("site_chat_messages")
      .select("role,content,summary")
      .eq("site_id", siteId)
      .order("created_at", { ascending: true })
      .limit(40);

    // Gate + consume 1 build credit (admins bypass automatically)
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: gate, error: gErr } = await admin.rpc("check_and_consume", {
      _uid: user.id, _action: "site_generation", _credit_cost: 1,
    });
    if (gErr) return json({ error: "Internal gate error" }, 500);
    const g = gate as { ok: boolean; reason?: string; admin_bypass?: boolean };
    if (!g.ok) {
      const status = g.reason === "no_credits" ? 402
        : g.reason === "daily_limit" || g.reason === "hourly_limit" || g.reason === "blocked" ? 429
        : 403;
      return json({ error: g.reason || "blocked" }, status);
    }

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "system",
        content: `Current site JSON:\n${JSON.stringify(site.content).slice(0, 12000)}`,
      },
      ...(history || []).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.role === "assistant" && m.summary ? m.summary : m.content,
      })),
      { role: "user", content: message },
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "build_site" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return json({ error: "Rate limited" }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits exhausted" }, 402);
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return json({ error: "AI provider error" }, 500);
    }

    const data = await aiResp.json();
    const argStr = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argStr) return json({ error: "AI returned no result" }, 500);
    let parsed: any;
    try { parsed = JSON.parse(argStr); } catch { return json({ error: "Invalid AI JSON" }, 500); }

    const summary: string = parsed.summary || "Updated the site.";
    const updatedContent = { ...parsed };
    delete updatedContent.summary;

    // Persist user message
    await supabase.from("site_chat_messages").insert({
      site_id: siteId, user_id: user.id, role: "user", content: message, credits_used: 0,
    });

    // Snapshot new version
    const { data: maxV } = await admin
      .from("site_versions").select("version_number")
      .eq("site_id", siteId).order("version_number", { ascending: false }).limit(1).maybeSingle();
    const nextVersion = (maxV?.version_number || 0) + 1;
    const { data: ver } = await admin.from("site_versions").insert({
      site_id: siteId, user_id: user.id, version_number: nextVersion,
      label: summary.slice(0, 80), content: updatedContent,
    }).select("id").single();

    // Update site
    await supabase.from("sites").update({ content: updatedContent }).eq("id", siteId);

    // Persist assistant message
    await supabase.from("site_chat_messages").insert({
      site_id: siteId, user_id: user.id, role: "assistant",
      content: summary, summary, credits_used: 1, version_id: ver?.id,
    });

    return json({ ok: true, content: updatedContent, summary, version_id: ver?.id, version_number: nextVersion });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    console.error("refine-site error", msg);
    return json({ error: msg }, 500);
  }
});

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
