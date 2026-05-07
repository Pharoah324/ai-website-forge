import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM_PROMPT = `You are a global AI website builder that serves businesses in every country worldwide. Given a business description (and optionally an existing template draft), return a complete, polished site structure.
Use the build_site tool. Generate clear, conversion-focused copy. Pick a tasteful color palette that fits the industry.
Sections should follow this order when relevant: hero, features, about, testimonials, pricing, faq, cta, contact.
Color values must be raw HSL triples like "221 83% 53%" (no hsl() wrapper, no commas).

CRITICAL LANGUAGE RULE:
Detect the language of the user's input. Generate the ENTIRE website — all copy, headlines, button text, navigation, meta tags, and content — in that SAME language. Never switch to English unless the user wrote their description in English. Works for ANY language in the world: English, Spanish, Portuguese, French, German, Italian, Dutch, Polish, Russian, Ukrainian, Arabic, Hebrew, Persian, Urdu, Turkish, Hindi, Bengali, Mandarin, Japanese, Korean, Thai, Vietnamese, Indonesian, Malay, Tagalog, Swahili, and every other major world language. If you can understand it, generate the site in it. Do not translate proper nouns.

For RTL languages (Arabic, Hebrew, Persian, Urdu) include "dir": "rtl" at the top level of the JSON and ensure copy reads naturally right-to-left.

Respect cultural context:
- Middle Eastern businesses: conservative, professional tone
- Japanese businesses: formal honorific tone
- Latin American businesses: warm, personal tone
- German businesses: precise, technical tone
- Brazilian businesses: energetic, friendly tone
Generate websites that feel native to the user's culture — not just translated from English.`;

