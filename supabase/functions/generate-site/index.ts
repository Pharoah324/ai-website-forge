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

    let voiceAddon = "";
    if (profile.brand_voice_active) {
      const rules = Array.isArray(profile.voice_rules) ? profile.voice_rules : null;
      if (rules && rules.length) {
        voiceAddon = `\n\nWrite all copy following this brand voice. Rules:\n- ${rules.join("\n- ")}`;
      } else if (profile.brand_voice_samples) {
        voiceAddon = `\n\nWrite all copy mirroring the tone of these samples:\n${String(profile.brand_voice_samples).slice(0, 2000)}`;
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
      try { await hydrateImages(parsed); } catch (e) { console.warn("hydrateImages failed (continuing without images):", e); }
      const site = await persistSite(supabase, user.id, prompt, parsed, profile, isUnlimited, isAdmin);
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

          try { await hydrateImages(parsed); } catch (e) { console.warn("hydrateImages failed (continuing without images):", e); }

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

// ----- Unsplash hydration -----
const unsplashCache = new Map<string, { regular: string; thumb: string; alt: string; credit: string } | null>();

async function unsplashSearch(query: string, orientation: "landscape" | "portrait" | "squarish" = "landscape") {
  if (!UNSPLASH_ACCESS_KEY || !query) return null;
  const cacheKey = `${orientation}:${query}`;
  if (unsplashCache.has(cacheKey)) return unsplashCache.get(cacheKey)!;
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=1&content_filter=high`;
    const r = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        "Accept-Version": "v1",
      },
    });
    if (!r.ok) {
      console.warn("unsplash error", r.status, query);
      unsplashCache.set(cacheKey, null);
      return null;
    }
    const data = await r.json();
    const photo = data?.results?.[0];
    if (!photo) {
      unsplashCache.set(cacheKey, null);
      return null;
    }
    const result = {
      regular: photo.urls.regular,
      thumb: photo.urls.thumb,
      alt: photo.alt_description || query,
      credit: `Photo by ${photo.user?.name || "Unsplash"} on Unsplash`,
    };
    unsplashCache.set(cacheKey, result);
    return result;
  } catch (e) {
    console.warn("unsplash exception", e);
    unsplashCache.set(cacheKey, null);
    return null;
  }
}

async function hydrateImages(siteJson: unknown) {
  if (!siteJson || typeof siteJson !== "object") return;
  if (!UNSPLASH_ACCESS_KEY) {
    console.log("hydrateImages: UNSPLASH_ACCESS_KEY not set, skipping image hydration");
    return;
  }
  // deno-lint-ignore no-explicit-any
  const site = siteJson as any;
  const sections = Array.isArray(site.sections) ? site.sections : [];

  // Run a bounded number of parallel queries to avoid Unsplash rate limits (50/hour demo).
  const tasks: Array<Promise<void>> = [];

  for (const sec of sections) {
    if (sec?.image_search_query && sec?.image_placement !== "none") {
      const orientation = sec.image_placement === "background" || sec.type === "hero" ? "landscape" : "landscape";
      tasks.push(unsplashSearch(sec.image_search_query, orientation).then((r) => {
        if (r) {
          sec.image_url = r.regular;
          sec.image_thumb = r.thumb;
          sec.image_alt = r.alt;
          sec.image_credit = r.credit;
        }
      }));
    }
    if (Array.isArray(sec?.items)) {
      for (const item of sec.items) {
        if (item?.image_search_query) {
          const orient = sec.type === "testimonials" ? "squarish" : "landscape";
          tasks.push(unsplashSearch(item.image_search_query, orient).then((r) => {
            if (r) {
              item.image_url = r.regular;
              item.image_thumb = r.thumb;
              item.image_alt = r.alt;
              item.image_credit = r.credit;
            }
          }));
        }
      }
    }
  }

  // Cap concurrency at 8
  const chunkSize = 8;
  for (let i = 0; i < tasks.length; i += chunkSize) {
    await Promise.all(tasks.slice(i, i + chunkSize));
  }
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
) {
  const name = (siteJson as { name?: string }).name || "Untitled Site";
  const { data: site, error: siteErr } = await supabase
    .from("sites")
    .insert({ user_id: userId, name, prompt, content: siteJson })
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
