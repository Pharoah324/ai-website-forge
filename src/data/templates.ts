import type { SiteContent } from "@/types/site";

export type Template = {
  id: string;
  name: string;
  industry: string;
  description: string;
  emoji: string;
  draft: SiteContent;
};

const baseTheme = {
  primary: "221 83% 53%",
  background: "0 0% 100%",
  foreground: "222 47% 11%",
  accent: "210 40% 96%",
};

export const TEMPLATES: Template[] = [
  {
    id: "restaurant",
    name: "Restaurant",
    industry: "Food & Beverage",
    description: "Menu, reservations, hours and story.",
    emoji: "🍽️",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Seasonal kitchen in {{CITY}}",
      theme: { ...baseTheme, primary: "16 84% 50%", accent: "30 50% 96%" },
      sections: [
        { type: "hero", heading: "Honest food. Warm room.", subheading: "{{BUSINESS_NAME}} serves seasonal small plates in the heart of {{CITY}}.", cta: "Reserve a table" },
        { type: "features", heading: "What we do", items: [
          { title: "Seasonal menu", body: "Changes with what local farms grow." },
          { title: "Natural wine", body: "A short, opinionated list." },
          { title: "Walk-ins welcome", body: "We always keep the bar open." },
        ]},
        { type: "about", heading: "Our story", subheading: "Opened in {{CITY}} by a chef who believes great food starts with great ingredients." },
        { type: "testimonials", heading: "Loved by locals", items: [
          { title: "", body: "Best new restaurant in the neighborhood.", author: "{{CITY}} Eater" },
          { title: "", body: "We came for dinner and stayed for dessert.", author: "Maria K." },
        ]},
        { type: "contact", heading: "Find us", subheading: "Open Tue–Sun · {{CITY}}", cta: "Reserve" },
      ],
    },
  },
  {
    id: "salon",
    name: "Salon & Spa",
    industry: "Beauty",
    description: "Services, booking, and stylist bios.",
    emoji: "💇",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Modern salon in {{CITY}}",
      theme: { ...baseTheme, primary: "330 70% 55%", accent: "330 50% 97%" },
      sections: [
        { type: "hero", heading: "Hair you'll love coming back to.", subheading: "{{BUSINESS_NAME}} is a boutique salon in {{CITY}} specializing in cuts, color and care.", cta: "Book now" },
        { type: "features", heading: "Services", items: [
          { title: "Cut & style", body: "Tailored to your hair, not a trend." },
          { title: "Color", body: "Balayage, gloss, full color." },
          { title: "Treatments", body: "Bond repair, scalp care, gloss." },
        ]},
        { type: "pricing", heading: "Pricing", items: [
          { title: "Cut", price: "$65+", body: "Includes wash and style." },
          { title: "Color", price: "$140+", body: "Single process or balayage." },
          { title: "Treatment", price: "$45+", body: "Add to any service." },
        ]},
        { type: "cta", heading: "Ready for a refresh?", cta: "Book online" },
      ],
    },
  },
  {
    id: "law",
    name: "Law Firm",
    industry: "Professional Services",
    description: "Practice areas, attorneys, consultations.",
    emoji: "⚖️",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Trusted counsel in {{CITY}}",
      theme: { ...baseTheme, primary: "215 60% 25%", accent: "215 30% 96%" },
      sections: [
        { type: "hero", heading: "Sharp legal counsel. Plain English.", subheading: "{{BUSINESS_NAME}} represents businesses and families across {{CITY}}.", cta: "Schedule a consultation" },
        { type: "features", heading: "Practice areas", items: [
          { title: "Business law", body: "Contracts, formation, disputes." },
          { title: "Real estate", body: "Closings, zoning, leases." },
          { title: "Estate planning", body: "Wills, trusts, probate." },
        ]},
        { type: "about", heading: "About the firm", subheading: "A boutique {{CITY}} practice with decades of combined experience." },
        { type: "contact", heading: "Talk to an attorney", cta: "Request a consultation" },
      ],
    },
  },
  {
    id: "dentist",
    name: "Dental Practice",
    industry: "Healthcare",
    description: "Services, team, online booking.",
    emoji: "🦷",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Modern dentistry in {{CITY}}",
      theme: { ...baseTheme, primary: "190 80% 40%", accent: "190 50% 96%" },
      sections: [
        { type: "hero", heading: "A dentist you'll actually look forward to.", subheading: "{{BUSINESS_NAME}} provides gentle, modern dental care in {{CITY}}.", cta: "Book an appointment" },
        { type: "features", heading: "Our services", items: [
          { title: "General", body: "Cleanings, fillings, exams." },
          { title: "Cosmetic", body: "Whitening, veneers, Invisalign." },
          { title: "Emergency", body: "Same-day care when it counts." },
        ]},
        { type: "testimonials", heading: "Patient reviews", items: [
          { title: "", body: "Painless cleaning and a friendly team.", author: "Jordan M." },
        ]},
        { type: "cta", heading: "New patients welcome", cta: "Schedule online" },
      ],
    },
  },
  {
    id: "gym",
    name: "Gym & Fitness",
    industry: "Health",
    description: "Classes, memberships, free trial.",
    emoji: "🏋️",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Train hard in {{CITY}}",
      theme: { ...baseTheme, primary: "0 75% 50%", accent: "0 0% 96%" },
      sections: [
        { type: "hero", heading: "Stronger every week.", subheading: "{{BUSINESS_NAME}} is a community gym in {{CITY}} with classes for every level.", cta: "Start free trial" },
        { type: "features", heading: "Programs", items: [
          { title: "Strength", body: "Coached barbell training." },
          { title: "Conditioning", body: "HIIT, intervals, mobility." },
          { title: "Personal training", body: "1:1 with a certified coach." },
        ]},
        { type: "pricing", heading: "Memberships", items: [
          { title: "Drop in", price: "$25", body: "Single class." },
          { title: "Unlimited", price: "$179/mo", body: "All classes, no contract." },
          { title: "Coaching", price: "$299/mo", body: "Includes 4 PT sessions." },
        ]},
        { type: "cta", heading: "Try a class on us", cta: "Claim free week" },
      ],
    },
  },
  {
    id: "real-estate",
    name: "Real Estate",
    industry: "Property",
    description: "Listings, agent bio, contact.",
    emoji: "🏡",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "{{CITY}} real estate, done right",
      theme: { ...baseTheme, primary: "30 80% 45%", accent: "30 40% 96%" },
      sections: [
        { type: "hero", heading: "Find a home you love in {{CITY}}.", subheading: "{{BUSINESS_NAME}} helps buyers and sellers across the {{CITY}} area.", cta: "Browse listings" },
        { type: "features", heading: "How we help", items: [
          { title: "Buyers", body: "Off-market access and patient guidance." },
          { title: "Sellers", body: "Pricing, staging, marketing." },
          { title: "Investors", body: "Cash-flow analysis and deal sourcing." },
        ]},
        { type: "about", heading: "About the agent", subheading: "A {{CITY}} native with deep neighborhood knowledge." },
        { type: "contact", heading: "Let's talk", cta: "Send a message" },
      ],
    },
  },
];
