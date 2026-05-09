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
        { type: "testimonials", heading: "What clients say", items: [
          { title: "", body: "Sold our house in 9 days, over asking.", author: "The Patel Family" },
          { title: "", body: "Made our first home purchase feel easy.", author: "Sam & Alex" },
        ]},
        { type: "contact", heading: "Let's talk", cta: "Send a message" },
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
        { type: "faq", heading: "Common questions", items: [
          { title: "Do you offer free consultations?", body: "Yes — first 30 minutes are complimentary." },
          { title: "How are fees structured?", body: "Flat fees for most matters; hourly when work is unpredictable." },
        ]},
        { type: "contact", heading: "Talk to an attorney", cta: "Request a consultation" },
      ],
    },
  },
  {
    id: "medical",
    name: "Medical & Healthcare",
    industry: "Healthcare",
    description: "Services, providers, online booking.",
    emoji: "🩺",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Modern care in {{CITY}}",
      theme: { ...baseTheme, primary: "190 80% 40%", accent: "190 50% 96%" },
      sections: [
        { type: "hero", heading: "Care that listens.", subheading: "{{BUSINESS_NAME}} provides patient-centered healthcare in {{CITY}}.", cta: "Book an appointment" },
        { type: "features", heading: "Our services", items: [
          { title: "Primary care", body: "Annual exams, screenings, wellness." },
          { title: "Specialty visits", body: "Targeted care from board-certified providers." },
          { title: "Telehealth", body: "See a provider from home." },
        ]},
        { type: "about", heading: "Meet our team", subheading: "Experienced providers serving {{CITY}} families with compassion." },
        { type: "testimonials", heading: "Patient reviews", items: [
          { title: "", body: "Felt heard and cared for from the first visit.", author: "Jordan M." },
          { title: "", body: "Same-day appointment when we needed it most.", author: "The Rivera Family" },
        ]},
        { type: "cta", heading: "New patients welcome", cta: "Schedule online" },
      ],
    },
  },
  {
    id: "gym",
    name: "Fitness & Gym",
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
    id: "ecommerce",
    name: "E-commerce",
    industry: "Retail",
    description: "Featured products, story, shop callouts.",
    emoji: "🛍️",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Goods made better, shipped from {{CITY}}",
      theme: { ...baseTheme, primary: "260 70% 55%", accent: "260 30% 97%" },
      sections: [
        { type: "hero", heading: "Quietly excellent everyday goods.", subheading: "{{BUSINESS_NAME}} makes thoughtful products that last. Designed in {{CITY}}.", cta: "Shop the collection" },
        { type: "features", heading: "Bestsellers", items: [
          { title: "The Original", body: "The piece that started it all." },
          { title: "Everyday Essential", body: "The one you'll reach for daily." },
          { title: "Limited Edition", body: "Small batch, while it lasts." },
        ]},
        { type: "about", heading: "Our story", subheading: "Started in {{CITY}} with a simple idea: better materials, fewer products, no shortcuts." },
        { type: "testimonials", heading: "Customer love", items: [
          { title: "", body: "Worth every dollar. I've already reordered.", author: "Verified buyer" },
          { title: "", body: "Quality you can feel the moment you open the box.", author: "Verified buyer" },
        ]},
        { type: "cta", heading: "Free shipping over $75", subheading: "Plus 30-day easy returns.", cta: "Shop now" },
      ],
    },
  },
  {
    id: "salon",
    name: "Beauty & Salon",
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
    id: "contractor",
    name: "Contractor & Home Services",
    industry: "Home Services",
    description: "Services, project gallery, free estimates.",
    emoji: "🛠️",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Quality work across {{CITY}}",
      theme: { ...baseTheme, primary: "35 90% 45%", accent: "35 40% 96%" },
      sections: [
        { type: "hero", heading: "Done right. On time. On budget.", subheading: "{{BUSINESS_NAME}} is a licensed and insured contractor serving {{CITY}} homeowners.", cta: "Get a free estimate" },
        { type: "features", heading: "What we do", items: [
          { title: "Remodels", body: "Kitchens, baths, full home renovations." },
          { title: "Repairs", body: "Drywall, plumbing fixes, electrical updates." },
          { title: "Additions", body: "Decks, ADUs, room additions." },
        ]},
        { type: "about", heading: "About us", subheading: "A family-owned crew that's been building in {{CITY}} for over a decade. Licensed, bonded, insured." },
        { type: "testimonials", heading: "From our customers", items: [
          { title: "", body: "Showed up when they said they would and stayed under budget.", author: "Kim D." },
          { title: "", body: "Our kitchen looks better than the renderings.", author: "The Nguyen Family" },
        ]},
        { type: "cta", heading: "Free, no-pressure estimates", subheading: "Tell us about your project — we'll come take a look.", cta: "Request estimate" },
      ],
    },
  },
];
