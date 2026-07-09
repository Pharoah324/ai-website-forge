import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logAiCallBg } from "../_shared/aiLog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Read the service role key. Supabase still injects SUPABASE_SERVICE_ROLE_KEY
// as a default secret even though it shows "deprecated" in the UI.
// Check it first, then fall back to our custom SVC_ROLE_KEY secret.
function getServiceRoleKey(): string {
  const a = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (a && a.trim()) return a.trim();
  const b = Deno.env.get("SVC_ROLE_KEY");
  if (b && b.trim()) return b.trim();
  const secretsJson = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretsJson) {
    try { const p = JSON.parse(secretsJson); if (p?.service_role) return p.service_role; } catch { /**/ }
  }
  return "";
}
const SUPABASE_SERVICE_ROLE_KEY = getServiceRoleKey();
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

VISUAL STYLE (REQUIRED — set theme.style + theme.accent2):
Pick the ONE style that best matches the business so the site feels best-in-class and instantly relatable to what the client wants:
- "vibrant" — bold gradient/mesh hero, glowing gradient CTAs, big rounded cards. Best for: tech/SaaS/apps, startups, creative, fitness, e-commerce, anything energetic or youthful.
- "glass" — frosted glassmorphism, subtle gradients, crisp depth, sleek. Best for: software, fintech, modern services, B2B, "techy" or premium-modern brands.
- "editorial" — large serif display type, generous whitespace, refined soft shadows, restrained palette, photography-forward. Best for: luxury, restaurants, hospitality, wellness, beauty, law, real estate, high-end personal brands.
Also ALWAYS set theme.accent2: a second HSL triple (complementary or analogous to primary) used for gradient CTAs and the hero mesh — pick one that harmonizes with primary.

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

LAYOUT ARCHITECTURE BY INDUSTRY:
Detect the industry from the user's prompt and apply the matching architecture below. Each industry MUST feel structurally distinct — never reuse another industry's section order, hero style, feature presentation, or testimonial treatment. Use the layout/image_placement fields and section ordering described to enforce this.

RESTAURANT / CAFE / FOOD — Editorial magazine, asymmetric, warm:
1) hero (image-background, full-bleed atmospheric photo, centered headline, reservation CTA)
2) features "Tonight's Menu" (cards-3, 3 dishes w/ photos, name, one-line desc)
3) gallery (asymmetric grid: large left + two stacked right)
4) about (image-left founder photo, intimate narrative)
5) press/awards strip (horizontal logo bar / star ratings)
6) testimonials (quotes layout, 2 large italic serif pull-quotes, NO cards)
7) cta hours + reservation (dark background, warm accent)
Backgrounds: cream → terracotta → cream → dark.

MEDICAL / MEDSPA / HEALTHCARE / DENTAL — Clinical luxury, clean, trustworthy:
1) hero (image-right, photo 60% / headline+CTA 40%, lots of white space)
2) stats trust bar (4 credentials: board certified, years, patients, rating)
3) features treatments (cards-3, subtle icons, name + one-line benefit)
4) "Your Journey" 3-step horizontal process (Consult → Treatment → Results)
5) before/after results (photo-forward)
6) about provider (image-left professional photo, credentials, statement)
7) cta booking (soft background, prominent calendar button)
Backgrounds: white → soft tint → white throughout.

FITNESS / GYM / CROSSFIT / MARTIAL ARTS — Dark, aggressive, motivating:
1) hero (image-background dark, action photo, large aggressive headline, NO subhead)
2) stats strip (4 numbers: members, classes/week, coaches, years)
3) features programs (cards-3, dark background, bold names, intensity badge)
4) "A Day at [GYM]" schedule preview with time slots (list)
5) testimonials transformations (2-3 member stories with metrics: lbs lost, PRs)
6) team coaches (avatars in a row, name + specialty only)
7) pricing (3 tiers, dark cards, most popular highlighted)
8) cta free trial (full-width, maximum urgency)
Backgrounds: stay dark throughout.

REAL ESTATE / REALTOR / PROPERTY — Trustworthy, local, results-driven:
1) hero (property photo, outcome-focused headline)
2) stats market (4 numbers: homes sold, avg DOM, list/sale ratio, reviews)
3) features "How I Help" (cards-3 columns Buyers/Sellers/Investors, distinct CTA each)
4) gallery featured listings (2-3 property cards w/ photo, beds/baths, price)
5) about agent (image-left large pro photo, story-driven, local credibility)
6) gallery video / virtual tour
7) testimonials (cards-3 w/ family names + transaction type)
8) contact (map + form side by side)

