export type SiteSectionItem = {
  title: string;
  body?: string;
  price?: string;
  author?: string;
  icon_name?: string;
  image_search_query?: string;
  image_url?: string;
  image_thumb?: string;
  image_alt?: string;
  image_credit?: string;
};

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
  cta_urgency?: string;
  image_search_query?: string;
  image_placement?: "background" | "side" | "card" | "avatar" | "none";
  layout?: "image-right" | "image-left" | "image-background" | "grid" | "stacked";
  image_url?: string;
  image_thumb?: string;
  image_alt?: string;
  image_credit?: string;
  items?: SiteSectionItem[];
};

export type SiteContent = {
  name: string;
  tagline: string;
  lang?: string;
  dir?: "ltr" | "rtl";
  theme: {
    primary: string;
    background: string;
    foreground: string;
    accent: string;
  };
  sections: SiteSection[];
};
