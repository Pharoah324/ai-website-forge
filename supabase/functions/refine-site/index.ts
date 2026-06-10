import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are refining an EXISTING website based on the user's instruction. Use the build_site tool.
Rules for refinement:
- Only change what the user asked to change. Keep everything else byte-for-byte identical.
- Always return the COMPLETE updated site JSON via the build_site tool, not just the changed parts — every section that exists now must still be present (hero, features, about, testimonials, pricing, faq, cta, contact, gallery, stats).
- PRESERVE every image field exactly as given — image_url, image_thumb, image_alt, image_credit, and icon_name — UNLESS the user explicitly asks to change the imagery. Do not blank them, do not invent new URLs.
- If the user adds a new section or item, set a descriptive English "image_search_query" for it (the system adds the actual photo); leave image_url empty for those.
- Provide a short plain-English "summary" field describing exactly what changed.
- If the instruction is vague, interpret it generously and make the most likely desired improvement.
- Never start from scratch unless the user explicitly asks to start over.
- Preserve the original language of the site unless asked to translate.
- Color values must be raw HSL triples like "221 83% 53%" (no hsl() wrapper, no commas).`;

// Full schema — mirrors generate-site so refinement can return gallery/stats
// sections and carry image/layout/icon fields through instead of stripping them.
const TOOL = {
  name: "build_site",
  description: "Return the complete refined site definition plus a short change summary.",
  input_schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "Brief plain-English description of what changed." },
      name: { type: "string" },
      tagline: { type: "string" },
      lang: { type: "string" },
      dir: { type: "string", enum: ["ltr", "rtl"] },
      ui: {
        type: "object",
        description: "Localized labels for static UI chrome (contact form, footer, etc.). Preserve unless asked to change.",
        properties: {
          get_started: { type: "string" },
          send: { type: "string" },
          sending: { type: "string" },
          name_placeholder: { type: "string" },
          email_placeholder: { type: "string" },
          phone_placeholder: { type: "string" },
          message_placeholder: { type: "string" },
          thank_you: { type: "string" },
          we_will_be_in_touch: { type: "string" },
          reservation_note: { type: "string" },
          support: { type: "string" },
          contact_heading: { type: "string" },
          contact_subheading: { type: "string" },
        },
      },
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
              enum: ["hero", "features", "about", "testimonials", "pricing", "faq", "cta", "contact", "gallery", "stats"],
            },
            heading: { type: "string" },
            subheading: { type: "string" },
            cta: { type: "string" },
            cta_urgency: { type: "string" },
            image_search_query: { type: "string", description: "English search phrase for Unsplash" },
            image_placement: { type: "string", enum: ["background", "side", "card", "avatar", "none"] },
            layout: { type: "string", enum: ["image-right", "image-left", "image-background", "grid", "stacked", "cards", "cards-3", "quotes", "list", "list-with-icons"] },
            image_url: { type: "string", description: "Existing image — preserve unless changing imagery." },
            image_thumb: { type: "string" },
            image_alt: { type: "string" },
            image_credit: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  body: { type: "string" },
                  price: { type: "string" },
                  author: { type: "string" },
                  icon_name: { type: "string", description: "Lucide PascalCase icon name" },
                  image_search_query: { type: "string" },
                  image_url: { type: "string", description: "Existing image — preserve unless changing imagery." },
                  image_thumb: { type: "string" },
                  image_alt: { type: "string" },
                  image_credit: { type: "string" },
                },
                required: ["title"],
              },
            },
          },
          required: ["type", "heading"],
        },
      },
    },
    required: ["summary", "name", "tagline", "theme", "sections"],
  },
};

// deno-lint-ignore no-explicit-any
type AnyObj = Record<string, any>;

// Carry unchanged structure/media forward from the previous content so a refine
// never drops images OR whole item lists, even if the model omits them. Matches
// sections/items by position first, then by heading/title. New sections (no
// match) keep their own values.
function preserveExisting(oldContent: AnyObj | null, next: AnyObj) {
  const oldSections: AnyObj[] = Array.isArray(oldContent?.sections) ? oldContent!.sections : [];
  const nextSections: AnyObj[] = Array.isArray(next?.sections) ? next.sections : [];
  const IMG = ["image_url", "image_thumb", "image_alt", "image_credit"];
  const norm = (s: string) => (s || "").toLowerCase().trim();

  nextSections.forEach((s, i) => {
    const old =
      oldSections[i] && oldSections[i].type === s.type
        ? oldSections[i]
        : oldSections.find((o) => norm(o.heading) === norm(s.heading) && o.type === s.type);
    if (!old) return;
    for (const f of IMG) if (!s[f] && old[f]) s[f] = old[f];
    // If the model omitted items entirely (undefined) on a section that had
    // them, carry them forward so the section doesn't come back empty. An
    // explicit empty array is treated as an intentional clear and left alone.
    if (s.items === undefined && Array.isArray(old.items)) s.items = old.items;
    if (Array.isArray(s.items) && Array.isArray(old.items)) {
      s.items.forEach((it: AnyObj, j: number) => {
        const oit = old.items[j] && norm(old.items[j].title) === norm(it.title)
          ? old.items[j]
          : old.items.find((x: AnyObj) => norm(x.title) === norm(it.title));
        if (!oit) return;
        for (const f of [...IMG, "icon_name"]) if (!it[f] && oit[f]) it[f] = oit[f];
      });
    }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY || !ANTHROPIC_API_KEY.trim()) {
      console.error("[refine-site] ANTHROPIC_API_KEY is missing.");
      return json({ error: "AI provider not configured", code: "missing_api_key" }, 500);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

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

    // Load site (RLS enforces ownership — non-owners get null → 404).
    const { data: site, error: sErr } = await supabase
      .from("sites").select("id,user_id,site_data,content,name,workspace_id").eq("id", siteId).single();
    if (sErr || !site) return json({ error: "Site not found" }, 404);
    const currentContent = (site.site_data ?? site.content) as AnyObj | null;

    // Resolve brand voice: workspace voice (if active) overrides personal voice.
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: prof } = await admin
      .from("profiles")
      .select("brand_voice_active, voice_rules, brand_voice_samples")
      .eq("id", user.id)
      .maybeSingle();
    let vActive = !!prof?.brand_voice_active;
    let vRules: unknown = prof?.voice_rules;
    let vSamples: string | null = prof?.brand_voice_samples ?? null;
    if (site.workspace_id) {
      const { data: ws } = await admin
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

    // Load chat history (folded into the user message — Anthropic requires
    // alternating user/assistant roles, so we send it as a transcript).
    const { data: history } = await supabase
      .from("site_chat_messages")
      .select("role,content,summary")
      .eq("site_id", siteId)
      .order("created_at", { ascending: true })
      .limit(40);
    const transcript = (history || [])
      .map((m) => `${m.role === "assistant" ? "AI" : "User"}: ${m.role === "assistant" && m.summary ? m.summary : m.content}`)
      .join("\n");

    // Gate + consume 1 build credit (admins bypass automatically).
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

    const userMessage = [
      `Current site JSON:\n${JSON.stringify(currentContent).slice(0, 14000)}`,
      transcript ? `\nConversation so far:\n${transcript}` : "",
      `\nNew instruction: ${message}`,
    ].join("\n");

    const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 8192,
        system: SYSTEM_PROMPT + voiceAddon,
        messages: [{ role: "user", content: userMessage }],
        tools: [{ name: TOOL.name, description: TOOL.description, input_schema: TOOL.input_schema }],
        tool_choice: { type: "tool", name: TOOL.name },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("[refine-site] Anthropic error", aiResp.status, t.slice(0, 500));
      if (aiResp.status === 429) return json({ error: "Rate limited. Try again in a moment." }, 429);
      if (aiResp.status === 401 || aiResp.status === 403) return json({ error: "Invalid Anthropic API key", code: "invalid_api_key" }, 500);
      return json({ error: "AI provider error", provider_status: aiResp.status }, 500);
    }

    const data = await aiResp.json();
    const toolBlock = Array.isArray(data.content)
      ? data.content.find((b: { type?: string }) => b?.type === "tool_use")
      : null;
    const parsed = toolBlock?.input as AnyObj | undefined;
    if (!parsed) return json({ error: "AI returned no result" }, 500);

    const summary: string = parsed.summary || "Updated the site.";
    const updatedContent: AnyObj = { ...parsed };
    delete updatedContent.summary;

    // Safety net: carry images and omitted item lists forward so a refine never
    // loses imagery or blanks a section even if the model omits fields.
    preserveExisting(currentContent, updatedContent);

    // Persist user message.
    await supabase.from("site_chat_messages").insert({
      site_id: siteId, user_id: user.id, role: "user", content: message, credits_used: 0,
    });

    // Snapshot new version.
    const { data: maxV } = await admin
      .from("site_versions").select("version_number")
      .eq("site_id", siteId).order("version_number", { ascending: false }).limit(1).maybeSingle();
    const nextVersion = (maxV?.version_number || 0) + 1;
    const { data: ver } = await admin.from("site_versions").insert({
      site_id: siteId, user_id: user.id, version_number: nextVersion,
      label: summary.slice(0, 80), content: updatedContent,
    }).select("id").single();

    // Update site via admin client and CHECK the result — a user-scoped update
    // could silently no-op under RLS, leaving the change unsaved.
    const { error: upErr } = await admin
      .from("sites").update({ site_data: updatedContent, content: updatedContent }).eq("id", siteId);
    if (upErr) {
      console.error("[refine-site] sites update failed:", JSON.stringify(upErr));
      return json({ error: "Failed to save changes: " + (upErr.message || "unknown") }, 500);
    }

    // Persist assistant message.
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
