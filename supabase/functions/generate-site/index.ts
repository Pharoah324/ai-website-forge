import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a website generator. Given a business description, return a complete site structure.
Use the build_site tool. Generate clear, conversion-focused copy. Pick a tasteful color palette that fits the industry.
Sections should follow this order when relevant: hero, features, about, testimonials, pricing, faq, cta, contact.`;

// Anthropic-style tool schema (input_schema instead of parameters)
const TOOL = {
  name: "build_site",
  description: "Build a structured website definition.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Short business name" },
      tagline: { type: "string" },
      theme: {
        type: "object",
        properties: {
          primary: { type: "string", description: "HSL string like '221 83% 53%'" },
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

    const body = await req.json();
    const prompt: string = (body.prompt || "").toString().slice(0, 4000);
    if (!prompt.trim()) {
      return new Response(JSON.stringify({ error: "Prompt required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check & deduct credits atomically (best-effort)
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("build_credits, plan, brand_voice_active, brand_voice_samples")
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
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let voiceAddon = "";
    if (profile.brand_voice_active && profile.brand_voice_samples) {
      voiceAddon = `\n\nWrite all copy in this brand voice. Samples:\n${String(profile.brand_voice_samples).slice(0, 2000)}`;
    }

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: SYSTEM_PROMPT + voiceAddon },
            { role: "user", content: prompt },
          ],
          tools: [TOOL],
          tool_choice: { type: "function", function: { name: "build_site" } },
        }),
      },
    );

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Try again in a moment." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI workspace credits exhausted. Add funds in Settings.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call returned", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "AI returned no site" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let siteJson: unknown;
    try {
      siteJson = JSON.parse(toolCall.function.arguments);
    } catch (_e) {
      return new Response(JSON.stringify({ error: "Bad AI JSON" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist site
    const { data: site, error: siteErr } = await supabase
      .from("sites")
      .insert({
        user_id: user.id,
        name: (siteJson as { name?: string }).name || "Untitled Site",
        prompt,
        content: siteJson,
      })
      .select()
      .single();

    if (siteErr) {
      console.error("Site insert error:", siteErr);
      return new Response(JSON.stringify({ error: "Failed to save site" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct 1 build credit (skip for agency)
    if (!isUnlimited) {
      await supabase
        .from("profiles")
        .update({ build_credits: profile.build_credits - 1 })
        .eq("id", user.id);

      await supabase.from("credit_ledger").insert({
        user_id: user.id,
        kind: "build",
        amount: -1,
        reason: "generate",
        description: `Generated site: ${site.name}`,
      });
    }

    return new Response(JSON.stringify({ site }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
