import * as LucideIcons from "lucide-react";
import type { SiteContent, SiteSection, SiteSectionItem } from "@/types/site";
import { useValidatedImage, type ImageOrientation } from "@/hooks/useValidatedImage";

// Build a useful Unsplash query for self-healing when a generated image
// 404s. Falls back to the section heading + business context if the
// generator didn't ship an explicit search query.
function buildSectionQuery(
  section: { type?: string; heading?: string; image_search_query?: string },
  brand?: string,
): string {
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
): string {
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
};

const ValidatedImg = ({
  initial, query, orientation = "landscape", fallbackIndex,
  alt, className, loading = "lazy",
}: ValidatedImgProps) => {
  const { src, alt: healedAlt, onError } = useValidatedImage({
    initial, query, orientation, fallbackIndex,
  });
  if (!src) return null;
  return (
    <img
      src={src}
      alt={healedAlt || alt || ""}
      loading={loading}
      className={className}
      onError={onError}
    />
  );
};

// Hero / CTA background images can't use <img onError>, so we preload-validate
// the URL and swap to a healed src once it's verified.
const ValidatedBgSection = ({
  initial, query, orientation = "landscape", fallbackIndex,
  overlay, sectionClassName, sectionStyle, children,
}: {
  initial?: string;
  query: string;
  orientation?: ImageOrientation;
  fallbackIndex?: number;
  overlay: string; // e.g. "linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.55))"
  sectionClassName?: string;
  sectionStyle?: React.CSSProperties;
  children: React.ReactNode;
}) => {
  const { src } = useValidatedImage({
    initial, query, orientation, fallbackIndex, preload: true,
  });
  const url = src || initial;
  return (
    <section
      className={sectionClassName}
      style={{
        ...sectionStyle,
        backgroundImage: url ? `${overlay}, url(${url})` : overlay,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {children}
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
}: {
  content: SiteContent;
  branding?: SiteBranding | null;
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

  return (
    <div style={style} className="min-h-full" dir={themedContent.dir || "ltr"}>
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
            <button
              style={{ background: `hsl(${themedContent.theme.primary})`, color: "white" }}
              className="rounded-md px-3 py-1.5 text-xs font-medium"
            >
              Get started
            </button>
          </div>
        </header>

        {themedContent.sections.map((s, i) => (
          <Section key={i} section={s} theme={themedContent.theme} index={i} brand={headerName} />
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
              Support:{" "}
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
}: {
  section: SiteSection;
  theme: SiteContent["theme"];
  index: number;
  brand?: string;
}) => {
  const accentBg = `hsl(${theme.accent})`;
  const primary = `hsl(${theme.primary})`;
  const muted = `hsl(${theme.foreground} / 0.75)`;
  const alt = index % 2 === 1; // alternating bands
  const sectionQuery = buildSectionQuery(section, brand);

  const PrimaryCTA = section.cta ? (
    <div className="mt-6 flex flex-col items-center gap-1.5">
      <button
        style={{ background: primary, color: "white" }}
        className="rounded-md px-6 py-3 text-sm font-semibold shadow-md"
      >
        {section.cta}
      </button>
      {section.cta_urgency && (
        <span className="text-xs font-medium" style={{ color: `hsl(${theme.primary})` }}>
          ⏱ {section.cta_urgency}
        </span>
      )}
    </div>
  ) : null;

  if (section.type === "hero") {
    const hasBg = section.image_url && (section.image_placement === "background" || section.layout === "image-background");
    const hasSide = section.image_url && (section.layout === "image-right" || section.layout === "image-left");

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
                  <button style={{ background: primary, color: "white" }} className="rounded-md px-6 py-3 text-sm font-semibold shadow-md">
                    {section.cta}
                  </button>
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
                <FeatureCard key={i} item={it} theme={theme} section={section} index={i} />
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
                      <p className="mt-2 text-sm" style={{ color: muted }}>{it.body}</p>
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
                        query={buildItemQuery(it, section)}
                        orientation="squarish"
                        fallbackIndex={i}
                        alt={it.author || "Testimonial"}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
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
                  {it.body && <p className="mt-1 text-sm" style={{ color: muted }}>{it.body}</p>}
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
        >
          <h2 className="text-3xl font-bold">{section.heading}</h2>
          {section.subheading && <p className="mx-auto mt-3 max-w-xl opacity-95">{section.subheading}</p>}
          {section.cta && (
            <div className="mt-6 flex flex-col items-center gap-1.5">
              <button className="rounded-md bg-white px-6 py-3 text-sm font-semibold" style={{ color: primary }}>
                {section.cta}
              </button>
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
            <button className="rounded-md bg-white px-6 py-3 text-sm font-semibold" style={{ color: primary }}>
              {section.cta}
            </button>
            {section.cta_urgency && <span className="text-xs font-medium opacity-95">⏱ {section.cta_urgency}</span>}
          </div>
        )}
      </section>
    );
  }

  // contact
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-xl">
        <h2 className="text-center text-3xl font-bold">{section.heading}</h2>
        {section.subheading && (
          <p className="mx-auto mt-3 text-center" style={{ color: muted }}>{section.subheading}</p>
        )}
        <div className="mt-6 space-y-3">
          <input placeholder="Your name" className="w-full rounded-md px-3 py-2 text-sm"
            style={{ border: `1px solid hsl(${theme.foreground} / 0.15)` }} />
          <input placeholder="Email" className="w-full rounded-md px-3 py-2 text-sm"
            style={{ border: `1px solid hsl(${theme.foreground} / 0.15)` }} />
          <textarea placeholder="Message" rows={4} className="w-full rounded-md px-3 py-2 text-sm"
            style={{ border: `1px solid hsl(${theme.foreground} / 0.15)` }} />
          <button style={{ background: primary, color: "white" }} className="w-full rounded-md py-2.5 text-sm font-semibold">
            {section.cta || "Send"}
          </button>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ item, theme }: { item: SiteSectionItem; theme: SiteContent["theme"] }) => {
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
      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.image_alt || item.title}
          loading="lazy"
          className="aspect-video w-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
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
        {item.body && <p className="mt-2 text-sm" style={{ color: muted }}>{item.body}</p>}
      </div>
    </div>
  );
};
