import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TOOL = {
  type: "function" as const,
  function: {
    name: "voice_rules",
    description: "Return 5 specific brand-voice rules describing the writer's style.",
    parameters: {
      type: "object",
      properties: {
        voice_rules: {
          type: "array",
          minItems: 5,
          maxItems: 5,
          items: { type: "string" },
        },
      },
      required: ["voice_rules"],
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

    const { samples, workspace_id } = await req.json();
    const text = String(samples || "").slice(0, 8000);
    if (!text.trim()) {
      return new Response(JSON.stringify({ error: "Provide writing samples" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
              "Analyze the writing samples and describe the writer's style in exactly 5 specific, actionable rules. Examples: 'Uses short sentences', 'Friendly and casual tone', 'Uses you and we a lot', 'Avoids corporate jargon', 'Ends with action-oriented sentences'. Return via the voice_rules tool.",
          },
          { role: "user", content: `Writing samples:\n\n${text}` },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "voice_rules" } },
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
    let rules: string[] = [];
    if (argStr) {
      try { rules = JSON.parse(argStr).voice_rules ?? []; } catch { /* noop */ }
    }
    if (!rules.length) {
      return new Response(JSON.stringify({ error: "Could not extract voice rules" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (workspace_id) {
      // RLS ensures only the agency owner can update this row.
      const { error: wsErr } = await supabase
        .from("agency_workspaces")
        .update({
          voice_rules: rules,
          brand_voice_samples: text,
          brand_voice_active: true,
        })
        .eq("id", workspace_id);
      if (wsErr) {
        return new Response(JSON.stringify({ error: wsErr.message }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      await supabase
        .from("profiles")
        .update({
          voice_rules: rules,
          brand_voice_samples: text,
          brand_voice_active: true,
        })
        .eq("id", userData.user.id);
    }

    return new Response(JSON.stringify({ voice_rules: rules }), {
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
