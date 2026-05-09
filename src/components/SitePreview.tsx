import * as LucideIcons from "lucide-react";
import type { SiteContent, SiteSection, SiteSectionItem } from "@/types/site";

type IconCmp = React.ComponentType<{ className?: string; size?: number; strokeWidth?: number; style?: React.CSSProperties }>;

function getIcon(name?: string): IconCmp | null {
  if (!name) return null;
  const mod = LucideIcons as unknown as Record<string, IconCmp>;
  return mod[name] || mod.Sparkles || null;
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

export const SitePreview = ({ content }: { content: SiteContent }) => {
  const style = {
    "--site-primary": content.theme.primary,
    "--site-bg": content.theme.background,
    "--site-fg": content.theme.foreground,
    "--site-accent": content.theme.accent,
  } as React.CSSProperties;

  // Older generated sites may contain markdown image syntax inside text
  // fields. Strip it at render time and promote the URL to image_url so we
  // never display literal "![](...)" text.
  const cleanedContent = sanitizeContent(content);

  return (
    <div style={style} className="min-h-full" dir={cleanedContent.dir || "ltr"}>
      <div
        style={{
          background: `hsl(${cleanedContent.theme.background})`,
          color: `hsl(${cleanedContent.theme.foreground})`,
        }}
      >
        {/* Header */}
        <header
          style={{ borderBottom: `1px solid hsl(${cleanedContent.theme.foreground} / 0.08)` }}
          className="px-6 py-4"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold">{cleanedContent.name}</span>
            <button
              style={{ background: `hsl(${cleanedContent.theme.primary})`, color: "white" }}
              className="rounded-md px-3 py-1.5 text-xs font-medium"
            >
              Get started
            </button>
          </div>
        </header>

        {cleanedContent.sections.map((s, i) => (
          <Section key={i} section={s} theme={cleanedContent.theme} index={i} />
        ))}

        <footer
          style={{
            borderTop: `1px solid hsl(${cleanedContent.theme.foreground} / 0.08)`,
            color: `hsl(${cleanedContent.theme.foreground} / 0.6)`,
          }}
          className="px-6 py-6 text-center text-xs"
        >
          © {new Date().getFullYear()} {cleanedContent.name}
        </footer>
      </div>
    </div>
  );
};

const Section = ({
  section,
  theme,
  index,
}: {
  section: SiteSection;
  theme: SiteContent["theme"];
  index: number;
}) => {
  const accentBg = `hsl(${theme.accent})`;
  const primary = `hsl(${theme.primary})`;
  const muted = `hsl(${theme.foreground} / 0.75)`;
  const alt = index % 2 === 1; // alternating bands

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
        <section
          className="relative px-6 py-24 text-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${section.image_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            color: "white",
          }}
        >
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            {section.heading}
          </h1>
          {section.subheading && (
            <p className="mx-auto mt-4 max-w-2xl text-lg opacity-95">{section.subheading}</p>
          )}
          {PrimaryCTA}
        </section>
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
            <img
              src={section.image_url}
              alt={section.image_alt || section.heading}
              loading="lazy"
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
                <FeatureCard key={i} item={it} theme={theme} />
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
                      <img
                        src={it.image_thumb || it.image_url}
                        alt={it.author || "Testimonial"}
                        loading="lazy"
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
      return (
        <section
          className="relative px-6 py-20 text-center"
          style={{
            backgroundImage: `linear-gradient(${primary.replace("hsl(", "hsla(").replace(")", " / 0.85)")}, ${primary.replace("hsl(", "hsla(").replace(")", " / 0.85)")}), url(${section.image_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            color: "white",
          }}
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
        </section>
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
