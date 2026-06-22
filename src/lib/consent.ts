// GDPR cookie consent store + the actual gating mechanism.
//
// The consent RECORD itself is essential: it is never gated behind itself, it
// only stores the user's choice (no tracking value). Everything NON-essential
// (analytics, marketing) stays blocked until the user opts in, and a reject /
// withdrawal actively clears anything already set.

export type ConsentCategories = { analytics: boolean; marketing: boolean };
export type ConsentRecord = {
  version: number;
  analytics: boolean;
  marketing: boolean;
  ts: number;
};

const KEY = "veb_cookie_consent";
// Bump when the cookie policy/categories change to re-prompt existing users.
export const CONSENT_VERSION = 1;

const listeners = new Set<() => void>();

export function getConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw) as ConsentRecord;
    if (rec.version !== CONSENT_VERSION) return null; // policy changed → re-prompt
    return rec;
  } catch {
    return null;
  }
}

/** Has the user made any choice yet? (Controls whether the banner shows.) */
export function hasDecision(): boolean {
  return getConsent() !== null;
}

export function hasConsent(cat: keyof ConsentCategories): boolean {
  const rec = getConsent();
  return !!rec && !!rec[cat];
}

/** Persist a decision (essential record) and apply its side-effects immediately. */
export function setConsent(cats: ConsentCategories): void {
  const rec: ConsentRecord = {
    version: CONSENT_VERSION,
    analytics: cats.analytics,
    marketing: cats.marketing,
    ts: Date.now(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(rec));
  } catch {
    /* storage blocked — gating still applies in-memory below */
  }
  applyConsent(rec);
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Apply a decision: turn gated things ON when allowed, actively OFF when not. */
function applyConsent(rec: ConsentRecord): void {
  // Marketing → affiliate attribution capture (the only marketing cookie today).
  import("./affiliateTracking").then(({ captureRefFromUrl, clearStoredRef }) => {
    if (rec.marketing) captureRefFromUrl();
    else clearStoredRef(); // withdrawal/reject removes any existing veb_ref
  });
  // Analytics → registry of gated scripts (none today; future GA/pixels go here,
  // NEVER in index.html, so they are blocked-by-default until this runs).
  if (rec.analytics) loadGatedScripts();
}

function loadGatedScripts(): void {
  // Intentionally empty for now. Any future analytics/marketing <script> must be
  // injected from here so it cannot load before consent.
}

/** Boot-time: honor a prior decision without prompting. Call once on the client. */
export function initConsent(): void {
  const rec = getConsent();
  if (rec) applyConsent(rec);
}

/** Open the consent settings dialog from anywhere (withdraw/change is global). */
export function openCookieSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("veb:cookie-settings"));
}
