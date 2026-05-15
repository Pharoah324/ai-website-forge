import * as LucideIcons from "lucide-react";
import { useState, type ReactNode } from "react";
import type { SiteContent, SiteSection, SiteSectionItem } from "@/types/site";
import { useValidatedImage, type ImageOrientation } from "@/hooks/useValidatedImage";

// ---------------------------------------------------------------------------
// Functional helpers: phone links, CTA scroll, contact form wiring
// ---------------------------------------------------------------------------

const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/g;
const BOOKING_RE = /\b(reserve|reservation|book|booking|schedule|appointment|table|seat)\b/i;

/** Wrap any phone-number-looking substrings inside text as clickable tel: links. */
export function linkifyPhones(text: string | undefined | null): ReactNode {
  if (!text) return text ?? null;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  PHONE_RE.lastIndex = 0;
  while ((match = PHONE_RE.exec(text)) !== null) {
    const raw = match[0];
    const digits = raw.replace(/[^\d+]/g, "");
    // Heuristic: must have at least 7 digits to qualify as a phone number.
    if (digits.replace(/\+/g, "").length < 7) continue;
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <a key={`tel-${match.index}`} href={`tel:${digits}`} className="underline">
        {raw}
      </a>,
    );
    lastIndex = match.index + raw.length;
  }
  if (lastIndex === 0) return text;
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

