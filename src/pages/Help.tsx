import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FAQ = { q: string; a: string };
type Section = { title: string; faqs: FAQ[] };

const sections: Section[] = [
  {
    title: "Getting Started",
    faqs: [
      {
        q: "What is Virtual Engine Builder?",
        a: "Virtual Engine Builder is an AI-powered website builder that creates professional websites, landing pages, and sales funnels from a simple text description. Just describe your business in plain language — in any of 50+ languages — and our AI builds a complete, SEO-optimized site in minutes.",
      },
      {
        q: "How do I create my first website?",
        a: "After signing up, click 'New Project' on your dashboard. Type a description of your business — what you do, who you serve, and what you want visitors to do. The AI will generate a complete website. You can then refine it using the chat interface, swap photos, adjust colors, and publish when ready.",
      },
      {
        q: "Do I need to know how to code?",
        a: "No coding required. Virtual Engine Builder is designed for business owners, marketers, and agencies who want professional websites without technical expertise. Everything is done through natural language and visual editing.",
      },
      {
        q: "What languages are supported?",
        a: "We support 50+ languages including English, Spanish, French, Portuguese, Arabic, Chinese, Hindi, and many more. You can describe your business in your preferred language and the AI will generate content in that language. Right-to-left (RTL) languages like Arabic and Hebrew are fully supported.",
      },
      {
        q: "Can I try it for free?",
        a: "Yes. Our Free plan gives you 20 build credits and 300 runtime credits at no cost — no credit card required. This is enough to build and explore 1-2 complete websites and see the platform in action before upgrading.",
      },
    ],
  },
  {
    title: "Credits & Billing",
    faqs: [
      {
        q: "What are build credits vs runtime credits?",
        a: "Build credits are consumed when you generate a new website or request a major redesign. Runtime credits are consumed during active use — refining content, adjusting layouts, using the chat interface, and previewing changes. Both credit types are included in every plan.",
      },
      {
        q: "What is the credit rollover policy?",
        a: "On Builder, Pro, and Agency plans, 50% of your unused build credits roll over to the next billing cycle. For example, if you have 100 unused build credits at the end of the month, 50 carry forward. Rolled-over credits expire at the end of the following billing cycle. Runtime credits do not roll over.",
      },
      {
        q: "Can I buy extra credits without upgrading my plan?",
        a: "Yes. You can purchase additional build credits at any time from your account dashboard, regardless of your current plan. Purchased credits never expire and are used after your plan credits are exhausted. This is ideal if you have a busy month without needing to change your plan permanently.",
      },
      {
        q: "What are the plan prices?",
        a: "Free: $0/mo — 20 build / 300 runtime credits. Starter: $19/mo — 100 build / 2,500 runtime credits. Builder: $49/mo — 300 build / 10,000 runtime credits. Pro: $99/mo — 800 build / 30,000 runtime credits. Agency: $199/mo — 2,000 build / 100,000 runtime credits.",
      },
      {
        q: "How do I cancel my subscription?",
        a: "You can cancel at any time from Account Settings → Billing. Your subscription remains active until the end of the current billing period. We do not offer refunds for partial months. If you believe you were charged in error, contact support@virtualengine.ai within 30 days.",
      },
    ],
  },
  {
    title: "Building Websites",
    faqs: [
      {
        q: "What types of websites can I build?",
        a: "Virtual Engine Builder supports 6 funnel types: Lead Generation, Sales Page, Service Business, E-commerce, Agency Portfolio, and Local Business. Each type is optimized for its specific conversion goal with layouts, copy structures, and CTAs built for that purpose.",
      },
      {
        q: "How does the AI refinement chat work?",
        a: "After your website is generated, you can open the refinement chat and describe changes in plain language. For example: 'Make the headline more urgent', 'Change the color scheme to blue and white', or 'Add a testimonials section after the pricing table.' The AI applies your changes in real time.",
      },
      {
        q: "Where do the photos come from?",
        a: "Photos are sourced from Unsplash, a library of over 3 million high-quality, royalty-free images. The AI automatically selects photos relevant to your industry and content. You can swap any photo by clicking on it and searching for alternatives.",
      },
      {
        q: "Is SEO built in?",
        a: "Yes. Every website generated by Virtual Engine Builder includes built-in SEO powered by Search Atlas. This includes optimized meta titles and descriptions, heading structure, keyword placement, image alt text, and schema markup. You can view and edit SEO settings for each page from your dashboard.",
      },
      {
        q: "Can I use voice input?",
        a: "Yes. Voice input is available in any language. Click the microphone icon in the builder and describe your website or refinements out loud. This is especially useful for users who prefer speaking to typing, or who are working in a language where typing is less convenient.",
      },
    ],
  },
  {
    title: "Integrations",
    faqs: [
      {
        q: "How does the GoHighLevel integration work?",
        a: "Virtual Engine Builder has native GoHighLevel integration — the only AI website builder with this feature. Connect your GHL account from the Integrations page and your generated websites will automatically sync leads, forms, and contacts directly into your GHL CRM. No Zapier or manual export required.",
      },
      {
        q: "How do I connect my GoHighLevel account?",
        a: "Go to Dashboard → Integrations → GoHighLevel. Click 'Connect Account' and authorize the connection. Once connected, all new form submissions from your websites will flow directly into your GHL pipeline. You can manage the connection and permissions from the same page.",
      },
      {
        q: "Does the GHL integration work for sub-accounts?",
        a: "Yes. Agency plan users can connect multiple GHL sub-accounts and assign each to a specific client project. Leads from each client's websites route to their respective GHL sub-account automatically.",
      },
      {
        q: "What other integrations are available?",
        a: "Current integrations include GoHighLevel (CRM), Search Atlas (SEO), Unsplash (photography), Stripe (payments), and Google/Facebook/Apple (social login). Additional integrations are on our roadmap. If you need a specific integration, submit a request via the contact page.",
      },
    ],
  },
  {
    title: "Agency & White Label",
    faqs: [
      {
        q: "What is white-label mode?",
        a: "White-label mode allows Agency plan users to present Virtual Engine Builder under their own brand. Your clients see your logo, your domain, and your brand colors — not Virtual Engine Builder. This lets you offer AI website building as your own proprietary service.",
      },
      {
        q: "How do sub-accounts work?",
        a: "Agency plan users can create sub-accounts for each client. Each sub-account has its own credit allocation, projects, and settings. You manage everything from a central agency dashboard and can monitor usage across all client accounts at a glance.",
      },
      {
        q: "Is there an affiliate program?",
        a: "Yes. Virtual Engine Builder offers a 30% recurring commission on every paid subscription you refer — for the lifetime of that customer. Commissions are paid monthly. To join, go to Account → Affiliate Program and grab your unique referral link.",
      },
      {
        q: "I still need help — how do I contact support?",
        a: "Visit our Contact page at builder.virtualengine.ai/contact or email support@virtualengine.ai. We respond within 24 hours on business days (Monday–Friday, 9am–6pm EST).",
      },
    ],
  },
];