LAW FIRM / ATTORNEY / LEGAL — Navy dominant, gold accents, serif, gravitas:
1) hero (image-background dark navy, minimal text, ONE powerful headline, ONE CTA)
2) features practice areas (list-with-icons VERTICAL list, NOT 3-column cards)
3) features "Why clients choose us" (grid 2x2, 4 differentiators)
4) team attorneys (horizontal cards w/ photo, name, bar admissions, specialty)
5) stats case results (3 anonymized verdicts with amounts)
6) testimonials (quotes, 2 long-form quotes, full name + matter type)
7) faq accordion (4-6 questions)
8) cta free consultation (phone number prominently displayed)
Backgrounds: white → navy → white → navy.

CONTRACTOR / HVAC / PLUMBER / ELECTRICIAN — Trustworthy, urgent, local:
1) hero (urgency focused, phone number IN hero, 24/7 badge)
2) features "Why choose us" (4 trust icons: Licensed, Insured, Warranty, 24/7)
3) features services (list-with-icons, NOT cards, brief descriptions)
4) "How it works" 3 steps (Call → We Arrive → Fixed)
5) gallery projects (3-4 before/after photos)
6) testimonials reviews (cards-3 w/ star ratings, first name + city)
7) contact service area (map or city list)
8) cta emergency (red/urgent, phone number large, available now)

BEAUTY / SALON / HAIR / NAILS — Editorial, aspirational, feminine but distinctive:
1) hero (image-background full-bleed editorial, model/results photo)
2) pricing services menu (price list format with categories Hair/Color/Treatments, NOT cards)
3) gallery "The experience" (3 photos in horizontal filmstrip)
4) gallery featured work (masonry grid, 5-6 photos)
5) team (avatars circular headshots, name + specialty)
6) testimonials (Instagram-style quote cards)
7) cta booking (calendar embed / prominent booking button)

E-COMMERCE / PRODUCT / BRAND — Product-forward editorial, authentic:
1) hero (image-right product image, value prop left, buy CTA prominent)
2) features "Why it's different" (cards-3 w/ close-up photos)
3) gallery bestsellers (horizontal scroll product row, name + price)
4) about founder story (image-left, conversational, origin narrative)
5) stats social proof (review count + star rating + 3 verified reviews)
6) about "How it's made" / sustainability (process/values)
7) cta final (free shipping threshold, return policy, buy now)

WELLNESS / YOGA / MASSAGE / HOLISTIC — Soft, organic, unhurried:
1) hero (image-background soft nature/studio, gentle headline, NO urgency)
2) about philosophy (full-width quote / mission in large italic serif)
3) features services (cards-3 w/ soft rounded corners, gentle icons)
4) "Your practice" timeline / journey of transformation
5) about practitioner (image-left warm personal photo in natural setting)
6) testimonials community (handwritten-note / soft card style)
7) features schedule / upcoming classes (list)
8) cta gentle ("Begin your journey" not "Book now")
Backgrounds: cream → white → sage → white (stay soft).

COACHING / CONSULTING / ADVISOR — Personal brand, authority, transformation:
1) hero (image-right LARGE personal photo, bold transformation headline)
2) features "Who I work with" (cards-3 client avatars/personas)
3) about the problem (agitate pain points)
4) features the solution / methodology (3-4 steps or pillars, numbered)
5) testimonials results (2-3 case studies with specific outcomes)
6) about credibility + story
7) press podcast/media strip (if applicable)
8) cta application ("Apply to work with me" not "Contact")

TECH / SAAS / SOFTWARE / APP — Clean, product-screenshot forward, conversion-optimized:
1) hero (image-right product screenshot/demo, benefit headline, free trial CTA, social proof)
2) press logo bar ("trusted by" companies)
3) features alternating image-left/image-right rows w/ product screenshots (NOT 3-column cards)
4) "How it works" 3-step numbered process
5) pricing (3 tiers, monthly/annual toggle)
6) press integration logos ("works with your stack")
7) testimonials (company name, role, metric achieved)
8) cta final (free trial, no credit card required)
Backgrounds: white → light gray → white → dark.

