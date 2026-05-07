// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SYSTEM = `You are an expert SEO + growth analyst for "Virtual Engine Builder", an AI business growth infrastructure platform.

Given a website URL and the connectors the customer has connected, return ONE JSON object with the following exact shape (no prose, no markdown). Be specific and actionable. If you don't have real data, produce realistic, plausible illustrative analysis based on the URL/domain — do NOT refuse.

{
  "scores": {
    "seo": number 0-100,
    "mobile": number 0-100,
    "speed": number 0-100,
    "conversion": number 0-100
  },
  "summary": string,
  "topPages": [{ "url": string, "clicks": number, "impressions": number, "ctr": number, "position": number }],
  "lowPages": [{ "url": string, "issue": string }],
  "keywordRankings": [{ "keyword": string, "position": number, "volume": number, "intent": "informational"|"commercial"|"transactional"|"navigational" }],
  "keywordOpportunities": [{ "keyword": string, "volume": number, "difficulty": number, "why": string }],
  "missingMetadata": [{ "url": string, "missing": string }],
  "missingAltText": [{ "url": string, "count": number }],
  "internalLinking": [{ "from": string, "to": string, "anchor": string }],
  "ctaSuggestions": [string],
  "contentGaps": [string],
  "suggestedServicePages": [string],
  "blogClusters": [{ "pillar": string, "posts": string[] }],
  "leadCapture": [string],
  "conversionOptimization": [string],
  "aiRecommendations": [{ "title": string, "body": string, "impact": "low"|"medium"|"high" }],
  "automationInsights": [{ "title": string, "body": string }],
  "trafficTrend": [{ "month": string, "organic": number, "direct": number, "referral": number }]
}

Rules:
- Return 5-10 items per array (3-6 for clusters/automations).
- trafficTrend: 6 months ending current month.
- Use the URL's apparent industry to tailor recommendations.
- Output JSON ONLY.`;

async function callLovableAI(url: string, integrations: Record<string, boolean>) {
  const userMsg = `Website: ${url}\nConnected: ${Object.entries(integrations)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ") || "none yet"}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = auth.replace("Bearer ", "");
    const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userRes } = await supa.auth.getUser(token);
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { projectId } = await req.json();
    if (!projectId) {
      return new Response(JSON.stringify({ error: "projectId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: project, error: pErr } = await supa
      .from("optimization_projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (pErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supa
      .from("optimization_projects")
      .update({ status: "analyzing" })
      .eq("id", projectId);

    const report = await callLovableAI(project.website_url, project.integrations || {});

    await supa.from("optimization_reports").insert({
      project_id: projectId,
      user_id: user.id,
      report,
    });

    await supa
      .from("optimization_projects")
      .update({
        status: "ready",
        latest_report: report,
        last_analyzed_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    return new Response(JSON.stringify({ ok: true, report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("analyze-website error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
