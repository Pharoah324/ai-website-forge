import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a website generator. Given a business description (and optionally an existing template draft), return a complete, polished site structure.
Use the build_site tool. Generate clear, conversion-focused copy. Pick a tasteful color palette that fits the industry.
Sections should follow this order when relevant: hero, features, about, testimonials, pricing, faq, cta, contact.
Color values must be raw HSL triples like "221 83% 53%" (no hsl() wrapper, no commas).`;

const TOOL = {
  name: "build_site",
  description: "Build a structured website definition.",
  input_schema: {
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
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const prompt: string = (body.prompt || "").toString().slice(0, 4000);
    const templateDraft = body.template_draft ?? null; // optional starting JSON
    const businessName: string | undefined = body.business_name;
    const businessCity: string | undefined = body.business_city;
    const stream: boolean = body.stream !== false; // default true

    if (!prompt.trim() && !templateDraft) {
      return new Response(JSON.stringify({ error: "Prompt or template required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("build_credits, plan, brand_voice_active, brand_voice_samples, voice_rules")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isUnlimited = profile.plan === "agency";
    if (!isUnlimited && profile.build_credits <= 0) {
      return new Response(
        JSON.stringify({ error: "Out of build credits. Top up or upgrade." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let voiceAddon = "";
    if (profile.brand_voice_active) {
      const rules = Array.isArray(profile.voice_rules) ? profile.voice_rules : null;
      if (rules && rules.length) {
        voiceAddon = `\n\nWrite all copy following this brand voice. Rules:\n- ${rules.join("\n- ")}`;
      } else if (profile.brand_voice_samples) {
        voiceAddon = `\n\nWrite all copy mirroring the tone of these samples:\n${String(profile.brand_voice_samples).slice(0, 2000)}`;
      }
    }

    let userMessage = prompt;
    if (templateDraft) {
      userMessage = `Personalize this template for "${businessName || "the business"}"${businessCity ? ` in ${businessCity}` : ""}.
Replace placeholders, sharpen the copy, keep section structure. Original prompt: ${prompt || "(template start)"}.

Existing template JSON:
${JSON.stringify(templateDraft).slice(0, 6000)}`;
    }

    const aiBody = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT + voiceAddon,
      messages: [{ role: "user", content: userMessage }],
      tools: [TOOL],
      tool_choice: { type: "tool", name: "build_site" },
      stream,
    };

    const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
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
      const t = await aiResp.text();
      console.error("Anthropic error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI provider error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!stream) {
      const data = await aiResp.json();
      const toolUse = (data.content || []).find(
        (b: { type: string; name?: string }) => b.type === "tool_use" && b.name === "build_site",
      );
      if (!toolUse?.input) {
        return new Response(JSON.stringify({ error: "AI returned no site" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const site = await persistSite(supabase, user.id, prompt, toolUse.input, profile, isUnlimited);
      return new Response(JSON.stringify({ site }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STREAMING: parse Anthropic SSE, forward partial JSON deltas of the tool input as SSE to the client,
    // accumulate the full JSON, then persist and emit a final "done" event with the saved site.
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
              const line = leftover.slice(0, nl).replace(/\r$/, "");
              leftover = leftover.slice(nl + 1);
              if (!line.startsWith("data: ")) continue;
              const json = line.slice(6).trim();
              if (!json) continue;
              try {
                const evt = JSON.parse(json);
                if (
                  evt.type === "content_block_delta" &&
                  evt.delta?.type === "input_json_delta" &&
                  typeof evt.delta.partial_json === "string"
                ) {
                  accumulated += evt.delta.partial_json;
                  send("delta", { partial_json: evt.delta.partial_json });
                }
              } catch {
                // ignore partial / non-JSON lines
              }
            }
          }

          let parsed: unknown = null;
          try {
            parsed = JSON.parse(accumulated);
          } catch (e) {
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
  profile: { build_credits: number },
  isUnlimited: boolean,
) {
  const name = (siteJson as { name?: string }).name || "Untitled Site";
  const { data: site, error: siteErr } = await supabase
    .from("sites")
    .insert({ user_id: userId, name, prompt, content: siteJson })
    .select()
    .single();
  if (siteErr) throw new Error("Failed to save site");

  if (!isUnlimited) {
    await supabase
      .from("profiles")
      .update({ build_credits: profile.build_credits - 1 })
      .eq("id", userId);
    await supabase.from("credit_ledger").insert({
      user_id: userId,
      kind: "build",
      amount: -1,
      reason: "generate",
      description: `Generated site: ${name}`,
    });
  }
  return site;
}
