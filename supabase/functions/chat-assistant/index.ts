import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { messages, language } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

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