const TOOL = {
  type: "function" as const,
  function: {
    name: "build_site",
    description: "Build a structured website definition.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        tagline: { type: "string" },
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
              type: {
                type: "string",
                enum: ["hero", "features", "about", "testimonials", "pricing", "faq", "cta", "contact"],
              },
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
            required: ["type", "heading"],
          },
        },
      },
      required: ["name", "tagline", "theme", "sections"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const prompt: string = (body.prompt || "").toString().slice(0, 4000);
    const templateDraft = body.template_draft ?? null;
    const businessName: string | undefined = body.business_name;
    const businessCity: string | undefined = body.business_city;
    const language: string | undefined = body.language;
    const stream: boolean = body.stream !== false;

    if (!prompt.trim() && !templateDraft) {
      return new Response(JSON.stringify({ error: "Prompt or template required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("build_credits, plan, brand_voice_active, brand_voice_samples, voice_rules, role")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atomic plan + rate-limit + credit gate via DB function (service role)
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: gate, error: gateErr } = await admin.rpc("check_and_consume", {
      _uid: user.id,
      _action: "site_generation",
      _credit_cost: 1,
    });
    if (gateErr) {
      console.error("gate error", gateErr);
      return new Response(JSON.stringify({ error: "Internal gate error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const g = gate as { ok: boolean; reason?: string; retry_after_seconds?: number; daily_limit?: number; hourly_limit?: number; plan?: string; admin_bypass?: boolean };
    if (!g.ok) {
      const status =
        g.reason === "no_credits" ? 402 :
        g.reason === "daily_limit" || g.reason === "hourly_limit" || g.reason === "blocked" ? 429 :
        403;
      return new Response(JSON.stringify({
        error: g.reason ?? "blocked",
        plan: g.plan,
        retry_after_seconds: g.retry_after_seconds,
        daily_limit: g.daily_limit,
        hourly_limit: g.hourly_limit,
      }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const isAdmin = !!g.admin_bypass;
    const isUnlimited = isAdmin || profile.plan === "agency";

    let voiceAddon = "";
    if (profile.brand_voice_active) {
      const rules = Array.isArray(profile.voice_rules) ? profile.voice_rules : null;
      if (rules && rules.length) {
        voiceAddon = `\n\nWrite all copy following this brand voice. Rules:\n- ${rules.join("\n- ")}`;
      } else if (profile.brand_voice_samples) {
        voiceAddon = `\n\nWrite all copy mirroring the tone of these samples:\n${String(profile.brand_voice_samples).slice(0, 2000)}`;
      }
    }

    // Accept ANY BCP-47 language code. We pass it through verbatim and let the model
    // resolve the human-readable name. If empty, the model auto-detects from the prompt.
    const LANG_NAMES: Record<string, string> = {
      en: "English", es: "Spanish", pt: "Portuguese", fr: "French", de: "German",
      it: "Italian", nl: "Dutch", pl: "Polish", ru: "Russian", uk: "Ukrainian",
      ar: "Arabic", he: "Hebrew", fa: "Persian", ur: "Urdu", tr: "Turkish",
      hi: "Hindi", bn: "Bengali", zh: "Mandarin Chinese", "zh-TW": "Traditional Chinese",
      ja: "Japanese", ko: "Korean", th: "Thai", vi: "Vietnamese",
      id: "Indonesian", ms: "Malay", tl: "Tagalog", sw: "Swahili",
    };
    const RTL_CODES = new Set(["ar", "he", "fa", "ur"]);
    const langName = language ? (LANG_NAMES[language] || language) : "";
    const rtlNote = language && RTL_CODES.has(language)
      ? ` This is a right-to-left language; include "dir": "rtl" in the JSON.`
      : "";
    const langInstruction = langName
      ? `\n\nIMPORTANT: Write ALL copy in ${langName}.${rtlNote}`
      : "";

    let userMessage = prompt + langInstruction;
    if (templateDraft) {
      userMessage = `Personalize this template for "${businessName || "the business"}"${businessCity ? ` in ${businessCity}` : ""}.
Replace placeholders, sharpen the copy, keep section structure. Original prompt: ${prompt || "(template start)"}.${langInstruction}

Existing template JSON:
${JSON.stringify(templateDraft).slice(0, 6000)}`;
    }

    const aiBody = {
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + voiceAddon },
        { role: "user", content: userMessage },
      ],
      tools: [TOOL],
      tool_choice: { type: "function", function: { name: "build_site" } },
      stream,
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiBody),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Lovable AI credits exhausted. Add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("Lovable AI error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI provider error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!stream) {
      const data = await aiResp.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      const argStr = toolCall?.function?.arguments;
      if (!argStr) {
        return new Response(JSON.stringify({ error: "AI returned no site" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      let parsed: unknown;
      try { parsed = JSON.parse(argStr); } catch {
        return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const site = await persistSite(supabase, user.id, prompt, parsed, profile, isUnlimited, isAdmin);
      return new Response(JSON.stringify({ site }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STREAMING: parse OpenAI-style SSE, accumulate tool_call.function.arguments deltas,
    // forward as our own "delta" events, then persist + emit "done".
    const reader = aiResp.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let leftover = "";
    let accumulated = "";

    const out = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            leftover += decoder.decode(value, { stream: true });
            let nl: number;
            while ((nl = leftover.indexOf("\n")) !== -1) {
              let line = leftover.slice(0, nl);
              leftover = leftover.slice(nl + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;
              const json = line.slice(6).trim();
              if (!json || json === "[DONE]") continue;
              try {
                const evt = JSON.parse(json);
                const delta = evt.choices?.[0]?.delta;
                const argChunk = delta?.tool_calls?.[0]?.function?.arguments;
                if (typeof argChunk === "string" && argChunk.length) {
                  accumulated += argChunk;
                  send("delta", { partial_json: argChunk });
                }
              } catch {
                // ignore partial / non-JSON
              }
            }
          }

          let parsed: unknown = null;
          try {
            parsed = JSON.parse(accumulated);
          } catch {
            send("error", { error: "Failed to parse AI output" });
            controller.close();
            return;
          }

          const site = await persistSite(
            supabase,
            user.id,
            prompt || (templateDraft ? `Template: ${businessName || "Untitled"}` : ""),
            parsed,
            profile,
            isUnlimited,
            isAdmin,
          );
          send("done", { site });
          controller.close();
        } catch (e) {
          const msg = e instanceof Error ? e.message : "stream error";
          console.error("stream error:", msg);
          send("error", { error: msg });
          controller.close();
        }
      },
    });

    return new Response(out, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("generate-site error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function persistSite(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  prompt: string,
  siteJson: unknown,
  _profile: { build_credits: number },
  _isUnlimited: boolean,
  _isAdmin: boolean,
) {
  const name = (siteJson as { name?: string }).name || "Untitled Site";
  const { data: site, error: siteErr } = await supabase
    .from("sites")
    .insert({ user_id: userId, name, prompt, content: siteJson })
    .select()
    .single();
  if (siteErr) {
    // Storage cap trigger raises 'storage_limit:sites:<n>:<plan>'
    const msg = siteErr.message || "";
    if (msg.includes("storage_limit:sites")) {
      const parts = msg.split(":");
      throw new Error(`storage_limit:sites:${parts[2]}:${parts[3]}`);
    }
    throw new Error("Failed to save site");
  }
  return site;
}
