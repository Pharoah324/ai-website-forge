import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Octokit } from "https://esm.sh/@octokit/rest@21.0.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_NAME = "Virtual Engine Builder";

// ---- helpers ----

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function slugify(s: string): string {
  return (s || "site")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "site";
}

function renderSection(s: any): string {
  const heading = escapeHtml(s.heading || "");
  const subheading = s.subheading ? `<p class="sub">${escapeHtml(s.subheading)}</p>` : "";
  const cta = s.cta ? `<a class="cta" href="#">${escapeHtml(s.cta)}</a>` : "";
  const items = Array.isArray(s.items) && s.items.length
    ? `<ul class="items">${s.items.map((it: any) => `
        <li>
          <h3>${escapeHtml(it.title || "")}</h3>
          ${it.body ? `<p>${escapeHtml(it.body)}</p>` : ""}
          ${it.price ? `<p class="price">${escapeHtml(it.price)}</p>` : ""}
          ${it.author ? `<p class="author">— ${escapeHtml(it.author)}</p>` : ""}
        </li>`).join("")}</ul>`
    : "";
  return `<section class="section section-${escapeHtml(s.type || "block")}">
    <div class="container">
      <h2>${heading}</h2>
      ${subheading}
      ${items}
      ${cta}
    </div>
  </section>`;
}

