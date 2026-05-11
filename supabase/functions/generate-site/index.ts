import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY") || "";

const SYSTEM_PROMPT = `You are an expert UX/UI designer AND website copywriter combined, building conversion-focused sites for businesses worldwide. Use the build_site tool.

CRITICAL LANGUAGE RULE:
Detect the language of the user's input and generate the ENTIRE site (copy, headlines, button text, nav, meta) in that SAME language. Works for any major world language. For RTL languages (Arabic, Hebrew, Persian, Urdu) include "dir": "rtl".

Color values must be raw HSL triples like "221 83% 53%" (no hsl() wrapper, no commas).

VISUAL HIERARCHY:
- One clear hero with a dominant headline.
- Size contrast: headlines large, subheadlines medium, body small.
- Most important CTA button visually dominates each section.
- Never two equally weighted elements side by side — one dominates.

LAYOUT:
- F-pattern: most important content top-left.
- Sections alternate light/dark backgrounds for breathing room.
- Max 3 columns per section (2 better on mobile).
- Every section: clear headline + supporting text + CTA.
- Generous padding between sections.

COLOR USAGE:
- Max 3 colors total: Primary, Accent, Neutral.
- Primary on headings + key elements only. Accent on CTAs + highlights only.
- Mix: 60% neutral, 30% primary, 10% accent.
- Max 2 font styles.

TYPOGRAPHY:
- Headlines: bold, large, max 8 words.
- Subheadlines: medium weight, conversational.
- Body: 16px+, 1.6 line height. Never all-caps for body. Always left-align body. Center-align headlines only in hero.

CTA RULES:
- Every page has at least 3 CTAs (top, middle, bottom).
- Primary CTA above the fold.
- Use action words: "Book Now", "Get Started Free", "See Our Work", "Talk to Us Today" — never "Click Here" / "Submit" / "Gallery" / "Contact".
- Add urgency where appropriate: "Limited Spots", "This Week Only", "Free Consultation".

TRUST SIGNALS:
- Include star rating / review count, clients-served or years-in-business, certifications, before/after results where relevant, a guarantee, real location/contact.

MOBILE-FIRST:
- Stack columns to single column on mobile. 48px tap targets. Never <14px on mobile. No horizontal scrolling. Hero image works portrait.

SECTION ORDER FOR MAX CONVERSION:
1) hero  2) social proof / stats strip  3) problem/pain  4) solution  5) services/features w/ images  6) how it works (3 steps)  7) testimonials w/ photos  8) about w/ team photo  9) final CTA w/ urgency  10) contact/footer.

INDUSTRY DESIGN:
Medical/MedSpa: clean whites, soft tones, professional photos, trust-heavy.
Restaurant: large food photography, warm colors, menu prominent.
Real Estate: full-width property photos, agent headshot, map.
Fitness/Gym: high-energy photos, bold colors, transformation results.
Law Firm: dark professional colors, attorney photos, trust signals.
Contractor: before/after, project gallery, reviews.
Salon/Beauty: lifestyle photography, soft aesthetic, booking prominent.
Coaching: large personal-brand photo, results + testimonials heavy.

FUNNEL MODES (when funnel_type is provided):
- lead_capture: single page, no nav, hero form above fold, minimal fields, trust badges + testimonials below form, NO multi-section nav links.
- sales_landing: long-form, problem/solution/proof/offer/urgency/CTA repeated 3+ times.
- appointment: calendar/booking prominent, what to expect, testimonials, address/parking.
- coming_soon: single hero with email capture, countdown copy, brand promise.
- link_in_bio: vertical stack of 4-8 link cards, photo top, single column.

OUTPUT IMAGE & ICON FIELDS:
CRITICAL: NEVER put markdown image syntax (e.g. "![](url)" or "![alt](url)") inside heading, subheading, body, title, or any other text field. NEVER paste raw image URLs into text. Images are added separately by the system using the image_search_query field. Text fields must contain prose only.

For EACH section include:
- image_search_query: a specific descriptive English phrase (4-9 words) that will return a perfect Unsplash photo for the section, including business type + setting (e.g. "luxury medspa treatment room miami", "cozy italian restaurant interior candlelight"). ALWAYS in English even when copy is in another language — Unsplash search is English-only.
- image_placement: one of "background" | "side" | "card" | "avatar" | "none".
- layout: one of "image-right" | "image-left" | "image-background" | "grid" | "stacked".
- cta_urgency: optional short urgency line (e.g. "Limited slots this week").

For EACH item inside services/features/pricing/testimonials include:
- icon_name: a Lucide icon PascalCase name relevant to the item (e.g. "Syringe","Dumbbell","Scale","UtensilsCrossed","Home","Sparkles","Shield","Award","Star","Phone","MapPin","Clock","CalendarCheck","Users","DollarSign").
- image_search_query: short English phrase for a matching photo (used for service cards / testimonial avatars).

Use these icon mappings as a starting guide:
Medical: Botox/Fillers→Syringe, Laser→Zap, Facial→Sparkles, Consult→MessageCircle.
Restaurant: Dining→UtensilsCrossed, Delivery→Truck, Reservations→Calendar, Menu→BookOpen.
Real Estate: Buying→Home, Selling→TrendingUp, Rentals→Key, Valuation→BarChart.
Fitness: Training→Dumbbell, Classes→Users, Nutrition→Apple, Results→Trophy.
Legal: Consultation→Scale, Contract→FileText, Court→Building, Research→Search.
Generic: Phone, Mail, MapPin, Clock, Users, Shield, Award, Star, DollarSign, CalendarCheck.`;

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
              type: {
                type: "string",
                enum: ["hero", "features", "about", "testimonials", "pricing", "faq", "cta", "contact"],
              },
              heading: { type: "string" },
              subheading: { type: "string" },
              cta: { type: "string" },
              cta_urgency: { type: "string" },
              image_search_query: { type: "string", description: "English search phrase for Unsplash" },
              image_placement: { type: "string", enum: ["background", "side", "card", "avatar", "none"] },
              layout: { type: "string", enum: ["image-right", "image-left", "image-background", "grid", "stacked"] },
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
    const funnelType: string | undefined = body.funnel_type; // "website" | "lead_capture" | "sales_landing" | "appointment" | "coming_soon" | "link_in_bio"
    const workspaceId: string | undefined = body.workspace_id;
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

    // Workspace voice (if any) overrides personal voice for this generation.
    let voiceSource: { active: boolean; voice_rules: unknown; brand_voice_samples: string | null } = {
      active: profile.brand_voice_active,
      voice_rules: profile.voice_rules,
      brand_voice_samples: profile.brand_voice_samples,
    };
    let effectiveWorkspaceId: string | null = null;
    if (workspaceId) {
      const { data: ws } = await admin
        .from("agency_workspaces")
        .select("brand_voice_active, voice_rules, brand_voice_samples")
        .eq("id", workspaceId)
        .eq("agency_user_id", user.id)
        .maybeSingle();
      if (ws) effectiveWorkspaceId = workspaceId;
      if (ws?.brand_voice_active) {
        voiceSource = { active: true, voice_rules: ws.voice_rules, brand_voice_samples: ws.brand_voice_samples };
      }
    }
    let voiceAddon = "";
    if (voiceSource.active) {
      const rules = Array.isArray(voiceSource.voice_rules) ? voiceSource.voice_rules : null;
      if (rules && rules.length) {
        voiceAddon = `\n\nWrite all copy following this brand voice. Rules:\n- ${rules.join("\n- ")}`;
      } else if (voiceSource.brand_voice_samples) {
        voiceAddon = `\n\nWrite all copy mirroring the tone of these samples:\n${String(voiceSource.brand_voice_samples).slice(0, 2000)}`;
      }
    }

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
      ? `\n\nIMPORTANT: Write ALL copy in ${langName}. (image_search_query fields stay in English.)${rtlNote}`
      : "";

    const funnelInstruction = funnelType && funnelType !== "website"
      ? `\n\nFUNNEL MODE: ${funnelType}. Apply the funnel rules from the system prompt strictly.`
      : "";

    let userMessage = prompt + langInstruction + funnelInstruction;
    if (templateDraft) {
      userMessage = `Personalize this template for "${businessName || "the business"}"${businessCity ? ` in ${businessCity}` : ""}.
Replace placeholders, sharpen the copy, keep section structure. Original prompt: ${prompt || "(template start)"}.${langInstruction}${funnelInstruction}

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
      try { sanitizeMarkdownImages(parsed); } catch (e) { console.warn("sanitizeMarkdownImages failed:", e); }
      try { await hydrateImages(parsed, prompt); } catch (e) { console.warn("hydrateImages failed (continuing without images):", e); }
      const site = await persistSite(supabase, user.id, prompt, parsed, profile, isUnlimited, isAdmin, effectiveWorkspaceId);
      return new Response(JSON.stringify({ site }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STREAMING
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
              } catch { /* ignore */ }
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

          try { sanitizeMarkdownImages(parsed); } catch (e) { console.warn("sanitizeMarkdownImages failed:", e); }
      try { await hydrateImages(parsed, prompt); } catch (e) { console.warn("hydrateImages failed (continuing without images):", e); }

          const site = await persistSite(
            supabase,
            user.id,
            prompt || (templateDraft ? `Template: ${businessName || "Untitled"}` : ""),
            parsed,
            profile,
            isUnlimited,
            isAdmin,
            effectiveWorkspaceId,
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

// ----- Unsplash hydration -----
type UnsplashPhoto = { regular: string; thumb: string; alt: string; credit: string };
const unsplashCache = new Map<string, UnsplashPhoto[] | null>();

// Curated, license-free Unsplash photo IDs grouped by category.
// These are served directly from the Unsplash CDN — no API key required.
// Used as a guaranteed fallback when the Unsplash search API is unavailable,
// rate-limited, or returns no results for a query.
const FALLBACK_PHOTOS: Record<string, string[]> = {
  medical:    ["1576091160399-112ba8d25d1d","1579684385127-1ef15d508118","1631815589968-fdb09a223b1e","1666214280557-f1b5022eb634","1551601651-bc60f254d532","1666214280391-8ff5bd3c0bf0"],
  restaurant: ["1517248135467-4c7edcad34c4","1555396273-367ea4eb4db5","1414235077428-338989a2e8c0","1565299624946-b28f40a0ae38","1504674900247-0877df9cc836","1546069901-ba9599a7e63c"],
  realestate: ["1564013799919-ab600027ffc6","1570129477492-45c003edd2be","1512917774080-9991f1c4c750","1600585154340-be6161a56a0c","1582268611958-ebfd161ef9cf","1600596542815-ffad4c1539a9"],
  fitness:    ["1534438327276-14e5300c3a48","1571019614242-c5c5dee9f50b","1517836357463-d25dfeac3438","1540497077202-7c8a3999166f","1583454110551-21f2fa2afe61","1518611012118-696072aa579a"],
  legal:      ["1589994965851-a8f479c573a9","1521791136064-7986c2920216","1505664194779-8beaceb93744","1450101499163-c8848c66ca85","1589216532372-1c2a367900d9","1505663912202-ac22d4cb3707"],
  contractor: ["1503387762-592deb58ef4e","1581094794329-c8112a89af12","1504307651254-35680f356dfd","1572177812156-58036aae439c","1521791055366-0d553872125f","1581092918056-0c4c3acd3789"],
  beauty:     ["1560066984-138dadb4c035","1522337360788-8b13dee7a37e","1487412947147-5cebf100ffc2","1559599101-f09722fb4948","1532710093739-9470acff878f","1583241800698-9c3b7a4e2c64"],
  coaching:   ["1573497019940-1c28c88b4f3e","1558222218-b7b54eede3f3","1551836022-d5d88e9218df","1521791055366-0d553872125f","1573497019418-b400bb3ab074","1556761175-5973dc0f32e7"],
  tech:       ["1517077304055-6e89abbf09b0","1518770660439-4636190af475","1551434678-e076c223a692","1487058792275-0ad4aaf24ca7","1531297484001-80022131f5a1","1498050108023-c5249f4df085"],
  retail:     ["1483985988355-763728e1935b","1441986300917-64674bd600d8","1560769629-975ec94e6a86","1567401893414-76b7b1e5a7a5","1607082348824-0a96f2a4b9da","1556905055-8f358a7a47b2"],
  travel:     ["1488646953014-85cb44e25828","1469854523086-cc02fe5d8800","1507525428034-b723cf961d3e","1502602898657-3e91760cbb34","1507525428034-b723cf961d3e","1444084316824-dc26d6657664"],
  education:  ["1497633762265-9d179a990aa6","1523580494863-6f3031224c94","1503676260728-1c00da094a0b","1571260899304-425eee4c7efc","1509062522246-3755977927d7","1488190211105-8b0e65b80b4e"],
  finance:    ["1554224155-8d04cb21cd6c","1611974789855-9c2a0a7236a3","1559526324-4b87b5e36e44","1551288049-bebda4e38f71","1518186285589-2f7649de83e0","1579621970590-9d624316904b"],
  // Luxury menswear / bespoke tailoring / Savile Row aesthetic
  fashion:    ["1593030103066-0093718efeb9","1507679799987-c73779587ccf","1594938298603-c8148c4dae35","1617137968427-85924c800a22","1521572163474-6864f9cf17ab","1564859228273-274232fdb516","1473966968600-fa801b869a1a","1519415510236-718bdfcd89c8","1593032465175-481ac7f401a0","1509631179647-0177331693ae","1490578474895-699cd4e2cf59","1553240799-36bbf332a5e3","1507003211169-0a1dd7228f2d","1580618864180-f6d7d39b8ff6","1551803091-e20673f15770"],
  generic:    ["1497366216548-37526070297c","1497366754035-f200968a6e72","1486406146926-c627a92ad1ab","1454165804606-c3d57bc86b40","1542744173-8e7e53415bb0","1517048676732-d65bc937f952","1556761175-b413da4baf72","1507003211169-0a1dd7228f2d"],
};

function categorizeSite(site: { name?: string; tagline?: string }, prompt = ""): string {
  const text = `${site.name || ""} ${site.tagline || ""} ${prompt}`.toLowerCase();
  const buckets: Array<[string, RegExp]> = [
    ["medical",    /\b(medspa|medical|clinic|doctor|dental|dentist|health|wellness|chiro|therapy|botox|aesthetic|skincare|derma)\b/],
    ["restaurant", /\b(restaurant|cafe|coffee|bar|bistro|food|pizza|sushi|kitchen|bakery|catering|chef|dining)\b/],
    ["realestate", /\b(real estate|realtor|property|properties|homes|housing|apartment|broker|mortgage|rental)\b/],
    ["fitness",    /\b(gym|fitness|yoga|pilates|crossfit|trainer|workout|athletic|sports|martial)\b/],
    ["legal",      /\b(law|legal|attorney|lawyer|firm|counsel|litigation|paralegal)\b/],
    ["contractor", /\b(contractor|construction|plumb|electric|hvac|roof|landscap|remodel|renovation|builder|handyman|painter)\b/],
    ["beauty",     /\b(salon|barber|hair|nail|makeup|beauty|spa|stylist|lash|brow)\b/],
    ["coaching",   /\b(coach|coaching|consult|mentor|life coach|business coach|speaker|author)\b/],
    ["tech",       /\b(software|saas|app|tech|startup|developer|api|ai|cloud|data|cyber)\b/],
    ["fashion",    /\b(bespoke|tailor|tailoring|sartorial|savile|haberdash|menswear|suit|suiting|atelier|couture|luxury fashion|formal wear|dress shirt|bowtie|pocket square|cufflink|cravat)\b/],
    ["retail",     /\b(shop|store|retail|boutique|ecommerce|product|brand|fashion|apparel)\b/],
    ["travel",     /\b(travel|tour|hotel|resort|vacation|airbnb|trip|adventure|destination)\b/],
    ["education",  /\b(school|tutor|education|course|class|learn|teach|academy|university|coaching center)\b/],
    ["finance",    /\b(finance|financial|accounting|bookkeep|tax|investment|wealth|advisor|insurance)\b/],
  ];
  for (const [name, re] of buckets) if (re.test(text)) return name;
  return "generic";
}

function buildFallbackPhoto(category: string, idx: number, query: string, orientation: "landscape" | "portrait" | "squarish"): UnsplashPhoto {
  const ids = FALLBACK_PHOTOS[category] || FALLBACK_PHOTOS.generic;
  const id = ids[Math.abs(idx) % ids.length];
  const dim = orientation === "squarish" ? "w=800&h=800" : orientation === "portrait" ? "w=900&h=1200" : "w=1600&h=1000";
  const regular = `https://images.unsplash.com/photo-${id}?${dim}&fit=crop&auto=format&q=80`;
  const thumb = `https://images.unsplash.com/photo-${id}?w=400&h=300&fit=crop&auto=format&q=70`;
  return { regular, thumb, alt: query || category, credit: "Photo via Unsplash" };
}