CREATIVE AGENCY / DESIGN / MARKETING — Dark, editorial, type-forward, portfolio-centric:
1) hero (dark, BOLD statement headline, NO hero image — type dominates, image_placement "none")
2) gallery work/portfolio (3 case study cards: client, category, result)
3) features services (list style, NOT cards)
4) "How we work" 3 phases (Discover / Design / Deploy)
5) press client logos grid
6) team (editorial headshots, role + one quirky fact)
7) press awards/recognition strip
8) cta new business ("Tell us about your project")

CRITICAL LAYOUT RULES:
- NEVER use the same section order for different industries — the skeleton must feel architecturally distinct.
- VARY the hero: restaurant full-bleed centered; medical split 60/40; fitness full-bleed dark; law minimal dark one-headline; tech product-screenshot right; coaching personal-photo dominant; agency type-only no image.
- VARY feature presentation: some industries use cards-3, others list-with-icons vertical, others alternating image-left/image-right rows, others numbered steps, others a price-list. NEVER default to 3-column cards for every industry.
- VARY testimonial style: restaurant large italic pull-quotes; fitness transformation w/ metrics; law formal anonymized; wellness soft handwritten; tech company+role+metric. NEVER use identical card style across industries.
- SECTION COUNT varies: simple local 6-7; restaurant 7-8; saas/tech 8-9; law/medical 7-8; e-commerce 7-8.
- BACKGROUND ALTERNATION matches mood (see per-industry notes above).

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
  name: "build_site",
  description: "Build a structured website definition.",
  input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        tagline: { type: "string" },
        lang: { type: "string" },
        dir: { type: "string", enum: ["ltr", "rtl"] },
        ui: {
          type: "object",
          description: "Localized labels for static UI chrome (contact form, footer, etc.) in the site's language. ALL values must be in the same language as the rest of the copy.",
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
            accent2: { type: "string", description: "Second accent as a raw HSL triple, complementary/analogous to primary — used for gradient CTAs and hero meshes. e.g. '280 70% 55%'." },
            style: { type: "string", enum: ["vibrant", "glass", "editorial"], description: "Overall visual style chosen to best fit the business (see VISUAL STYLE rules)." },
          },
          required: ["primary", "background", "foreground", "accent", "style", "accent2"],
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
};

// Rotating visual directions so generated sites don't all converge on the same
// skeleton. One is chosen at random per build and layered on top of the industry
// architecture — it shifts palette mood, typography, hero treatment, section
// rhythm and shape language. It does NOT lower the copy/quality bar.
const DESIGN_DIRECTIONS: string[] = [
  "MINIMAL & AIRY: lots of negative space, thin-to-regular type weights, near-monochrome palette + ONE restrained accent, a centered or simple split hero, mostly 'stacked' and 'list' layouts, square or barely-rounded corners, no heavy card shadows.",
  "BOLD EDITORIAL: oversized magazine headlines with strong size contrast, an 'image-background' hero, asymmetric composition, alternating image-left/image-right feature rows instead of card grids, one vivid accent used confidently.",
  "WARM & ORGANIC: earthy/natural palette, soft large corner radius, friendly rounded sans, gentle alternating image-left/right sections, soft shadows, unhurried spacing — approachable rather than corporate.",
  "MODERN PRODUCT/TECH: crisp neutral base with a cool accent, tight grid, an 'image-right' product-style hero, alternating feature rows, a clean stats strip, medium-rounded cards.",
  "VIBRANT & PLAYFUL: saturated colors and/or a gradient accent, big rounded shapes, energetic 'cards-3' feature grids, bold buttons — high energy but still legible.",
  "ELEGANT & LUXE: deep/dark or muted sophisticated palette, serif or high-contrast display headings with a refined sans body, a gallery-forward layout, a metallic/muted accent, restrained spacing and thin dividers.",
  "CONFIDENT & TYPE-FORWARD: type dominates — prefer a hero with image_placement 'none' where the headline carries the page, high contrast, big blocks, minimal decoration, imagery only where it adds meaning.",
  "STRUCTURED & TRUSTWORTHY: classic professional layout, blue/neutral palette, clear hierarchy, a visible stats/trust bar, 'cards-3' features, predictable rhythm — built to reassure.",
];

