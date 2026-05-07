import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

// Lang is now an open string — any BCP-47 language code is allowed.
// UI dictionaries exist only for a subset; everything else falls back to English UI
// while still driving site generation language and HTML lang/dir attributes.
export type Lang = string;

export type LanguageEntry = {
  code: string;
  label: string;          // short code shown in selector chip
  flag: string;           // emoji flag
  name: string;           // native name
  englishName: string;
  region: "Americas" | "Europe" | "Middle East" | "Africa" | "Asia" | "Pacific";
  rtl?: boolean;
  primary?: boolean;      // shown in quick-select
};

// Curated global list. Primary = quick-select group at the top of the dropdown.
export const LANGUAGES: LanguageEntry[] = [
  // PRIMARY (most widely spoken worldwide)
  { code: "en",    label: "EN",  flag: "🇺🇸", name: "English",            englishName: "English",            region: "Americas",     primary: true },
  { code: "es",    label: "ES",  flag: "🇪🇸", name: "Español",            englishName: "Spanish",            region: "Europe",       primary: true },
  { code: "pt",    label: "PT",  flag: "🇧🇷", name: "Português",          englishName: "Portuguese",         region: "Americas",     primary: true },
  { code: "zh",    label: "中",  flag: "🇨🇳", name: "中文",                englishName: "Chinese (Simplified)", region: "Asia",      primary: true },
  { code: "ja",    label: "日",  flag: "🇯🇵", name: "日本語",              englishName: "Japanese",           region: "Asia",         primary: true },
  { code: "ar",    label: "AR",  flag: "🇸🇦", name: "العربية",            englishName: "Arabic",             region: "Middle East",  rtl: true, primary: true },
  { code: "hi",    label: "HI",  flag: "🇮🇳", name: "हिन्दी",              englishName: "Hindi",              region: "Asia",         primary: true },
  { code: "fr",    label: "FR",  flag: "🇫🇷", name: "Français",           englishName: "French",             region: "Europe",       primary: true },
  { code: "de",    label: "DE",  flag: "🇩🇪", name: "Deutsch",            englishName: "German",             region: "Europe",       primary: true },
  { code: "ko",    label: "KO",  flag: "🇰🇷", name: "한국어",              englishName: "Korean",             region: "Asia",         primary: true },
  { code: "it",    label: "IT",  flag: "🇮🇹", name: "Italiano",           englishName: "Italian",            region: "Europe",       primary: true },
  { code: "ru",    label: "RU",  flag: "🇷🇺", name: "Русский",            englishName: "Russian",            region: "Europe",       primary: true },
  { code: "id",    label: "ID",  flag: "🇮🇩", name: "Bahasa Indonesia",   englishName: "Indonesian",         region: "Asia",         primary: true },
  { code: "tr",    label: "TR",  flag: "🇹🇷", name: "Türkçe",             englishName: "Turkish",            region: "Middle East",  primary: true },
  { code: "vi",    label: "VI",  flag: "🇻🇳", name: "Tiếng Việt",         englishName: "Vietnamese",         region: "Asia",         primary: true },
  { code: "th",    label: "TH",  flag: "🇹🇭", name: "ภาษาไทย",            englishName: "Thai",               region: "Asia",         primary: true },

  // EUROPE
  { code: "nl",    label: "NL",  flag: "🇳🇱", name: "Nederlands",         englishName: "Dutch",              region: "Europe" },
  { code: "pl",    label: "PL",  flag: "🇵🇱", name: "Polski",             englishName: "Polish",             region: "Europe" },
  { code: "sv",    label: "SV",  flag: "🇸🇪", name: "Svenska",            englishName: "Swedish",            region: "Europe" },
  { code: "no",    label: "NO",  flag: "🇳🇴", name: "Norsk",              englishName: "Norwegian",          region: "Europe" },
  { code: "da",    label: "DA",  flag: "🇩🇰", name: "Dansk",              englishName: "Danish",             region: "Europe" },
  { code: "fi",    label: "FI",  flag: "🇫🇮", name: "Suomi",              englishName: "Finnish",            region: "Europe" },
  { code: "el",    label: "EL",  flag: "🇬🇷", name: "Ελληνικά",           englishName: "Greek",              region: "Europe" },
  { code: "ro",    label: "RO",  flag: "🇷🇴", name: "Română",             englishName: "Romanian",           region: "Europe" },
  { code: "hu",    label: "HU",  flag: "🇭🇺", name: "Magyar",             englishName: "Hungarian",          region: "Europe" },
  { code: "cs",    label: "CS",  flag: "🇨🇿", name: "Čeština",            englishName: "Czech",              region: "Europe" },
  { code: "sk",    label: "SK",  flag: "🇸🇰", name: "Slovenčina",         englishName: "Slovak",             region: "Europe" },
  { code: "bg",    label: "BG",  flag: "🇧🇬", name: "Български",          englishName: "Bulgarian",          region: "Europe" },
  { code: "hr",    label: "HR",  flag: "🇭🇷", name: "Hrvatski",           englishName: "Croatian",           region: "Europe" },
  { code: "sr",    label: "SR",  flag: "🇷🇸", name: "Српски",             englishName: "Serbian",            region: "Europe" },
  { code: "uk",    label: "UK",  flag: "🇺🇦", name: "Українська",         englishName: "Ukrainian",          region: "Europe" },

  // MIDDLE EAST
  { code: "he",    label: "HE",  flag: "🇮🇱", name: "עברית",              englishName: "Hebrew",             region: "Middle East", rtl: true },
  { code: "fa",    label: "FA",  flag: "🇮🇷", name: "فارسی",              englishName: "Persian",            region: "Middle East", rtl: true },
  { code: "ur",    label: "UR",  flag: "🇵🇰", name: "اردو",               englishName: "Urdu",               region: "Middle East", rtl: true },

  // ASIA
  { code: "zh-TW", label: "繁",  flag: "🇹🇼", name: "繁體中文",            englishName: "Chinese (Traditional)", region: "Asia" },
  { code: "bn",    label: "BN",  flag: "🇧🇩", name: "বাংলা",              englishName: "Bengali",            region: "Asia" },
  { code: "ms",    label: "MS",  flag: "🇲🇾", name: "Bahasa Melayu",      englishName: "Malay",              region: "Asia" },
  { code: "tl",    label: "TL",  flag: "🇵🇭", name: "Tagalog",            englishName: "Tagalog/Filipino",   region: "Asia" },
  { code: "ta",    label: "TA",  flag: "🇮🇳", name: "தமிழ்",              englishName: "Tamil",              region: "Asia" },
  { code: "te",    label: "TE",  flag: "🇮🇳", name: "తెలుగు",             englishName: "Telugu",             region: "Asia" },
  { code: "mr",    label: "MR",  flag: "🇮🇳", name: "मराठी",              englishName: "Marathi",            region: "Asia" },

  // AFRICA
  { code: "sw",    label: "SW",  flag: "🇰🇪", name: "Kiswahili",          englishName: "Swahili",            region: "Africa" },
  { code: "am",    label: "AM",  flag: "🇪🇹", name: "አማርኛ",              englishName: "Amharic",            region: "Africa" },
  { code: "ha",    label: "HA",  flag: "🇳🇬", name: "Hausa",              englishName: "Hausa",              region: "Africa" },
  { code: "yo",    label: "YO",  flag: "🇳🇬", name: "Yorùbá",             englishName: "Yoruba",             region: "Africa" },
  { code: "zu",    label: "ZU",  flag: "🇿🇦", name: "isiZulu",            englishName: "Zulu",               region: "Africa" },
  { code: "af",    label: "AF",  flag: "🇿🇦", name: "Afrikaans",          englishName: "Afrikaans",          region: "Africa" },

  // PACIFIC
  { code: "mi",    label: "MI",  flag: "🇳🇿", name: "Te Reo Māori",       englishName: "Maori",              region: "Pacific" },
  { code: "sm",    label: "SM",  flag: "🇼🇸", name: "Gagana Sāmoa",       englishName: "Samoan",             region: "Pacific" },
];

