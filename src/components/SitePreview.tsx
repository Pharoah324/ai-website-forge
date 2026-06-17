import * as LucideIcons from "lucide-react";
import { useState, useRef, useEffect, createElement, type ReactNode } from "react";
import type { SiteContent, SiteSection, SiteSectionItem } from "@/types/site";
import { useValidatedImage, type ImageOrientation } from "@/hooks/useValidatedImage";

// ---------------------------------------------------------------------------
// Phone linkification + scroll helpers
// ---------------------------------------------------------------------------
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/g;
const BOOKING_RE = /\b(reserve|reservation|book|booking|schedule|appointment|table|seat)\b/i;

export function linkifyPhones(text: string | undefined | null): ReactNode {
  if (!text) return text ?? null;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  PHONE_RE.lastIndex = 0;
  while ((match = PHO NE_RE.exec(text)) !== null) {
    const raw = match[0];
    const digits = raw.replace(/[^\d+]/g, "");
    if (digits.replace(/\+/g, "").length < 7) continue;
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(<a key={`tel-${match.index}`} href={`tel:${digits}`} className="underline">{raw}</a>);
    lastIndex = match.index + raw.length;
  }
  if (lastIndex === 0) return text;
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

function scrollToContact(e: React.MouseEvent) {
  const el = document.getElementById("contact");
  if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth", block: "start" }); }
}

// ---------------------------------------------------------------------------
// UI strings (i18n)
// ---------------------------------------------------------------------------
type UiKey =
  | "get_started" | "send_message" | "send" | "sending"
  | "name_placeholder" | "email_placeholder" | "phone_placeholder" | "message_placeholder"
  | "thank_you" | "we_will_be_in_touch" | "reservation_note" | "support"
  | "contact_heading" | "contact_subheading"
  | "err_name_required" | "err_name_long" | "err_email_required" | "err_email_invalid"
  | "err_email_long" | "err_phone_short" | "err_phone_long" | "err_message_required"
  | "err_message_long" | "err_generic";

const UI_STRINGS: Record<string, Record<UiKey, string>> = {
  en: {
    get_started: "Get started", send_message: "Send message", send: "Send", sending: "Sending…",
    name_placeholder: "Your name", email_placeholder: "Email", phone_placeholder: "Phone (optional)",
    message_placeholder: "Message", thank_you: "Thank you!", we_will_be_in_touch: "We'll be in touch within 24 hours.",
    reservation_note: "We'll confirm your reservation by phone or email.", support: "Support",
    contact_heading: "Get in touch", contact_subheading: "Tell us what you need and we'll be in touch within 24 hours.",
    err_name_required: "Please enter your name", err_name_long: "Name is too long",
    err_email_required: "Please enter your email", err_email_invalid: "Please enter a valid email",
    err_email_long: "Email is too long", err_phone_short: "Phone number looks too short",
    err_phone_long: "Phone number is too long", err_message_required: "Please enter a message",
    err_message_long: "Message is too long", err_generic: "Something went wrong. Please try again.",
  },
  es: {
    get_started: "Comenzar", send_message: "Enviar mensaje", send: "Enviar", sending: "Enviando…",
    name_placeholder: "Tu nombre", email_placeholder: "Correo electrónico", phone_placeholder: "Teléfono (opcional)",
    message_placeholder: "Mensaje", thank_you: "¡Gracias!", we_will_be_in_touch: "Nos pondremos en contacto en menos de 24 horas.",
    reservation_note: "Confirmaremos tu reserva por teléfono o correo.", support: "Soporte",
    contact_heading: "Contáctanos", contact_subheading: "Cuéntanos qué necesitas y te responderemos en 24 horas.",
    err_name_required: "Por favor ingresa tu nombre", err_name_long: "El nombre es demasiado largo",
    err_email_required: "Por favor ingresa tu correo", err_email_invalid: "Por favor ingresa un correo válido",
    err_email_long: "El correo es demasiado largo", err_phone_short: "El número parece muy corto",
    err_phone_long: "El número es demasiado largo", err_message_required: "Por favor ingresa un mensaje",
    err_message_long: "El mensaje es demasiado largo", err_generic: "Algo salió mal. Intenta de nuevo.",
  },
  pt: {
    get_started: "Começar", send_message: "Enviar mensagem", send: "Enviar", sending: "Enviando…",
    name_placeholder: "Seu nome", email_placeholder: "E-mail", phone_placeholder: "Telefone (opcional)",
    message_placeholder: "Mensagem", thank_you: "Obrigado!", we_will_be_in_touch: "Entraremos em contato em até 24 horas.",
    reservation_note: "Confirmaremos sua reserva por telefone ou e-mail.", support: "Suporte",
    contact_heading: "Fale conosco", contact_subheading: "Conte o que você precisa e responderemos em até 24 horas.",
    err_name_required: "Por favor, informe seu nome", err_name_long: "Nome muito longo",
    err_email_required: "Por favor, informe seu e-mail", err_email_invalid: "Por favor, informe um e-mail válido",
    err_email_long: "E-mail muito longo", err_phone_short: "Número de telefone muito curto",
    err_phone_long: "Número de telefone muito longo", err_message_required: "Por favor, escreva uma mensagem",
    err_message_long: "Mensagem muito longa", err_generic: "Algo deu errado. Tente novamente.",
  },
  fr: {
    get_started: "Commencer", send_message: "Envoyer le message", send: "Envoyer", sending: "Envoi…",
    name_placeholder: "Votre nom", email_placeholder: "E-mail", phone_placeholder: "Téléphone (facultatif)",
    message_placeholder: "Message", thank_you: "Merci !", we_will_be_in_touch: "Nous vous répondrons sous 24 heures.",
    reservation_note: "Nous confirmerons votre réservation par téléphone ou e-mail.", support: "Support",
    contact_heading: "Contactez-nous", contact_subheading: "Dites-nous ce dont vous avez besoin et nous vous répondrons sous 24 heures.",
    err_name_required: "Veuillez entrer votre nom", err_name_long: "Le nom est trop long",
    err_email_required: "Veuillez entrer votre e-mail", err_email_invalid: "Veuillez entrer un e-mail valide",
    err_email_long: "L'e-mail est trop long", err_phone_short: "Le numéro de téléphone semble trop court",
    err_phone_long: "Le numéro de téléphone est trop long", err_message_required: "Veuillez entrer un message",
    err_message_long: "Le message est trop long", err_generic: "Une erreur s'est produite. Veuillez réessayer.",
  },
};

function getLangKey(lang?: string) {
  if (!lang) return "en";
  const code = lang.toLowerCase().split(/[-_]/)[0];
  return UI_STRINGS[code] ? code : "en";
}
function makeT(lang?: string, overrides?: Partial<Record<UiKey, string>>) {
  const dict = UI_STRINGS[getLangKey(lang)];
  return (key: UiKey) => { const o = overrides?.[key]; return (o && o.trim()) ? o : dict[key]; };
}

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------
type IconCmp = React.ComponentType<{ className?: string; size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
function getIcon(name?: string): IconCmp | null {
  if (!name) return null;
  const mod = LucideIcons as unknown as Record<string, IconCmp>;
  return mod[name] || mod.Sparkles || null;
}

const UNSPLASH_REF = "?utm_source=virtualengine_builder&utm_medium=referral";
const PhotoCredit = ({ credit, className }: { credit: string; className?: string }) => (
  <a href={`https://unsplash.com/${UNSPLASH_REF}`} target="_blank" rel="noopener noreferrer"
    className={className || "absolute bottom-1 right-1 rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white/95 no-underline hover:bg-black/70"}
    style={{ backdropFilter: "blur(2px)" }}>
    {credit}
  </a>
);

const ValidatedImg = ({
  initial, query, orientation = "landscape", fallbackIndex,
  alt, className, loading = "lazy", credit, creditMode = "overlay",
}: {
  initial?: string; query: string; orientation?: ImageOrientation; fallbackIndex?: number;
  alt?: string; className?: string; loading?: "lazy" | "eager"; credit?: string; creditMode?: "overlay" | "tooltip";
}) => {
  const { src, alt: healedAlt, onError } = useValidatedImage({ initial, query, orientation, fallbackIndex });
  if (!src) return null;
  if (!credit || creditMode === "tooltip") {
    return <img src={src} alt={healedAlt || alt || ""} title={credit && creditMode === "tooltip" ? credit : undefined}
      loading={loading} className={className} onError={onError} />;
  }
  return (
    <figure className={`relative overflow-hidden ${className || ""}`}>
      <img src={src} alt={healedAlt || alt || ""} loading={loading} className="h-full w-full object-cover" onError={onError} />
      <PhotoCredit credit={credit} />
    </figure>
  );
};

const ValidatedBgSection = ({
  initial, query, orientation = "landscape", fallbackIndex,
  overlay, sectionClassName, sectionStyle, children, credit,
}: {
  initial?: string; query: string; orientation?: ImageOrientation; fallbackIndex?: number;
  overlay: string; sectionClassName?: string; sectionStyle?: React.CSSProperties;
  children: React.ReactNode; credit?: string;
}) => {
  const { src, status } = useValidatedImage({ initial, query, orientation, fallbackIndex, preload: true });
  const url = status === "ok" ? src : undefined;
  return (
    <section className={`relative ${sectionClassName || ""}`} style={{
      ...sectionStyle,
      backgroundImage: url ? `${overlay}, url(${url})` : overlay,
      backgroundSize: "cover", backgroundPosition: "center",
    }}>
      {children}
      {url && credit && <PhotoCredit credit={credit} />}
    </section>
  );
};

// ---------------------------------------------------------------------------
// Image query builders
// ---------------------------------------------------------------------------
const MENSWEAR_BRAND_RE = /\b(kings?\s*(?:&|and)?\s*collars?|sartorial|haberdash|bespoke|savile|tailor|gentleman|gentlemen|menswear|men's wear|suit\s*house|atelier)\b/i;
function isMenswearContext(brand?: string, extra?: string) {
  return MENSWEAR_BRAND_RE.test(`${brand || ""} ${extra || ""}`);
}
function menswearQueryFor(text: string): string {
  const t = (text || "").toLowerCase();
  if (/cufflink/.test(t)) return "mens cufflinks luxury";
  if (/bow\s*tie|bowtie/.test(t)) return "mens bowtie";
  if (/pocket\s*square/.test(t)) return "pocket square mens suit";
  if (/tie\b|necktie/.test(t)) return "mens silk tie";
  if (/shoe|oxford|brogue/.test(t)) return "oxford dress shoes mens";
  if (/fabric|wool|cashmere/.test(t)) return "mens suit fabric";
  if (/shirt/.test(t)) return "mens dress shirt tailored";
  if (/watch/.test(t)) return "mens luxury watch";
  if (/wedding|tuxedo|black\s*tie/.test(t)) return "mens tuxedo black tie";
  if (/atelier|tailor|craft|stitch/.test(t)) return "bespoke tailoring atelier";
  return "well dressed man bespoke suit";
}
function buildSectionQuery(section: { type?: string; heading?: string; image_search_query?: string }, brand?: string): string {
  if (isMenswearContext(brand, section.heading)) return menswearQueryFor(`${section.heading || ""} ${section.type || ""}`);
  if (section.image_search_query) return section.image_search_query;
  const h = (section.heading || "").trim();
  const b = (brand || "").trim();
  switch (section.type) {
    case "hero": return `${b} ${h} hero professional`.trim() || "modern business hero";
    case "about": return `${b} team office`.trim() || "professional team";
    case "testimonials": return "happy customer portrait";
    case "cta": return `${b} lifestyle`.trim() || "call to action";
    case "contact": return `${b} office storefront`.trim() || "office";
    default: return `${b} ${h}`.trim() || "professional";
  }
}
function buildItemQuery(item: { title?: string; image_search_query?: string }, section: { type?: string; heading?: string }, brand?: string): string {
  if (isMenswearContext(brand, `${section.heading || ""} ${item.title || ""}`)) return menswearQueryFor(`${item.title || ""} ${section.heading || ""}`);
  if (item.image_search_query) return item.image_search_query;
  return `${section.heading || ""} ${item.title || ""}`.trim() || "detail photography";
}

// ---------------------------------------------------------------------------
// Content sanitizer (strips markdown image syntax from text fields)
// ---------------------------------------------------------------------------
const MD_IMG_RE = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
const RAW_IMG_URL_RE = /(https?:\/\/(?:images\.unsplash\.com|[^\s)]+\.(?:jpg|jpeg|png|webp|gif|avif))[^\s)]*)/gi;

function cleanTextNode<T extends Record<string, unknown>>(node: T): T {
  let firstUrl: string | null = null;
  let firstAlt: string | null = null;
  const out: Record<string, unknown> = { ...node };
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (typeof v !== "string") continue;
    let cleaned = v.replace(MD_IMG_RE, (_m, alt: string, url: string) => { if (!firstUrl) { firstUrl = url; firstAlt = alt || null; } return ""; });
    cleaned = cleaned.replace(RAW_IMG_URL_RE, (_m, url: string) => { if (!firstUrl) firstUrl = url; return ""; });
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
    out[k] = cleaned;
  }
  if (firstUrl && !out.image_url) { out.image_url = firstUrl; if (firstAlt && !out.image_alt) out.image_alt = firstAlt; }
  return out as T;
}
function sanitizeContent(content: SiteContent): SiteContent {
  const sections = (content.sections || []).map((sec) => {
    const s = cleanTextNode(sec as unknown as Record<string, unknown>) as unknown as SiteSection;
    // Always normalize items to an array. The type-specific renderers call
    // section.items.map(...) directly, so a section that omits items (e.g. an
    // AI refine that dropped the field) must not leave it undefined or the
    // whole preview white-screens with "Cannot read properties of undefined".
    s.items = Array.isArray(s.items)
      ? s.items.map((it) => cleanTextNode(it as unknown as Record<string, unknown>) as unknown as SiteSectionItem)
      : [];
    return s;
  });
  return { ...content, sections };
}

