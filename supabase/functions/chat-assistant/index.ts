import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logAiCallBg } from "../_shared/aiLog.ts";

// Layer 1 input caps (a real support chat is short; generous headroom).
const MAX_MESSAGES = 40;
const MAX_TOTAL_CHARS = 12_000;
const MAX_MESSAGE_CHARS = 4_000;
// Tunable limits via env (placed out-of-band); defaults are safe fallbacks.
const envInt = (k: string, d: number) => {
  const n = Number(Deno.env.get(k));
  return Number.isFinite(n) && n > 0 ? n : d;
};
const IP_RATE_LIMIT = envInt("IP_RATE_LIMIT", 300);           // Layer 3: requests / window / IP
const IP_RATE_WINDOW_SECS = envInt("IP_RATE_WINDOW_SECS", 3600);
const DAILY_CALL_LIMIT = envInt("ANTHROPIC_DAILY_LIMIT", 5000); // Layer 2: global Anthropic calls / day

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the friendly support assistant for Virtual Engine Builder — an AI website builder available in 50+ languages worldwide that turns plain-English (or any language) business descriptions into live websites, funnels, and landing pages, with a native GoHighLevel integration. Be concise (2–4 sentences), warm, and helpful. Encourage the visitor to try the free tier (20 build credits, no credit card). If asked something off-topic, gently steer back to building their site.

LANGUAGE: Always reply in the SAME language the user wrote in. Auto-detect from their message. If the user opened the chat in a specific language (provided as the "language" hint), prefer that language unless their message is clearly in another. Supports every major world language (English, Spanish, Portuguese, French, German, Italian, Russian, Arabic, Hebrew, Persian, Urdu, Hindi, Bengali, Mandarin, Japanese, Korean, Thai, Vietnamese, Indonesian, Turkish, Swahili, and more).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const startedAt = Date.now();
    const { messages, language } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    // Layer 1 — input caps. BEFORE any Anthropic call. Bounds per-call cost on the
    // attacker-controlled message history; oversized payload rejected here.
    const msgs = Array.isArray(messages) ? messages : [];
    const totalChars = msgs.reduce((n: number, m: { content?: unknown }) => n + (typeof m?.content === "string" ? m.content.length : 0), 0);
    if (
      msgs.length > MAX_MESSAGES ||
      totalChars > MAX_TOTAL_CHARS ||
      msgs.some((m: { content?: unknown }) => typeof m?.content === "string" && m.content.length > MAX_MESSAGE_CHARS)
    ) {
      logAiCallBg({ fn: "chat-assistant", model: "claude-sonnet-4-5-20250929", durationMs: Date.now() - startedAt, success: false, errorMessage: "payload_too_large", tokensIn: 0, tokensOut: 0, meta: { http_status: 400, limit_hit_reason: "payload_too_large" } });
      return new Response(JSON.stringify({ error: "payload_too_large" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langHint = language ? `\n\nUser interface language hint: ${language}. Respond in this language unless the user clearly writes in another.` : "";

    // Client sends OpenAI-style {role, content} turns. Anthropic takes only
    // user/assistant roles (system is top-level) and must start with user.
    const convo = (Array.isArray(messages) ? messages : [])
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string");
    while (convo.length && convo[0].role !== "user") convo.shift();
    if (!convo.length) {
      return new Response(JSON.stringify({ error: "No message" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Layer 3 — per-IP throttle. BEFORE the global breaker, so an over-limit visitor
    // is rejected (429) WITHOUT bumping the global counter. FAIL-OPEN: on RPC error
    // or an unresolved client IP, fall through to the global breaker (fail-closed).
    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      null;
    if (clientIp) {
      try {
        const { data: ipres, error: ipErr } = await admin.rpc("bump_ip_calls", {
          _ip: clientIp, _limit: IP_RATE_LIMIT, _window_secs: IP_RATE_WINDOW_SECS,
        });
        if (ipErr) {
          console.error("[throttle] bump_ip_calls error (fail-open):", ipErr.message);
        } else if (ipres && (ipres as { over?: boolean }).over) {
          console.warn("[throttle] per-IP limit hit -> 429; count:", (ipres as { count?: number }).count);
          logAiCallBg({ fn: "chat-assistant", model: "claude-sonnet-4-5-20250929", durationMs: Date.now() - startedAt, success: false, errorMessage: "rate_limited", tokensIn: 0, tokensOut: 0, meta: { http_status: 429, limit_hit_reason: "rate_limited" } });
          return new Response(JSON.stringify({ error: "rate_limited" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        console.error("[throttle] bump_ip_calls threw (fail-open):", e instanceof Error ? e.message : String(e));
      }
    } else {
      console.warn("[throttle] no client IP resolved — skipping per-IP, relying on global breaker");
    }

    // Layer 2 — global daily circuit breaker. AFTER the per-IP check, BEFORE the
    // Anthropic call. FAIL-CLOSED: any RPC error / unexpected response, or over the
    // daily limit, returns 503 and does NOT call Anthropic (only runaway backstop).
    let allowed = false;
    try {
      const { data: brk, error: brkErr } = await admin.rpc("bump_ai_calls", { _limit: DAILY_CALL_LIMIT });
      if (brkErr) {
        console.error("[breaker] RPC error (fail-closed -> 503):", brkErr.message);
      } else if (brk && (brk as { ok?: boolean; over?: boolean }).ok) {
        if ((brk as { over?: boolean }).over) {
          console.warn("[breaker] daily Anthropic limit reached -> 503; count:", (brk as { count?: number }).count);
        } else {
          allowed = true;
        }
      } else {
        console.error("[breaker] unexpected RPC response (fail-closed -> 503):", JSON.stringify(brk));
      }
    } catch (e) {
      console.error("[breaker] RPC threw (fail-closed -> 503):", e instanceof Error ? e.message : String(e));
    }
    if (!allowed) {
      logAiCallBg({ fn: "chat-assistant", model: "claude-sonnet-4-5-20250929", durationMs: Date.now() - startedAt, success: false, errorMessage: "service_busy", tokensIn: 0, tokensOut: 0, meta: { http_status: 503, limit_hit_reason: "service_busy" } });
      return new Response(JSON.stringify({ error: "service_busy" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        system: SYSTEM_PROMPT + langHint,
        messages: convo,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("anthropic error", response.status, t);
      return new Response(JSON.stringify({ error: "AI provider error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform Anthropic SSE into the OpenAI-style delta SSE the client parses
    // (data: {choices:[{delta:{content}}]} ... data: [DONE]).
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let leftover = "";
    const out = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
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
              if (!line.startsWith("data:")) continue;
              const js = line.slice(5).trim();
              if (!js || js === "[DONE]") continue;
              try {
                const evt = JSON.parse(js);
                if (
                  evt.type === "content_block_delta" &&
                  evt.delta?.type === "text_delta" &&
                  typeof evt.delta.text === "string" &&
                  evt.delta.text.length
                ) {
                  send({ choices: [{ delta: { content: evt.delta.text } }] });
                }
              } catch { /* ignore keepalives / non-JSON */ }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          logAiCallBg({ fn: "chat-assistant", model: "claude-sonnet-4-5-20250929", tokensIn: null, tokensOut: null, durationMs: Date.now() - startedAt, success: true });
        } catch (e) {
          console.error("chat-assistant stream error", e);
        } finally {
          try { controller.close(); } catch { /* noop */ }
        }
      },
    });

    return new Response(out, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform" },
    });
  } catch (e) {
    console.error("chat-assistant error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
