export type SiteSection = {
  type:
    | "hero"
    | "features"
    | "about"
    | "testimonials"
    | "pricing"
    | "faq"
    | "cta"
    | "contact";
  heading: string;
  subheading?: string;
  cta?: string;
  items?: Array<{
    title: string;
    body?: string;
    price?: string;
    author?: string;
  }>;
};

export type SiteContent = {
  name: string;
  tagline: string;
  theme: {
    primary: string;
    background: string;
    foreground: string;
    accent: string;
  };
  sections: SiteSection[];
};
