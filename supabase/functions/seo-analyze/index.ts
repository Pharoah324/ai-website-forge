// Search Atlas SEO analysis for a generated site.
// Pulls top keywords for the detected industry/location, suggests blog topics,
// generates SEO-optimized meta title/description, computes an SEO score (0-100).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logAiCallBg } from "../_shared/aiLog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SEARCH_ATLAS_API_KEY = Deno.env.get("SEARCH_ATLAS_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type Keyword = { keyword: string; volume: number; difficulty?: number };

async function fetchSearchAtlasKeywords(
  industry: string,
  location: string,
): Promise<Keyword[]> {
  if (!SEARCH_ATLAS_API_KEY) return [];
  const seed = `${industry} ${location}`.trim();
  try {
    // Search Atlas keyword research endpoint (Otto / Keyword Researcher v2).
    // Endpoint shape may vary by account; we degrade gracefully on failure.
    const r = await fetch(
      "https://api.searchatlas.com/api/v2/keyword-researcher/keyword-suggestions/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SEARCH_ATLAS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword: seed, location_name: location || "United States", language_code: "en", limit: 15 }),
      },
    );
    if (!r.ok) {
      console.warn("Search Atlas error", r.status, await r.text().catch(() => ""));
      return [];
    }
    const j = await r.json();
    const list = (j.results || j.data || j.keywords || []) as any[];
    return list.slice(0, 15).map((k) => ({
      keyword: k.keyword || k.term || k.text || String(k),
      volume: Number(k.search_volume ?? k.volume ?? k.monthly_searches ?? 0),
      difficulty: k.keyword_difficulty ?? k.difficulty ?? undefined,
    })).filter((k) => k.keyword);
  } catch (e) {
    console.warn("Search Atlas fetch failed", e);
    return [];
  }
}

async function aiSuggest(payload: {
  business: string;
  tagline: string;
  prompt: string;
  keywords: Keyword[];
}) {
  const kwList = payload.keywords.map((k) => `${k.keyword} (${k.volume}/mo)`).join(", ") || "(none)";
  const sys = `You are an SEO strategist. Return strict JSON with keys: industry, location, meta_title (<=60 chars), meta_description (<=160 chars), blog_topics (array of 5 short blog post titles targeting the keywords). Use the same language as the business copy.`;
  const user = `Business: ${payload.business}
Tagline: ${payload.tagline}
Original prompt: ${payload.prompt}
Top keywords from Search Atlas: ${kwList}

Return JSON only.`;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: sys,
      messages: [
        { role: "user", content: user },
      ],
    }),
  });
  if (!r.ok) throw new Error(`AI ${r.status}`);
  const j = await r.json();
  const txt = (Array.isArray(j.content) ? j.content.find((b: { type?: string }) => b?.type === "text")?.text : "") || "{}";
  // Claude may wrap JSON in ```json fences — strip before parsing.
  const cleaned = txt.replace(/^```(?:json)?/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(cleaned); } catch { return {}; }
}

function computeScore(args: {
  hasKeywords: boolean;
  metaTitleLen: number;
  metaDescLen: number;
  contentText: string;
  keywords: Keyword[];
}) {
  let s = 40;
  if (args.metaTitleLen >= 30 && args.metaTitleLen <= 60) s += 15;
  else if (args.metaTitleLen > 0) s += 7;
  if (args.metaDescLen >= 110 && args.metaDescLen <= 160) s += 15;
  else if (args.metaDescLen > 0) s += 7;
  if (args.hasKeywords) s += 10;
  const lc = args.contentText.toLowerCase();
  const matches = args.keywords.filter((k) => lc.includes(k.keyword.toLowerCase())).length;
  s += Math.min(20, matches * 4);
  return Math.max(0, Math.min(100, s));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const startedAt = Date.now();
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const siteId: string = body.site_id;
    if (!siteId) return new Response(JSON.stringify({ error: "site_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: site, error: siteErr } = await supabase.from("sites").select("*").eq("id", siteId).maybeSingle();
    if (siteErr || !site) return new Response(JSON.stringify({ error: "Site not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const content = (site.site_data || site.content || {}) as any;
    const allText = JSON.stringify(content);

    // First pass: ask AI to extract industry+location from prompt+content.
    const seedAI = await aiSuggest({
      business: content.name || site.name,
      tagline: content.tagline || "",
      prompt: site.prompt || "",
      keywords: [],
    });
    logAiCallBg({ fn: "seo-analyze", userId: u.user.id, siteId, model: "claude-sonnet-4-5-20250929", tokensIn: null, tokensOut: null, durationMs: Date.now() - startedAt, success: true, meta: { pass: "seed" } });
    const industry: string = seedAI.industry || "small business";
    const location: string = seedAI.location || "";

    const keywords = await fetchSearchAtlasKeywords(industry, location);

    // Second pass with real keywords for meta+blog topics.
    const finalAI = keywords.length
      ? await aiSuggest({
          business: content.name || site.name,
          tagline: content.tagline || "",
          prompt: site.prompt || "",
          keywords,
        })
      : seedAI;
    if (keywords.length) logAiCallBg({ fn: "seo-analyze", userId: u.user.id, siteId, model: "claude-sonnet-4-5-20250929", tokensIn: null, tokensOut: null, durationMs: Date.now() - startedAt, success: true, meta: { pass: "final" } });

    const meta_title: string = (finalAI.meta_title || `${content.name || site.name} | ${content.tagline || ""}`).slice(0, 60);
    const meta_description: string = (finalAI.meta_description || content.tagline || "").slice(0, 160);
    const blog_topics: string[] = Array.isArray(finalAI.blog_topics) ? finalAI.blog_topics.slice(0, 5) : [];

    const score = computeScore({
      hasKeywords: keywords.length > 0,
      metaTitleLen: meta_title.length,
      metaDescLen: meta_description.length,
      contentText: allText,
      keywords,
    });

    const { error: upErr } = await supabase.from("site_seo").upsert({
      site_id: siteId,
      user_id: u.user.id,
      score,
      meta_title,
      meta_description,
      keywords,
      blog_topics,
      industry,
      location,
      source: keywords.length ? "search_atlas" : "ai_only",
    }, { onConflict: "site_id" });
    if (upErr) throw upErr;

    return new Response(JSON.stringify({
      ok: true,
      score, meta_title, meta_description, keywords, blog_topics, industry, location,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("seo-analyze error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