// ---------------------------------------------------------------------------
// Design score
// ---------------------------------------------------------------------------
export function computeDesignScore(content: SiteContent | null) {
  if (!content) return { total: 0, hierarchy: 0, mobile: 0, cta: 0, images: 0, notes: [] as string[] };
  const sections = content.sections || [];
  const notes: string[] = [];
  const hero = sections.find((s) => s.type === "hero");
  let hierarchy = 0;
  if (hero) hierarchy += 50;
  if (hero?.heading && hero.heading.split(" ").length <= 9) hierarchy += 25;
  if (sections.length >= 5) hierarchy += 25;
  if (!hero) notes.push("Missing hero section");
  const ctaCount = sections.filter((s) => s.cta).length;
  let cta = 0;
  if (hero?.cta) cta += 40;
  if (ctaCount >= 3) cta += 40;
  if (sections.some((s) => s.cta_urgency)) cta += 20;
  if (ctaCount < 3) notes.push("Add more CTAs (top, middle, bottom)");
  const withImg = sections.filter((s) => s.image_url || s.items?.some((i) => i.image_url)).length;
  const images = sections.length ? Math.round((withImg / sections.length) * 100) : 0;
  if (images < 50) notes.push("Add more imagery");
  let mobile = 80;
  if (hero?.heading && hero.heading.length > 70) { mobile -= 15; notes.push("Hero headline is long for mobile"); }
  if (sections.length > 12) { mobile -= 10; notes.push("Page may be too long for mobile"); }
  const total = Math.round(hierarchy * 0.3 + cta * 0.3 + images * 0.25 + mobile * 0.15);
  return { total, hierarchy, mobile, cta, images, notes };
}

