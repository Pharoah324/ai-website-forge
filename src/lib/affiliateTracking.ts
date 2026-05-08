// Captures ?ref=VEB-XXXX from URL and stores it for 30 days.
const KEY = "veb_ref";
const TTL_DAYS = 30;

export function captureRefFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref && /^VEB-[A-Z0-9]{4,8}$/i.test(ref)) {
    const payload = { code: ref.toUpperCase(), exp: Date.now() + TTL_DAYS * 86400_000 };
    try {
      localStorage.setItem(KEY, JSON.stringify(payload));
      document.cookie = `${KEY}=${encodeURIComponent(ref.toUpperCase())}; max-age=${TTL_DAYS * 86400}; path=/; SameSite=Lax`;
    } catch { /* noop */ }
  }
}

export function getStoredRef(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, exp } = JSON.parse(raw);
    if (Date.now() > exp) {
      localStorage.removeItem(KEY);
      return null;
    }
    return code as string;
  } catch {
    return null;
  }
}

export function clearStoredRef() {
  try {
    localStorage.removeItem(KEY);
    document.cookie = `${KEY}=; max-age=0; path=/`;
  } catch { /* noop */ }
}
