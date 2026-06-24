// Vercel domains client (Option B SSL): at publish time the publish flow registers
// each published site's specific subdomain (e.g. wegotyourback.builder.virtualengine.ai)
// on the ai-website-forge project, so Vercel auto-verifies it against the existing
// wildcard CNAME and issues a standard per-host cert — no wildcard cert, no NS delegation.
//
// Config from env (Pharoah sets these on the Supabase project; token is a secret):
//   VERCEL_API_TOKEN   — Bearer token scoped to the team that owns the project (secret)
//   VERCEL_PROJECT_ID  — the ai-website-forge project id
//   VERCEL_TEAM_ID     — the team id the project lives under (teamId is required)

const API = "https://api.vercel.com";

export type VercelResult = {
  ok: boolean; // operation reached the desired end state (incl. idempotent cases)
  status: number; // last HTTP status (0 on network failure)
  body: any; // parsed response body (or { error } on network failure)
  alreadyExists?: boolean; // add: the domain was already on the project
};

function env() {
  return {
    token: Deno.env.get("VERCEL_API_TOKEN") ?? "",
    projectId: Deno.env.get("VERCEL_PROJECT_ID") ?? "",
    teamId: Deno.env.get("VERCEL_TEAM_ID") ?? "",
  };
}

// Returns a comma list of missing config names, or null if all present.
function missingConfig(): string | null {
  const { token, projectId, teamId } = env();
  const missing = [
    !token && "VERCEL_API_TOKEN",
    !projectId && "VERCEL_PROJECT_ID",
    !teamId && "VERCEL_TEAM_ID",
  ].filter(Boolean) as string[];
  return missing.length ? missing.join(", ") : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// fetch with bounded retry/backoff on TRANSIENT failures only (network err, 5xx, 429).
// 4xx (incl. idempotent "already exists") are returned to the caller, not retried.
async function vercelFetch(
  path: string,
  init: RequestInit,
  attempts = 3,
): Promise<{ status: number; body: any }> {
  const { token } = env();
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${API}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
      });
      const body = await res.json().catch(() => ({}));
      if ((res.status >= 500 || res.status === 429) && i < attempts - 1) {
        console.warn(`[vercel] ${init.method ?? "GET"} ${path} -> ${res.status}; retry ${i + 1}/${attempts - 1}`);
        await sleep(500 * (i + 1));
        continue;
      }
      return { status: res.status, body };
    } catch (e) {
      lastErr = e;
      console.warn(`[vercel] ${init.method ?? "GET"} ${path} network error; retry ${i + 1}/${attempts - 1}: ${(e as Error).message}`);
      if (i < attempts - 1) { await sleep(500 * (i + 1)); continue; }
    }
  }
  return { status: 0, body: { error: { message: (lastErr as Error)?.message ?? "network error" } } };
}

// Add <domain> to the project. Idempotent: a domain already on the project is success.
export async function addProjectDomain(domain: string): Promise<VercelResult> {
  const cfg = missingConfig();
  if (cfg) {
    console.error(`[vercel] addProjectDomain(${domain}) skipped — missing config: ${cfg}`);
    return { ok: false, status: 0, body: { error: { message: `missing config: ${cfg}` } } };
  }
  const { projectId, teamId } = env();
  const { status, body } = await vercelFetch(
    `/v10/projects/${projectId}/domains?teamId=${teamId}`,
    { method: "POST", body: JSON.stringify({ name: domain }) },
  );
  const code = body?.error?.code;
  const alreadyExists = status === 409 || code === "domain_already_in_use" || code === "domain_already_exists";
  const ok = (status >= 200 && status < 300) || alreadyExists;
  if (ok) console.log(`[vercel] addProjectDomain ${domain} -> ${status}${alreadyExists ? " (already on project)" : ""}`);
  else console.error(`[vercel] addProjectDomain ${domain} FAILED -> ${status}`, JSON.stringify(body));
  return { ok, status, body, alreadyExists };
}

// Get the project-domain record (verified/misconfigured). Use to CONFIRM before
// reporting publish success — the POST's `verified` can be optimistically true.
export async function getProjectDomain(domain: string): Promise<VercelResult> {
  const cfg = missingConfig();
  if (cfg) return { ok: false, status: 0, body: { error: { message: `missing config: ${cfg}` } } };
  const { projectId, teamId } = env();
  const { status, body } = await vercelFetch(
    `/v9/projects/${projectId}/domains/${domain}?teamId=${teamId}`,
    { method: "GET" },
  );
  const ok = status >= 200 && status < 300;
  if (!ok) console.warn(`[vercel] getProjectDomain ${domain} -> ${status}`, JSON.stringify(body));
  return { ok, status, body };
}

// Remove <domain> from the project (cleanup). Idempotent: 404 (not present) is success.
export async function removeProjectDomain(domain: string): Promise<VercelResult> {
  const cfg = missingConfig();
  if (cfg) return { ok: false, status: 0, body: { error: { message: `missing config: ${cfg}` } } };
  const { projectId, teamId } = env();
  const { status, body } = await vercelFetch(
    `/v10/projects/${projectId}/domains/${domain}?teamId=${teamId}`,
    { method: "DELETE" },
  );
  const ok = (status >= 200 && status < 300) || status === 404;
  if (ok) console.log(`[vercel] removeProjectDomain ${domain} -> ${status}`);
  else console.error(`[vercel] removeProjectDomain ${domain} FAILED -> ${status}`, JSON.stringify(body));
  return { ok, status, body };
}