function scrollToContact(e: React.MouseEvent) {
  const el = document.getElementById("contact");
  if (el) {
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

type CTAButtonProps = {
  label: string;
  primary: string;
  className?: string;
  style?: React.CSSProperties;
  variant?: "filled" | "inverse";
};

/** Generated-site CTA — scrolls to the contact form. */
const CTAButton = ({ label, primary, className, style, variant = "filled" }: CTAButtonProps) => {
  const base = "inline-block rounded-md px-6 py-3 text-sm font-semibold shadow-md transition-opacity hover:opacity-90";
  const styleResolved: React.CSSProperties =
    variant === "inverse"
      ? { background: "white", color: primary, ...style }
      : { background: primary, color: "white", ...style };
  return (
    <a href="#contact" onClick={scrollToContact} className={className ?? base} style={styleResolved}>
      {label}
    </a>
  );
};

type ContactFormProps = {
  section: SiteSection;
  theme: SiteContent["theme"];
  siteId?: string;
  showBookingNote: boolean;
};

// ---------------------------------------------------------------------------
// Static UI strings — translated to match the generated site language.
// Falls back to English for any unsupported locale.
// ---------------------------------------------------------------------------
type UiKey =
  | "get_started"
  | "send_message"
  | "send"
  | "sending"
  | "name_placeholder"
  | "email_placeholder"
  | "phone_placeholder"
  | "message_placeholder"
  | "thank_you"
  | "we_will_be_in_touch"
  | "reservation_note"
  | "support"
  | "contact_heading"
  | "contact_subheading"
  | "err_name_required"
  | "err_name_long"
  | "err_email_required"
  | "err_email_invalid"
  | "err_email_long"
  | "err_phone_short"
  | "err_phone_long"
  | "err_message_required"
  | "err_message_long"
  | "err_generic";

const UI_STRINGS: Record<string, Record<UiKey, string>> = {
  en: {
    get_started: "Get started",
    send_message: "Send message",
    send: "Send",
    sending: "Sending…",
    name_placeholder: "Your name",
    email_placeholder: "Email",
    phone_placeholder: "Phone (optional)",
    message_placeholder: "Message",
    thank_you: "Thank you!",
    we_will_be_in_touch: "We'll be in touch within 24 hours.",
    reservation_note: "We'll confirm your reservation by phone or email.",
    support: "Support",
    contact_heading: "Get in touch",
    contact_subheading: "Tell us what you need and we'll be in touch within 24 hours.",
    err_name_required: "Please enter your name",
    err_name_long: "Name is too long",
    err_email_required: "Please enter your email",
    err_email_invalid: "Please enter a valid email",
    err_email_long: "Email is too long",
    err_phone_short: "Phone number looks too short",
    err_phone_long: "Phone number is too long",
    err_message_required: "Please enter a message",
    err_message_long: "Message is too long",
    err_generic: "Something went wrong. Please try again.",
  },
  es: {
    get_started: "Comenzar",
    send_message: "Enviar mensaje",
    send: "Enviar",
    sending: "Enviando…",
    name_placeholder: "Tu nombre",
    email_placeholder: "Correo electrónico",
    phone_placeholder: "Teléfono (opcional)",
    message_placeholder: "Mensaje",
    thank_you: "¡Gracias!",
    we_will_be_in_touch: "Nos pondremos en contacto en menos de 24 horas.",
    reservation_note: "Confirmaremos tu reserva por teléfono o correo electrónico.",
    support: "Soporte",
    contact_heading: "Contáctanos",
    contact_subheading: "Cuéntanos qué necesitas y te responderemos en menos de 24 horas.",
    err_name_required: "Por favor ingresa tu nombre",
    err_name_long: "El nombre es demasiado largo",
    err_email_required: "Por favor ingresa tu correo electrónico",
    err_email_invalid: "Por favor ingresa un correo válido",
    err_email_long: "El correo es demasiado largo",
    err_phone_short: "El número de teléfono parece muy corto",
    err_phone_long: "El número de teléfono es demasiado largo",
    err_message_required: "Por favor ingresa un mensaje",
    err_message_long: "El mensaje es demasiado largo",
    err_generic: "Algo salió mal. Por favor intenta de nuevo.",
  },
  pt: {
    get_started: "Começar",
    send_message: "Enviar mensagem",
    send: "Enviar",
    sending: "Enviando…",
    name_placeholder: "Seu nome",
    email_placeholder: "E-mail",
    phone_placeholder: "Telefone (opcional)",
    message_placeholder: "Mensagem",
    thank_you: "Obrigado!",
    we_will_be_in_touch: "Entraremos em contato em até 24 horas.",
    reservation_note: "Confirmaremos sua reserva por telefone ou e-mail.",
    support: "Suporte",
    contact_heading: "Fale conosco",
    contact_subheading: "Conte o que você precisa e responderemos em até 24 horas.",
    err_name_required: "Por favor, informe seu nome",
    err_name_long: "Nome muito longo",
    err_email_required: "Por favor, informe seu e-mail",
    err_email_invalid: "Por favor, informe um e-mail válido",
    err_email_long: "E-mail muito longo",
    err_phone_short: "O número de telefone parece muito curto",
    err_phone_long: "Número de telefone muito longo",
    err_message_required: "Por favor, escreva uma mensagem",
    err_message_long: "Mensagem muito longa",
    err_generic: "Algo deu errado. Por favor, tente novamente.",
  },
  fr: {
    get_started: "Commencer",
    send_message: "Envoyer le message",
    send: "Envoyer",
    sending: "Envoi…",
    name_placeholder: "Votre nom",
    email_placeholder: "E-mail",
    phone_placeholder: "Téléphone (facultatif)",
    message_placeholder: "Message",
    thank_you: "Merci !",
    we_will_be_in_touch: "Nous vous répondrons sous 24 heures.",
    reservation_note: "Nous confirmerons votre réservation par téléphone ou e-mail.",
    support: "Support",
    contact_heading: "Contactez-nous",
    contact_subheading: "Dites-nous ce dont vous avez besoin et nous vous répondrons sous 24 heures.",
    err_name_required: "Veuillez entrer votre nom",
    err_name_long: "Le nom est trop long",
    err_email_required: "Veuillez entrer votre e-mail",
    err_email_invalid: "Veuillez entrer un e-mail valide",
    err_email_long: "L'e-mail est trop long",
    err_phone_short: "Le numéro de téléphone semble trop court",
    err_phone_long: "Le numéro de téléphone est trop long",
    err_message_required: "Veuillez entrer un message",
    err_message_long: "Le message est trop long",
    err_generic: "Une erreur s'est produite. Veuillez réessayer.",
  },
};

function getLangKey(lang?: string): string {
  if (!lang) return "en";
  const code = lang.toLowerCase().split(/[-_]/)[0];
  return UI_STRINGS[code] ? code : "en";
}

function makeT(lang?: string) {
  const dict = UI_STRINGS[getLangKey(lang)];
  return (key: UiKey) => dict[key];
}

const ContactForm = ({
  section,
  theme,
  siteId,
  showBookingNote,
  lang,
}: ContactFormProps & { lang?: string }) => {
  const primary = `hsl(${theme.primary})`;
  const muted = `hsl(${theme.foreground} / 0.75)`;
  const border = `1px solid hsl(${theme.foreground} / 0.15)`;
  const t = makeT(lang);

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

    // Preview mode — no backing site_id (e.g. editor preview, share preview).
    if (!siteId) {
      setStatus("success");
      return;
    }

    setStatus("submitting");
    setErrorMsg(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/form-submission-webhook`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          site_id: siteId,
          fields: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            message: message.trim(),
            source: "Generated site contact form",
          },
        }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        // 412 = owner has not connected GHL — treat as soft success for the visitor,
        // they shouldn't see infrastructure errors.
        if (resp.status === 412) {
          setStatus("success");
          return;
        }
        throw new Error(json?.error || `Submission failed (${resp.status})`);
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : t("err_generic"));
    }
  };

  if (status === "success") {
    return (
      <section id="contact" className="px-6 py-16">
        <div
          className="mx-auto max-w-xl rounded-lg p-8 text-center"
          style={{ border: `1px solid hsl(${theme.primary} / 0.4)`, background: `hsl(${theme.primary} / 0.06)` }}
        >
          <h2 className="text-2xl font-bold" style={{ color: primary }}>
            {t("thank_you")}
          </h2>
          <p className="mt-3" style={{ color: muted }}>
            {t("we_will_be_in_touch")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="px-6 py-16">
      <div className="mx-auto max-w-xl">
        <h2 className="text-center text-3xl font-bold">{section.heading}</h2>
        {section.subheading && (
          <p className="mx-auto mt-3 text-center" style={{ color: muted }}>
            {linkifyPhones(section.subheading)}
          </p>
        )}
        {showBookingNote && (
          <p
            className="mx-auto mt-4 max-w-md rounded-md px-3 py-2 text-center text-xs"
            style={{ background: `hsl(${theme.primary} / 0.08)`, color: primary }}
          >
            {t("reservation_note")}
          </p>
        )}

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-3">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("name_placeholder")}
              maxLength={100}
              autoComplete="name"
              required
              aria-invalid={!!fieldErrors.name}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ border, background: `hsl(${theme.background})`, color: `hsl(${theme.foreground})` }}
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
          </div>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email_placeholder")}
              maxLength={255}
              autoComplete="email"
              required
              aria-invalid={!!fieldErrors.email}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ border, background: `hsl(${theme.background})`, color: `hsl(${theme.foreground})` }}
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
          </div>
          <div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phone_placeholder")}
              maxLength={40}
              autoComplete="tel"
              aria-invalid={!!fieldErrors.phone}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ border, background: `hsl(${theme.background})`, color: `hsl(${theme.foreground})` }}
            />
            {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
          </div>
          <div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("message_placeholder")}
              rows={4}
              maxLength={2000}
              required
              aria-invalid={!!fieldErrors.message}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ border, background: `hsl(${theme.background})`, color: `hsl(${theme.foreground})` }}
            />
            {fieldErrors.message && <p className="mt-1 text-xs text-red-600">{fieldErrors.message}</p>}
          </div>
          {status === "error" && errorMsg && (
            <p className="rounded-md px-3 py-2 text-center text-xs" style={{ background: "rgba(239,68,68,0.1)", color: "rgb(185,28,28)" }}>
              {errorMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={status === "submitting"}
            style={{ background: primary, color: "white", opacity: status === "submitting" ? 0.7 : 1 }}
            className="w-full rounded-md py-2.5 text-sm font-semibold"
          >
            {status === "submitting" ? t("sending") : section.cta || t("send")}
          </button>
        </form>
      </div>
    </section>
  );
};


// ---- Menswear / luxury-tailoring vocabulary mapping ------------------------
// When a brand reads as a men's haberdashery / bespoke house we force every
// Unsplash query into a curated menswear vocabulary so we never get women,
// generic stock, or off-brand imagery.
const MENSWEAR_BRAND_RE =
  /\b(kings?\s*(?:&|and)?\s*collars?|sartorial|haberdash|bespoke|savile|tailor|gentleman|gentlemen|menswear|men's wear|suit\s*house|atelier)\b/i;

function isMenswearContext(brand?: string, extra?: string): boolean {
  const blob = `${brand || ""} ${extra || ""}`;
  return MENSWEAR_BRAND_RE.test(blob);
}

// Map any heading / item title to a precise menswear Unsplash search term.
// Falls back to a generic "well dressed man" so we never search arms, women,
// or unrelated stock when the title is abstract ("The Boardroom Collection").
function menswearQueryFor(text: string): string {
  const t = (text || "").toLowerCase();
  if (/cufflink|cuff link/.test(t)) return "mens cufflinks luxury";
  if (/bow\s*tie|bowtie/.test(t)) return "mens bowtie";
  if (/pocket\s*square|handkerchief/.test(t)) return "pocket square mens suit";
  if (/tie\b|necktie|cravat/.test(t)) return "mens silk tie";
  if (/shoe|oxford|loafer|brogue|footwear/.test(t)) return "oxford dress shoes mens";
  if (/fabric|cloth|textile|wool|cashmere|swatch|material/.test(t)) return "mens suit fabric";
  if (/shirt|collar/.test(t)) return "mens dress shirt tailored";
  if (/watch|timepiece/.test(t)) return "mens luxury watch";
  if (/belt|leather goods|wallet/.test(t)) return "mens leather belt luxury";
  if (/board\s*room|business|executive|office|corporate/.test(t)) return "mens luxury suit boardroom";
  if (/wedding|formal|black\s*tie|tuxedo|evening/.test(t)) return "mens tuxedo black tie";
  if (/casual|weekend|smart\s*casual/.test(t)) return "well dressed man smart casual";
  if (/atelier|workshop|craft|hand\s*made|stitch|sewing|measure|fitting|tape/.test(t))
    return "bespoke tailoring atelier";
  if (/accessor/.test(t)) return "mens accessories cufflinks bowtie";
  if (/hero|collection|signature|flagship|masters?|kings?/.test(t)) return "mens luxury suit bespoke";
  if (/about|story|heritage|legacy|founder/.test(t)) return "savile row tailor portrait";
  if (/testimonial|client|review/.test(t)) return "well dressed man portrait";
  if (/contact|visit|appointment|store|showroom/.test(t)) return "luxury menswear showroom interior";
  return "well dressed man bespoke suit";
}

// Build a useful Unsplash query for self-healing when a generated image
// 404s. Falls back to the section heading + business context if the
// generator didn't ship an explicit search query.
function buildSectionQuery(
  section: { type?: string; heading?: string; image_search_query?: string },
  brand?: string,
): string {
  const menswear = isMenswearContext(brand, section.heading);
  if (menswear) {
    return menswearQueryFor(`${section.heading || ""} ${section.type || ""}`);
  }
  if (section.image_search_query) return section.image_search_query;
  const h = (section.heading || "").trim();
  const b = (brand || "").trim();
  switch (section.type) {
    case "hero": return `${b} ${h} hero professional`.trim() || "modern business hero";
    case "about": return `${b} team office`.trim() || "professional team";
    case "features": return `${b} ${h}`.trim() || "service detail";
    case "testimonials": return "happy customer portrait";
    case "cta": return `${b} ${h} lifestyle`.trim() || "call to action lifestyle";
    case "contact": return `${b} location storefront`.trim() || "office storefront";
    default: return `${b} ${h}`.trim() || "professional photography";
  }
}

function buildItemQuery(
  item: { title?: string; image_search_query?: string },
  section: { type?: string; heading?: string },
  brand?: string,
): string {
  const menswear = isMenswearContext(brand, `${section.heading || ""} ${item.title || ""}`);
  if (menswear) {
    return menswearQueryFor(`${item.title || ""} ${section.heading || ""}`);
  }
  if (item.image_search_query) return item.image_search_query;
  return `${section.heading || ""} ${item.title || ""}`.trim() || "detail photography";
}

type ValidatedImgProps = {
  initial?: string;
  query: string;
  orientation?: ImageOrientation;
  fallbackIndex?: number;
  alt?: string;
  className?: string;
  loading?: "lazy" | "eager";
  onLoaded?: () => void;
  /** "Photo by X on Unsplash" — required by Unsplash API ToS. */
  credit?: string;
  /** "overlay" wraps in <figure> with a caption; "tooltip" only sets title (use for tiny avatars). */
  creditMode?: "overlay" | "tooltip";
};

const UNSPLASH_REF = "?utm_source=virtualengine_builder&utm_medium=referral";

const PhotoCredit = ({ credit, className }: { credit: string; className?: string }) => (
  <a
    href={`https://unsplash.com/${UNSPLASH_REF}`}
    target="_blank"
    rel="noopener noreferrer"
    className={
      className ||
      "absolute bottom-1 right-1 rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white/95 no-underline hover:bg-black/70"
    }
    style={{ backdropFilter: "blur(2px)" }}
  >
    {credit}
  </a>
);

const ValidatedImg = ({
  initial, query, orientation = "landscape", fallbackIndex,
  alt, className, loading = "lazy", credit, creditMode = "overlay",
}: ValidatedImgProps) => {
  const { src, alt: healedAlt, onError } = useValidatedImage({
    initial, query, orientation, fallbackIndex,
  });
  if (!src) return null;
  if (!credit || creditMode === "tooltip") {
    return (
      <img
        src={src}
        alt={healedAlt || alt || ""}
        title={credit && creditMode === "tooltip" ? credit : undefined}
        loading={loading}
        className={className}
        onError={onError}
      />
    );
  }
  return (
    <figure className={`relative overflow-hidden ${className || ""}`}>
      <img
        src={src}
        alt={healedAlt || alt || ""}
        loading={loading}
        className="h-full w-full object-cover"
        onError={onError}
      />
      <PhotoCredit credit={credit} />
    </figure>
  );
};

// Hero / CTA background images can't use <img onError>, so we preload-validate
// the URL and swap to a healed src once it's verified.
const ValidatedBgSection = ({
  initial, query, orientation = "landscape", fallbackIndex,
  overlay, sectionClassName, sectionStyle, children, credit,
}: {
  initial?: string;
  query: string;
  orientation?: ImageOrientation;
  fallbackIndex?: number;
  overlay: string; // e.g. "linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.55))"
  sectionClassName?: string;
  sectionStyle?: React.CSSProperties;
  children: React.ReactNode;
  credit?: string;
}) => {
  const { src, status } = useValidatedImage({
    initial, query, orientation, fallbackIndex, preload: true,
  });
  const url = status === "ok" ? src : undefined;
  return (
    <section
      className={`relative ${sectionClassName || ""}`}
      style={{
        ...sectionStyle,
        backgroundImage: url ? `${overlay}, url(${url})` : overlay,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {children}
      {url && credit && <PhotoCredit credit={credit} />}
    </section>
  );
};



type IconCmp = React.ComponentType<{ className?: string; size?: number; strokeWidth?: number; style?: React.CSSProperties }>;

function getIcon(name?: string): IconCmp | null {
  if (!name) return null;
  const mod = LucideIcons as unknown as Record<string, IconCmp>;
  return mod[name] || mod.Sparkles || null;
}

// Strip markdown image syntax (and stray image URLs) from text fields, and
// promote the first found URL to image_url when missing. Older generated
// sites stored "![](url)" inside body fields, which would otherwise render
// as literal text.
const MD_IMG_RE = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
const RAW_IMG_URL_RE = /(https?:\/\/(?:images\.unsplash\.com|[^\s)]+\.(?:jpg|jpeg|png|webp|gif|avif))[^\s)]*)/gi;

function cleanTextNode<T extends Record<string, unknown>>(node: T): T {
  let firstUrl: string | null = null;
  let firstAlt: string | null = null;
  const out: Record<string, unknown> = { ...node };
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (typeof v !== "string") continue;
    let cleaned = v.replace(MD_IMG_RE, (_m, alt: string, url: string) => {
      if (!firstUrl) { firstUrl = url; firstAlt = alt || null; }
      return "";
    });
    cleaned = cleaned.replace(RAW_IMG_URL_RE, (_m, url: string) => {
      if (!firstUrl) firstUrl = url;
      return "";
    });
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
    out[k] = cleaned;
  }
  if (firstUrl && !out.image_url) {
    out.image_url = firstUrl;
    if (firstAlt && !out.image_alt) out.image_alt = firstAlt;
  }
  return out as T;
}

function sanitizeContent(content: SiteContent): SiteContent {
  const sections = (content.sections || []).map((sec) => {
    const cleanedSec = cleanTextNode(sec as unknown as Record<string, unknown>) as unknown as SiteSection;
    if (Array.isArray(cleanedSec.items)) {
      cleanedSec.items = cleanedSec.items.map((it) =>
        cleanTextNode(it as unknown as Record<string, unknown>) as unknown as SiteSectionItem
      );
    }
    return cleanedSec;
  });
  return { ...content, sections };
}

// Compute a quick design-quality score (0-100).
export function computeDesignScore(content: SiteContent | null): {
  total: number;
  hierarchy: number;
  mobile: number;
  cta: number;
  images: number;
  notes: string[];
} {
  if (!content) return { total: 0, hierarchy: 0, mobile: 0, cta: 0, images: 0, notes: [] };
  const sections = content.sections || [];
  const notes: string[] = [];

  const hero = sections.find((s) => s.type === "hero");
  let hierarchy = 0;
  if (hero) hierarchy += 50;
  if (hero?.heading && hero.heading.split(" ").length <= 9) hierarchy += 25;
  if (sections.length >= 5) hierarchy += 25;
  if (!hero) notes.push("Missing hero section");

  // CTA: above-fold + count >= 3
  const ctaCount = sections.filter((s) => s.cta).length;
  let cta = 0;
  if (hero?.cta) cta += 40;
  if (ctaCount >= 3) cta += 40;
  if (sections.some((s) => s.cta_urgency)) cta += 20;
  if (ctaCount < 3) notes.push("Add more CTAs (top, middle, bottom)");

  // Images: how many sections have image_url
  const withImg = sections.filter((s) => s.image_url || s.items?.some((i) => i.image_url)).length;
  const images = sections.length ? Math.round((withImg / sections.length) * 100) : 0;
  if (images < 50) notes.push("Add more imagery");

  // Mobile: assume good if content exists; penalise huge headings
  let mobile = 80;
  if (hero?.heading && hero.heading.length > 70) {
    mobile -= 15;
    notes.push("Hero headline is long for mobile");
  }
  if (sections.length > 12) {
    mobile -= 10;
    notes.push("Page may be too long for mobile");
  }

  const total = Math.round(hierarchy * 0.3 + cta * 0.3 + images * 0.25 + mobile * 0.15);
  return { total, hierarchy, mobile, cta, images, notes };
}

export type SiteBranding = {
  brand_name?: string | null;
  logo_url?: string | null;
  primary_color?: string | null; // HSL "h s% l%"
  accent_color?: string | null;
  hide_branding?: boolean | null;
  footer_text?: string | null;
  support_email?: string | null;
};

export const SitePreview = ({
  content,
  branding,
  siteId,
}: {
  content: SiteContent;
  branding?: SiteBranding | null;
  /** When set, the contact form posts to the form-submission-webhook for this site. */
  siteId?: string;
}) => {
  const cleanedContent = sanitizeContent(content);

  // Apply white-label theme overrides
  const themedContent: SiteContent = branding
    ? {
        ...cleanedContent,
        name: branding.brand_name || cleanedContent.name,
        theme: {
          ...cleanedContent.theme,
          primary: branding.primary_color || cleanedContent.theme.primary,
          accent: branding.accent_color || cleanedContent.theme.accent,
        },
      }
    : cleanedContent;

  const style = {
    "--site-primary": themedContent.theme.primary,
    "--site-bg": themedContent.theme.background,
    "--site-fg": themedContent.theme.foreground,
    "--site-accent": themedContent.theme.accent,
  } as React.CSSProperties;

  const headerName = branding?.brand_name || themedContent.name;
  const footerLine =
    branding?.footer_text ||
    `© ${new Date().getFullYear()} ${headerName}`;

  const lang = themedContent.lang;
  const t = makeT(lang);

  // Booking-style CTA anywhere on the page → show reservation reassurance in form.
  const hasBookingCta = themedContent.sections.some(
    (s) => (s.cta && BOOKING_RE.test(s.cta)) || (s.heading && BOOKING_RE.test(s.heading)),
  );
  // Ensure there's always a contact section to scroll to.
  const sectionsToRender: SiteSection[] = themedContent.sections.some((s) => s.type === "contact")
    ? themedContent.sections
    : [
        ...themedContent.sections,
        {
          type: "contact",
          heading: t("contact_heading"),
          subheading: t("contact_subheading"),
          cta: t("send_message"),
        } as SiteSection,
      ];

  return (
    <div style={style} className="min-h-full" dir={themedContent.dir || "ltr"} lang={lang}>
      <div
        style={{
          background: `hsl(${themedContent.theme.background})`,
          color: `hsl(${themedContent.theme.foreground})`,
        }}
      >
        {/* Header */}
        <header
          style={{ borderBottom: `1px solid hsl(${themedContent.theme.foreground} / 0.08)` }}
          className="px-6 py-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {branding?.logo_url && (
                <img
                  src={branding.logo_url}
                  alt={headerName}
                  className="h-7 w-auto object-contain"
                />
              )}
              <span className="font-bold">{headerName}</span>
            </div>
            <a
              href="#contact"
              onClick={scrollToContact}
              style={{ background: `hsl(${themedContent.theme.primary})`, color: "white" }}
              className="rounded-md px-3 py-1.5 text-xs font-medium"
            >
              {t("get_started")}
            </a>
          </div>
        </header>

        {sectionsToRender.map((s, i) => (
          <Section
            key={i}
            section={s}
            theme={themedContent.theme}
            index={i}
            brand={headerName}
            siteId={siteId}
            hasBookingCta={hasBookingCta}
            lang={lang}
          />
        ))}

        <footer
          style={{
            borderTop: `1px solid hsl(${themedContent.theme.foreground} / 0.08)`,
            color: `hsl(${themedContent.theme.foreground} / 0.6)`,
          }}
          className="px-6 py-6 text-center text-xs"
        >
          <div>{footerLine}</div>
          {branding?.support_email && (
            <div className="mt-1 opacity-80">
              {t("support")}:{" "}
              <a href={`mailto:${branding.support_email}`} className="underline">
                {branding.support_email}
              </a>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};

const Section = ({
  section,
  theme,
  index,
  brand,
  siteId,
  hasBookingCta,
  lang,
}: {
  section: SiteSection;
  theme: SiteContent["theme"];
  index: number;
  brand?: string;
  siteId?: string;
  hasBookingCta?: boolean;
  lang?: string;
}) => {
  const accentBg = `hsl(${theme.accent})`;
  const primary = `hsl(${theme.primary})`;
  const muted = `hsl(${theme.foreground} / 0.75)`;
  const alt = index % 2 === 1; // alternating bands
  const sectionQuery = buildSectionQuery(section, brand);

  const PrimaryCTA = section.cta ? (
    <div className="mt-6 flex flex-col items-center gap-1.5">
      <CTAButton label={section.cta} primary={primary} />
      {section.cta_urgency && (
        <span className="text-xs font-medium" style={{ color: `hsl(${theme.primary})` }}>
          ⏱ {section.cta_urgency}
        </span>
      )}
    </div>
  ) : null;

  if (section.type === "hero") {
    const hasSide = section.image_url && (section.layout === "image-right" || section.layout === "image-left");
    const wantsBg = section.image_placement === "background" || section.layout === "image-background";
    const hasBg = !hasSide && (wantsBg || Boolean(section.image_url) || section.type === "hero");

    if (hasBg) {
      return (
        <ValidatedBgSection
          initial={section.image_url}
          query={sectionQuery}
          orientation="landscape"
          fallbackIndex={index}
          overlay="linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55))"
          sectionClassName="relative px-6 py-24 text-center"
          sectionStyle={{ color: "white" }}
          credit={section.image_credit}
        >
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            {section.heading}
          </h1>
          {section.subheading && (
            <p className="mx-auto mt-4 max-w-2xl text-lg opacity-95">{section.subheading}</p>
          )}
          {PrimaryCTA}
        </ValidatedBgSection>
      );
    }
    if (hasSide) {
      const reverse = section.layout === "image-left";
      return (
        <section className="px-6 py-16">
          <div className={`mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
            <div>
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">{section.heading}</h1>
              {section.subheading && (
                <p className="mt-4 text-lg" style={{ color: muted }}>{section.subheading}</p>
              )}
              {section.cta && (
                <div className="mt-6 flex items-center gap-3">
                  <CTAButton label={section.cta} primary={primary} />
                  {section.cta_urgency && (
                    <span className="text-xs font-medium" style={{ color: `hsl(${theme.primary})` }}>⏱ {section.cta_urgency}</span>
                  )}
                </div>
              )}
            </div>
            <ValidatedImg
              initial={section.image_url}
              query={sectionQuery}
              orientation="landscape"
              fallbackIndex={index}
              alt={section.image_alt || section.heading}
              className="aspect-[4/3] w-full rounded-lg object-cover shadow-xl"
              credit={section.image_credit}
            />
          </div>
        </section>
      );
    }
    return (
      <section className="px-6 py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
          {section.heading}
        </h1>
        {section.subheading && (
          <p className="mx-auto mt-4 max-w-2xl text-lg" style={{ color: muted }}>
            {section.subheading}
          </p>
        )}
        {PrimaryCTA}
      </section>
    );
  }

  if (section.type === "features" || section.type === "about") {
    return (
      <section
        className="px-6 py-16"
        style={{ background: alt ? accentBg : `hsl(${theme.background})` }}
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold">{section.heading}</h2>
          {section.subheading && (
            <p className="mx-auto mt-3 max-w-2xl text-center" style={{ color: muted }}>
              {section.subheading}
            </p>
          )}
          {section.items && section.items.length > 0 && (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {section.items.map((it, i) => (
                <FeatureCard key={i} item={it} theme={theme} section={section} index={i} brand={brand} />
              ))}
            </div>
          )}
          {PrimaryCTA}
        </div>
      </section>
    );
  }

  if (section.type === "pricing") {
    return (
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold">{section.heading}</h2>
          {section.subheading && (
            <p className="mx-auto mt-3 max-w-2xl text-center" style={{ color: muted }}>
              {section.subheading}
            </p>
          )}
          {section.items && (
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {section.items.map((it, i) => {
                const Icon = getIcon(it.icon_name);
                return (
                  <div
                    key={i}
                    className="rounded-lg p-6 text-center"
                    style={{ border: `1px solid hsl(${theme.foreground} / 0.1)` }}
                  >
                    {Icon && (
                      <Icon className="mx-auto mb-3" size={28} strokeWidth={2} />
                    )}
                    <h3 className="font-semibold">{it.title}</h3>
                    {it.price && <p className="mt-3 text-3xl font-bold" style={{ color: primary }}>{it.price}</p>}
                    {it.body && (
                      <p className="mt-2 text-sm" style={{ color: muted }}>{linkifyPhones(it.body)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {PrimaryCTA}
        </div>
      </section>
    );
  }

  if (section.type === "testimonials") {
    return (
      <section className="px-6 py-16" style={{ background: accentBg }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold">{section.heading}</h2>
          {section.items && (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {section.items.map((it, i) => (
                <div key={i} className="rounded-lg p-5" style={{ background: `hsl(${theme.background})` }}>
                  <div className="flex items-start gap-3">
                    {it.image_thumb || it.image_url ? (
                      <ValidatedImg
                        initial={it.image_thumb || it.image_url}
                        query={buildItemQuery(it, section, brand)}
                        orientation="squarish"
                        fallbackIndex={i}
                        alt={it.author || "Testimonial"}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                        credit={it.image_credit}
                        creditMode="tooltip"
                      />
                    ) : (
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{ background: primary, color: "white" }}
                      >
                        {(it.author || "?").charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm italic">"{it.body || it.title}"</p>
                      {it.author && (
                        <p className="mt-2 text-xs font-medium" style={{ color: muted }}>— {it.author}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (section.type === "faq") {
    return (
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold">{section.heading}</h2>
          {section.items && (
            <div className="mt-8 space-y-4">
              {section.items.map((it, i) => (
                <div key={i} className="rounded-lg p-4" style={{ border: `1px solid hsl(${theme.foreground} / 0.1)` }}>
                  <p className="font-semibold">{it.title}</p>
                  {it.body && <p className="mt-1 text-sm" style={{ color: muted }}>{linkifyPhones(it.body)}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (section.type === "cta") {
    if (section.image_url) {
      const ctaOverlay = `linear-gradient(${primary.replace("hsl(", "hsla(").replace(")", " / 0.85)")}, ${primary.replace("hsl(", "hsla(").replace(")", " / 0.85)")})`;
      return (
        <ValidatedBgSection
          initial={section.image_url}
          query={sectionQuery}
          orientation="landscape"
          fallbackIndex={index}
          overlay={ctaOverlay}
          sectionClassName="relative px-6 py-20 text-center"
          sectionStyle={{ color: "white" }}
          credit={section.image_credit}
        >
          <h2 className="text-3xl font-bold">{section.heading}</h2>
          {section.subheading && <p className="mx-auto mt-3 max-w-xl opacity-95">{section.subheading}</p>}
          {section.cta && (
            <div className="mt-6 flex flex-col items-center gap-1.5">
              <CTAButton label={section.cta} primary={primary} variant="inverse" />
              {section.cta_urgency && <span className="text-xs font-medium opacity-95">⏱ {section.cta_urgency}</span>}
            </div>
          )}
        </ValidatedBgSection>
      );
    }
    return (
      <section className="px-6 py-20 text-center" style={{ background: primary, color: "white" }}>
        <h2 className="text-3xl font-bold">{section.heading}</h2>
        {section.subheading && <p className="mx-auto mt-3 max-w-xl opacity-90">{section.subheading}</p>}
        {section.cta && (
          <div className="mt-6 flex flex-col items-center gap-1.5">
            <CTAButton label={section.cta} primary={primary} variant="inverse" />
            {section.cta_urgency && <span className="text-xs font-medium opacity-95">⏱ {section.cta_urgency}</span>}
          </div>
        )}
      </section>
    );
  }

  // contact — real form wired to form-submission-webhook
  return (
    <ContactForm
      section={section}
      theme={theme}
      siteId={siteId}
      showBookingNote={!!hasBookingCta}
    />
  );
};

const FeatureCard = ({
  item, theme, section, index, brand,
}: {
  item: SiteSectionItem;
  theme: SiteContent["theme"];
  section: SiteSection;
  index: number;
  brand?: string;
}) => {
  const Icon = getIcon(item.icon_name);
  const muted = `hsl(${theme.foreground} / 0.75)`;
  const primary = `hsl(${theme.primary})`;
  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{
        background: `hsl(${theme.background})`,
        border: `1px solid hsl(${theme.foreground} / 0.08)`,
      }}
    >
      {(item.image_url || item.image_search_query || section.type === "features" || section.type === "about") && (
        <ValidatedImg
          initial={item.image_url}
          query={buildItemQuery(item, section, brand)}
          orientation="landscape"
          fallbackIndex={index}
          alt={item.image_alt || item.title}
          className="aspect-video w-full object-cover"
          credit={item.image_credit}
        />
      )}
      <div className="p-5">
        {Icon && !item.image_url && (
          <div
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-md"
            style={{ background: `hsl(${theme.primary} / 0.12)`, color: primary }}
          >
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
        <h3 className="flex items-center gap-2 font-semibold">
          {Icon && item.image_url && <Icon size={18} strokeWidth={2} style={{ color: primary }} />}
          {item.title}
        </h3>
        {item.body && <p className="mt-2 text-sm" style={{ color: muted }}>{linkifyPhones(item.body)}</p>}
      </div>
    </div>
  );
};
