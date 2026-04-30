import type { SiteContent, SiteSection } from "@/types/site";

export const SitePreview = ({ content }: { content: SiteContent }) => {
  const style = {
    "--site-primary": content.theme.primary,
    "--site-bg": content.theme.background,
    "--site-fg": content.theme.foreground,
    "--site-accent": content.theme.accent,
  } as React.CSSProperties;

  return (
    <div
      style={style}
      className="min-h-full"
    >
      <div
        style={{
          background: `hsl(${content.theme.background})`,
          color: `hsl(${content.theme.foreground})`,
        }}
      >
        {/* Header */}
        <header
          style={{
            borderBottom: `1px solid hsl(${content.theme.foreground} / 0.08)`,
          }}
          className="px-6 py-4"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold">{content.name}</span>
            <button
              style={{
                background: `hsl(${content.theme.primary})`,
                color: "white",
              }}
              className="rounded-md px-3 py-1.5 text-xs font-medium"
            >
              Get started
            </button>
          </div>
        </header>

        {content.sections.map((s, i) => (
          <Section key={i} section={s} theme={content.theme} />
        ))}

        <footer
          style={{
            borderTop: `1px solid hsl(${content.theme.foreground} / 0.08)`,
            color: `hsl(${content.theme.foreground} / 0.6)`,
          }}
          className="px-6 py-6 text-center text-xs"
        >
          © {new Date().getFullYear()} {content.name}
        </footer>
      </div>
    </div>
  );
};

const Section = ({
  section,
  theme,
}: {
  section: SiteSection;
  theme: SiteContent["theme"];
}) => {
  const accentBg = `hsl(${theme.accent})`;
  const primary = `hsl(${theme.primary})`;
  const muted = `hsl(${theme.foreground} / 0.7)`;

  if (section.type === "hero") {
    return (
      <section className="px-6 py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
          {section.heading}
        </h1>
        {section.subheading && (
          <p
            className="mx-auto mt-4 max-w-2xl text-lg"
            style={{ color: muted }}
          >
            {section.subheading}
          </p>
        )}
        {section.cta && (
          <button
            style={{ background: primary, color: "white" }}
            className="mt-8 rounded-md px-6 py-3 text-sm font-semibold"
          >
            {section.cta}
          </button>
        )}
      </section>
    );
  }

  if (section.type === "features" || section.type === "about") {
    return (
      <section className="px-6 py-16" style={{ background: accentBg }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold">{section.heading}</h2>
          {section.subheading && (
            <p
              className="mx-auto mt-3 max-w-2xl text-center"
              style={{ color: muted }}
            >
              {section.subheading}
            </p>
          )}
          {section.items && section.items.length > 0 && (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {section.items.map((it, i) => (
                <div
                  key={i}
                  className="rounded-lg p-5"
                  style={{
                    background: `hsl(${theme.background})`,
                    border: `1px solid hsl(${theme.foreground} / 0.08)`,
                  }}
                >
                  <h3 className="font-semibold">{it.title}</h3>
                  {it.body && (
                    <p className="mt-2 text-sm" style={{ color: muted }}>
                      {it.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
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
            <p
              className="mx-auto mt-3 max-w-2xl text-center"
              style={{ color: muted }}
            >
              {section.subheading}
            </p>
          )}
          {section.items && (
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {section.items.map((it, i) => (
                <div
                  key={i}
                  className="rounded-lg p-6 text-center"
                  style={{
                    border: `1px solid hsl(${theme.foreground} / 0.1)`,
                  }}
                >
                  <h3 className="font-semibold">{it.title}</h3>
                  {it.price && (
                    <p className="mt-3 text-3xl font-bold">{it.price}</p>
                  )}
                  {it.body && (
                    <p className="mt-2 text-sm" style={{ color: muted }}>
                      {it.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
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
                <div
                  key={i}
                  className="rounded-lg p-5"
                  style={{ background: `hsl(${theme.background})` }}
                >
                  <p className="text-sm italic">"{it.body || it.title}"</p>
                  {it.author && (
                    <p className="mt-3 text-xs font-medium" style={{ color: muted }}>
                      — {it.author}
                    </p>
                  )}
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
                <div
                  key={i}
                  className="rounded-lg p-4"
                  style={{ border: `1px solid hsl(${theme.foreground} / 0.1)` }}
                >
                  <p className="font-semibold">{it.title}</p>
                  {it.body && (
                    <p className="mt-1 text-sm" style={{ color: muted }}>
                      {it.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (section.type === "cta") {
    return (
      <section
        className="px-6 py-20 text-center"
        style={{ background: primary, color: "white" }}
      >
        <h2 className="text-3xl font-bold">{section.heading}</h2>
        {section.subheading && (
          <p className="mx-auto mt-3 max-w-xl opacity-90">{section.subheading}</p>
        )}
        {section.cta && (
          <button
            className="mt-6 rounded-md bg-white px-6 py-3 text-sm font-semibold"
            style={{ color: primary }}
          >
            {section.cta}
          </button>
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
          <p
            className="mx-auto mt-3 text-center"
            style={{ color: muted }}
          >
            {section.subheading}
          </p>
        )}
        <div className="mt-6 space-y-3">
          <input
            placeholder="Your name"
            className="w-full rounded-md px-3 py-2 text-sm"
            style={{ border: `1px solid hsl(${theme.foreground} / 0.15)` }}
          />
          <input
            placeholder="Email"
            className="w-full rounded-md px-3 py-2 text-sm"
            style={{ border: `1px solid hsl(${theme.foreground} / 0.15)` }}
          />
          <textarea
            placeholder="Message"
            rows={4}
            className="w-full rounded-md px-3 py-2 text-sm"
            style={{ border: `1px solid hsl(${theme.foreground} / 0.15)` }}
          />
          <button
            style={{ background: primary, color: "white" }}
            className="w-full rounded-md py-2.5 text-sm font-semibold"
          >
            {section.cta || "Send"}
          </button>
        </div>
      </div>
    </section>
  );
};