export const RTL_LANGS = new Set(LANGUAGES.filter((l) => l.rtl).map((l) => l.code));

export function isRTL(code: string): boolean {
  if (RTL_LANGS.has(code)) return true;
  // Also support raw codes the AI might return
  return ["ar", "he", "fa", "ur", "yi", "ps", "sd"].some((c) => code.toLowerCase().startsWith(c));
}

export function getLanguageEntry(code: string): LanguageEntry | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

const STORAGE_KEY = "veb_lang";

type Dict = Record<string, string>;

// UI translations only exist for these — any other selected lang falls back to English UI.
const dicts: Record<string, Dict> = {
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
  // Translations for es/pt/fr/etc. — fall back to English when missing.
  // For UI strings we keep nav/common essentials; the heavy lifting (site copy)
  // happens in the AI generation prompt which fully respects user language.
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
    "hero.cta": "✦ Hacer realidad mi idea",
    "hero.seePricing": "Ver precios",
    "newsite.title": "Describe tu sitio",
    "newsite.generate": "Generar",
    "newsite.generating": "Generando…",
    "newsite.cancel": "Cancelar",
    "billing.title": "Facturación",
    "billing.plans": "Planes",
    "billing.monthly": "Mensual",
    "billing.annual": "Anual",
    "billing.upgrade": "Mejorar",
    "billing.free": "Gratis",
  },
  pt: {
    "nav.signin": "Entrar",
    "nav.dashboard": "Painel",
    "nav.newsite": "Novo site",
    "nav.integrations": "Integrações",
    "nav.billing": "Cobrança",
    "nav.settings": "Configurações",
    "nav.signout": "Sair",
    "common.plan": "plano",
    "common.unlimitedBuilds": "Gerações ilimitadas",
    "common.creditsLeft": "{n} créditos restantes",
    "newsite.title": "Descreva seu site",
    "newsite.generate": "Gerar",
    "newsite.generating": "Gerando…",
    "newsite.cancel": "Cancelar",
    "billing.title": "Cobrança",
    "billing.plans": "Planos",
    "billing.monthly": "Mensal",
    "billing.annual": "Anual",
    "billing.upgrade": "Atualizar",
    "billing.free": "Grátis",
  },
  fr: {
    "nav.signin": "Se connecter",
    "nav.dashboard": "Tableau de bord",
    "nav.newsite": "Nouveau site",
    "nav.integrations": "Intégrations",
    "nav.billing": "Facturation",
    "nav.settings": "Paramètres",
    "nav.signout": "Se déconnecter",
    "common.plan": "forfait",
    "common.unlimitedBuilds": "Générations illimitées",
    "common.creditsLeft": "{n} crédits restants",
    "newsite.title": "Décrivez votre site",
    "newsite.generate": "Générer",
    "newsite.generating": "Génération…",
    "newsite.cancel": "Annuler",
    "billing.title": "Facturation",
    "billing.plans": "Forfaits",
    "billing.monthly": "Mensuel",
    "billing.annual": "Annuel",
    "billing.upgrade": "Mettre à niveau",
    "billing.free": "Gratuit",
  },
  ar: {
    "nav.signin": "تسجيل الدخول",
    "nav.dashboard": "لوحة التحكم",
    "nav.newsite": "موقع جديد",
    "nav.billing": "الفوترة",
    "nav.settings": "الإعدادات",
    "nav.signout": "تسجيل الخروج",
    "newsite.generate": "إنشاء",
    "billing.title": "الفوترة",
    "billing.plans": "الخطط",
  },
};

function detectLang(): string {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  const nav = (navigator.language || "en").toLowerCase();
  // Match against any known LANGUAGES code (e.g. "zh-TW", "pt-BR" → "pt")
  const exact = LANGUAGES.find((l) => l.code.toLowerCase() === nav);
  if (exact) return exact.code;
  const base = nav.split("-")[0];
  const baseHit = LANGUAGES.find((l) => l.code.toLowerCase() === base);
  if (baseHit) return baseHit.code;
  return "en";
}

type I18nCtx = {
  lang: string;
  setLang: (l: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  rtl: boolean;
};

const Ctx = createContext<I18nCtx>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
  rtl: false,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<string>("en");
  const rtl = isRTL(lang);

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  const setLang = useCallback((l: string) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = isRTL(lang) ? "rtl" : "ltr";
    }
  }, [lang]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = dicts[lang] || {};
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

  return <Ctx.Provider value={{ lang, setLang, t, rtl }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

export function getStoredLang(): string {
  return detectLang();
}
