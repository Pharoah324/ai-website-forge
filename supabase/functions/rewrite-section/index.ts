import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TOOL = {
  type: "function" as const,
  function: {
    name: "rewrite_variations",
    description: "Return 3 rewritten variations of a website section.",
    parameters: {
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
  },
};

const RL = new Map<string, number[]>();
const LIMIT = 30;
const WINDOW_MS = 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
      return new Response(
        JSON.stringify({ error: "Rewrite limit reached. Try again in an hour." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    hits.push(now);
    RL.set(uid, hits);

    const { section, business_context } = await req.json();
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

    let voiceAddon = "";
    if (profile?.brand_voice_active) {
      const rules = Array.isArray(profile.voice_rules) ? profile.voice_rules : [];
      if (rules.length) {
        voiceAddon = `\n\nFollow these brand voice rules:\n- ${rules.join("\n- ")}`;
      } else if (profile.brand_voice_samples) {
        voiceAddon = `\n\nMirror the tone of these samples:\n${String(profile.brand_voice_samples).slice(0, 1500)}`;
      }
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content:
              `You rewrite a single website section. Produce 3 distinct, conversion-focused variations. Keep the same section type, similar length, and same number of items.${voiceAddon}`,
          },
          {
            role: "user",
            content: `Business context: ${business_context || "(general)"}\n\nOriginal section JSON:\n${JSON.stringify(section)}\n\nReturn 3 variations via the rewrite_variations tool.`,
          },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "rewrite_variations" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("lovable ai", aiResp.status, t);
      const status = aiResp.status === 429 ? 429 : aiResp.status === 402 ? 402 : 500;
      const msg = aiResp.status === 402
        ? "Lovable AI credits exhausted. Add funds in Settings → Workspace → Usage."
        : "AI provider error";
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await aiResp.json();
    const argStr = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let variations: unknown[] = [];
    if (argStr) {
      try { variations = JSON.parse(argStr).variations ?? []; } catch { /* noop */ }
    }
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
