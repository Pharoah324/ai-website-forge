// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logAiCallBg } from "../_shared/aiLog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

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
- Return 3-6 items per array (3-4 for clusters/automations) — be concise so the full JSON fits.
- trafficTrend: 6 months ending current month.
- Use the URL's apparent industry to tailor recommendations.
- Output JSON ONLY — start your response with { and end with }. No prose, no markdown fences.`;

async function callAI(url: string, integrations: Record<string, boolean>) {
  const userMsg = `Website: ${url}\nConnected: ${Object.entries(integrations)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ") || "none yet"}`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 16000,
      system: SYSTEM,
      messages: [
        { role: "user", content: userMsg },
      ],
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI provider ${resp.status}: ${t.slice(0, 300)}`);
  }
  const data = await resp.json();
  const text = (Array.isArray(data.content) ? data.content.find((b: { type?: string }) => b?.type === "text")?.text : "") ?? "";
  if (!text.trim()) throw new Error("AI returned an empty response");
  // Extract the JSON object even if wrapped in prose/fences, and guard against
  // truncated output (which would throw an opaque parse error).
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("AI did not return JSON: " + text.slice(0, 200));
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("Failed to parse AI JSON (likely truncated — try again)");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const startedAt = Date.now();
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

    // Plan + rate-limit gate (optimization runs cost 0 build credits today,
    // but still consume daily/hourly quota).
    const { data: gate, error: gateErr } = await supa.rpc("check_and_consume", {
      _uid: user.id,
      _action: "optimization_run",
      _credit_cost: 0,
    });
    if (gateErr) {
      console.error("gate error", gateErr);
      return new Response(JSON.stringify({ error: "Internal gate error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const g = gate as { ok: boolean; reason?: string; retry_after_seconds?: number; daily_limit?: number; plan?: string };
    if (!g.ok) {
      const status = g.reason === "daily_limit" || g.reason === "hourly_limit" || g.reason === "blocked" ? 429 : 403;
      if (g.reason === "no_credits") logAiCallBg({ fn: "analyze-website", userId: user.id, siteId: null, model: "claude-sonnet-4-5-20250929", durationMs: Date.now() - startedAt, success: false, errorMessage: "no_credits", tokensIn: 0, tokensOut: 0, meta: { http_status: status, limit_hit_reason: "no_credits" } });
      return new Response(JSON.stringify({
        error: g.reason ?? "blocked",
        plan: g.plan,
        retry_after_seconds: g.retry_after_seconds,
        daily_limit: g.daily_limit,
      }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supa
      .from("optimization_projects")
      .update({ status: "analyzing" })
      .eq("id", projectId);

    // If anything below fails, reset status to 'error' so the UI doesn't hang on
    // the "analyzing" spinner forever (and the user can re-run).
    let report;
    try {
      report = await callAI(project.website_url, project.integrations || {});

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
    } catch (inner) {
      await supa.from("optimization_projects").update({ status: "error" }).eq("id", projectId);
      throw inner;
    }

    logAiCallBg({ fn: "analyze-website", userId: user.id, siteId: null, model: "claude-sonnet-4-5-20250929", tokensIn: null, tokensOut: null, durationMs: Date.now() - startedAt, success: true, meta: { projectId } });
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