async function unsplashSearchMany(
  query: string,
  orientation: "landscape" | "portrait" | "squarish" = "landscape",
  perPage = 10,
): Promise<UnsplashPhoto[] | null> {
  if (!UNSPLASH_ACCESS_KEY || !query) return null;
  const cacheKey = `${orientation}:${perPage}:${query}`;
  if (unsplashCache.has(cacheKey)) return unsplashCache.get(cacheKey)!;
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=${perPage}&content_filter=high&order_by=relevant`;
    const r = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`, "Accept-Version": "v1" },
    });
    if (!r.ok) {
      console.warn("unsplash error", r.status, query);
      unsplashCache.set(cacheKey, null);
      return null;
    }
    const data = await r.json();
    const photos: UnsplashPhoto[] = (data?.results || []).map((p: { urls: { regular: string; thumb: string }; alt_description?: string; user?: { name?: string } }) => ({
      regular: p.urls.regular,
      thumb: p.urls.thumb,
      alt: p.alt_description || query,
      credit: `Photo by ${p.user?.name || "Unsplash"} on Unsplash`,
    }));
    if (!photos.length) { unsplashCache.set(cacheKey, null); return null; }
    unsplashCache.set(cacheKey, photos);
    return photos;
  } catch (e) {
    console.warn("unsplash exception", e);
    unsplashCache.set(cacheKey, null);
    return null;
  }
}

