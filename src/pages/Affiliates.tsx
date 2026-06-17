import { Link, useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Zap, ArrowRight, CheckCircle2, DollarSign, Link2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Lang = "en" | "es" | "pt";

const COPY: Record<Lang, Record<string, string>> = {
  en: {
    badge: "✦ Affiliate Program",
    h1a: "Earn 30% Recurring Commission.",
    h1b: "Every Month. Forever.",
    sub: "Share Virtual Engine Builder with your audience and earn 30% of every subscription — for the lifetime of the customer. No cap. No expiration.",
    calcTitle: "How much can you earn?",
    calcRefs: "I will refer {n} customers",
    calcMonthly: "Estimated monthly earnings",
    calcLifetime: "12-month estimate",
    step1: "Apply in 60 seconds",
    step2: "Get your unique affiliate link",
    step3: "Earn 30% every month forever",
    apply: "Apply Now",
    tiersTitle: "Commission Tiers",
    formTitle: "Apply to the program",
    fullName: "Full name",
    email: "Email",
    site: "Website or social URL",
    promo: "How will you promote us?",
    expected: "Expected monthly referrals",
    paypal: "PayPal email for payouts",
    terms: "I agree to the affiliate terms",
    submit: "Submit Application",
    success: "Application received! We'll review it within 24h.",
  },
  es: {
    badge: "✦ Programa de Afiliados",
    h1a: "Gana el 30% de Comisión Recurrente.",
    h1b: "Cada Mes. Para Siempre.",
    sub: "Comparte Virtual Engine Builder con tu audiencia y gana el 30% de cada suscripción — por la vida del cliente. Sin límite. Sin caducidad.",
    calcTitle: "¿Cuánto puedes ganar?",
    calcRefs: "Refiero {n} clientes",
    calcMonthly: "Ingresos mensuales estimados",
    calcLifetime: "Estimación a 12 meses",
    step1: "Aplica en 60 segundos",
    step2: "Recibe tu link único",
    step3: "Gana 30% cada mes para siempre",
    apply: "Aplicar Ahora",
    tiersTitle: "Niveles de Comisión",
    formTitle: "Aplicar al programa",
    fullName: "Nombre completo",
    email: "Correo",
    site: "Sitio web o red social",
    promo: "¿Cómo nos promocionarás?",
    expected: "Referidos mensuales esperados",
    paypal: "Correo PayPal para pagos",
    terms: "Acepto los términos de afiliación",
    submit: "Enviar Solicitud",
    success: "¡Solicitud recibida! Revisaremos en 24h.",
  },
  pt: {
    badge: "✦ Programa de Afiliados",
    h1a: "Ganhe 30% de Comissão Recorrente.",
    h1b: "Todo Mês. Para Sempre.",
    sub: "Compartilhe o Virtual Engine Builder com seu público e ganhe 30% de cada assinatura — pela vida do cliente. Sem limite. Sem expiração.",
    calcTitle: "Quanto você pode ganhar?",
    calcRefs: "Vou indicar {n} clientes",
    calcMonthly: "Ganhos mensais estimados",
    calcLifetime: "Estimativa de 12 meses",
    step1: "Aplique em 60 segundos",
    step2: "Receba seu link único",
    step3: "Ganhe 30% todo mês para sempre",
    apply: "Aplicar Agora",
    tiersTitle: "Níveis de Comissão",
    formTitle: "Aplicar ao programa",
    fullName: "Nome completo",
    email: "E-mail",
    site: "Site ou rede social",
    promo: "Como vai nos promover?",
    expected: "Indicações mensais esperadas",
    paypal: "E-mail PayPal para pagamentos",
    terms: "Aceito os termos de afiliação",
    submit: "Enviar Solicitação",
    success: "Solicitação recebida! Vamos revisar em 24h.",
  },
};

// Avg subscription value used for the calculator (USD/mo).
const AVG_PLAN_PRICE = 49;

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  website_url: z.string().trim().max(500).optional().or(z.literal("")),
  promotion_plan: z.string().trim().max(2000).optional().or(z.literal("")),
  expected_referrals: z.string().trim().max(50).optional().or(z.literal("")),
  paypal_email: z.string().trim().email().max(255),
});

