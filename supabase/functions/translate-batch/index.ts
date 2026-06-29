// Translate an array of short UI strings into a target language using
// Anthropic Claude. Public, no JWT required — so guarded by input caps (Layer 1)
// and a fail-closed global daily breaker (Layer 2).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Layer 1 input caps (client batches <=40 short strings; these are generous headroom).
const MAX_ITEMS = 60;
const MAX_TOTAL_CHARS = 20_000;
const MAX_ITEM_CHARS = 5_000;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { texts, target, sourceHint } = await req.json();
    if (!Array.isArray(texts) || !target) {
      return new Response(JSON.stringify({ error: "Bad request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (target === "en" || texts.length === 0) {
      return new Response(JSON.stringify({ translations: texts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Layer 1 — input caps. BEFORE any Anthropic call. Bounds per-call cost; an
    // oversized payload is rejected here (and never reaches the breaker/Anthropic).
    const totalChars = texts.reduce((n: number, s: unknown) => n + (typeof s === "string" ? s.length : 0), 0);
    if (
      texts.length > MAX_ITEMS ||
      totalChars > MAX_TOTAL_CHARS ||
      texts.some((s: unknown) => typeof s === "string" && s.length > MAX_ITEM_CHARS)
    ) {
      return new Response(JSON.stringify({ error: "payload_too_large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sys =
      `You are a professional UI translator. Translate each item in the JSON array from ${sourceHint || "English"} to language code "${target}". ` +
      `Preserve placeholders like {n}, HTML entities, emojis, and surrounding whitespace exactly. ` +
      `Keep brand names ("Virtual Engine Builder", "Lovable", "GoHighLevel", "Search Atlas", "Base44") in English. ` +
      `Return ONLY a JSON array of strings, same length and order, no commentary.`;

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
      return new Response(JSON.stringify({ error: "service_busy" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        temperature: 0.1,
        system: sys,
        messages: [
          { role: "user", content: JSON.stringify(texts) },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: t }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await res.json();
    const content: string = (Array.isArray(data.content)
      ? data.content.find((b: { type?: string }) => b?.type === "text")?.text
      : "") ?? "[]";
    let translations: string[] = texts;
    try {
      const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length === texts.length) {
        translations = parsed.map((s: unknown, i: number) =>
          typeof s === "string" ? s : texts[i],
        );
      }
    } catch { /* fall back to originals */ }

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
