import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logAiCallBg } from "../_shared/aiLog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TOOL = {
  name: "rewrite_variations",
  description: "Return 3 rewritten variations of a website section.",
  input_schema: {
    type: "object",
    properties: {
      variations: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
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
              },
            },
          },
          required: ["heading"],
        },
      },
    },
    required: ["variations"],
  },
};

const RL = new Map<string, number[]>();
const LIMIT = 30;
const WINDOW_MS = 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const startedAt = Date.now();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uid = userData.user.id;
    const now = Date.now();
    const hits = (RL.get(uid) || []).filter((t) => now - t < WINDOW_MS);
    if (hits.length >= LIMIT) {
      logAiCallBg({ fn: "rewrite-section", userId: uid, siteId: null, model: "claude-sonnet-4-5-20250929", durationMs: Date.now() - startedAt, success: false, errorMessage: "rate_limited", tokensIn: 0, tokensOut: 0, meta: { http_status: 429, limit_hit_reason: "rate_limited" } });
      return new Response(
        JSON.stringify({ error: "Rewrite limit reached. Try again in an hour." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    hits.push(now);
    RL.set(uid, hits);

    const { section, business_context, site_id } = await req.json();
    if (!section || typeof section !== "object") {
      return new Response(JSON.stringify({ error: "section required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("brand_voice_active, voice_rules, brand_voice_samples")
      .eq("id", uid)
      .single();

    let vActive = !!profile?.brand_voice_active;
    let vRules: unknown = profile?.voice_rules;
    let vSamples: string | null = profile?.brand_voice_samples ?? null;
    if (site_id) {
      const { data: siteRow } = await supabase
        .from("sites").select("workspace_id").eq("id", site_id).maybeSingle();
      if (siteRow?.workspace_id) {
        const { data: ws } = await supabase
          .from("agency_workspaces")
          .select("brand_voice_active, voice_rules, brand_voice_samples")
          .eq("id", siteRow.workspace_id)
          .maybeSingle();
        if (ws?.brand_voice_active) {
          vActive = true; vRules = ws.voice_rules; vSamples = ws.brand_voice_samples;
        }
      }
    }
    let voiceAddon = "";
    if (vActive) {
      const rules = Array.isArray(vRules) ? vRules : [];
      if (rules.length) {
        voiceAddon = `\n\nFollow these brand voice rules:\n- ${rules.join("\n- ")}`;
      } else if (vSamples) {
        voiceAddon = `\n\nMirror the tone of these samples:\n${String(vSamples).slice(0, 1500)}`;
      }
    }

    const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: `You rewrite a single website section. Produce 3 distinct, conversion-focused variations. Keep the same section type, similar length, and same number of items.${voiceAddon}`,
        messages: [
          {
            role: "user",
            content: `Business context: ${business_context || "(general)"}\n\nOriginal section JSON:\n${JSON.stringify(section)}\n\nReturn 3 variations via the rewrite_variations tool.`,
          },
        ],
        tools: [TOOL],
        tool_choice: { type: "tool", name: "rewrite_variations" },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("anthropic", aiResp.status, t);
      const status = aiResp.status === 429 ? 429 : 500;
      return new Response(JSON.stringify({ error: "AI provider error" }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await aiResp.json();
    const toolBlock = Array.isArray(data.content)
      ? data.content.find((b: { type?: string }) => b?.type === "tool_use")
      : null;
    let variations: unknown[] = [];
    if (toolBlock?.input) {
      variations = (toolBlock.input as { variations?: unknown[] }).variations ?? [];
    }
    logAiCallBg({ fn: "rewrite-section", userId: uid, siteId: site_id ?? null, model: "claude-sonnet-4-5-20250929", tokensIn: data?.usage?.input_tokens ?? null, tokensOut: data?.usage?.output_tokens ?? null, durationMs: Date.now() - startedAt, success: true });
    return new Response(JSON.stringify({ variations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