// ---------------------------------------------------------------------------
// Theme helpers
// ---------------------------------------------------------------------------
function hsl(val: string) { return `hsl(${val})`; }
function hsla(val: string, alpha: number) { return `hsl(${val} / ${alpha})`; }

// ---------------------------------------------------------------------------
// Style system — the AI picks theme.style ("vibrant" | "glass" | "editorial")
// per prompt; this maps it to a coherent set of modern design tokens (gradient
// meshes, glass/elevated cards, display fonts, depth) exposed as CSS variables
// on the root so every section upgrades from one place.
// ---------------------------------------------------------------------------
type StyleName = "vibrant" | "glass" | "editorial";
type StyleSystem = {
  style: StyleName; fontImport: string; displayFont: string; bodyFont: string;
  radius: string; heroBg: string; ctaBg: string; ctaShadow: string;
  cardBg: string; cardBorder: string; cardShadow: string; cardBackdrop: string; sectionTint: string;
};
function getStyleSystem(theme: SiteContent["theme"]): StyleSystem {
  const t = theme as SiteContent["theme"] & { style?: string; accent2?: string };
  const p = theme.primary, a = theme.accent, fg = theme.foreground, bg = theme.background;
  const a2 = t.accent2 || a;
  const style: StyleName = (t.style === "glass" || t.style === "editorial" || t.style === "vibrant") ? t.style : "vibrant";

  if (style === "glass") {
    return {
      style, displayFont: "'Sora', 'Inter', sans-serif", bodyFont: "'Inter', system-ui, sans-serif",
      fontImport: "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap",
      radius: "1rem",
      heroBg: `radial-gradient(120% 120% at 50% -10%, ${hsla(p, 0.20)} 0%, transparent 55%), radial-gradient(90% 90% at 88% 15%, ${hsla(a2, 0.18)} 0%, transparent 60%)`,
      ctaBg: `linear-gradient(135deg, ${hsl(p)}, ${hsl(a2)})`, ctaShadow: `0 8px 30px ${hsla(p, 0.4)}`,
      cardBg: hsla(fg, 0.04), cardBorder: `1px solid ${hsla(fg, 0.1)}`,
      cardShadow: `0 1px 2px ${hsla(fg, 0.06)}`, cardBackdrop: "blur(10px)",
      sectionTint: `linear-gradient(180deg, ${hsla(fg, 0.02)}, ${hsla(p, 0.035)})`,
    };
  }
  if (style === "editorial") {
    return {
      style, displayFont: "'Fraunces', Georgia, serif", bodyFont: "'Inter', system-ui, sans-serif",
      fontImport: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500&display=swap",
      radius: "0.5rem",
      heroBg: `radial-gradient(100% 80% at 50% 0%, ${hsla(p, 0.07)} 0%, transparent 60%)`,
      ctaBg: hsl(p), ctaShadow: `0 6px 22px ${hsla(p, 0.22)}`,
      cardBg: hsl(bg), cardBorder: `1px solid ${hsla(fg, 0.1)}`,
      cardShadow: `0 18px 50px -18px ${hsla(fg, 0.2)}`, cardBackdrop: "none",
      sectionTint: hsla(fg, 0.03),
    };
  }
  // vibrant (default)
  return {
    style, displayFont: "'Space Grotesk', 'Inter', sans-serif", bodyFont: "'Inter', system-ui, sans-serif",
    fontImport: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap",
    radius: "1.5rem",
    heroBg: `radial-gradient(110% 110% at 12% 8%, ${hsla(p, 0.30)} 0%, transparent 50%), radial-gradient(100% 100% at 92% 22%, ${hsla(a2, 0.26)} 0%, transparent 55%), linear-gradient(180deg, ${hsla(a, 0.05)}, transparent)`,
    ctaBg: `linear-gradient(135deg, ${hsl(p)}, ${hsl(a2)})`, ctaShadow: `0 10px 34px ${hsla(p, 0.45)}`,
    cardBg: hsl(bg), cardBorder: `1px solid ${hsla(fg, 0.08)}`,
    cardShadow: `0 14px 44px -16px ${hsla(p, 0.3)}`, cardBackdrop: "none",
    sectionTint: `linear-gradient(180deg, transparent, ${hsla(p, 0.045)})`,
  };
}

// Derive a "dark" version of a background for alternating sections
function altBg(bg: string, fg: string, alpha = 0.04) {
  return `hsl(${fg} / ${alpha})`;
}

// ---------------------------------------------------------------------------
// CTA Button — modern pill style with subtle shadow
// ---------------------------------------------------------------------------
type CTAButtonProps = {
  label: string;
  primary: string;
  accent?: string;
  className?: string;
  style?: React.CSSProperties;
  variant?: "filled" | "outline" | "ghost" | "inverse";
  size?: "sm" | "md" | "lg";
};

