// Translate an array of short UI strings into a target language using
// Anthropic Claude. Public, no JWT required.
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
