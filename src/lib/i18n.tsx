import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type Lang = "en" | "es" | "pt" | "fr";

export const LANGUAGES: { code: Lang; label: string; flag: string; name: string }[] = [
  { code: "en", label: "EN", flag: "🇺🇸", name: "English" },
  { code: "es", label: "ES", flag: "🇪🇸", name: "Español" },
  { code: "pt", label: "PT", flag: "🇧🇷", name: "Português" },
  { code: "fr", label: "FR", flag: "🇫🇷", name: "Français" },
];

const STORAGE_KEY = "veb_lang";

type Dict = Record<string, string>;
const dicts: Record<Lang, Dict> = {
  en: {
    "nav.signin": "Sign in",
    "nav.getstarted": "Get started",
    "nav.dashboard": "Dashboard",
    "nav.newsite": "New Site",
    "nav.integrations": "Integrations",
    "nav.billing": "Billing",
    "nav.settings": "Settings",
    "nav.signout": "Sign out",
    "common.plan": "plan",
    "common.unlimitedBuilds": "Unlimited builds",
    "common.creditsLeft": "{n} build credits left",

    "hero.badge": "AI-powered site generation",
    "hero.title1": "You Have an Idea.",
    "hero.title2": "We'll Build It in Minutes.",
    "hero.subtitle":
      "Type it or say it out loud. Virtual Engine Builder turns your business description into a real website, funnel, or landing page — live and ready to take customers.",
    "hero.cta": "✦ Bring My Idea to Life",
    "hero.seePricing": "See pricing",
    "hero.bullet1": "Free to start",
    "hero.bullet2": "No tech skills needed",
    "hero.bullet3": "GoHighLevel ready",
    "demo.title": "See It In Action",
    "demo.subtitle": "From description to live website in 60 seconds.",
    "demo.describe": "Describe your business",
    "demo.generate": "Generate",
    "demo.generating": "Generating site…",
    "testimonials.title": "Loved by builders, agencies, and coaches",
    "pricing.title": "Simple pricing",
    "pricing.subtitle":
      "Pay for what you build. Unused credits roll over (50%, capped at one month).",
    "pricing.popular": "Most popular",
    "pricing.startFree": "Start free",
    "pricing.choose": "Choose plan",
    "footer.product": "A Virtual Engine product — virtualengine.ai →",

    "newsite.title": "Describe your site",
    "newsite.hint": "Plain English. The more detail, the better the site.",
    "newsite.placeholder":
      "e.g. A modern dental practice in Austin focused on cosmetic dentistry, with online booking and patient testimonials.",
    "newsite.generate": "Generate",
    "newsite.generating": "Generating…",
    "newsite.unlimited": "(unlimited)",
    "newsite.oneCredit": "(1 credit)",
    "newsite.cancel": "Cancel",
    "newsite.outOfCredits": "Out of build credits",
    "newsite.topup": "Top up to keep generating, or upgrade your plan.",
    "newsite.buyCredits": "Buy credits",
    "newsite.describeFirst": "Describe your business first",
    "newsite.success": "Site generated",
    "newsite.open": "Open",
    "newsite.recording": "Recording…",
    "newsite.transcriptReady": "Transcript ready",
    "newsite.discard": "Discard",
    "newsite.append": "Append to prompt",
    "newsite.startSpeaking": "Listening… start speaking.",

    "billing.title": "Billing",
    "billing.subtitle": "Manage your plan and credit packs.",
    "billing.current": "Current plan",
    "billing.unlimited": "Unlimited build credits",
    "billing.totalCredits": "{n} total build credits available",
    "billing.buyCredits": "Buy credits",
    "billing.plans": "Plans",
    "billing.monthly": "Monthly",
    "billing.annual": "Annual",
    "billing.current_chip": "CURRENT",
    "billing.upgrade": "Upgrade",
    "billing.currentBtn": "Current plan",
    "billing.free": "Free",
  },
  es: {
    "nav.signin": "Iniciar sesión",
    "nav.getstarted": "Empezar",
    "nav.dashboard": "Panel",
    "nav.newsite": "Nuevo sitio",
    "nav.integrations": "Integraciones",
    "nav.billing": "Facturación",
    "nav.settings": "Ajustes",
    "nav.signout": "Cerrar sesión",
    "common.plan": "plan",
    "common.unlimitedBuilds": "Generaciones ilimitadas",
    "common.creditsLeft": "{n} créditos de generación restantes",

    "hero.badge": "Generación de sitios con IA",
    "hero.title1": "Tienes una idea.",
    "hero.title2": "La construimos en minutos.",
    "hero.subtitle":
      "Escríbelo o dilo en voz alta. Virtual Engine Builder convierte tu descripción en un sitio web, embudo o landing page real — listo para recibir clientes.",
    "hero.cta": "✦ Hacer realidad mi idea",
    "hero.seePricing": "Ver precios",
    "hero.bullet1": "Empieza gratis",
    "hero.bullet2": "Sin conocimientos técnicos",
    "hero.bullet3": "Listo para GoHighLevel",
    "demo.title": "Míralo en acción",
    "demo.subtitle": "De la descripción al sitio web en 60 segundos.",
    "demo.describe": "Describe tu negocio",
    "demo.generate": "Generar",
    "demo.generating": "Generando sitio…",
    "testimonials.title": "Amado por creadores, agencias y coaches",
    "pricing.title": "Precios simples",
    "pricing.subtitle":
      "Paga por lo que construyes. Los créditos no usados se acumulan (50%, máx. un mes).",
    "pricing.popular": "Más popular",
    "pricing.startFree": "Empezar gratis",
    "pricing.choose": "Elegir plan",
    "footer.product": "Un producto de Virtual Engine — virtualengine.ai →",

    "newsite.title": "Describe tu sitio",
    "newsite.hint": "En lenguaje natural. Cuanto más detalle, mejor el sitio.",
    "newsite.placeholder":
      "ej. Una clínica dental moderna en Madrid enfocada en estética dental, con reservas en línea y testimonios.",
    "newsite.generate": "Generar",
    "newsite.generating": "Generando…",
    "newsite.unlimited": "(ilimitado)",
    "newsite.oneCredit": "(1 crédito)",
    "newsite.cancel": "Cancelar",
    "newsite.outOfCredits": "Sin créditos de generación",
    "newsite.topup": "Recarga para seguir generando o mejora tu plan.",
    "newsite.buyCredits": "Comprar créditos",
    "newsite.describeFirst": "Describe tu negocio primero",
    "newsite.success": "Sitio generado",
    "newsite.open": "Abrir",
    "newsite.recording": "Grabando…",
    "newsite.transcriptReady": "Transcripción lista",
    "newsite.discard": "Descartar",
    "newsite.append": "Añadir al prompt",
    "newsite.startSpeaking": "Escuchando… empieza a hablar.",

    "billing.title": "Facturación",
    "billing.subtitle": "Gestiona tu plan y paquetes de créditos.",
    "billing.current": "Plan actual",
    "billing.unlimited": "Créditos ilimitados",
    "billing.totalCredits": "{n} créditos disponibles en total",
    "billing.buyCredits": "Comprar créditos",
    "billing.plans": "Planes",
    "billing.monthly": "Mensual",
    "billing.annual": "Anual",
    "billing.current_chip": "ACTUAL",
    "billing.upgrade": "Mejorar",
    "billing.currentBtn": "Plan actual",
    "billing.free": "Gratis",
  },
  pt: {
    "nav.signin": "Entrar",
    "nav.getstarted": "Começar",
    "nav.dashboard": "Painel",
    "nav.newsite": "Novo site",
    "nav.integrations": "Integrações",
    "nav.billing": "Cobrança",
    "nav.settings": "Configurações",
    "nav.signout": "Sair",
    "common.plan": "plano",
    "common.unlimitedBuilds": "Gerações ilimitadas",
    "common.creditsLeft": "{n} créditos de geração restantes",

    "hero.badge": "Geração de sites com IA",
    "hero.title1": "Você tem uma ideia.",
    "hero.title2": "Nós a construímos em minutos.",
    "hero.subtitle":
      "Digite ou fale em voz alta. O Virtual Engine Builder transforma sua descrição em um site, funil ou landing page real — pronto para receber clientes.",
    "hero.cta": "✦ Dar vida à minha ideia",
    "hero.seePricing": "Ver preços",
    "hero.bullet1": "Comece grátis",
    "hero.bullet2": "Sem conhecimento técnico",
    "hero.bullet3": "Pronto para GoHighLevel",
    "demo.title": "Veja em ação",
    "demo.subtitle": "Da descrição ao site em 60 segundos.",
    "demo.describe": "Descreva seu negócio",
    "demo.generate": "Gerar",
    "demo.generating": "Gerando site…",
    "testimonials.title": "Amado por criadores, agências e coaches",
    "pricing.title": "Preços simples",
    "pricing.subtitle":
      "Pague pelo que construir. Créditos não usados acumulam (50%, máx. um mês).",
    "pricing.popular": "Mais popular",
    "pricing.startFree": "Começar grátis",
    "pricing.choose": "Escolher plano",
    "footer.product": "Um produto da Virtual Engine — virtualengine.ai →",

    "newsite.title": "Descreva seu site",
    "newsite.hint": "Em linguagem natural. Quanto mais detalhe, melhor o site.",
    "newsite.placeholder":
      "ex. Uma clínica odontológica moderna em São Paulo focada em estética, com agendamento online e depoimentos.",
    "newsite.generate": "Gerar",
    "newsite.generating": "Gerando…",
    "newsite.unlimited": "(ilimitado)",
    "newsite.oneCredit": "(1 crédito)",
    "newsite.cancel": "Cancelar",
    "newsite.outOfCredits": "Sem créditos de geração",
    "newsite.topup": "Recarregue para continuar ou faça upgrade do plano.",
    "newsite.buyCredits": "Comprar créditos",
    "newsite.describeFirst": "Descreva seu negócio primeiro",
    "newsite.success": "Site gerado",
    "newsite.open": "Abrir",
    "newsite.recording": "Gravando…",
    "newsite.transcriptReady": "Transcrição pronta",
    "newsite.discard": "Descartar",
    "newsite.append": "Adicionar ao prompt",
    "newsite.startSpeaking": "Ouvindo… comece a falar.",

    "billing.title": "Cobrança",
    "billing.subtitle": "Gerencie seu plano e pacotes de créditos.",
    "billing.current": "Plano atual",
    "billing.unlimited": "Créditos ilimitados",
    "billing.totalCredits": "{n} créditos disponíveis no total",
    "billing.buyCredits": "Comprar créditos",
    "billing.plans": "Planos",
    "billing.monthly": "Mensal",
    "billing.annual": "Anual",
    "billing.current_chip": "ATUAL",
    "billing.upgrade": "Upgrade",
    "billing.currentBtn": "Plano atual",
    "billing.free": "Grátis",
  },
  fr: {
    "nav.signin": "Connexion",
    "nav.getstarted": "Commencer",
    "nav.dashboard": "Tableau de bord",
    "nav.newsite": "Nouveau site",
    "nav.integrations": "Intégrations",
    "nav.billing": "Facturation",
    "nav.settings": "Paramètres",
    "nav.signout": "Déconnexion",
    "common.plan": "forfait",
    "common.unlimitedBuilds": "Générations illimitées",
    "common.creditsLeft": "{n} crédits de génération restants",

    "hero.badge": "Génération de sites par IA",
    "hero.title1": "Vous avez une idée.",
    "hero.title2": "Nous la construisons en minutes.",
    "hero.subtitle":
      "Écrivez-le ou dites-le à voix haute. Virtual Engine Builder transforme votre description en site web, tunnel ou landing page — prêt à accueillir vos clients.",
    "hero.cta": "✦ Concrétiser mon idée",
    "hero.seePricing": "Voir les tarifs",
    "hero.bullet1": "Gratuit pour commencer",
    "hero.bullet2": "Aucune compétence technique",
    "hero.bullet3": "Compatible GoHighLevel",
    "demo.title": "Voir en action",
    "demo.subtitle": "De la description au site en 60 secondes.",
    "demo.describe": "Décrivez votre entreprise",
    "demo.generate": "Générer",
    "demo.generating": "Génération en cours…",
    "testimonials.title": "Adopté par créateurs, agences et coachs",
    "pricing.title": "Tarifs simples",
    "pricing.subtitle":
      "Payez ce que vous construisez. Les crédits non utilisés se reportent (50%, plafonné à un mois).",
    "pricing.popular": "Le plus populaire",
    "pricing.startFree": "Commencer gratuitement",
    "pricing.choose": "Choisir",
    "footer.product": "Un produit Virtual Engine — virtualengine.ai →",

    "newsite.title": "Décrivez votre site",
    "newsite.hint": "En langage naturel. Plus de détails = meilleur site.",
    "newsite.placeholder":
      "ex. Un cabinet dentaire moderne à Montréal axé sur l'esthétique, avec réservation en ligne et témoignages.",
    "newsite.generate": "Générer",
    "newsite.generating": "Génération…",
    "newsite.unlimited": "(illimité)",
    "newsite.oneCredit": "(1 crédit)",
    "newsite.cancel": "Annuler",
    "newsite.outOfCredits": "Plus de crédits",
    "newsite.topup": "Rechargez pour continuer ou changez de forfait.",
    "newsite.buyCredits": "Acheter des crédits",
    "newsite.describeFirst": "Décrivez d'abord votre entreprise",
    "newsite.success": "Site généré",
    "newsite.open": "Ouvrir",
    "newsite.recording": "Enregistrement…",
    "newsite.transcriptReady": "Transcription prête",
    "newsite.discard": "Annuler",
    "newsite.append": "Ajouter au prompt",
    "newsite.startSpeaking": "À l'écoute… parlez maintenant.",

    "billing.title": "Facturation",
    "billing.subtitle": "Gérez votre forfait et packs de crédits.",
    "billing.current": "Forfait actuel",
    "billing.unlimited": "Crédits illimités",
    "billing.totalCredits": "{n} crédits disponibles au total",
    "billing.buyCredits": "Acheter des crédits",
    "billing.plans": "Forfaits",
    "billing.monthly": "Mensuel",
    "billing.annual": "Annuel",
    "billing.current_chip": "ACTUEL",
    "billing.upgrade": "Mettre à niveau",
    "billing.currentBtn": "Forfait actuel",
    "billing.free": "Gratuit",
  },
};

function detectLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (stored && dicts[stored]) return stored;
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("es")) return "es";
  if (nav.startsWith("pt")) return "pt";
  if (nav.startsWith("fr")) return "fr";
  return "en";
}

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const Ctx = createContext<I18nCtx>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* noop */ }
    if (typeof document !== "undefined") document.documentElement.lang = l;
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = dicts[lang] || dicts.en;
      let s = dict[key] ?? dicts.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replace(`{${k}}`, String(v));
        }
      }
      return s;
    },
    [lang],
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

export function getStoredLang(): Lang {
  return detectLang();
}
