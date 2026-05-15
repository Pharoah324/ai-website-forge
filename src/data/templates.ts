import type { SiteContent } from "@/types/site";

export type Template = {
  id: string;
  name: string;
  industry: string;
  description: string;
  emoji: string;
  draft: SiteContent;
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN SYSTEM
// Each industry gets its own palette, font pairing, and Unsplash photo strategy.
// Colors are HSL strings consumed directly by Tailwind CSS variables.
//
// Palette naming convention:
//   primary    = dominant brand color (buttons, headings, accents)
//   background = page background
//   foreground = body text
//   accent     = subtle tint used for section backgrounds and cards
//
// Font pairings (loaded via Google Fonts in index.html):
//   headingFont = display/heading typeface
//   bodyFont    = body copy typeface
//
// unsplashQuery = used to fetch hero + section images from Unsplash API
// unsplashQueries = array of per-section queries [hero, features, about]
// ─────────────────────────────────────────────────────────────────────────────

// ── Industry palettes ─────────────────────────────────────────────────────────

const palettes = {

  // Warm terracotta + cream — rustic, inviting, artisanal
  foodBeverage: {
    primary: "16 84% 44%",
    background: "36 33% 97%",
    foreground: "20 30% 15%",
    accent: "36 60% 92%",
    headingFont: "Playfair Display",
    bodyFont: "Lato",
  },

  // Deep forest green + warm white — growth, trust, stability
  realEstate: {
    primary: "152 45% 28%",
    background: "0 0% 99%",
    foreground: "152 20% 12%",
    accent: "152 30% 94%",
    headingFont: "Cormorant Garamond",
    bodyFont: "Inter",
  },

  // Deep navy + gold — authority, precision, trust
  legal: {
    primary: "220 55% 22%",
    background: "220 20% 98%",
    foreground: "220 40% 12%",
    accent: "42 70% 92%",
    headingFont: "Libre Baskerville",
    bodyFont: "Source Sans Pro",
  },

  // Soft teal + clean white — calm, clinical, compassionate
  healthcare: {
    primary: "187 60% 35%",
    background: "195 40% 98%",
    foreground: "200 30% 15%",
    accent: "187 50% 93%",
    headingFont: "Nunito",
    bodyFont: "Open Sans",
  },

  // Bold red-orange + dark charcoal — energy, power, intensity
  fitness: {
    primary: "11 90% 50%",
    background: "0 0% 7%",
    foreground: "0 0% 96%",
    accent: "11 70% 12%",
    headingFont: "Barlow Condensed",
    bodyFont: "Barlow",
  },

  // Deep violet + soft lavender — creative, premium, modern
  ecommerce: {
    primary: "258 65% 48%",
    background: "258 30% 98%",
    foreground: "258 40% 12%",
    accent: "258 40% 95%",
    headingFont: "DM Serif Display",
    bodyFont: "DM Sans",
  },

  // Rose gold + blush cream — luxe, feminine, editorial
  beauty: {
    primary: "338 55% 48%",
    background: "340 30% 98%",
    foreground: "338 25% 15%",
    accent: "338 50% 94%",
    headingFont: "Cormorant Garamond",
    bodyFont: "Jost",
  },

  // Slate blue + warm gray — reliable, professional, craft
  homeServices: {
    primary: "210 65% 38%",
    background: "210 15% 97%",
    foreground: "210 25% 12%",
    accent: "210 35% 92%",
    headingFont: "Oswald",
    bodyFont: "Roboto",
  },

  // Electric indigo + white — innovation, speed, clarity
  tech: {
    primary: "243 75% 58%",
    background: "243 20% 98%",
    foreground: "243 30% 10%",
    accent: "243 50% 95%",
    headingFont: "Space Grotesk",
    bodyFont: "Inter",
  },

  // Sage green + warm cream — wellness, calm, organic
  wellness: {
    primary: "145 40% 38%",
    background: "80 25% 97%",
    foreground: "145 25% 12%",
    accent: "145 35% 92%",
    headingFont: "Cormorant Garamond",
    bodyFont: "Nunito",
  },

  // Deep amber + dark brown — premium, craft, artisan
  hospitality: {
    primary: "32 90% 42%",
    background: "36 25% 97%",
    foreground: "25 35% 12%",
    accent: "32 60% 92%",
    headingFont: "Playfair Display",
    bodyFont: "Raleway",
  },

  // Cobalt blue + crisp white — professional, global, financial
  finance: {
    primary: "213 80% 42%",
    background: "213 25% 98%",
    foreground: "213 40% 10%",
    accent: "213 50% 93%",
    headingFont: "Libre Baskerville",
    bodyFont: "Inter",
  },

  // Warm charcoal + yellow-gold — bold, creative, agency
  creative: {
    primary: "43 95% 48%",
    background: "0 0% 6%",
    foreground: "0 0% 95%",
    accent: "43 80% 10%",
    headingFont: "Syne",
    bodyFont: "DM Sans",
  },

  // Dusty rose + ivory — warm, inviting, personal
  coaching: {
    primary: "350 45% 48%",
    background: "30 30% 98%",
    foreground: "350 20% 15%",
    accent: "350 40% 94%",
    headingFont: "Playfair Display",
    bodyFont: "Lato",
  },

  // Teal + white — clean, trustworthy, modern nonprofit
  nonprofit: {
    primary: "174 55% 35%",
    background: "174 20% 98%",
    foreground: "174 30% 10%",
    accent: "174 40% 92%",
    headingFont: "Merriweather",
    bodyFont: "Source Sans Pro",
  },
};

// ── Layout variant helpers ────────────────────────────────────────────────────
// These give AI generation hints about which layout style to use.
// Referenced in the draft as layoutVariant field.
export type LayoutVariant =
  | "editorial"     // Magazine-style: big type, asymmetric grid
  | "minimal"       // White space-heavy, single column, refined
  | "bold"          // Full-bleed hero, high contrast, punchy headlines
  | "warmth"        // Rounded corners, soft tones, friendly feel
  | "corporate"     // Grid-based, professional, structured
  | "luxury"        // Dark mode option, gold accents, premium feel
  | "energetic";    // Dynamic angles, gradient overlays, motion feel

// ── Unsplash query map ────────────────────────────────────────────────────────
// Specific, descriptive queries produce dramatically better photos.
const unsplashQueries: Record<string, { hero: string; features: string; about: string }> = {
  restaurant:    { hero: "restaurant interior warm lighting dinner",      features: "artisan food plating close up",        about: "chef kitchen cooking ingredients" },
  "real-estate": { hero: "modern home exterior architecture sunlight",    features: "luxury interior living room design",   about: "real estate agent professional portrait" },
  law:           { hero: "law office professional modern interior",       features: "legal books gavel courtroom",          about: "attorney professional portrait office" },
  medical:       { hero: "modern medical clinic bright clean interior",   features: "doctor patient consultation care",     about: "healthcare professional team smiling" },
  gym:           { hero: "modern gym equipment fitness studio lighting",  features: "people training weights workout",      about: "personal trainer coaching athlete" },
  ecommerce:     { hero: "product lifestyle photography minimal studio",  features: "handmade product detail craftsmanship",about: "small business owner packaging products" },
  salon:         { hero: "luxury hair salon modern interior design",      features: "hair styling color treatment detail",  about: "hairstylist portrait professional salon" },
  contractor:    { hero: "modern home renovation kitchen remodel result", features: "construction craftsmanship detail work",about: "contractor team professional job site" },
  tech:          { hero: "modern tech office startup team collaboration", features: "software development laptop coding",   about: "tech founder team product demo" },
  wellness:      { hero: "yoga studio serene natural light meditation",   features: "wellness massage spa treatment calm",  about: "wellness practitioner nature portrait" },
  hospitality:   { hero: "boutique hotel lobby interior luxury design",   features: "hotel room suite elegant amenities",  about: "hospitality team welcome front desk" },
  finance:       { hero: "financial district city skyline professional",  features: "financial planning meeting charts",    about: "financial advisor professional portrait" },
  creative:      { hero: "creative agency studio team working design",    features: "design process branding creative work",about: "creative director studio portrait art" },
  coaching:      { hero: "life coaching session outdoor sunlight warmth", features: "workshop group session personal growth",about: "coach professional portrait smiling" },
  nonprofit:     { hero: "community volunteers working together outdoor", features: "nonprofit impact helping community",   about: "nonprofit team mission driven people" },
};

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES
// Each template now carries: rich palette, font pairing, layout variant,
// Unsplash query hints, and varied section structures.
// ─────────────────────────────────────────────────────────────────────────────

export const TEMPLATES: Template[] = [

  // ── RESTAURANT ─────────────────────────────────────────────────────────────
  {
    id: "restaurant",
    name: "Restaurant",
    industry: "Food & Beverage",
    description: "Menu, reservations, hours and story.",
    emoji: "🍽️",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Seasonal kitchen in {{CITY}}",
      theme: palettes.foodBeverage,
      layoutVariant: "editorial" as LayoutVariant,
      unsplash: unsplashQueries.restaurant,
      sections: [
        {
          type: "hero",
          heading: "Where every plate tells a story.",
          subheading: "{{BUSINESS_NAME}} brings seasonal, locally sourced cuisine to the heart of {{CITY}}. Open for dinner Tuesday through Sunday.",
          cta: "Reserve your table",
          image: { query: unsplashQueries.restaurant.hero, position: "right" },
        },
        {
          type: "features",
          heading: "The experience",
          layout: "cards-3",
          items: [
            { title: "Farm-to-table menu", body: "Our menu changes weekly with what local farms grow best. No freezers, no shortcuts." },
            { title: "Natural wine list", body: "A curated, opinionated selection of natural and biodynamic wines from small producers." },
            { title: "Walk-ins at the bar", body: "We keep seats at the bar for spontaneous evenings. Come as you are." },
          ],
        },
        {
          type: "gallery",
          heading: "Recent dishes",
          columns: 3,
          images: [
            { query: "artisan dish plating fine dining", alt: "Signature dish" },
            { query: "fresh pasta handmade Italian", alt: "House pasta" },
            { query: "dessert chocolate patisserie art", alt: "Dessert" },
          ],
        },
        {
          type: "about",
          heading: "Our story",
          subheading: "{{BUSINESS_NAME}} was born from a simple conviction: great food starts with great relationships — with farmers, with the land, and with our guests in {{CITY}}.",
          image: { query: unsplashQueries.restaurant.about, position: "left" },
        },
        {
          type: "testimonials",
          heading: "What guests say",
          layout: "quotes",
          items: [
            { title: "", body: "The most memorable meal I've had in {{CITY}}. The kind of place you take people you want to impress.", author: "Thomas R." },
            { title: "", body: "Everything on the plate was intentional. You can taste the care.", author: "Priya M." },
            { title: "", body: "We celebrated our anniversary here and it was absolutely perfect.", author: "Sarah & James K." },
          ],
        },
        {
          type: "contact",
          heading: "Join us for dinner",
          subheading: "Open Tuesday–Sunday · {{CITY}} · Reservations recommended",
          cta: "Reserve a table",
        },
      ],
    },
  },

  // ── REAL ESTATE ────────────────────────────────────────────────────────────
  {
    id: "real-estate",
    name: "Real Estate",
    industry: "Property",
    description: "Listings, agent bio, contact.",
    emoji: "🏡",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "{{CITY}} real estate, done right",
      theme: palettes.realEstate,
      layoutVariant: "corporate" as LayoutVariant,
      unsplash: unsplashQueries["real-estate"],
      sections: [
        {
          type: "hero",
          heading: "Your next home in {{CITY}} starts here.",
          subheading: "{{BUSINESS_NAME}} combines deep local expertise with a client-first approach to help you buy, sell, or invest with total confidence.",
          cta: "Start your search",
          image: { query: unsplashQueries["real-estate"].hero, position: "full-bleed" },
          overlay: true,
        },
        {
          type: "stats",
          heading: "Proven results in {{CITY}}",
          items: [
            { value: "98%", label: "List-to-sale ratio" },
            { value: "14", label: "Avg. days on market" },
            { value: "200+", label: "Families served" },
            { value: "5★", label: "Average client rating" },
          ],
        },
        {
          type: "features",
          heading: "How we help",
          layout: "cards-3",
          items: [
            { title: "Buyers", body: "Off-market access, patient guidance, and negotiation expertise to find your perfect home." },
            { title: "Sellers", body: "Strategic pricing, professional staging, and a marketing plan that gets results." },
            { title: "Investors", body: "Cash-flow analysis, deal sourcing, and portfolio strategy for every budget." },
          ],
        },
        {
          type: "about",
          heading: "A {{CITY}} expert you can trust",
          subheading: "{{BUSINESS_NAME}} has helped hundreds of families navigate the {{CITY}} market. Born and raised here, with the neighborhood knowledge that only comes from living it.",
          image: { query: unsplashQueries["real-estate"].about, position: "right" },
        },
        {
          type: "testimonials",
          heading: "Client success stories",
          layout: "cards",
          items: [
            { title: "", body: "Sold our home in 9 days, above asking price. The process was seamless from start to finish.", author: "The Patel Family" },
            { title: "", body: "As first-time buyers, we were nervous. {{BUSINESS_NAME}} made the whole thing feel manageable and even fun.", author: "Sam & Alex T." },
            { title: "", body: "Found us an off-market property that perfectly matched our wishlist. Truly exceptional service.", author: "Michelle W." },
          ],
        },
        { type: "contact", heading: "Ready to make a move?", subheading: "Tell us what you're looking for and we'll get started.", cta: "Schedule a call" },
      ],
    },
  },

  // ── LAW FIRM ───────────────────────────────────────────────────────────────
  {
    id: "law",
    name: "Law Firm",
    industry: "Professional Services",
    description: "Practice areas, attorneys, consultations.",
    emoji: "⚖️",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Trusted counsel in {{CITY}}",
      theme: palettes.legal,
      layoutVariant: "corporate" as LayoutVariant,
      unsplash: unsplashQueries.law,
      sections: [
        {
          type: "hero",
          heading: "Experienced counsel. Clear answers.",
          subheading: "{{BUSINESS_NAME}} provides sharp legal representation to businesses and families across {{CITY}}. We speak plain English, not legalese.",
          cta: "Schedule a consultation",
          image: { query: unsplashQueries.law.hero, position: "right" },
        },
        {
          type: "features",
          heading: "Practice areas",
          layout: "list-with-icons",
          items: [
            { title: "Business & Corporate Law", body: "Entity formation, contracts, mergers, employment agreements, and commercial disputes." },
            { title: "Real Estate Law", body: "Residential and commercial closings, leasing, zoning, and title disputes." },
            { title: "Estate Planning", body: "Wills, trusts, powers of attorney, and probate administration." },
            { title: "Litigation", body: "Aggressive, efficient representation in civil and commercial disputes." },
          ],
        },
        {
          type: "about",
          heading: "About {{BUSINESS_NAME}}",
          subheading: "A boutique {{CITY}} firm founded on the belief that excellent legal work doesn't require a big-firm price tag. Our attorneys have decades of combined experience serving local businesses and families.",
          image: { query: unsplashQueries.law.about, position: "left" },
        },
        {
          type: "faq",
          heading: "Common questions",
          items: [
            { title: "Do you offer free consultations?", body: "Yes. Your first 30-minute consultation is complimentary, with no obligation." },
            { title: "How are fees structured?", body: "We offer flat fees for predictable matters and hourly billing when work is more complex. We always discuss fees upfront." },
            { title: "How quickly can you take my case?", body: "We respond to all inquiries within one business day and can often begin work immediately." },
          ],
        },
        {
          type: "testimonials",
          heading: "Client testimonials",
          items: [
            { title: "", body: "The most practical, no-nonsense attorney I've worked with. Solved a complex contract dispute quickly and affordably.", author: "David M., CEO" },
            { title: "", body: "They handled our business formation and have been invaluable as we've grown. Highly trusted advisors.", author: "Founder, Tech Startup" },
          ],
        },
        { type: "contact", heading: "Talk to an attorney today", subheading: "Free 30-minute consultation · No obligation · {{CITY}}", cta: "Request a consultation" },
      ],
    },
  },

  // ── MEDICAL & HEALTHCARE ──────────────────────────────────────────────────
  {
    id: "medical",
    name: "Medical & Healthcare",
    industry: "Healthcare",
    description: "Services, providers, online booking.",
    emoji: "🩺",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Modern care in {{CITY}}",
      theme: palettes.healthcare,
      layoutVariant: "warmth" as LayoutVariant,
      unsplash: unsplashQueries.medical,
      sections: [
        {
          type: "hero",
          heading: "Healthcare that starts with listening.",
          subheading: "{{BUSINESS_NAME}} provides compassionate, patient-centered care for {{CITY}} families. Same-day appointments available.",
          cta: "Book an appointment",
          image: { query: unsplashQueries.medical.hero, position: "right" },
        },
        {
          type: "features",
          heading: "Our services",
          layout: "cards-3",
          items: [
            { title: "Primary care", body: "Annual wellness exams, preventive screenings, chronic condition management, and same-day sick visits." },
            { title: "Specialty care", body: "Coordinated referrals and targeted treatment from board-certified specialists." },
            { title: "Telehealth", body: "See a provider from home. Available 7 days a week for established patients." },
          ],
        },
        {
          type: "about",
          heading: "Meet our care team",
          subheading: "The providers at {{BUSINESS_NAME}} are {{CITY}} locals who chose this community on purpose. We believe great healthcare is built on relationships, not transactions.",
          image: { query: unsplashQueries.medical.about, position: "right" },
        },
        {
          type: "testimonials",
          heading: "Patient reviews",
          layout: "cards",
          items: [
            { title: "", body: "I've never felt more heard by a doctor. They remembered every detail from my previous visit.", author: "Jordan M." },
            { title: "", body: "Got a same-day appointment when my daughter was sick. Exactly what a family practice should be.", author: "The Rivera Family" },
            { title: "", body: "Finally a practice that actually calls back. Communication is exceptional.", author: "Barbara T." },
          ],
        },
        { type: "cta", heading: "Accepting new patients", subheading: "Most major insurance plans accepted. Same-day appointments available.", cta: "Schedule online" },
      ],
    },
  },

  // ── FITNESS ────────────────────────────────────────────────────────────────
  {
    id: "gym",
    name: "Fitness & Gym",
    industry: "Health",
    description: "Classes, memberships, free trial.",
    emoji: "🏋️",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Train hard in {{CITY}}",
      theme: palettes.fitness,
      layoutVariant: "bold" as LayoutVariant,
      unsplash: unsplashQueries.gym,
      sections: [
        {
          type: "hero",
          heading: "No excuses. Just results.",
          subheading: "{{BUSINESS_NAME}} is a community gym in {{CITY}} built around coached training, real programming, and people who show up.",
          cta: "Claim your free week",
          image: { query: unsplashQueries.gym.hero, position: "full-bleed" },
          overlay: true,
          overlayOpacity: 0.65,
        },
        {
          type: "features",
          heading: "Programs",
          layout: "cards-3",
          items: [
            { title: "Strength training", body: "Coach-led barbell programming for all levels. Learn to squat, deadlift, and press — properly." },
            { title: "Conditioning", body: "High-intensity intervals, metabolic circuits, and mobility work that makes you harder to kill." },
            { title: "Personal training", body: "One-on-one with a certified coach. Built around your schedule, goals, and history." },
          ],
        },
        {
          type: "pricing",
          heading: "Memberships",
          layout: "cards-3",
          items: [
            { title: "Drop-in", price: "$25", body: "Single class, no commitment. Come try us out." },
            { title: "Unlimited", price: "$179/mo", body: "All classes, all times. No contract, cancel anytime." },
            { title: "Coaching", price: "$299/mo", body: "Unlimited classes + 4 personal training sessions per month." },
          ],
        },
        {
          type: "testimonials",
          heading: "From our members",
          items: [
            { title: "", body: "I've been to a dozen gyms. This is the first one where the coaches actually know my name and my goals.", author: "Marcus D." },
            { title: "", body: "Lost 40 pounds in 6 months. The accountability from this community is unlike anything else.", author: "Tanya K." },
          ],
        },
        { type: "cta", heading: "First week is on us", subheading: "No credit card. No contract. Just show up.", cta: "Start free trial" },
      ],
    },
  },

  // ── E-COMMERCE ─────────────────────────────────────────────────────────────
  {
    id: "ecommerce",
    name: "E-commerce",
    industry: "Retail",
    description: "Featured products, story, shop callouts.",
    emoji: "🛍️",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Goods made better, shipped from {{CITY}}",
      theme: palettes.ecommerce,
      layoutVariant: "editorial" as LayoutVariant,
      unsplash: unsplashQueries.ecommerce,
      sections: [
        {
          type: "hero",
          heading: "Made better. Made to last.",
          subheading: "{{BUSINESS_NAME}} makes thoughtful products with better materials and no shortcuts. Designed and packed in {{CITY}}.",
          cta: "Shop the collection",
          image: { query: unsplashQueries.ecommerce.hero, position: "right" },
        },
        {
          type: "features",
          heading: "Bestsellers",
          layout: "cards-3",
          items: [
            { title: "The Original", body: "The piece that started everything. Refined over five years of customer feedback." },
            { title: "Everyday Essential", body: "The one you'll reach for every single morning. Over 10,000 sold." },
            { title: "Limited Edition", body: "Small batch collaboration. Ships when it's ready — not before." },
          ],
        },
        {
          type: "about",
          heading: "Why we started",
          subheading: "{{BUSINESS_NAME}} started in a garage in {{CITY}} with a simple question: why do products made with better materials cost so much more? We found out they don't have to.",
          image: { query: unsplashQueries.ecommerce.about, position: "left" },
        },
        {
          type: "testimonials",
          heading: "What customers say",
          items: [
            { title: "", body: "I've bought from dozens of brands like this. {{BUSINESS_NAME}} is the only one I've reordered from three times.", author: "Verified buyer" },
            { title: "", body: "The quality you can feel the moment you open the box. Premium in every way.", author: "Verified buyer" },
            { title: "", body: "Arrived beautifully packaged, faster than expected. A perfect gift.", author: "Verified buyer" },
          ],
        },
        { type: "cta", heading: "Free shipping over $75", subheading: "30-day hassle-free returns. No questions asked.", cta: "Shop now" },
      ],
    },
  },

  // ── BEAUTY & SALON ─────────────────────────────────────────────────────────
  {
    id: "salon",
    name: "Beauty & Salon",
    industry: "Beauty",
    description: "Services, booking, and stylist bios.",
    emoji: "💇",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Modern salon in {{CITY}}",
      theme: palettes.beauty,
      layoutVariant: "luxury" as LayoutVariant,
      unsplash: unsplashQueries.salon,
      sections: [
        {
          type: "hero",
          heading: "The salon {{CITY}} has been waiting for.",
          subheading: "{{BUSINESS_NAME}} is a boutique styling studio specializing in precision cuts, lived-in color, and treatments that actually work.",
          cta: "Book your visit",
          image: { query: unsplashQueries.salon.hero, position: "right" },
        },
        {
          type: "features",
          heading: "What we offer",
          layout: "cards-3",
          items: [
            { title: "Cut & style", body: "Tailored to your hair texture, face shape, and lifestyle. Not a trend — your best version." },
            { title: "Color & balayage", body: "Hand-painted highlights, lived-in balayage, glosses, and full-color transformations." },
            { title: "Treatments", body: "Bond repair, keratin smoothing, scalp therapy, and hydration treatments." },
          ],
        },
        {
          type: "pricing",
          heading: "Services & pricing",
          layout: "list",
          items: [
            { title: "Haircut & blowout", price: "$75+", body: "Consultation, cut, wash, and style." },
            { title: "Balayage", price: "$175+", body: "Hand-painted color with toning and blowout." },
            { title: "Full color", price: "$145+", body: "Single or double process, includes toner." },
            { title: "Bond treatment", price: "$55+", body: "Olaplex or K18 add-on to any service." },
          ],
        },
        {
          type: "testimonials",
          heading: "Client love",
          items: [
            { title: "", body: "I finally have hair I don't have to fight every morning. Best color I've ever had.", author: "Lisa M." },
            { title: "", body: "The consultation alone was worth it. She really understood what I was going for.", author: "Destiny K." },
          ],
        },
        { type: "cta", heading: "Book online in 60 seconds", subheading: "{{CITY}} · By appointment · New clients welcome", cta: "Book now" },
      ],
    },
  },

  // ── CONTRACTOR & HOME SERVICES ─────────────────────────────────────────────
  {
    id: "contractor",
    name: "Contractor & Home Services",
    industry: "Home Services",
    description: "Services, project gallery, free estimates.",
    emoji: "🛠️",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Quality work across {{CITY}}",
      theme: palettes.homeServices,
      layoutVariant: "corporate" as LayoutVariant,
      unsplash: unsplashQueries.contractor,
      sections: [
        {
          type: "hero",
          heading: "Done right. On time. On budget.",
          subheading: "{{BUSINESS_NAME}} is a licensed, insured contractor serving {{CITY}} homeowners with quality remodels, repairs, and additions.",
          cta: "Get a free estimate",
          image: { query: unsplashQueries.contractor.hero, position: "right" },
        },
        {
          type: "features",
          heading: "Our services",
          layout: "cards-3",
          items: [
            { title: "Kitchen & bath remodels", body: "Full gut renovations or targeted updates. Custom cabinetry, tile work, and fixture installation." },
            { title: "Home repairs", body: "Drywall, painting, plumbing fixes, electrical updates, and everything in between." },
            { title: "Additions & ADUs", body: "Room additions, deck builds, accessory dwelling units, and garage conversions." },
          ],
        },
        {
          type: "about",
          heading: "Family-owned, {{CITY}} proud",
          subheading: "{{BUSINESS_NAME}} has been building and renovating homes across {{CITY}} for over a decade. Every project gets our personal attention — because our reputation depends on it.",
          image: { query: unsplashQueries.contractor.about, position: "left" },
        },
        {
          type: "testimonials",
          heading: "What homeowners say",
          items: [
            { title: "", body: "Showed up when they said they would, stayed under budget, and left the job site cleaner than they found it.", author: "Kim D." },
            { title: "", body: "Our kitchen renovation came out better than the renderings. Couldn't be happier.", author: "The Nguyen Family" },
            { title: "", body: "Third project we've hired them for. They're the only contractor we'll ever call.", author: "Robert A." },
          ],
        },
        { type: "cta", heading: "Free estimates, always", subheading: "No pressure, no obligation. Just an honest assessment of your project.", cta: "Request a free estimate" },
      ],
    },
  },

  // ── TECH / SAAS ────────────────────────────────────────────────────────────
  {
    id: "tech",
    name: "Tech & SaaS",
    industry: "Technology",
    description: "Product features, pricing, sign-up funnel.",
    emoji: "💻",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Built for scale in {{CITY}}",
      theme: palettes.tech,
      layoutVariant: "minimal" as LayoutVariant,
      unsplash: unsplashQueries.tech,
      sections: [
        {
          type: "hero",
          heading: "The tool your team has been waiting for.",
          subheading: "{{BUSINESS_NAME}} helps teams in {{CITY}} and beyond move faster, stay aligned, and ship better work. Free to start.",
          cta: "Start for free",
          badge: "No credit card required",
          image: { query: unsplashQueries.tech.hero, position: "right" },
        },
        {
          type: "features",
          heading: "Everything you need. Nothing you don't.",
          layout: "cards-3",
          items: [
            { title: "Built for speed", body: "Instant onboarding, zero setup friction. Your team is productive on day one." },
            { title: "Scales with you", body: "From solo founders to enterprise teams. Pricing that makes sense at every stage." },
            { title: "Integrates everywhere", body: "Native integrations with the tools your team already uses. No new tabs, no new logins." },
          ],
        },
        {
          type: "pricing",
          heading: "Simple pricing",
          layout: "cards-3",
          items: [
            { title: "Free", price: "$0/mo", body: "For individuals and small teams just getting started." },
            { title: "Pro", price: "$29/mo", body: "Everything in Free plus advanced features and priority support." },
            { title: "Enterprise", price: "Custom", body: "Dedicated infrastructure, SSO, SLAs, and a dedicated account manager." },
          ],
        },
        {
          type: "testimonials",
          heading: "Loved by teams",
          items: [
            { title: "", body: "We replaced three different tools with {{BUSINESS_NAME}}. Wish we'd found it sooner.", author: "CTO, Series A Startup" },
            { title: "", body: "The onboarding experience is the best I've seen. Our whole team was using it the same day.", author: "Head of Product" },
          ],
        },
        { type: "cta", heading: "Start free today", subheading: "No credit card required. Cancel anytime.", cta: "Get started free" },
      ],
    },
  },

  // ── WELLNESS & SPA ─────────────────────────────────────────────────────────
  {
    id: "wellness",
    name: "Wellness & Spa",
    industry: "Wellness",
    description: "Services, booking, and philosophy.",
    emoji: "🧘",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Your sanctuary in {{CITY}}",
      theme: palettes.wellness,
      layoutVariant: "warmth" as LayoutVariant,
      unsplash: unsplashQueries.wellness,
      sections: [
        {
          type: "hero",
          heading: "Come back to yourself.",
          subheading: "{{BUSINESS_NAME}} is a holistic wellness studio in {{CITY}} offering massage, yoga, and integrative treatments that restore body and mind.",
          cta: "Book a session",
          image: { query: unsplashQueries.wellness.hero, position: "right" },
        },
        {
          type: "features",
          heading: "Our offerings",
          layout: "cards-3",
          items: [
            { title: "Therapeutic massage", body: "Swedish, deep tissue, prenatal, and sports massage from licensed therapists." },
            { title: "Yoga & movement", body: "Daily classes for all levels. Vinyasa, restorative, and yin yoga." },
            { title: "Integrative treatments", body: "Reiki, sound healing, aromatherapy, and cupping therapy." },
          ],
        },
        {
          type: "about",
          heading: "Our philosophy",
          subheading: "At {{BUSINESS_NAME}}, we believe wellness isn't a luxury — it's essential. Our practitioners in {{CITY}} bring years of training and genuine care to every session.",
          image: { query: unsplashQueries.wellness.about, position: "left" },
        },
        {
          type: "testimonials",
          heading: "From our community",
          items: [
            { title: "", body: "This place is my reset button. I leave every session feeling like a completely different person.", author: "Amara J." },
            { title: "", body: "The most skilled massage therapist I've ever seen. Booked my next three appointments before I left.", author: "Chris W." },
          ],
        },
        { type: "cta", heading: "Your first session awaits", subheading: "New clients welcome · Online booking · {{CITY}}", cta: "Book now" },
      ],
    },
  },

  // ── COACHING ───────────────────────────────────────────────────────────────
  {
    id: "coaching",
    name: "Coaching & Consulting",
    industry: "Coaching",
    description: "Offer, methodology, testimonials, booking.",
    emoji: "🎯",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Clarity. Direction. Results.",
      theme: palettes.coaching,
      layoutVariant: "warmth" as LayoutVariant,
      unsplash: unsplashQueries.coaching,
      sections: [
        {
          type: "hero",
          heading: "You already know what you want. Let's get you there.",
          subheading: "{{BUSINESS_NAME}} helps driven professionals and entrepreneurs in {{CITY}} break through the noise, get clear on their path, and actually move.",
          cta: "Book a discovery call",
          image: { query: unsplashQueries.coaching.hero, position: "right" },
        },
        {
          type: "features",
          heading: "How I work",
          layout: "cards-3",
          items: [
            { title: "1:1 coaching", body: "Weekly sessions built around your goals, your timeline, and the specific obstacles in your way." },
            { title: "Group programs", body: "Structured 8-week cohorts for founders and leaders who want community alongside accountability." },
            { title: "VIP intensives", body: "One or two-day deep dives for when you need breakthroughs fast, not gradually." },
          ],
        },
        {
          type: "about",
          heading: "About {{BUSINESS_NAME}}",
          subheading: "I started {{BUSINESS_NAME}} after spending years helping executives and founders solve the problems they couldn't talk about in boardrooms. I'm based in {{CITY}} and work with clients worldwide.",
          image: { query: unsplashQueries.coaching.about, position: "right" },
        },
        {
          type: "testimonials",
          heading: "Client results",
          items: [
            { title: "", body: "Six months in, I'd tripled my revenue and finally felt like the CEO of my own company. This was the missing piece.", author: "Founder, {{CITY}}" },
            { title: "", body: "I came in burnt out and left with a business model I was actually excited about.", author: "Creative Director" },
          ],
        },
        { type: "cta", heading: "Let's find out if we're a fit", subheading: "Free 30-minute discovery call · No pressure · {{CITY}} & worldwide", cta: "Book your call" },
      ],
    },
  },

  // ── CREATIVE AGENCY ────────────────────────────────────────────────────────
  {
    id: "agency",
    name: "Creative Agency",
    industry: "Creative Services",
    description: "Portfolio, services, and new business.",
    emoji: "🎨",
    draft: {
      name: "{{BUSINESS_NAME}}",
      tagline: "Creative studio in {{CITY}}",
      theme: palettes.creative,
      layoutVariant: "bold" as LayoutVariant,
      unsplash: unsplashQueries.creative,
      sections: [
        {
          type: "hero",
          heading: "We make brands impossible to ignore.",
          subheading: "{{BUSINESS_NAME}} is a full-service creative studio in {{CITY}}. Strategy, design, and content for brands that want to be remembered.",
          cta: "See our work",
          image: { query: unsplashQueries.creative.hero, position: "full-bleed" },
          overlay: true,
        },
        {
          type: "features",
          heading: "What we do",
          layout: "cards-3",
          items: [
            { title: "Brand identity", body: "Strategy, naming, visual identity, and brand guidelines that hold up across every touchpoint." },
            { title: "Digital design", body: "Websites, apps, and digital campaigns that convert as well as they look." },
            { title: "Content & campaign", body: "Photography, video, copywriting, and paid media that drives results." },
          ],
        },
        {
          type: "about",
          heading: "Why {{BUSINESS_NAME}}",
          subheading: "We started {{BUSINESS_NAME}} because we were tired of agency work that looked great in presentations and underperformed in market. We build beautiful things that work.",
          image: { query: unsplashQueries.creative.about, position: "left" },
        },
        {
          type: "testimonials",
          heading: "Client feedback",
          items: [
            { title: "", body: "They redesigned our brand from scratch and our sales pipeline doubled within a quarter.", author: "CEO, B2B SaaS" },
            { title: "", body: "The only agency I've worked with that actually pushed back when our brief was wrong. Invaluable.", author: "CMO, Retail Brand" },
          ],
        },
        { type: "contact", heading: "New business", subheading: "We take on 4–6 new clients per quarter. Let's talk about your project.", cta: "Start a conversation" },
      ],
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN INTELLIGENCE HELPERS
// Used by the AI generation system to pick the right palette and layout
// based on the user's business description.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the best-matching template ID given keywords from a user prompt.
 * The AI generation edge function should call this to seed the right palette.
 */
export function detectIndustry(prompt: string): string {
  const p = prompt.toLowerCase();

  if (/restaurant|cafe|coffee|bakery|bar|food|catering|pizza|sushi|dining/.test(p)) return "restaurant";
  if (/real estate|realtor|property|homes|listings|broker|housing/.test(p)) return "real-estate";
  if (/law|attorney|legal|lawyer|firm|counsel|litigation/.test(p)) return "law";
  if (/medical|health|doctor|clinic|dental|therapy|hospital|care|patient/.test(p)) return "medical";
  if (/gym|fitness|yoga|workout|training|coach|crossfit|pilates|martial/.test(p)) return "gym";
  if (/shop|store|ecommerce|product|retail|boutique|brand|merchandise/.test(p)) return "ecommerce";
  if (/salon|beauty|hair|spa|nails|aesthetics|skincare|medspa/.test(p)) return "salon";
  if (/contractor|construction|remodel|builder|plumber|electrician|hvac|roofing/.test(p)) return "contractor";
  if (/software|saas|app|tech|startup|platform|developer|api/.test(p)) return "tech";
  if (/wellness|massage|healing|holistic|meditation|reiki|naturo/.test(p)) return "wellness";
  if (/coach|coaching|consultant|consulting|strategy|mentor|advisor/.test(p)) return "coaching";
  if (/agency|creative|design|branding|marketing|studio|advertising/.test(p)) return "agency";

  // Default to a clean neutral if we can't detect
  return "tech";
}

/**
 * Returns a palette object for use in AI-generated sites that don't
 * match a predefined template exactly.
 */
export function getPaletteForIndustry(industryId: string) {
  const map: Record<string, typeof palettes[keyof typeof palettes]> = {
    restaurant:    palettes.foodBeverage,
    "real-estate": palettes.realEstate,
    law:           palettes.legal,
    medical:       palettes.healthcare,
    gym:           palettes.fitness,
    ecommerce:     palettes.ecommerce,
    salon:         palettes.beauty,
    contractor:    palettes.homeServices,
    tech:          palettes.tech,
    wellness:      palettes.wellness,
    coaching:      palettes.coaching,
    agency:        palettes.creative,
  };
  return map[industryId] ?? palettes.tech;
}

/**
 * Returns Unsplash query strings for a given industry.
 */
export function getUnsplashQueries(industryId: string) {
  return unsplashQueries[industryId] ?? {
    hero: "modern professional business office",
    features: "business team collaboration work",
    about: "professional portrait business founder",
  };
}