export default function Affiliates() {
  const { lang: routeLang } = useParams<{ lang?: string }>();
  const lang: Lang = routeLang === "es" ? "es" : routeLang === "pt" ? "pt" : "en";
  const t = COPY[lang];
  const navigate = useNavigate();
  const { user } = useAuth();

  const [refs, setRefs] = useState(20);
  const monthly = Math.round(refs * AVG_PLAN_PRICE * 0.3);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    website_url: "",
    promotion_plan: "",
    expected_referrals: "",
    paypal_email: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Must be logged in to apply: affiliates.user_id is NOT NULL, so a logged-out
    // submission would hit a constraint violation. Redirect to sign up/in first.
    if (!user) {
      toast.message("Create an account or sign in to apply.");
      navigate("/auth?mode=signup");
      return;
    }
    if (!agreed) return toast.error("Please agree to the affiliate terms.");
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSubmitting(true);
    const row = {
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      paypal_email: parsed.data.paypal_email,
      website_url: parsed.data.website_url || null,
      promotion_plan: parsed.data.promotion_plan || null,
      expected_referrals: parsed.data.expected_referrals || null,
      user_id: user.id,
      affiliate_code: "VEB-PEND" + Math.random().toString(36).slice(2, 6).toUpperCase(),
    };
    const { error } = await supabase.from("affiliates").insert(row);
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(t.success);
    navigate("/app/affiliate");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-primary/15 bg-background/85 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">
              Virtual Engine <span className="text-primary">Builder</span>
            </span>
          </Link>
          <div className="flex gap-2 text-xs">
            <Link to="/affiliates" className={lang === "en" ? "font-bold text-primary" : "opacity-60 hover:opacity-100"}>EN</Link>
            <Link to="/affiliates/es" className={lang === "es" ? "font-bold text-primary" : "opacity-60 hover:opacity-100"}>ES</Link>
            <Link to="/affiliates/pt" className={lang === "pt" ? "font-bold text-primary" : "opacity-60 hover:opacity-100"}>PT</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20">
        <div className="container text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> {t.badge}
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
            {t.h1a}<br />
            <span className="bg-gradient-to-r from-primary to-cta bg-clip-text text-transparent">{t.h1b}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{t.sub}</p>

          {/* Earnings calculator */}
          <Card className="mx-auto mt-10 max-w-xl border-primary/30 bg-primary/5 p-6 text-left shadow-glow">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <DollarSign className="h-4 w-4 text-cta" /> {t.calcTitle}
            </div>
            <div className="mb-4">
              <div className="mb-2 text-sm">{t.calcRefs.replace("{n}", String(refs))}</div>
              <Slider value={[refs]} onValueChange={(v) => setRefs(v[0])} min={1} max={200} step={1} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md border border-primary/20 bg-background/50 p-3">
                <div className="text-xs text-muted-foreground">{t.calcMonthly}</div>
                <div className="text-2xl font-bold text-cta">${monthly}/mo</div>
              </div>
              <div className="rounded-md border border-primary/20 bg-background/50 p-3">
                <div className="text-xs text-muted-foreground">{t.calcLifetime}</div>
                <div className="text-2xl font-bold text-primary">${monthly * 12}</div>
              </div>
            </div>
          </Card>

          <Button asChild size="lg" className="mt-8 bg-cta text-cta-foreground hover:bg-cta/90">
            <a href="#apply">{t.apply} <ArrowRight className="ml-1 h-4 w-4" /></a>
          </Button>
        </div>
      </section>

      {/* Steps */}
      <section className="border-y border-primary/10 bg-card/40 py-16">
        <div className="container grid gap-6 md:grid-cols-3">
          {[t.step1, t.step2, t.step3].map((s, i) => (
            <Card key={i} className="border-primary/20 bg-card p-6 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-bold text-primary">
                {i + 1}
              </div>
              <p className="text-sm font-medium">{s}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section className="py-16">
        <div className="container">
          <h2 className="mb-8 text-center text-3xl font-bold">{t.tiersTitle}</h2>
          <div className="overflow-hidden rounded-xl border border-primary/20">
            <table className="w-full text-sm">
              <thead className="bg-primary/10">
                <tr className="text-left">
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Referrals</th>
                  <th className="px-4 py-3 text-right">Commission</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Starter", "1-10", "20% recurring"],
                  ["Pro", "11-50", "30% recurring"],
                  ["Elite", "51+", "40% recurring"],
                  ["Agency Partner", "Custom", "50% first month + 20% recurring"],
                ].map(([tier, range, rate]) => (
                  <tr key={tier} className="border-t border-primary/10">
                    <td className="px-4 py-3 font-medium">{tier}</td>
                    <td className="px-4 py-3 text-muted-foreground">{range}</td>
                    <td className="px-4 py-3 text-right font-semibold text-cta">{rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Apply form */}
      <section id="apply" className="bg-card/40 py-20">
        <div className="container max-w-2xl">
          <h2 className="mb-2 text-center text-3xl font-bold">{t.formTitle}</h2>
          <Card className="mt-8 border-primary/20 p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{t.fullName}</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                </div>
                <div>
                  <Label>{t.email}</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div>
                <Label>{t.site}</Label>
                <Input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label>{t.promo}</Label>
                <Textarea value={form.promotion_plan} onChange={(e) => setForm({ ...form, promotion_plan: e.target.value })} rows={3} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{t.expected}</Label>
                  <Input value={form.expected_referrals} onChange={(e) => setForm({ ...form, expected_referrals: e.target.value })} placeholder="e.g. 10-25" />
                </div>
                <div>
                  <Label>{t.paypal}</Label>
                  <Input type="email" value={form.paypal_email} onChange={(e) => setForm({ ...form, paypal_email: e.target.value })} required />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    🌍 Global payouts via PayPal (200+ countries) or Wise/TransferWise for regions where PayPal is limited. Tell us which you prefer in the notes above.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                {t.terms}
              </label>
              <Button type="submit" disabled={submitting} className="w-full bg-cta text-cta-foreground hover:bg-cta/90">
                {submitting ? "..." : t.submit}
              </Button>
            </form>
          </Card>
        </div>
      </section>

      <footer className="border-t border-primary/15 py-8 text-center text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">← Back to Virtual Engine Builder</Link>
      </footer>
    </div>
  );
}