async function verifySecrets() {
  const required = [
    "ANTHROPIC_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const optional = ["UNSPLASH_ACCESS_KEY"];
  const checks: Record<string, { present: boolean; valid?: boolean; detail?: string }> = {};
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const k of required) {
    const v = Deno.env.get(k);
    const present = !!(v && v.trim());
    checks[k] = { present };
    if (!present) missing.push(k);
  }
  for (const k of optional) {
    const v = Deno.env.get(k);
    checks[k] = { present: !!(v && v.trim()) };
  }

  // Live-validate ANTHROPIC_API_KEY against the Anthropic API.
  const ak = Deno.env.get("ANTHROPIC_API_KEY");
  if (ak && ak.trim()) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ak,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 1,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      const txt = await r.text();
      if (r.ok) {
        checks.ANTHROPIC_API_KEY.valid = true;
      } else {
        checks.ANTHROPIC_API_KEY.valid = false;
        checks.ANTHROPIC_API_KEY.detail = `anthropic ${r.status}: ${txt.slice(0, 200)}`;
        if (r.status === 401 || r.status === 403) invalid.push("ANTHROPIC_API_KEY");
        else if (r.status === 429) checks.ANTHROPIC_API_KEY.detail = "rate_limited";
      }
    } catch (e) {
      checks.ANTHROPIC_API_KEY.valid = false;
      checks.ANTHROPIC_API_KEY.detail = `network: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  const ok = missing.length === 0 && invalid.length === 0;
  return { ok, missing, invalid, checks };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Public health/verify endpoint — no auth required so it's diagnosable
  // even when auth is the problem. Triggered by GET, ?verify=1, or path /verify.
  const url = new URL(req.url);
  if (
    req.method === "GET" ||
    url.searchParams.get("verify") === "1" ||
    url.pathname.endsWith("/verify")
  ) {
    const result = await verifySecrets();
    return new Response(JSON.stringify(result, null, 2), {
      status: result.ok ? 200 : 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const startedAt = Date.now();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY || !ANTHROPIC_API_KEY.trim()) {
      console.error("[generate-site] ANTHROPIC_API_KEY is missing.");
      return new Response(JSON.stringify({
        error: "AI provider not configured",
        detail: "ANTHROPIC_API_KEY is missing.",
        code: "missing_api_key",
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[generate-site] Service role key is not set — cannot save sites. Check SUPABASE_SECRET_KEYS or SUPABASE_SERVICE_ROLE_KEY secret.");
      return new Response(JSON.stringify({ error: "Server misconfiguration: service role key missing" }), {
        status: 500,
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
      if (g.reason === "no_credits") logAiCallBg({ fn: "generate-site", userId: user.id, siteId: null, model: "claude-sonnet-4-5-20250929", durationMs: Date.now() - startedAt, success: false, errorMessage: "no_credits", tokensIn: 0, tokensOut: 0, meta: { http_status: status, limit_hit_reason: "no_credits" } });
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
      ? `\n\nIMPORTANT: Write ALL copy in ${langName}, including the "ui" object (contact form placeholders, "Send", "Sending…", "Thank you!", "We'll be in touch within 24 hours.", "We'll confirm your reservation by phone or email.", "Support", "Get in touch", "Tell us what you need…", "Get started"). Always populate "ui" with natural ${langName} translations of every label. (image_search_query fields stay in English.)${rtlNote}`
      : `\n\nAlways populate the "ui" object with English labels for the contact form, footer, and CTAs.`;

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

    // Pick a random visual direction so no two builds feel identical.
    const designDirection = DESIGN_DIRECTIONS[Math.floor(Math.random() * DESIGN_DIRECTIONS.length)];
    userMessage += `\n\nDESIGN DIRECTION FOR THIS BUILD — make this site look visually distinct from other generated sites by applying this aesthetic:\n${designDirection}\nAdapt it to suit the business: where the industry has strong conventions (e.g. law = gravitas, medical = clinical) keep the palette/mood appropriate, but ALWAYS vary the structural treatment — hero style, section ordering, feature presentation (cards vs list vs alternating rows vs steps), spacing and shape language — so the result does not default to the same generic skeleton. Honor all quality, language and funnel rules.`;

    const aiBody = {
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      system: SYSTEM_PROMPT + voiceAddon,
      messages: [
        { role: "user", content: userMessage },
      ],
      tools: [{
        name: TOOL.name,
        description: TOOL.description,
        input_schema: TOOL.input_schema,
      }],
      tool_choice: { type: "tool", name: TOOL.name },
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
      const t = await aiResp.text();
      console.error("[generate-site] Anthropic API error", {
        status: aiResp.status,
        statusText: aiResp.statusText,
        body: t.slice(0, 2000),
      });
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({
          error: "Rate limited. Try again in a moment.",
          detail: t.slice(0, 500),
        }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResp.status === 401 || aiResp.status === 403) {
        return new Response(JSON.stringify({
          error: "Invalid Anthropic API key",
          detail: t.slice(0, 500),
          code: "invalid_api_key",
        }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({
        error: "AI provider error",
        detail: t.slice(0, 500),
        provider_status: aiResp.status,
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!stream) {
      const data = await aiResp.json();
      // Anthropic returns content blocks; find the tool_use block
      const toolBlock = Array.isArray(data.content)
        ? data.content.find((b: { type?: string }) => b?.type === "tool_use")
        : null;
      const parsedInput = toolBlock?.input ?? null;
      if (!parsedInput) {
        return new Response(JSON.stringify({ error: "AI returned no site" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const parsed: unknown = parsedInput;
      try { sanitizeMarkdownImages(parsed); } catch (e) { console.warn("sanitizeMarkdownImages failed:", e); }
      try { await hydrateImages(parsed, prompt); } catch (e) { console.warn("hydrateImages failed (continuing without images):", e); }
      const site = await persistSite(admin, user.id, prompt, parsed, profile, isUnlimited, isAdmin, effectiveWorkspaceId);
      logAiCallBg({ fn: "generate-site", userId: user.id, siteId: site?.id ?? null, model: "claude-sonnet-4-5-20250929", tokensIn: data?.usage?.input_tokens ?? null, tokensOut: data?.usage?.output_tokens ?? null, durationMs: Date.now() - startedAt, success: true });
      return new Response(JSON.stringify({ site }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STREAMING
    unsplashDisabled = false;
    const reader = aiResp.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let leftover = "";
    let accumulated = "";

    const out = new ReadableStream({
      async start(controller) {
        let closed = false;
        const safeEnqueue = (chunk: Uint8Array) => {
          if (closed) return;
          try { controller.enqueue(chunk); } catch { /* controller already closed */ }
        };
        const send = (event: string, data: unknown) => {
          safeEnqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };
        // SSE keepalive — comment lines every 10s prevent the client's
        // 45s stall watchdog from tripping during long Anthropic pauses
        // or post-stream image hydration.
        const heartbeat = setInterval(() => {
          safeEnqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
        }, 10_000);

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
                // Anthropic streaming: tool_use input arrives via
                // content_block_delta events with delta.type === "input_json_delta".
                if (
                  evt.type === "content_block_delta" &&
                  evt.delta?.type === "input_json_delta" &&
                  typeof evt.delta.partial_json === "string" &&
                  evt.delta.partial_json.length
                ) {
                  const argChunk = evt.delta.partial_json;
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
            clearInterval(heartbeat);
            closed = true;
            try { controller.close(); } catch { /* noop */ }
            return;
          }

          try { sanitizeMarkdownImages(parsed); } catch (e) { console.warn("sanitizeMarkdownImages failed:", e); }
          try { await hydrateImages(parsed, prompt); } catch (e) { console.warn("hydrateImages failed (continuing without images):", e); }

          const site = await persistSite(
            admin,
            user.id,
            prompt || (templateDraft ? `Template: ${businessName || "Untitled"}` : ""),
            parsed,
            profile,
            isUnlimited,
            isAdmin,
            effectiveWorkspaceId,
          );
          send("done", { site });
          logAiCallBg({ fn: "generate-site", userId: user.id, siteId: site?.id ?? null, model: "claude-sonnet-4-5-20250929", tokensIn: null, tokensOut: null, durationMs: Date.now() - startedAt, success: true });
          clearInterval(heartbeat);
          closed = true;
          try { controller.close(); } catch { /* noop */ }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "stream error";
          console.error("stream error:", msg);
          send("error", { error: msg });
          clearInterval(heartbeat);
          closed = true;
          try { controller.close(); } catch { /* noop */ }
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
// If Unsplash returns 401/403 once, the key is bad — stop hammering it for
// the rest of this invocation. Saves 10–20s of dead requests per generation.
let unsplashDisabled = false;

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

// Industry anchor phrases prepended to vague/auto-built image queries so Unsplash
// returns on-topic photos even when the AI omits a per-item image_search_query.
// Keeps the business-specific terms but guarantees the *industry* is in the query.
const CATEGORY_QUERY_HINT: Record<string, string> = {
  medical:    "medical clinic",
  restaurant: "restaurant food",
  realestate: "real estate home",
  fitness:    "fitness gym",
  legal:      "law office professional",
  contractor: "home construction contractor",
  beauty:     "beauty salon",
  coaching:   "professional business",
  tech:       "modern technology abstract gradient",
  fashion:    "luxury menswear tailoring",
  retail:     "retail product",
  travel:     "travel destination",
  education:  "education learning",
  finance:    "finance office",
  garden:     "gardening lush plants vegetable garden",
  generic:    "",
};

function categorizeSite(site: { name?: string; tagline?: string }, prompt = ""): string {
  const text = `${site.name || ""} ${site.tagline || ""} ${prompt}`.toLowerCase();
  const buckets: Array<[string, RegExp]> = [
    ["medical",    /\b(medspa|medical|clinic|doctor|dental|dentist|health|wellness|chiro|therapy|botox|aesthetic|skincare|derma)\b/],
    // Garden/agriculture MUST be tested before restaurant — gardening apps routinely
    // say "grow your own food" / "kitchen garden", which the restaurant regex below
    // greedily matches on "food"/"kitchen", mislabeling them as restaurants.
    ["garden",     /\b(garden|gardening|gardener|grower|growers|grow your own|nursery|horticultur|landscap|lawn care|greenhouse|vegetable|veggie|orchard|permacultur|homestead|agricultur|botanical|seedling|houseplant|hydroponic)\b/],
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
  if (!UNSPLASH_ACCESS_KEY || !query || unsplashDisabled) return null;
  const cacheKey = `${orientation}:${perPage}:${query}`;
  if (unsplashCache.has(cacheKey)) return unsplashCache.get(cacheKey)!;
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=${perPage}&content_filter=high&order_by=relevant`;
    const r = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`, "Accept-Version": "v1" },
    });
    if (!r.ok) {
      console.warn("unsplash error", r.status, query);
      if (r.status === 401 || r.status === 403) {
        console.warn("unsplash key invalid — disabling for this invocation");
        unsplashDisabled = true;
      }
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
  const hint = CATEGORY_QUERY_HINT[category] || "";
  const apiAvailable = !!UNSPLASH_ACCESS_KEY;
  if (!apiAvailable) {
    console.log(`hydrateImages: UNSPLASH_ACCESS_KEY not set — using curated fallback (category=${category})`);
  }

  // Derive a business-context phrase to enrich vague queries.
  const bizContext: string = [site.name, site.tagline].filter(Boolean).join(" ").slice(0, 80);

  // Rotating banks of Savile Row / luxury menswear queries so repeated
  // sections (and gallery items) pull varied editorial imagery instead
  // of the same suit photo over and over.
  const FASHION_HERO = [
    "luxury bespoke suit man portrait editorial dark",
    "savile row tailored three piece suit gentleman",
    "tom ford style menswear editorial moody",
    "elegant gentleman tailored suit black background",
  ];
  const FASHION_ABOUT = [
    "savile row tailor atelier craftsmanship hands",
    "master tailor chalk fabric bespoke workshop",
    "luxury menswear atelier interior wood",
  ];
  const FASHION_FEATURES = [
    "bespoke tailoring fabric detail luxury menswear",
    "wool suit fabric texture macro luxury",
    "tailor measuring jacket lapel pins",
    "luxury silk lining suit jacket detail",
    "hand stitched buttonhole bespoke suit",
  ];
  const FASHION_GALLERY = [
    "bespoke wool suit jacket detail",
    "luxury silk pocket square folded",
    "mens bowtie black tie elegant",
    "polished leather oxford shoes mens",
    "silver cufflinks mens dress shirt",
    "luxury dress shirt collar detail",
    "tailor chalk marking suit fabric",
    "rolled fabric swatches bespoke tailor",
    "well dressed man tailored suit portrait",
    "leather brogues mens formal shoes",
    "neatly folded mens dress shirts",
    "vintage gentlemen tailoring tools scissors",
  ];
  const FASHION_TESTIMONIALS = [
    "well dressed gentleman portrait suit black background",
    "businessman tailored suit portrait elegant",
    "mature gentleman bespoke suit portrait",
  ];
  const FASHION_CTA = [
    "mens formal wear elegant editorial dark",
    "tuxedo black tie gentleman dramatic",
  ];
  const FASHION_CONTACT = [
    "tailor shop interior luxury menswear boutique",
    "haberdashery shop wood interior suits",
  ];
  // Clean, on-brand abstract/product imagery for tech/SaaS feature cards —
  // avoids the literal "type the feature title into Unsplash" trap that returns
  // random code screenshots, glasses, or photos with foreign on-screen text.
  const TECH_GALLERY = [
    "abstract 3d render gradient shapes",
    "minimal saas dashboard interface clean",
    "futuristic technology abstract blue purple",
    "modern app ui on laptop minimal desk",
    "data visualization abstract glowing",
    "geometric abstract tech gradient background",
    "cloud computing abstract minimal render",
    "soft 3d glass shapes gradient studio",
  ];
  const pick = (arr: string[], idx: number) => arr[Math.abs(idx) % arr.length];

  const fallbackForSection = (sec: { type?: string; heading?: string }, sIdx = 0) => {
    const h = (sec.heading || "").replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).slice(0, 4).join(" ");
    // Anchor with the industry hint so business names/taglines that contain
    // misleading words (e.g. a gardening tagline mentioning "food") don't pull
    // off-topic stock. Hint is "" for generic, so this is a no-op there.
    const base = [hint, bizContext || h].filter(Boolean).join(" ").trim();
    if (category === "fashion") {
      switch (sec.type) {
        case "hero": return pick(FASHION_HERO, sIdx);
        case "about": return pick(FASHION_ABOUT, sIdx);
        case "features": return pick(FASHION_FEATURES, sIdx);
        case "pricing": return "luxury suit jacket detail elegant editorial";
        case "testimonials": return pick(FASHION_TESTIMONIALS, sIdx);
        case "cta": return pick(FASHION_CTA, sIdx);
        case "contact": return pick(FASHION_CONTACT, sIdx);
        default: return `luxury menswear bespoke ${h}`.trim();
      }
    }
    switch (sec.type) {
      case "hero": return `${base} professional`;
      case "about": return `${base} team office`;
      case "features": return `${base} ${h || "service"}`;
      case "pricing": return `${base} workspace modern`;
      case "testimonials": return `${base} satisfied client professional portrait`;
      case "cta": return `${base} lifestyle`;
      case "contact": return `${base} location storefront`;
      default: return `${base} ${h}`.trim();
    }
  };

  // Models routinely hallucinate Unsplash photo IDs that don't exist (returning broken images
  // that render as alt text). We CANNOT trust any AI-supplied image URL — even if it points at
  // images.unsplash.com — so we always overwrite with verified search results / curated fallbacks.
  // Track every photo we've placed so the same image never repeats across
  // sections/items. The old code re-picked popular results by index, so one
  // hot shot could show up 4-5 times on a single site.
  const usedUrls = new Set<string>();
  const applyPhoto = (
    target: { image_url?: string; image_thumb?: string; image_alt?: string; image_credit?: string },
    photo: UnsplashPhoto,
  ) => {
    target.image_url = photo.regular;
    target.image_thumb = photo.thumb;
    target.image_alt = photo.alt;
    target.image_credit = photo.credit;
    usedUrls.add(photo.regular);
  };
  // Pick the first not-yet-used photo from a result set (wrapping from the
  // preferred index). All picks are synchronous, so the shared used-set has no
  // races even though hydration tasks run concurrently.
  const pickUnused = (photos: UnsplashPhoto[], preferredIdx = 0): UnsplashPhoto => {
    const n = photos.length;
    for (let k = 0; k < n; k++) {
      const p = photos[(preferredIdx + k) % n];
      if (!usedUrls.has(p.regular)) return p;
    }
    return photos[preferredIdx % n];
  };

  const tasks: Array<Promise<void>> = [];
  let fallbackCounter = 0;

  sections.forEach((sec: { type?: string; heading?: string; image_search_query?: string; image_placement?: string; layout?: string; image_url?: string; image_thumb?: string; image_alt?: string; image_credit?: string; items?: Array<{ image_search_query?: string; image_url?: string; image_thumb?: string; image_alt?: string; image_credit?: string; title?: string }> }, sIdx: number) => {
    if (sec.type === "hero") {
      // Only default a hero image when the model gave no placement. Respect an
      // explicit "none" so type-dominant / minimal heroes (a key part of design
      // variety) aren't forced into a background photo.
      if (!sec.image_placement) sec.image_placement = "background";
      if (!sec.layout) sec.layout = sec.image_placement === "none" ? "stacked" : "image-background";
    }

    if (sec.image_placement !== "none") {
      const query = sec.image_search_query || fallbackForSection(sec, sIdx);
      const orientation: "landscape" | "portrait" | "squarish" = "landscape";
      const fbIdx = fallbackCounter++;
      tasks.push(
        unsplashSearchMany(query, orientation, 10)
          .then((photos) => {
            if (photos && photos.length) applyPhoto(sec, pickUnused(photos, sIdx));
            else applyPhoto(sec, buildFallbackPhoto(category, sIdx + fbIdx, query, orientation));
          })
          .catch(() => applyPhoto(sec, buildFallbackPhoto(category, sIdx + fbIdx, query, orientation))),
      );
    }

    if (Array.isArray(sec.items) && sec.items.length) {
      const batchQuery = sec.image_search_query || fallbackForSection(sec, sIdx);
      const isTestimonials = sec.type === "testimonials";
      const itemOrient: "landscape" | "squarish" = isTestimonials ? "squarish" : "landscape";
      const itemCategory = isTestimonials ? "generic" : category;

      tasks.push(
        // Only fetch a batch for non-testimonial sections (testimonials use per-item queries)
        (isTestimonials ? Promise.resolve(null) : unsplashSearchMany(batchQuery, itemOrient, 10).catch(() => null))
          .then(async (batch) => {
            for (let iIdx = 0; iIdx < sec.items!.length; iIdx++) {
              const item = sec.items![iIdx];
              let photo: UnsplashPhoto | null = null;

              // Build item-level query — testimonials MUST have contextual per-item queries
              let itemQuery = item.image_search_query;
              // Tech/SaaS feature & gallery cards: literal per-feature queries
              // reliably return poor stock (code screenshots, photos with foreign
              // on-screen text). Override with curated clean-abstract imagery.
              if (!isTestimonials && category === "tech") {
                itemQuery = pick(TECH_GALLERY, iIdx + sIdx);
              }
              if (!itemQuery) {
                if (isTestimonials) {
                  // Use business context for testimonial avatars — NOT generic portraits
                  itemQuery = `${bizContext || "professional"} client satisfied portrait`;
                } else if (category === "fashion") {
                  itemQuery = pick(FASHION_GALLERY, iIdx + sIdx);
                } else {
                  // Gallery/results items with no AI-supplied query previously fell through
                  // to a vague batch query, then to off-topic fallback stock (e.g. a
                  // gardening "results" gallery showing restaurant food). Anchor the query
                  // to the site's industry (hint) + the item's own title (or the section
                  // heading) so each photo matches the actual subject.
                  const cleanTitle = (item.title || "").replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
                  const cleanHeading = (sec.heading || "").replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).slice(0, 5).join(" ");
                  itemQuery = [hint, cleanTitle || cleanHeading].filter(Boolean).join(" ").trim() || batchQuery;
                }
              }

              if (itemQuery) {
                const photos = await unsplashSearchMany(itemQuery, itemOrient, 10).catch(() => null);
                if (photos && photos.length) photo = pickUnused(photos, iIdx);
              }
              if (!photo && batch && batch.length) {
                photo = pickUnused(batch, iIdx);
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

  // Never persist an empty site. A site with no sections renders as a blank
  // shell (header + fallback contact) that can't be scrolled or refined back to
  // life — exactly the broken state we don't want to save.
  const secs = (siteJson as { sections?: unknown[] }).sections;
  if (!Array.isArray(secs) || secs.length === 0) {
    throw new Error("Generation produced no sections — not saved. Please try again.");
  }

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
    console.error("[persistSite] insert error:", JSON.stringify(siteErr));
    if (msg.includes("storage_limit:sites")) {
      const parts = msg.split(":");
      throw new Error(`storage_limit:sites:${parts[2]}:${parts[3]}`);
    }
    throw new Error("Failed to save site: " + msg);
  }

  // Snapshot the original as version 1 so every site always has a restore point
  // (refinements add v2, v3, …; users can always return to the first build).
  const { error: verErr } = await supabase.from("site_versions").insert({
    site_id: site.id,
    user_id: userId,
    version_number: 1,
    label: "Original",
    content: siteJson,
  });
  if (verErr) console.warn("[persistSite] initial version snapshot failed (non-fatal):", verErr.message);

  return site;
}
