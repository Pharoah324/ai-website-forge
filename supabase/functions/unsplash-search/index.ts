// Lightweight Unsplash search proxy. Used as a fallback / for client-side
// re-fetch when generate-site couldn't hydrate an image.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    if (!UNSPLASH_ACCESS_KEY) {
      return new Response(JSON.stringify({ error: "UNSPLASH_ACCESS_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = await req.json().catch(() => ({}));
    const query = String(body.query || "").slice(0, 200).trim();
    const orientation = ["landscape", "portrait", "squarish"].includes(body.orientation)
      ? body.orientation
      : "landscape";
    if (!query) {
      return new Response(JSON.stringify({ error: "query required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=1&content_filter=high`;
    const r = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: "unsplash error", status: r.status, detail: t.slice(0, 500) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await r.json();
    const photo = data?.results?.[0];
    if (!photo) {
      return new Response(JSON.stringify({ result: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({
      result: {
        regular: photo.urls.regular,
        thumb: photo.urls.thumb,
        alt: photo.alt_description || query,
        credit: `Photo by ${photo.user?.name || "Unsplash"} on Unsplash`,
        link: photo.links?.html,
      },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