const CTAButton = ({ label, primary, accent, className, style, variant = "filled", size = "md" }: CTAButtonProps) => {
  const padding = size === "lg" ? "px-8 py-4 text-base" : size === "sm" ? "px-4 py-2 text-xs" : "px-6 py-3 text-sm";
  const base = `inline-flex items-center gap-2 rounded-full font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${padding}`;

  let styleResolved: React.CSSProperties = {};
  if (variant === "filled") styleResolved = { background: `var(--ve-cta-bg, ${hsl(primary)})`, color: "white", boxShadow: `var(--ve-cta-shadow, 0 4px 20px ${hsla(primary, 0.35)})`, ...style };
  else if (variant === "inverse") styleResolved = { background: "white", color: hsl(primary), ...style };
  else if (variant === "outline") styleResolved = { background: "transparent", color: hsl(primary), border: `2px solid ${hsl(primary)}`, ...style };
  else styleResolved = { background: "transparent", color: hsl(primary), ...style };

  const cls = `${className ?? base}${variant === "filled" ? " ve-cta-sheen" : ""}`;
  return (
    <a href="#contact" onClick={scrollToContact} className={cls} style={styleResolved}>
      {label}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-70">
        <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
};

// ---------------------------------------------------------------------------
// Interactive 3D scene (Spline) — loaded from CDN as a web component (no npm
// dep, no build impact), client-only (SSG-safe), renders nothing until ready so
// the hero's gradient + scrim act as the graceful fallback if it can't load.
// ---------------------------------------------------------------------------
const SPLINE_VIEWER_SRC = "https://unpkg.com/@splinetool/viewer@1.9.48/build/spline-viewer.js";
function Scene3D({ url, className }: { url: string; className?: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof document === "undefined" || !url) return;
    // WebGL gate — skip entirely on unsupported devices (fallback shows instead).
    try {
      const c = document.createElement("canvas");
      if (!(c.getContext("webgl2") || c.getContext("webgl"))) return;
    } catch { return; }
    if ((window as unknown as { customElements?: CustomElementRegistry }).customElements?.get("spline-viewer")) {
      setReady(true); return;
    }
    if (document.querySelector("script[data-spline-viewer]")) {
      const t = setInterval(() => {
        if (window.customElements?.get("spline-viewer")) { setReady(true); clearInterval(t); }
      }, 200);
      return () => clearInterval(t);
    }
    const s = document.createElement("script");
    s.type = "module"; s.src = SPLINE_VIEWER_SRC; s.setAttribute("data-spline-viewer", "1");
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, [url]);
  if (!ready || !url) return null;
  return (
    <div className={className} aria-hidden>
      {createElement("spline-viewer", { url, style: { width: "100%", height: "100%", display: "block", pointerEvents: "none" } })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section label pill (like "SUSTAINABLE HOME GROWING" in Lovable example)
// ---------------------------------------------------------------------------
const SectionLabel = ({ text, primary }: { text: string; primary: string }) => (
  <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest mb-4"
    style={{ background: hsla(primary, 0.1), color: hsl(primary) }}>
    {text}
  </span>
);

// ---------------------------------------------------------------------------
// Stats bar (horizontal strip of numbers)
// ---------------------------------------------------------------------------
const StatsBar = ({ items, primary, bg, fg }: { items: SiteSectionItem[]; primary: string; bg: string; fg: string }) => (
  <div className="flex flex-wrap justify-center gap-8 md:gap-16 py-10 px-6"
    style={{ background: hsla(fg, 0.03), borderTop: `1px solid ${hsla(fg, 0.08)}`, borderBottom: `1px solid ${hsla(fg, 0.08)}` }}>
    {items.map((it, i) => (
      <div key={i} className="text-center">
        <div className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: hsl(primary) }}>{it.title}</div>
        {it.body && <div className="mt-1 text-xs uppercase tracking-wider opacity-60">{it.body}</div>}
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Contact Form
// ---------------------------------------------------------------------------
const ContactForm = ({
  section, theme, siteId, showBookingNote, lang, ui,
}: {
  section: SiteSection; theme: SiteContent["theme"]; siteId?: string;
  showBookingNote: boolean; lang?: string; ui?: Partial<Record<UiKey, string>>;
}) => {
  const primary = hsl(theme.primary);
  const muted = hsla(theme.foreground, 0.6);
  const t = makeT(lang, ui);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t("err_name_required");
    else if (name.trim().length > 100) errs.name = t("err_name_long");
    if (!email.trim()) errs.email = t("err_email_required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = t("err_email_invalid");
    else if (email.trim().length > 255) errs.email = t("err_email_long");
    if (phone.trim() && phone.replace(/[^\d+]/g, "").length < 7) errs.phone = t("err_phone_short");
    if (phone.trim().length > 40) errs.phone = t("err_phone_long");
    if (!message.trim()) errs.message = t("err_message_required");
    else if (message.trim().length > 2000) errs.message = t("err_message_long");
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    if (!validate()) return;
    if (!siteId) { setStatus("success"); return; }
    setStatus("submitting"); setErrorMsg(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/form-submission-webhook`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ site_id: siteId, fields: { name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, message: message.trim(), source: "Generated site contact form" } }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) { if (resp.status === 412) { setStatus("success"); return; } throw new Error(json?.error || `Submission failed (${resp.status})`); }
      setStatus("success");
    } catch (err) { setStatus("error"); setErrorMsg(err instanceof Error ? err.message : t("err_generic")); }
  };

  const inputStyle: React.CSSProperties = {
    border: `1.5px solid ${hsla(theme.foreground, 0.12)}`,
    background: hsla(theme.foreground, 0.03),
    color: hsl(theme.foreground),
    borderRadius: "12px",
    padding: "12px 16px",
    width: "100%",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  };

  if (status === "success") {
    return (
      <section id="contact" className="px-6 py-20">
        <div className="mx-auto max-w-lg rounded-2xl p-10 text-center"
          style={{ border: `1px solid ${hsla(theme.primary, 0.2)}`, background: hsla(theme.primary, 0.05) }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: hsla(theme.primary, 0.15) }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke={primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: primary }}>{t("thank_you")}</h2>
          <p className="mt-2 text-sm" style={{ color: muted }}>{t("we_will_be_in_touch")}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="px-6 py-20">
      <div className="mx-auto max-w-xl">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{section.heading}</h2>
        {section.subheading && <p className="mt-3 text-base" style={{ color: muted }}>{linkifyPhones(section.subheading)}</p>}
        {showBookingNote && (
          <p className="mt-4 rounded-xl px-4 py-2.5 text-sm" style={{ background: hsla(theme.primary, 0.08), color: primary }}>{t("reservation_note")}</p>
        )}
        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
          <div>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name_placeholder")} maxLength={100} autoComplete="name" required style={inputStyle} />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
          </div>
          <div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("email_placeholder")} maxLength={255} autoComplete="email" required style={inputStyle} />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
          </div>
          <div>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("phone_placeholder")} maxLength={40} autoComplete="tel" style={inputStyle} />
            {fieldErrors.phone && <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>}
          </div>
          <div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("message_placeholder")} rows={5} maxLength={2000} required style={{ ...inputStyle, resize: "vertical" }} />
            {fieldErrors.message && <p className="mt-1 text-xs text-red-500">{fieldErrors.message}</p>}
          </div>
          {status === "error" && errorMsg && (
            <p className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", color: "rgb(185,28,28)" }}>{errorMsg}</p>
          )}
          <button type="submit" disabled={status === "submitting"}
            className="w-full rounded-full py-4 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.99]"
            style={{ background: primary, color: "white", opacity: status === "submitting" ? 0.7 : 1, boxShadow: `0 4px 20px ${hsla(theme.primary, 0.3)}` }}>
            {status === "submitting" ? t("sending") : section.cta || t("send")}
          </button>
        </form>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// SiteBranding type
// ---------------------------------------------------------------------------
export type SiteBranding = {
  brand_name?: string | null; logo_url?: string | null;
  primary_color?: string | null; accent_color?: string | null;
  hide_branding?: boolean | null; footer_text?: string | null; support_email?: string | null;
};

// ---------------------------------------------------------------------------
// Main SitePreview export
// ---------------------------------------------------------------------------
export const SitePreview = ({
  content, branding, siteId,
}: {
  content: SiteContent; branding?: SiteBranding | null; siteId?: string;
}) => {
  const cleanedContent = sanitizeContent(content);
  const themedContent: SiteContent = branding ? {
    ...cleanedContent,
    name: branding.brand_name || cleanedContent.name,
    theme: { ...cleanedContent.theme, primary: branding.primary_color || cleanedContent.theme.primary, accent: branding.accent_color || cleanedContent.theme.accent },
  } : cleanedContent;

  const S = getStyleSystem(themedContent.theme);
  const rootRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Scroll-reveal: fade/slide sections in as they enter the viewport. Applied
  // centrally (no per-section edits); respects prefers-reduced-motion via CSS.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll("section")) as HTMLElement[];
    els.forEach((el) => el.classList.add("ve-reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("ve-in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [content]);

  // Header treatment: transparent while over the hero, frosted once scrolled
  // past it. Observing the hero section keeps this correct whether the page
  // scrolls in the editor pane or the published window.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const hero = root.querySelector("section");
    if (!hero) { setScrolled(true); return; }
    const io = new IntersectionObserver(
      ([e]) => setScrolled(e.intersectionRatio < 0.15),
      { threshold: [0, 0.15, 0.5] },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [content]);

  // Subtle 3D tilt on cards as the pointer moves across them (skipped for
  // reduced-motion / touch). Inline transform overrides the CSS hover lift.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const cards = Array.from(root.querySelectorAll(".ve-card")) as HTMLElement[];
    const cleanups: Array<() => void> = [];
    cards.forEach((el) => {
      const move = (ev: PointerEvent) => {
        if (ev.pointerType === "touch") return;
        const r = el.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width - 0.5;
        const py = (ev.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg) translateY(-8px)`;
      };
      const leave = () => { el.style.transform = ""; };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      cleanups.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); });
    });
    return () => cleanups.forEach((c) => c());
  }, [content]);

  const cssVars = {
    "--site-primary": themedContent.theme.primary,
    "--site-bg": themedContent.theme.background,
    "--site-fg": themedContent.theme.foreground,
    "--site-accent": themedContent.theme.accent,
    "--ve-display": S.displayFont,
    "--ve-body": S.bodyFont,
    "--ve-radius": S.radius,
    "--ve-cta-bg": S.ctaBg,
    "--ve-cta-shadow": S.ctaShadow,
    "--ve-card-bg": S.cardBg,
    "--ve-card-border": S.cardBorder,
    "--ve-card-shadow": S.cardShadow,
    "--ve-card-backdrop": S.cardBackdrop,
    "--ve-hero-bg": S.heroBg,
    "--ve-section-tint": S.sectionTint,
  } as React.CSSProperties;

  const headerName = branding?.brand_name || themedContent.name;
  const footerLine = branding?.footer_text || `© ${new Date().getFullYear()} ${headerName}`;
  const lang = themedContent.lang;
  const ui = themedContent.ui;
  const t = makeT(lang, ui);
  const fg = themedContent.theme.foreground;
  const bg = themedContent.theme.background;

  const hasBookingCta = themedContent.sections.some(
    (s) => (s.cta && BOOKING_RE.test(s.cta)) || (s.heading && BOOKING_RE.test(s.heading))
  );

  const sectionsToRender: SiteSection[] = themedContent.sections.some((s) => s.type === "contact")
    ? themedContent.sections
    : [...themedContent.sections, { type: "contact", heading: t("contact_heading"), subheading: t("contact_subheading"), cta: t("send_message") } as SiteSection];

  // Detect nav links from section headings (max 5 meaningful ones)
  const navSections = themedContent.sections
    .filter((s) => !["hero", "contact"].includes(s.type || "") && s.heading)
    .slice(0, 5);

  // A full-bleed image hero renders dark with white text, so the transparent
  // header over it needs light text until the user scrolls past the hero.
  const firstHero = themedContent.sections.find((s) => s.type === "hero");
  const heroIsDark = !!firstHero && !!(firstHero.image_url || firstHero.image_search_query)
    && firstHero.layout !== "image-left" && firstHero.layout !== "image-right";
  const overDarkHero = heroIsDark && !scrolled;
  const headerText = overDarkHero ? "rgba(255,255,255,0.95)" : hsl(fg);
  const headerNavText = overDarkHero ? "rgba(255,255,255,0.8)" : hsla(fg, 0.7);

  return (
    <div ref={rootRef} style={cssVars} className="ve-root min-h-full" dir={themedContent.dir || "ltr"} lang={lang}>
      <style>{`
        @import url('${S.fontImport}');
        .ve-root :is(h1,h2,h3) { font-family: var(--ve-display) !important; }
        .ve-root .ve-reveal { opacity: 0; transform: translateY(26px); transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
        .ve-root .ve-reveal.ve-in { opacity: 1; transform: none; }
        .ve-root .ve-card { border-radius: var(--ve-radius); background: var(--ve-card-bg); border: var(--ve-card-border); box-shadow: var(--ve-card-shadow); backdrop-filter: var(--ve-card-backdrop); transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s ease; transform-style: preserve-3d; will-change: transform; }
        .ve-root .ve-card:hover { transform: translateY(-6px); box-shadow: 0 24px 60px -20px ${hsla(themedContent.theme.primary, 0.4)}; }
        @keyframes ve-float { 0%,100% { transform: translate(0,0) } 50% { transform: translate(0,-22px) } }
        .ve-root .ve-cta-sheen { position: relative; overflow: hidden; }
        .ve-root .ve-cta-sheen::after { content: ''; position: absolute; inset: 0; background: linear-gradient(120deg, transparent 32%, rgba(255,255,255,.38) 50%, transparent 68%); transform: translateX(-130%); transition: transform .65s ease; }
        .ve-root .ve-cta-sheen:hover::after { transform: translateX(130%); }
        @media (prefers-reduced-motion: reduce) { .ve-root .ve-reveal { opacity: 1 !important; transform: none !important; transition: none !important; } .ve-root .ve-blob { animation: none; } }
      `}</style>
      <div style={{ background: hsl(bg), color: hsl(fg), fontFamily: "var(--ve-body)" }}>

        {/* ── Modern header ─────────────────────────────────────────────── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 50,
          background: scrolled ? hsla(bg, 0.82) : "transparent",
          backdropFilter: scrolled ? "blur(14px)" : "none",
          borderBottom: `1px solid ${scrolled ? hsla(fg, 0.08) : "transparent"}`,
          transition: "background .35s ease, backdrop-filter .35s ease, border-color .35s ease",
        }} className="px-6 py-5 md:px-10">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            {/* Logo + name */}
            <div className="flex items-center gap-3">
              {branding?.logo_url && (
                <img src={branding.logo_url} alt={headerName} className="h-8 w-auto object-contain" />
              )}
              <span className="text-base font-bold tracking-tight" style={{ fontFamily: "var(--ve-display)", letterSpacing: "-0.02em", color: headerText, transition: "color .35s ease" }}>
                {headerName}
              </span>
            </div>

            {/* Nav links — desktop only */}
            {navSections.length > 0 && (
              <nav className="hidden md:flex items-center gap-6">
                {navSections.map((s, i) => (
                  <a key={i} href="#contact" onClick={scrollToContact}
                    className="text-sm font-medium transition-opacity hover:opacity-70"
                    style={{ color: headerNavText, transition: "color .35s ease" }}>
                    {s.heading?.split(" ").slice(0, 3).join(" ")}
                  </a>
                ))}
              </nav>
            )}

            {/* CTA */}
            <a href="#contact" onClick={scrollToContact}
              className="rounded-full px-5 py-2 text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: "var(--ve-cta-bg)", color: "white", boxShadow: "var(--ve-cta-shadow)" }}>
              {t("get_started")}
            </a>
          </div>
        </header>

        {/* ── Sections ──────────────────────────────────────────────────── */}
        {sectionsToRender.map((s, i) => (
          <SectionRenderer
            key={i} section={s} theme={themedContent.theme} index={i}
            brand={headerName} siteId={siteId} hasBookingCta={hasBookingCta}
            lang={lang} ui={ui} totalSections={sectionsToRender.length}
          />
        ))}

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="px-6 py-10 md:px-10" style={{ borderTop: `1px solid ${hsla(fg, 0.07)}`, color: hsla(fg, 0.45) }}>
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center text-xs md:flex-row md:justify-between">
            <span className="font-semibold" style={{ color: hsla(fg, 0.6) }}>{headerName}</span>
            <span>{footerLine}</span>
            {branding?.support_email && (
              <span>{t("support")}: <a href={`mailto:${branding.support_email}`} className="underline">{branding.support_email}</a></span>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Section renderer — routes each section type to its styled component
// ---------------------------------------------------------------------------
const SectionRenderer = ({
  section, theme, index, brand, siteId, hasBookingCta, lang, ui, totalSections,
}: {
  section: SiteSection; theme: SiteContent["theme"]; index: number; brand?: string;
  siteId?: string; hasBookingCta?: boolean; lang?: string; ui?: Partial<Record<UiKey, string>>;
  totalSections: number;
}) => {
  const primary = theme.primary;
  const fg = theme.foreground;
  const bg = theme.background;
  const sectionQuery = buildSectionQuery(section, brand);

  // Alternating background system — every other content section gets a very subtle tint
  const isAlt = index % 2 === 1;
  const altBackground = isAlt ? "var(--ve-section-tint)" : hsl(bg);

  // ── HERO ──────────────────────────────────────────────────────────────
  if (section.type === "hero") {
    // Interactive 3D hero (Spline scene). Falls back to the gradient + scrim if
    // the scene can't load (WebGL unsupported, network, etc.).
    const scene3dUrl = (section as { scene_url?: string }).scene_url;
    if (scene3dUrl) {
      return (
        <section className="relative overflow-hidden px-6 py-36 text-center md:px-10 md:py-52"
          style={{ background: "var(--ve-hero-bg)", color: "white" }}>
          <Scene3D url={scene3dUrl} className="absolute inset-0 z-0" />
          <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.6) 100%)" }} />
          <div className="relative z-10 mx-auto max-w-4xl">
            {brand && (
              <div className="mb-5">
                <span className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                  style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}>
                  {brand}
                </span>
              </div>
            )}
            <h1 className="font-bold leading-[1.05] tracking-tight" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", letterSpacing: "-0.03em" }}>
              {section.heading}
            </h1>
            {section.subheading && (
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.85)", fontSize: "clamp(1rem, 2vw, 1.2rem)" }}>
                {section.subheading}
              </p>
            )}
            {section.cta && (
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <CTAButton label={section.cta} primary={primary} size="lg" />
                {section.cta_urgency && <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>✦ {section.cta_urgency}</span>}
              </div>
            )}
          </div>
        </section>
      );
    }
    const layout = section.layout || (section.image_url ? "image-background" : "stacked");
    const hasSplitLayout = layout === "image-right" || layout === "image-left";

    // Full-bleed background hero
    if (!hasSplitLayout) {
      const overlayColor = section.image_url
        ? "linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.42) 100%)"
        : "var(--ve-hero-bg)";

      return (
        <ValidatedBgSection
          initial={section.image_url} query={sectionQuery} orientation="landscape"
          fallbackIndex={index} overlay={overlayColor}
          sectionClassName="relative px-6 py-32 md:py-44 text-center md:px-10"
          sectionStyle={{ color: section.image_url ? "white" : hsl(fg) }}
          credit={section.image_credit}
        >
          {/* Category label */}
          {brand && (
            <div className="mb-5">
              <span className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                style={{
                  background: section.image_url ? "rgba(255,255,255,0.15)" : hsla(primary, 0.1),
                  color: section.image_url ? "rgba(255,255,255,0.9)" : hsl(primary),
                  backdropFilter: "blur(8px)",
                }}>
                {brand}
              </span>
            </div>
          )}

          {/* Headline — large and bold */}
          <h1 className="mx-auto max-w-4xl font-bold leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontFamily: "'Geist', 'Inter', sans-serif", letterSpacing: "-0.03em" }}>
            {section.heading}
          </h1>

          {section.subheading && (
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed"
              style={{ color: section.image_url ? "rgba(255,255,255,0.85)" : hsla(fg, 0.7), fontSize: "clamp(1rem, 2vw, 1.2rem)" }}>
              {section.subheading}
            </p>
          )}

          {/* CTA buttons */}
          {section.cta && (
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <CTAButton label={section.cta} primary={primary} size="lg"
                style={section.image_url ? { background: "white", color: hsl(primary), boxShadow: "0 4px 24px rgba(0,0,0,0.2)" } : undefined} />
              {section.cta_urgency && (
                <span className="text-sm font-medium" style={{ color: section.image_url ? "rgba(255,255,255,0.75)" : hsla(fg, 0.55) }}>
                  ✦ {section.cta_urgency}
                </span>
              )}
            </div>
          )}
        </ValidatedBgSection>
      );
    }

    // Split layout hero (image-left or image-right)
    const reverse = layout === "image-left";
    return (
      <section className="px-6 py-20 md:px-10 md:py-28">
        <div className={`mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
          <div>
            {brand && <SectionLabel text={brand} primary={primary} />}
            <h1 className="font-bold leading-tight tracking-tight"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontFamily: "'Geist', 'Inter', sans-serif", letterSpacing: "-0.03em" }}>
              {section.heading}
            </h1>
            {section.subheading && (
              <p className="mt-5 text-lg leading-relaxed" style={{ color: hsla(fg, 0.65) }}>{section.subheading}</p>
            )}
            {section.cta && (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <CTAButton label={section.cta} primary={primary} size="lg" />
                {section.cta_urgency && (
                  <span className="text-sm font-medium" style={{ color: hsla(fg, 0.5) }}>✦ {section.cta_urgency}</span>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl opacity-25 blur-2xl" style={{ background: `linear-gradient(135deg, ${hsl(primary)}, ${hsl(theme.accent)})`, animation: "ve-float 11s ease-in-out infinite" }} />
            <ValidatedImg initial={section.image_url} query={sectionQuery} orientation="landscape"
              fallbackIndex={index} alt={section.image_alt || section.heading}
              className="relative aspect-[4/3] w-full rounded-2xl object-cover shadow-2xl"
              credit={section.image_credit} />
          </div>
        </div>
      </section>
    );
  }

  // ── STATS ─────────────────────────────────────────────────────────────
  if (section.type === "stats") {
    if (section.items && section.items.length > 0) {
      return <StatsBar items={section.items} primary={primary} bg={bg} fg={fg} />;
    }
    return null;
  }

  // ── FEATURES ──────────────────────────────────────────────────────────
  if (section.type === "features") {
    const layout = section.layout || "cards-3";
    const isListLayout = layout === "list" || layout === "list-with-icons";
    const isAlternating = layout === "image-left" || layout === "image-right";

    if (isAlternating && section.items && section.items.length > 0) {
      return (
        <section className="px-6 py-20 md:px-10" style={{ background: altBackground }}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <SectionLabel text={section.heading} primary={primary} />
              {section.subheading && <p className="mt-3 max-w-2xl mx-auto text-base" style={{ color: hsla(fg, 0.6) }}>{section.subheading}</p>}
            </div>
            <div className="space-y-24">
              {section.items.map((it, i) => {
                const Icon = getIcon(it.icon_name);
                const isEven = i % 2 === 0;
                return (
                  <div key={i} className={`grid gap-12 md:grid-cols-2 md:items-center ${!isEven ? "md:[&>*:first-child]:order-2" : ""}`}>
                    <div>
                      {Icon && (
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                          style={{ background: hsla(primary, 0.1), color: hsl(primary) }}>
                          <Icon size={22} strokeWidth={1.8} />
                        </div>
                      )}
                      <h3 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Geist', 'Inter', sans-serif", letterSpacing: "-0.02em" }}>{it.title}</h3>
                      {it.body && <p className="mt-3 leading-relaxed" style={{ color: hsla(fg, 0.65) }}>{linkifyPhones(it.body)}</p>}
                    </div>
                    <ValidatedImg initial={it.image_url} query={buildItemQuery(it, section, brand)}
                      orientation="landscape" fallbackIndex={i} alt={it.image_alt || it.title}
                      className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
                      credit={it.image_credit} />
                  </div>
                );
              })}
            </div>
          </div>
          {section.cta && (
            <div className="mt-16 text-center">
              <CTAButton label={section.cta} primary={primary} />
            </div>
          )}
        </section>
      );
    }

    if (isListLayout && section.items && section.items.length > 0) {
      return (
        <section className="px-6 py-20 md:px-10" style={{ background: altBackground }}>
          <div className="mx-auto max-w-3xl">
            <SectionLabel text={section.heading} primary={primary} />
            {section.subheading && <p className="mt-2 mb-10 text-base" style={{ color: hsla(fg, 0.6) }}>{section.subheading}</p>}
            <div className="space-y-6">
              {section.items.map((it, i) => {
                const Icon = getIcon(it.icon_name);
                return (
                  <div key={i} className="flex items-start gap-5 rounded-2xl p-5"
                    style={{ background: hsla(fg, 0.03), border: `1px solid ${hsla(fg, 0.07)}` }}>
                    {Icon && (
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: hsla(primary, 0.1), color: hsl(primary) }}>
                        <Icon size={18} strokeWidth={1.8} />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{it.title}</h3>
                      {it.body && <p className="mt-1 text-sm leading-relaxed" style={{ color: hsla(fg, 0.65) }}>{linkifyPhones(it.body)}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            {section.cta && <div className="mt-10"><CTAButton label={section.cta} primary={primary} /></div>}
          </div>
        </section>
      );
    }

    // Default: card grid
    return (
      <section className="px-6 py-20 md:px-10" style={{ background: altBackground }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <SectionLabel text={section.heading} primary={primary} />
            {section.subheading && <p className="mt-2 max-w-2xl mx-auto text-base" style={{ color: hsla(fg, 0.6) }}>{section.subheading}</p>}
          </div>
          {section.items && section.items.length > 0 && (
            <div className={`grid gap-6 ${section.items.length === 2 ? "md:grid-cols-2" : section.items.length >= 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
              {section.items.map((it, i) => (
                <FeatureCard key={i} item={it} theme={theme} section={section} index={i} brand={brand} />
              ))}
            </div>
          )}
          {section.cta && <div className="mt-12 text-center"><CTAButton label={section.cta} primary={primary} /></div>}
        </div>
      </section>
    );
  }

  // ── ABOUT ─────────────────────────────────────────────────────────────
  if (section.type === "about") {
    const hasImage = Boolean(section.image_url || section.image_search_query);
    const layout = section.layout || (hasImage ? "image-left" : "stacked");
    const hasSide = layout === "image-left" || layout === "image-right";

    if (hasSide) {
      const reverse = layout === "image-right";
      return (
        <section className="px-6 py-20 md:px-10" style={{ background: altBackground }}>
          <div className={`mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
            <div className="relative">
              <ValidatedImg initial={section.image_url} query={sectionQuery} orientation="portrait"
                fallbackIndex={index} alt={section.image_alt || section.heading}
                className="aspect-[3/4] w-full rounded-2xl object-cover shadow-2xl"
                credit={section.image_credit} />
              <div className="absolute -bottom-4 -right-4 h-full w-full rounded-2xl -z-10 opacity-20"
                style={{ background: hsl(primary) }} />
            </div>
            <div>
              <SectionLabel text={section.heading} primary={primary} />
              {section.subheading && (
                <p className="text-xl font-medium leading-relaxed" style={{ color: hsla(fg, 0.75) }}>{section.subheading}</p>
              )}
              {section.items && section.items.map((it, i) => (
                <div key={i} className="mt-4">
                  <h3 className="font-semibold">{it.title}</h3>
                  {it.body && <p className="mt-1 text-sm leading-relaxed" style={{ color: hsla(fg, 0.65) }}>{linkifyPhones(it.body)}</p>}
                </div>
              ))}
              {section.cta && <div className="mt-8"><CTAButton label={section.cta} primary={primary} /></div>}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="px-6 py-20 text-center md:px-10" style={{ background: altBackground }}>
        <div className="mx-auto max-w-3xl">
          <SectionLabel text={section.heading} primary={primary} />
          {section.subheading && (
            <p className="text-xl leading-relaxed" style={{ color: hsla(fg, 0.7) }}>{section.subheading}</p>
          )}
          {section.items && section.items.length > 0 && (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {section.items.map((it, i) => (
                <FeatureCard key={i} item={it} theme={theme} section={section} index={i} brand={brand} />
              ))}
            </div>
          )}
          {section.cta && <div className="mt-10"><CTAButton label={section.cta} primary={primary} /></div>}
        </div>
      </section>
    );
  }

  // ── GALLERY ───────────────────────────────────────────────────────────
  if (section.type === "gallery") {
    const items = section.items || [];
    return (
      <section className="px-6 py-20 md:px-10" style={{ background: altBackground }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <SectionLabel text={section.heading} primary={primary} />
            {section.subheading && <p className="mt-2 max-w-xl mx-auto text-base" style={{ color: hsla(fg, 0.6) }}>{section.subheading}</p>}
          </div>
          {items.length > 0 ? (
            <div className={`grid gap-4 ${items.length === 1 ? "" : items.length === 2 ? "md:grid-cols-2" : items.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4"}`}>
              {items.map((it, i) => (
                <div key={i} className="group relative overflow-hidden rounded-2xl">
                  <ValidatedImg initial={it.image_url} query={buildItemQuery(it, section, brand)}
                    orientation="squarish" fallbackIndex={i} alt={it.image_alt || it.title}
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    credit={it.image_credit} />
                  {it.title && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="text-sm font-semibold text-white">{it.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : section.image_url ? (
            <ValidatedImg initial={section.image_url} query={sectionQuery} orientation="landscape"
              fallbackIndex={index} alt={section.heading}
              className="w-full rounded-2xl object-cover shadow-xl" credit={section.image_credit} />
          ) : null}
          {section.cta && <div className="mt-10 text-center"><CTAButton label={section.cta} primary={primary} /></div>}
        </div>
      </section>
    );
  }

  // ── TESTIMONIALS ──────────────────────────────────────────────────────
  if (section.type === "testimonials") {
    const layout = section.layout || "cards";
    const isQuotes = layout === "quotes";

    if (isQuotes && section.items) {
      return (
        <section className="px-6 py-20 md:px-10" style={{ background: altBackground }}>
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <SectionLabel text={section.heading} primary={primary} />
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {section.items.map((it, i) => (
                <div key={i} className="relative">
                  <div className="text-7xl font-serif leading-none opacity-15" style={{ color: hsl(primary) }}>"</div>
                  <p className="mt-2 text-lg font-medium italic leading-relaxed" style={{ color: hsla(fg, 0.85) }}>
                    {it.body || it.title}
                  </p>
                  {it.author && (
                    <p className="mt-4 text-sm font-semibold" style={{ color: hsl(primary) }}>— {it.author}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="px-6 py-20 md:px-10" style={{ background: hsla(primary, 0.04) }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <SectionLabel text={section.heading} primary={primary} />
          </div>
          {section.items && (
            <div className="grid gap-5 md:grid-cols-2">
              {section.items.map((it, i) => (
                <div key={i} className="rounded-2xl p-6 shadow-sm" style={{ background: hsl(bg), border: `1px solid ${hsla(fg, 0.07)}` }}>
                  {/* Stars */}
                  <div className="mb-3 flex gap-1">
                    {[...Array(5)].map((_, si) => (
                      <svg key={si} width="14" height="14" viewBox="0 0 24 24" fill={hsl(primary)}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm italic leading-relaxed" style={{ color: hsla(fg, 0.8) }}>"{it.body || it.title}"</p>
                  <div className="mt-4 flex items-center gap-3">
                    {it.image_thumb || it.image_url ? (
                      <ValidatedImg initial={it.image_thumb || it.image_url} query={buildItemQuery(it, section, brand)}
                        orientation="squarish" fallbackIndex={i} alt={it.author || "Review"}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                        credit={it.image_credit} creditMode="tooltip" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{ background: hsla(primary, 0.15), color: hsl(primary) }}>
                        {(it.author || "?").charAt(0)}
                      </div>
                    )}
                    {it.author && <p className="text-xs font-semibold" style={{ color: hsla(fg, 0.7) }}>— {it.author}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // ── PRICING ───────────────────────────────────────────────────────────
  if (section.type === "pricing") {
    return (
      <section className="px-6 py-20 md:px-10" style={{ background: altBackground }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <SectionLabel text={section.heading} primary={primary} />
            {section.subheading && <p className="mt-2 max-w-xl mx-auto text-base" style={{ color: hsla(fg, 0.6) }}>{section.subheading}</p>}
          </div>
          {section.items && (
            <div className="grid gap-6 md:grid-cols-3">
              {section.items.map((it, i) => {
                const Icon = getIcon(it.icon_name);
                const isMiddle = section.items!.length === 3 && i === 1;
                return (
                  <div key={i} className={`relative rounded-2xl p-7 ${isMiddle ? "scale-[1.03] shadow-2xl" : "shadow-sm"}`}
                    style={{
                      background: isMiddle ? hsl(primary) : hsl(bg),
                      border: isMiddle ? "none" : `1px solid ${hsla(fg, 0.1)}`,
                      color: isMiddle ? "white" : hsl(fg),
                    }}>
                    {isMiddle && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                        style={{ background: "white", color: hsl(primary) }}>
                        Most Popular
                      </div>
                    )}
                    {Icon && <Icon className="mb-4" size={28} strokeWidth={1.8} style={{ color: isMiddle ? "rgba(255,255,255,0.8)" : hsl(primary) }} />}
                    <h3 className="text-lg font-bold">{it.title}</h3>
                    {it.price && (
                      <p className="mt-3 text-4xl font-bold tracking-tight" style={{ fontFamily: "'Geist', sans-serif" }}>{it.price}</p>
                    )}
                    {it.body && (
                      <p className="mt-3 text-sm leading-relaxed" style={{ color: isMiddle ? "rgba(255,255,255,0.8)" : hsla(fg, 0.65) }}>
                        {linkifyPhones(it.body)}
                      </p>
                    )}
                    <a href="#contact" onClick={scrollToContact}
                      className="mt-6 block w-full rounded-full py-2.5 text-center text-sm font-semibold transition-all hover:opacity-90"
                      style={isMiddle ? { background: "white", color: hsl(primary) } : { background: hsla(primary, 0.1), color: hsl(primary) }}>
                      Get started
                    </a>
                  </div>
                );
              })}
            </div>
          )}
          {section.cta && <div className="mt-10 text-center"><CTAButton label={section.cta} primary={primary} /></div>}
        </div>
      </section>
    );
  }

  // ── FAQ ───────────────────────────────────────────────────────────────
  if (section.type === "faq") {
    return (
      <section className="px-6 py-20 md:px-10" style={{ background: altBackground }}>
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <SectionLabel text={section.heading} primary={primary} />
          </div>
          {section.items && (
            <div className="space-y-3">
              {section.items.map((it, i) => (
                <FAQItem key={i} item={it} theme={theme} />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // ── CTA BANNER ────────────────────────────────────────────────────────
  if (section.type === "cta") {
    if (section.image_url || section.image_search_query) {
      return (
        <ValidatedBgSection
          initial={section.image_url} query={sectionQuery} orientation="landscape"
          fallbackIndex={index}
          overlay={`linear-gradient(${hsla(primary, 0.88)}, ${hsla(primary, 0.92)})`}
          sectionClassName="relative px-6 py-24 text-center md:px-10"
          sectionStyle={{ color: "white" }}
          credit={section.image_credit}
        >
          <h2 className="mx-auto max-w-3xl font-bold leading-tight"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontFamily: "'Geist', 'Inter', sans-serif", letterSpacing: "-0.02em" }}>
            {section.heading}
          </h2>
          {section.subheading && <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">{section.subheading}</p>}
          {section.cta && (
            <div className="mt-10 flex flex-col items-center gap-2">
              <CTAButton label={section.cta} primary={primary} size="lg" variant="inverse" style={{ background: "white", color: hsl(primary) }} />
              {section.cta_urgency && <span className="text-sm opacity-80">✦ {section.cta_urgency}</span>}
            </div>
          )}
        </ValidatedBgSection>
      );
    }

    return (
      <section className="px-6 py-24 text-center md:px-10" style={{ background: hsl(primary), color: "white" }}>
        <h2 className="mx-auto max-w-3xl font-bold leading-tight"
          style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontFamily: "'Geist', 'Inter', sans-serif", letterSpacing: "-0.02em" }}>
          {section.heading}
        </h2>
        {section.subheading && <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">{section.subheading}</p>}
        {section.cta && (
          <div className="mt-10 flex flex-col items-center gap-2">
            <CTAButton label={section.cta} primary={primary} size="lg" variant="inverse" style={{ background: "white", color: hsl(primary) }} />
            {section.cta_urgency && <span className="text-sm opacity-80">✦ {section.cta_urgency}</span>}
          </div>
        )}
      </section>
    );
  }

  // ── CONTACT ───────────────────────────────────────────────────────────
  return (
    <ContactForm section={section} theme={theme} siteId={siteId}
      showBookingNote={!!hasBookingCta} lang={lang} ui={ui} />
  );
};

// ---------------------------------------------------------------------------
// Feature card — modern card with image, icon, title, body
// ---------------------------------------------------------------------------
const FeatureCard = ({
  item, theme, section, index, brand,
}: {
  item: SiteSectionItem; theme: SiteContent["theme"]; section: SiteSection; index: number; brand?: string;
}) => {
  const Icon = getIcon(item.icon_name);
  const primary = theme.primary;
  const fg = theme.foreground;
  const hasItemImage = Boolean(item.image_url || item.image_search_query);

  return (
    <div className="ve-card group overflow-hidden">
      {hasItemImage && (
        <div className="overflow-hidden">
          <ValidatedImg initial={item.image_url} query={buildItemQuery(item, section, brand)}
            orientation="landscape" fallbackIndex={index} alt={item.image_alt || item.title}
            className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
            credit={item.image_credit} />
        </div>
      )}
      <div className="p-6">
        {Icon && !hasItemImage && (
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: hsla(primary, 0.1), color: hsl(primary) }}>
            <Icon size={20} strokeWidth={1.8} />
          </div>
        )}
        {Icon && hasItemImage && (
          <div className="mb-3 flex items-center gap-2">
            <Icon size={16} strokeWidth={2} style={{ color: hsl(primary) }} />
          </div>
        )}
        <h3 className="font-semibold leading-snug" style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}>{item.title}</h3>
        {item.body && (
          <p className="mt-2 text-sm leading-relaxed" style={{ color: hsla(fg, 0.65) }}>
            {linkifyPhones(item.body)}
          </p>
        )}
        {item.price && (
          <p className="mt-3 text-2xl font-bold" style={{ color: hsl(primary), fontFamily: "'Geist', sans-serif" }}>{item.price}</p>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// FAQ accordion item
// ---------------------------------------------------------------------------
const FAQItem = ({ item, theme }: { item: SiteSectionItem; theme: SiteContent["theme"] }) => {
  const [open, setOpen] = useState(false);
  const primary = theme.primary;
  const fg = theme.foreground;
  const bg = theme.background;

  return (
    <div className="rounded-xl overflow-hidden transition-all" style={{ border: `1px solid hsl(${fg} / 0.08)`, background: hsl(bg) }}>
      <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left" onClick={() => setOpen(!open)}>
        <span className="font-semibold text-sm leading-snug">{item.title}</span>
        <div className={`shrink-0 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
          style={{ color: hsl(primary) }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </button>
      {open && item.body && (
        <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: `hsl(${fg} / 0.65)` }}>
          {linkifyPhones(item.body)}
        </div>
      )}
    </div>
  );
};