function buildHtml(content: any): string {
  const name = escapeHtml(content?.name || "Untitled site");
  const tagline = escapeHtml(content?.tagline || "");
  const sections = Array.isArray(content?.sections) ? content.sections.map(renderSection).join("\n") : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${name}</title>
  <meta name="description" content="${tagline}" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="site-header">
    <div class="container">
      <h1>${name}</h1>
      ${tagline ? `<p class="tagline">${tagline}</p>` : ""}
    </div>
  </header>
  <main>
${sections}
  </main>
  <footer class="site-footer">
    <div class="container">
      <p>Built with ${PLATFORM_NAME}.</p>
    </div>
  </footer>
</body>
</html>`;
}

function buildCss(content: any): string {
  const t = content?.theme || {};
  const primary = t.primary || "#2563eb";
  const bg = t.background || "#0a0f1f";
  const fg = t.foreground || "#e8eefc";
  const accent = t.accent || "#60a5fa";
  return `:root{
  --primary:${primary};
  --bg:${bg};
  --fg:${fg};
  --accent:${accent};
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--fg);line-height:1.6}
.container{max-width:1100px;margin:0 auto;padding:0 24px}
.site-header{padding:48px 0 24px;text-align:center}
.site-header h1{font-size:2.5rem;margin:0 0 8px;color:var(--accent)}
.tagline{opacity:.8;margin:0}
.section{padding:64px 0;border-top:1px solid rgba(255,255,255,.06)}
.section h2{font-size:2rem;margin:0 0 16px}
.sub{opacity:.8;margin:0 0 24px;font-size:1.1rem}
.items{list-style:none;padding:0;display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.items li{padding:20px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(255,255,255,.02)}
.items h3{margin:0 0 8px;font-size:1.15rem;color:var(--accent)}
.price{font-weight:700;color:var(--primary);margin-top:8px}
.author{font-style:italic;opacity:.75;margin-top:12px}
.cta{display:inline-block;margin-top:24px;padding:12px 24px;border-radius:8px;background:var(--primary);color:#fff;text-decoration:none;font-weight:600}
.cta:hover{opacity:.9}
.site-footer{padding:32px 0;text-align:center;opacity:.6;font-size:.9rem;border-top:1px solid rgba(255,255,255,.06);margin-top:32px}
`;
}

function buildReadme(name: string, tagline: string): string {
  return `# ${name}

${tagline}

This repository is generated and maintained by **${PLATFORM_NAME}**.

## Files

- \`index.html\` — rendered site
- \`styles.css\` — styles
- \`site.json\` — source content (edit in ${PLATFORM_NAME} for full editing)

## Local preview

Just open \`index.html\` in a browser, or serve the folder:

\`\`\`bash
npx serve .
\`\`\`
`;
}

// Recursively upsert a file via the GitHub Contents API.
async function putFile(
  octokit: Octokit, owner: string, repo: string, path: string,
  contentUtf8: string, message: string, branch: string,
) {
  // base64 encode
  const b64 = btoa(unescape(encodeURIComponent(contentUtf8)));
  let sha: string | undefined;
  try {
    const existing = await octokit.repos.getContent({ owner, repo, path, ref: branch });
    if (!Array.isArray(existing.data) && "sha" in existing.data) {
      sha = (existing.data as any).sha;
    }
  } catch (e: any) {
    if (e.status !== 404) throw e;
  }
  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path, message, content: b64, branch, sha,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const siteId: string | undefined = body.site_id;
    if (!siteId) {
      return new Response(JSON.stringify({ error: "site_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // load site (RLS scoped to this user via their JWT)
    const { data: site, error: siteErr } = await supabase
      .from("sites").select("*").eq("id", siteId).maybeSingle();
    if (siteErr || !site) {
      return new Response(JSON.stringify({ error: siteErr?.message || "Site not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // load github integration
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: integ, error: integErr } = await admin
      .from("integrations").select("*")
      .eq("user_id", userId).eq("platform", "github").maybeSingle();
    if (integErr || !integ?.access_token) {
      return new Response(JSON.stringify({ error: "GitHub not connected" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const octokit = new Octokit({ auth: integ.access_token });

    // who am I?
    const me = await octokit.users.getAuthenticated();
    const owner = me.data.login;

    // repo name — reuse stored if present
    const meta = (integ.metadata ?? {}) as Record<string, any>;
    const sitesMap: Record<string, { repo: string; html_url: string }> = meta.sites ?? {};
    let repoName = sitesMap[siteId]?.repo;

    if (!repoName) {
      // build a unique repo name
      const base = slugify(site.name);
      repoName = base;
      let suffix = 0;
      // try up to 5 names if collisions
      while (suffix < 5) {
        try {
          await octokit.repos.get({ owner, repo: repoName });
          // exists — try another
          suffix++;
          repoName = `${base}-${Date.now().toString(36).slice(-4)}${suffix > 1 ? `-${suffix}` : ""}`;
        } catch (e: any) {
          if (e.status === 404) break; // free
          throw e;
        }
      }
      // create
      const created = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: `${site.name} — built with ${PLATFORM_NAME}`,
        private: true,
        auto_init: true,
      });
      repoName = created.data.name;
    }

    // determine default branch
    const repoInfo = await octokit.repos.get({ owner, repo: repoName });
    const branch = repoInfo.data.default_branch || "main";

    const indexHtml = buildHtml(site.content);
    const stylesCss = buildCss(site.content);
    const siteJson = JSON.stringify(site.content, null, 2);
    const readme = buildReadme(site.name, (site.content as any)?.tagline || "");

    const commitMsg = `Site update from ${PLATFORM_NAME}`;

    // push files sequentially (each call may need fresh sha)
    await putFile(octokit, owner, repoName, "index.html", indexHtml, commitMsg, branch);
    await putFile(octokit, owner, repoName, "styles.css", stylesCss, commitMsg, branch);
    await putFile(octokit, owner, repoName, "site.json", siteJson, commitMsg, branch);
    await putFile(octokit, owner, repoName, "README.md", readme, commitMsg, branch);

    const htmlUrl = repoInfo.data.html_url;

    // persist mapping
    sitesMap[siteId] = { repo: repoName, html_url: htmlUrl };
    await admin.from("integrations").update({
      metadata: { ...meta, sites: sitesMap, login: owner },
    }).eq("id", integ.id);

    return new Response(JSON.stringify({
      repo: repoName,
      owner,
      html_url: htmlUrl,
      branch,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("github-push error", e);
    return new Response(JSON.stringify({ error: e?.message || String(e), status: e?.status }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
