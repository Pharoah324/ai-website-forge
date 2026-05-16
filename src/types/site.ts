export type SiteSectionItem = {
  title?: string;
  body?: string;
  price?: string;
  author?: string;
  value?: string;
  label?: string;
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
    | "contact"
    | "gallery"
    | "stats";
  heading: string;
  subheading?: string;
  cta?: string;
  cta_urgency?: string;
  badge?: string;
  columns?: number;
  overlay?: string | boolean | number;
  overlayOpacity?: number;
  images?: Array<string | { query: string; position?: string; alt?: string }>;
  image?: string | { query: string; position: string };
  image_search_query?: string;
  image_placement?: "background" | "side" | "card" | "avatar" | "none";
  layout?:
    | "image-right"
    | "image-left"
    | "image-background"
    | "grid"
    | "stacked"
    | "cards"
    | "cards-3"
    | "quotes"
    | "list"
    | "list-with-icons";
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
  layoutVariant?: string;
  unsplash?: Record<string, string>;
  ui?: Partial<Record<
    | "get_started"
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
    | "contact_subheading",
    string
  >>;
};