export default function Help() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        faqs: s.faqs.filter(
          (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q),
        ),
      }))
      .filter((s) => s.faqs.length > 0);
  }, [query]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-card/40 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/VEB_Navbar_Logo.png" alt="Virtual Engine Builder" className="h-8 w-auto" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary-glow">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl py-16">
        <p className="mb-2 text-sm uppercase tracking-wider text-primary-glow">Help Center</p>
        <h1 className="mb-3 text-4xl font-bold md:text-5xl">How can we help?</h1>
        <p className="mb-8 text-muted-foreground">Everything you need to get started and grow.</p>

        <div className="relative mb-10">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for an answer…"
            className="pl-9 h-12 text-base"
          />
        </div>

        <div className="space-y-10">
          {filtered.length === 0 && (
            <p className="text-muted-foreground">No results found. Try a different search.</p>
          )}
          {filtered.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-xl font-semibold text-primary-glow">{section.title}</h2>
              <Accordion type="single" collapsible className="rounded-xl border border-border/60 bg-card/40">
                {section.faqs.map((faq, i) => (
                  <AccordionItem key={faq.q} value={`${section.title}-${i}`} className="px-4">
                    <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                    <AccordionContent className="text-foreground/85">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-xl border border-primary/30 bg-primary/10 p-6 text-center">
          <h3 className="mb-2 text-xl font-semibold">Still need help?</h3>
          <p className="mb-4 text-muted-foreground">
            Our team responds within 24 hours on business days.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Contact Support
          </Link>
        </div>
      </main>

      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
        <p>
          A{" "}
          <a href="https://virtualengine.ai" className="text-primary-glow hover:underline">
            Virtual Engine
          </a>{" "}
          product · © {new Date().getFullYear()} Virtual Engine Builder
        </p>
      </footer>
    </div>
  );
}
