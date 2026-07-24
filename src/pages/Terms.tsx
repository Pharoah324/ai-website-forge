import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
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

      <main className="container max-w-3xl py-16">
        <p className="mb-2 text-sm uppercase tracking-wider text-primary-glow">Virtual Engine Builder</p>
        <h1 className="mb-3 text-4xl font-bold md:text-5xl">Terms of Service</h1>
        <p className="mb-12 text-sm text-muted-foreground">Effective Date: July 22, 2026</p>

        <div className="space-y-6 text-foreground/90 leading-relaxed">
          <p>
            These Terms of Service ("Terms") govern your access to and use of Virtual Engine Builder ("Service"),
            operated by Virtual Engine ("we," "us," or "our") at{" "}
            <a href="https://builder.virtualengine.ai" className="text-primary-glow hover:underline">
              https://builder.virtualengine.ai
            </a>
            . By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree, do
            not use the Service.
          </p>

          <Section title="1. Eligibility">
            <p>
              You must be at least 18 years old and capable of forming a legally binding contract to use the Service. By
              using the Service, you represent that you meet these requirements. The Service is available to users in
              190+ countries subject to applicable local laws.
            </p>
          </Section>

          <Section title="2. Account Registration">
            <p>To access most features of the Service, you must create an account. You agree to:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Be responsible for all activity that occurs under your account</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms or that we reasonably
              believe are being used fraudulently.
            </p>
          </Section>

          <Section title="3. The Service">
            <h3 className="mt-4 text-lg font-semibold text-foreground">3.1 What We Provide</h3>
            <p>
              Virtual Engine Builder is an AI-powered website builder that generates websites, landing pages, and
              funnels from natural language descriptions. The Service includes:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>AI website generation using the Anthropic Claude API</li>
              <li>Search Atlas SEO integration for search optimization</li>
              <li>GoHighLevel CRM integration for lead management</li>
              <li>Multi-language support in 50+ languages</li>
              <li>Credit-based usage system with optional rollover</li>
              <li>Agency and white-label tools for professional users</li>
            </ul>
            <h3 className="mt-4 text-lg font-semibold text-foreground">3.2 AI-Generated Content</h3>
            <p>
              The Service uses artificial intelligence to generate website content based on your prompts. You
              acknowledge that:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>AI-generated content may not always be accurate, complete, or suitable for your specific needs</li>
              <li>You are responsible for reviewing and editing generated content before publishing</li>
              <li>We do not guarantee that AI-generated content is free from errors or legal issues</li>
              <li>Generated websites are starting points and may require customization</li>
            </ul>
          </Section>

          <Section title="4. Credits and Usage">
            <h3 className="mt-4 text-lg font-semibold text-foreground">4.1 Credit System</h3>
            <p>
              The Service uses a credit-based system. Build credits are consumed when generating new websites or major
              revisions. Runtime credits are consumed during active use and refinements. Credit allocations vary by plan
              as described on our pricing page.
            </p>
            <h3 className="mt-4 text-lg font-semibold text-foreground">4.2 Credit Rollover</h3>
            <p>
              Users on Builder, Pro, and Agency plans receive 50% rollover of unused build credits each billing cycle.
              Rolled-over credits expire at the end of the following billing cycle. Runtime credits do not roll over.
            </p>
            <h3 className="mt-4 text-lg font-semibold text-foreground">4.3 Additional Credits</h3>
            <p>
              Users may purchase additional build credits at any time regardless of plan. Purchased credits do not
              expire and are used after plan credits are exhausted.
            </p>
          </Section>

          <Section title="5. Subscriptions and Billing">
            <h3 className="mt-4 text-lg font-semibold text-foreground">5.1 Plans and Pricing</h3>
            <p>
              The Service is offered on the following plans: Free ($0/mo), Starter ($19/mo), Builder ($49/mo), Pro
              ($99/mo), and Agency ($199/mo). Pricing is as displayed at the time of purchase and is subject to change
              with notice.
            </p>
            <h3 className="mt-4 text-lg font-semibold text-foreground">5.2 Billing</h3>
            <p>
              Paid subscriptions are billed monthly in advance. All payments are processed through Stripe. By
              subscribing, you authorize us to charge your payment method on a recurring basis until you cancel.
            </p>
            <h3 className="mt-4 text-lg font-semibold text-foreground">5.3 Cancellation and Refunds</h3>
            <p>
              You may cancel your subscription at any time from your account settings. Cancellation takes effect at the
              end of the current billing period. We do not provide refunds for partial billing periods. If you believe
              you were charged in error, contact us at{" "}
              <a href="mailto:support@virtualengine.ai" className="text-primary-glow hover:underline">
                support@virtualengine.ai
              </a>{" "}
              within 30 days.
            </p>
            <h3 className="mt-4 text-lg font-semibold text-foreground">5.4 Free Plan</h3>
            <p>
              The Free plan is provided at no cost and includes limited credits. We reserve the right to modify,
              suspend, or discontinue the Free plan at any time with reasonable notice.
            </p>
          </Section>

          <Section title="6. Acceptable Use">
            <p>You agree not to use the Service to:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Generate content that is illegal, harmful, threatening, abusive, harassing, defamatory, or obscene</li>
              <li>Infringe any intellectual property rights of third parties</li>
              <li>Create spam, phishing pages, or deceptive content</li>
              <li>Distribute malware, viruses, or harmful code</li>
              <li>Violate the privacy rights of others</li>
              <li>Scrape, crawl, or extract data from the Service without authorization</li>
              <li>Attempt to reverse engineer, decompile, or extract the Service's source code</li>
              <li>Use the Service for any unlawful purpose or in violation of applicable law</li>
              <li>Circumvent or attempt to circumvent usage limits or credit systems</li>
            </ul>
            <p>We reserve the right to suspend or terminate access for violations of this section without refund.</p>
          </Section>

          <Section title="7. Intellectual Property">
            <h3 className="mt-4 text-lg font-semibold text-foreground">7.1 Our IP</h3>
            <p>
              The Service, including its underlying technology, design, trademarks, and content (excluding user-generated
              content), is owned by Virtual Engine and protected by intellectual property laws. You may not copy,
              modify, distribute, or create derivative works of any part of the Service without our written permission.
            </p>
            <h3 className="mt-4 text-lg font-semibold text-foreground">7.2 Your Content</h3>
            <p>
              You retain ownership of the content you submit to the Service, including your business descriptions,
              prompts, and any custom content you upload. By submitting content, you grant us a limited license to use
              that content solely to provide and improve the Service.
            </p>
            <h3 className="mt-4 text-lg font-semibold text-foreground">7.3 Generated Websites</h3>
            <p>
              Websites generated by the Service using your prompts are owned by you. You are responsible for ensuring
              that the content you publish does not infringe third-party rights. We grant you a non-exclusive license to
              use website templates, design components, and AI-generated copy produced by the Service.
            </p>
          </Section>

          <Section title="8. GoHighLevel Integration">
            <p>
              The GoHighLevel integration is subject to GoHighLevel's own terms of service. By connecting your GHL
              account, you authorize us to interact with your GHL data on your behalf. You are responsible for your GHL
              account and compliance with GHL's terms. We are not affiliated with or endorsed by GoHighLevel except as a
              listed marketplace partner.
            </p>
            <p>
              If you connect a third-party service (such as GoHighLevel) or publish a website that collects visitor
              information, you are responsible for complying with applicable privacy laws for that data, including
              providing any required notices to your visitors and honoring their data-rights requests. You authorize
              Virtual Engine Builder to store form submissions from your published sites and to transmit them to the
              services you connect. You may disconnect an integration at any time; disconnecting does not delete form
              submissions already stored, which we retain on your behalf and can provide to you upon request.
            </p>
          </Section>

          <Section title="9. Agency and White-Label Terms">
            <p>
              Agency plan users may create sub-accounts for clients. You are responsible for ensuring your clients
              comply with these Terms. White-label features allow you to present the Service under your own brand. You
              may not misrepresent the underlying technology or make false claims about your service to clients.
            </p>
          </Section>

          <Section title="10. Affiliate Program">
            <p>
              Participation in the Virtual Engine Builder affiliate program is subject to separate Affiliate Program
              Terms. The program offers 30% recurring commission on referred paid subscriptions. We reserve the right to
              modify or terminate the affiliate program at any time with reasonable notice.
            </p>
          </Section>

          <Section title="11. Disclaimers">
            <p className="uppercase text-sm">
              The Service is provided "as is" and "as available" without warranties of any kind, express or implied,
              including but not limited to warranties of merchantability, fitness for a particular purpose, and
              non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or that
              AI-generated content will meet your requirements.
            </p>
          </Section>

          <Section title="12. Limitation of Liability">
            <p className="uppercase text-sm">
              To the maximum extent permitted by law, Virtual Engine and its officers, directors, employees, and agents
              shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including
              lost profits, loss of data, or business interruption, arising from your use of or inability to use the
              Service. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </Section>

          <Section title="13. Indemnification">
            <p>
              You agree to indemnify and hold harmless Virtual Engine, its affiliates, officers, directors, and
              employees from any claims, damages, losses, or expenses (including reasonable attorneys' fees) arising
              from your use of the Service, your violation of these Terms, or your infringement of any third-party
              rights.
            </p>
          </Section>

          <Section title="14. Modifications to the Service">
            <p>
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time with
              reasonable notice. We will not be liable to you or any third party for any modification, suspension, or
              discontinuation of the Service.
            </p>
          </Section>

          <Section title="15. Governing Law and Disputes">
            <p>
              These Terms are governed by the laws of the United States. Any disputes arising from these Terms or your
              use of the Service shall be resolved through binding arbitration in accordance with the American
              Arbitration Association rules, except that either party may seek injunctive relief in a court of competent
              jurisdiction. You waive any right to a jury trial or class action proceeding.
            </p>
          </Section>

          <Section title="16. Changes to These Terms">
            <p>
              We may update these Terms from time to time. We will notify you of material changes by email or by posting
              a notice in the Service at least 14 days before the changes take effect. Your continued use of the Service
              after the effective date constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="17. Contact Us">
            <p>If you have questions about these Terms, please contact us:</p>
            <p>
              Virtual Engine
              <br />
              Email:{" "}
              <a href="mailto:legal@virtualengine.ai" className="text-primary-glow hover:underline">
                legal@virtualengine.ai
              </a>
              <br />
              Support:{" "}
              <a href="mailto:support@virtualengine.ai" className="text-primary-glow hover:underline">
                support@virtualengine.ai
              </a>
              <br />
              Website:{" "}
              <a href="https://virtualengine.ai" className="text-primary-glow hover:underline">
                https://virtualengine.ai
              </a>
            </p>
          </Section>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 mt-8 text-2xl font-bold text-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
