import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
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
        <h1 className="mb-3 text-4xl font-bold md:text-5xl">Privacy Policy</h1>
        <p className="mb-12 text-sm text-muted-foreground">Effective Date: May 14, 2026</p>

        <div className="prose-legal space-y-6 text-foreground/90 leading-relaxed">
          <p>
            This Privacy Policy describes how Virtual Engine ("we," "us," or "our") collects, uses, and shares
            information about you when you use Virtual Engine Builder (the "Service"), accessible at{" "}
            <a href="https://builder.virtualengine.ai" className="text-primary-glow hover:underline">
              https://builder.virtualengine.ai
            </a>
            . By using the Service, you agree to the practices described in this policy.
          </p>

          <Section title="1. Information We Collect">
            <h3 className="mt-4 text-lg font-semibold text-foreground">1.1 Information You Provide</h3>
            <ul className="ml-5 list-disc space-y-1">
              <li>Account registration information: name, email address, and password</li>
              <li>Billing information: processed securely through Stripe; we do not store full card numbers</li>
              <li>Business descriptions, prompts, and content you submit to generate websites</li>
              <li>Communications you send us, including support requests and feedback</li>
              <li>GoHighLevel account credentials and API keys you choose to connect</li>
            </ul>
            <h3 className="mt-4 text-lg font-semibold text-foreground">1.2 Information Collected Automatically</h3>
            <ul className="ml-5 list-disc space-y-1">
              <li>Usage data: pages visited, features used, time spent, and actions taken</li>
              <li>Device information: browser type, operating system, IP address, and device identifiers</li>
              <li>Log data: server logs, error reports, and performance data</li>
              <li>Cookies and similar tracking technologies (see Section 6)</li>
            </ul>
            <h3 className="mt-4 text-lg font-semibold text-foreground">1.3 Information from Third Parties</h3>
            <ul className="ml-5 list-disc space-y-1">
              <li>Google: if you sign in with Google, we receive your name, email, and profile photo</li>
              <li>Stripe: payment confirmation and subscription status</li>
              <li>Unsplash: image usage data for photos included in generated websites</li>
              <li>Search Atlas: SEO data related to websites you generate</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Create and manage your account and provide the Service</li>
              <li>Generate AI-powered websites and content based on your descriptions</li>
              <li>Process payments and manage your subscription</li>
              <li>Connect your GoHighLevel account and sync data as you direct</li>
              <li>Send transactional emails, billing receipts, and important service updates</li>
              <li>Respond to your support requests and communications</li>
              <li>Improve and develop the Service, including training and refining our AI models</li>
              <li>Monitor for abuse, fraud, and security threats</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="3. How We Share Your Information">
            <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
            <h3 className="mt-4 text-lg font-semibold text-foreground">3.1 Service Providers</h3>
            <p>We share information with third-party vendors who help us operate the Service, including:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Supabase — database and authentication infrastructure</li>
              <li>Vercel — website hosting and deployment</li>
              <li>Stripe — payment processing</li>
              <li>Anthropic — AI generation (prompts and business descriptions may be processed)</li>
              <li>Resend — transactional email delivery</li>
              <li>Search Atlas — SEO data and keyword research</li>
              <li>Unsplash — stock photography</li>
              <li>GoHighLevel — CRM integration (only when you connect your account)</li>
            </ul>
            <h3 className="mt-4 text-lg font-semibold text-foreground">3.2 Legal Requirements</h3>
            <p>
              We may disclose your information if required by law, court order, or government authority, or if we believe
              disclosure is necessary to protect the rights, property, or safety of Virtual Engine, our users, or the
              public.
            </p>
            <h3 className="mt-4 text-lg font-semibold text-foreground">3.3 Business Transfers</h3>
            <p>
              If Virtual Engine is involved in a merger, acquisition, or sale of assets, your information may be
              transferred as part of that transaction. We will provide notice before your information becomes subject to
              a different privacy policy.
            </p>
          </Section>

          <Section title="4. Data Retention">
            <p>
              We retain your personal information for as long as your account is active or as needed to provide the
              Service. You may request deletion of your account and associated data at any time by contacting us at{" "}
              <a href="mailto:legal@virtualengine.ai" className="text-primary-glow hover:underline">
                legal@virtualengine.ai
              </a>
              . We may retain certain information as required by law or for legitimate business purposes such as fraud
              prevention.
            </p>
          </Section>

          <Section title="5. Your Rights and Choices">
            <p>Depending on your location, you may have the following rights:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Access: request a copy of the personal information we hold about you</li>
              <li>Correction: request correction of inaccurate or incomplete information</li>
              <li>Deletion: request deletion of your personal information</li>
              <li>Portability: request your data in a machine-readable format</li>
              <li>Objection: object to certain uses of your information</li>
              <li>Withdrawal of consent: withdraw consent where processing is based on consent</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:legal@virtualengine.ai" className="text-primary-glow hover:underline">
                legal@virtualengine.ai
              </a>
              . We will respond within 30 days. Users in the European Economic Area, United Kingdom, and California have
              additional rights under GDPR and CCPA respectively.
            </p>
          </Section>

          <Section title="6. Cookies">
            <p>
              We use cookies and similar technologies to authenticate users, remember preferences, analyze usage, and
              improve the Service. You can control cookies through your browser settings. Disabling certain cookies may
              affect the functionality of the Service.
            </p>
          </Section>

          <Section title="7. Data Security">
            <p>
              We implement industry-standard security measures to protect your information, including encryption in
              transit (TLS), encryption at rest, secure authentication, and regular security reviews. However, no method
              of transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="8. International Data Transfers">
            <p>
              Virtual Engine Builder is operated from the United States and serves users in 190+ countries. If you are
              located outside the United States, your information will be transferred to and processed in the United
              States and other countries where our service providers operate. By using the Service, you consent to this
              transfer.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              The Service is not directed to children under the age of 13. We do not knowingly collect personal
              information from children under 13. If we become aware that we have collected information from a child
              under 13, we will take steps to delete that information promptly.
            </p>
          </Section>

          <Section title="10. Third-Party Links">
            <p>
              The Service may contain links to third-party websites or services. We are not responsible for the privacy
              practices of those third parties. We encourage you to review their privacy policies before providing any
              information.
            </p>
          </Section>

          <Section title="11. GoHighLevel Integration">
            <p>
              When you connect your GoHighLevel account to the Service, you authorize us to access, sync, and interact
              with your GHL data as directed by you. We access only the data necessary to provide the integration
              features. You may disconnect your GHL account at any time from your account settings.
            </p>
          </Section>

          <Section title="12. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by email or by
              posting a notice in the Service. Your continued use of the Service after the effective date of the updated
              policy constitutes your acceptance of the changes.
            </p>
          </Section>

          <Section title="13. Contact Us">
            <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
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
