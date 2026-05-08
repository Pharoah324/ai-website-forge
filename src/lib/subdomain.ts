export const PUBLISH_ROOT = "builder.virtualengine.ai";

/**
 * Returns the customer subdomain if the current host is a published-site host
 * like `theirsite.builder.virtualengine.ai`. Returns null for the apex builder
 * host, lovable preview hosts, and localhost.
 */
export function getCustomerSubdomain(host: string = (typeof window !== "undefined" ? window.location.hostname : "")): string | null {
  if (!host) return null;
  const h = host.toLowerCase();
  if (h === PUBLISH_ROOT) return null;
  if (h.endsWith(`.${PUBLISH_ROOT}`)) {
    const sub = h.slice(0, -1 - PUBLISH_ROOT.length);
    // Reject the marketing "www" subdomain — treat as apex
    if (!sub || sub === "www") return null;
    return sub;
  }
  return null;
}