async function unsplashSearch(query: string, orientation: "landscape" | "portrait" | "squarish" = "landscape", pickIndex = 0): Promise<UnsplashPhoto | null> {
  const photos = await unsplashSearchMany(query, orientation, 10);
  if (!photos || !photos.length) return null;
  return photos[pickIndex % photos.length];
}

// Strip markdown image syntax from text fields. If a field contains
// `![alt](url)` and no image_url is set on the parent, promote the URL.
function sanitizeMarkdownImages(siteJson: unknown) {
  if (!siteJson || typeof siteJson !== "object") return;
  // deno-lint-ignore no-explicit-any
  const site = siteJson as any;
  const MD_IMG = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  const RAW_IMG_URL = /(https?:\/\/(?:images\.unsplash\.com|[^\s)]+\.(?:jpg|jpeg|png|webp|gif|avif))[^\s)]*)/gi;

  const TEXT_FIELDS = ["heading", "subheading", "body", "title", "cta", "cta_urgency", "price", "author"];

  // deno-lint-ignore no-explicit-any
  const cleanNode = (node: any) => {
    if (!node || typeof node !== "object") return;
    let firstUrl: string | null = null;
    let firstAlt: string | null = null;
    for (const key of TEXT_FIELDS) {
      const v = node[key];
      if (typeof v !== "string") continue;
      let cleaned = v.replace(MD_IMG, (_m, alt, url) => {
        if (!firstUrl) { firstUrl = url; firstAlt = alt || null; }
        return "";
      });
      // Strip stray raw image URLs left behind
      cleaned = cleaned.replace(RAW_IMG_URL, (_m, url) => {
        if (!firstUrl) firstUrl = url;
        return "";
      });
      cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
      node[key] = cleaned;
    }
    if (firstUrl && !node.image_url) {
      node.image_url = firstUrl;
      if (firstAlt && !node.image_alt) node.image_alt = firstAlt;
    }
  };

  const sections = Array.isArray(site.sections) ? site.sections : [];
  for (const sec of sections) {
    cleanNode(sec);
    if (Array.isArray(sec?.items)) {
      for (const item of sec.items) cleanNode(item);
    }
  }
}

async function hydrateImages(siteJson: unknown, prompt = "") {
  if (!siteJson || typeof siteJson !== "object") return;
  // deno-lint-ignore no-explicit-any
  const site = siteJson as any;
  const sections = Array.isArray(site.sections) ? site.sections : [];
  const category = categorizeSite(site, prompt);
  const apiAvailable = !!UNSPLASH_ACCESS_KEY;
  if (!apiAvailable) {
    console.log(`hydrateImages: UNSPLASH_ACCESS_KEY not set — using curated fallback (category=${category})`);
  }

  // Derive a business-context phrase to enrich vague queries.
  const bizContext: string = [site.name, site.tagline].filter(Boolean).join(" ").slice(0, 80);

  const fallbackForSection = (sec: { type?: string; heading?: string }) => {
    const h = (sec.heading || "").replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).slice(0, 4).join(" ");
    const base = bizContext || h;
    if (category === "fashion") {
      switch (sec.type) {
        case "hero": return `luxury bespoke suit man portrait editorial`;
        case "about": return `savile row tailor atelier craftsmanship`;
        case "features": return `bespoke tailoring fabric detail luxury menswear`;
        case "pricing": return `luxury suit jacket detail elegant`;
        case "testimonials": return `well dressed gentleman portrait suit`;
        case "cta": return `mens formal wear elegant editorial`;
        case "contact": return `tailor shop interior luxury menswear boutique`;
        default: return `luxury menswear bespoke ${h}`.trim();
      }
    }
    switch (sec.type) {
      case "hero": return `${base} professional`;
      case "about": return `${base} team office`;
      case "features": return `${base} ${h || "service"}`;
      case "pricing": return `${base} workspace modern`;
      case "testimonials": return `happy customer portrait`;
      case "cta": return `${base} lifestyle`;
      case "contact": return `${base} location storefront`;
      default: return `${base} ${h}`.trim();
    }
  };

  // Treat AI-supplied image URLs as untrusted unless they're real Unsplash CDN URLs.
  // Models routinely hallucinate placeholder URLs, which then render as broken images / alt text.
  const isTrustedImageUrl = (u?: string) =>
    !!u && /^https:\/\/images\.unsplash\.com\//i.test(u);

  const applyPhoto = (
    target: { image_url?: string; image_thumb?: string; image_alt?: string; image_credit?: string },
    photo: UnsplashPhoto,
  ) => {
    if (isTrustedImageUrl(target.image_url)) return;
    target.image_url = photo.regular;
    target.image_thumb = photo.thumb;
    target.image_alt = photo.alt;
    target.image_credit = photo.credit;
  };

  const tasks: Array<Promise<void>> = [];
  let fallbackCounter = 0;

  sections.forEach((sec: { type?: string; heading?: string; image_search_query?: string; image_placement?: string; layout?: string; image_url?: string; image_thumb?: string; image_alt?: string; image_credit?: string; items?: Array<{ image_search_query?: string; image_url?: string; image_thumb?: string; image_alt?: string; image_credit?: string; title?: string }> }, sIdx: number) => {
    // Force hero to have an image and use background layout if not specified
    if (sec.type === "hero") {
      if (!sec.image_placement || sec.image_placement === "none") sec.image_placement = "background";
      if (!sec.layout) sec.layout = "image-background";
    }

    if (sec.image_placement !== "none") {
      const query = sec.image_search_query || fallbackForSection(sec);
      const orientation: "landscape" | "portrait" | "squarish" = "landscape";
      const fbIdx = fallbackCounter++;
      tasks.push(
        unsplashSearch(query, orientation, sIdx)
          .then((r) => {
            if (r) applyPhoto(sec, r);
            else applyPhoto(sec, buildFallbackPhoto(category, sIdx + fbIdx, query, orientation));
          })
          .catch(() => applyPhoto(sec, buildFallbackPhoto(category, sIdx + fbIdx, query, orientation))),
      );
    }

    if (Array.isArray(sec.items) && sec.items.length) {
      const batchQuery = sec.image_search_query || fallbackForSection(sec);
      const itemOrient: "landscape" | "squarish" = sec.type === "testimonials" ? "squarish" : "landscape";
      const itemCategory = sec.type === "testimonials" ? "generic" : category; // testimonials → portrait fallback bucket later

      tasks.push(
        unsplashSearchMany(batchQuery, itemOrient, 10)
          .catch(() => null)
          .then(async (batch) => {
            for (let iIdx = 0; iIdx < sec.items!.length; iIdx++) {
              const item = sec.items![iIdx];
              if (item.image_url) continue;
              let photo: UnsplashPhoto | null = null;
              const itemQuery = item.image_search_query;
              if (itemQuery) {
                photo = await unsplashSearch(itemQuery, itemOrient, iIdx).catch(() => null);
              }
              if (!photo && batch && batch.length) {
                photo = batch[iIdx % batch.length];
              }
              if (!photo) {
                photo = buildFallbackPhoto(itemCategory, iIdx + sIdx * 7, itemQuery || batchQuery, itemOrient);
              }
              applyPhoto(item, photo);
            }
          }),
      );
    }
  });

  // Cap concurrency at 6 (Unsplash demo: 50 req/hr).
  const chunkSize = 6;
  for (let i = 0; i < tasks.length; i += chunkSize) {
    await Promise.allSettled(tasks.slice(i, i + chunkSize));
  }

  const hydrated = sections.filter((s: { image_url?: string }) => s.image_url).length;
  console.log(`hydrateImages: ${hydrated}/${sections.length} sections (category=${category}, api=${apiAvailable})`);
}

async function persistSite(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  prompt: string,
  siteJson: unknown,
  _profile: { build_credits: number },
  _isUnlimited: boolean,
  _isAdmin: boolean,
  workspaceId?: string | null,
) {
  const name = (siteJson as { name?: string }).name || "Untitled Site";
  const { data: site, error: siteErr } = await supabase
    .from("sites")
    .insert({
      user_id: userId,
      name,
      prompt,
      site_data: siteJson,
      content: siteJson,
      workspace_id: workspaceId || null,
    })
    .select()
    .single();
  if (siteErr) {
    const msg = siteErr.message || "";
    if (msg.includes("storage_limit:sites")) {
      const parts = msg.split(":");
      throw new Error(`storage_limit:sites:${parts[2]}:${parts[3]}`);
    }
    throw new Error("Failed to save site");
  }
  return site;
}
