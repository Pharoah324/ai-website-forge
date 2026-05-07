var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { ViteReactSSG } from "vite-react-ssg";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useQuery, useQueryClient, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, useSearchParams, useNavigate, useParams, NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Toaster as Toaster$2, toast as toast$1 } from "sonner";
import * as React from "react";
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, Component } from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { X, MessageCircle, Loader2, Send, ChevronRight, Check, Circle, Globe, ChevronDown, Zap, ArrowRight, ArrowDown, CheckCircle2, Quote, Star, DollarSign, Mic, Link2, TrendingUp, Rocket, CalendarDays, Settings2, Search, BarChart3, PenTool, Plus, AlertTriangle, Sparkles, Wand2, ExternalLink, History, ChevronUp, CreditCard, MicOff, LayoutTemplate, Monitor, Tablet, Smartphone, FileText, ArrowLeft, Copy, Share2, Github, Trash2, KeyRound, Webhook, Settings as Settings$1, Unplug, Plug, Eye, ShieldCheck, Pause, XCircle, ShieldAlert, LayoutDashboard, LogOut, Twitter, Facebook, Linkedin, Download, Users, Activity, Bell, Megaphone, FlaskConical, UserCog, UserPlus, Play, Ban, AlertCircle, Info, RefreshCw, Lock, Target, Image, Layers, Cpu } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { createClient } from "@supabase/supabase-js";
import { Slot } from "@radix-ui/react-slot";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as LabelPrimitive from "@radix-ui/react-label";
import { z } from "zod";
import { format, formatDistanceToNow } from "date-fns";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LineChart, Line, AreaChart, Area } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
const Toaster$1 = ({ ...props }) => {
  const { theme = "system" } = useTheme();
  return /* @__PURE__ */ jsx(
    Toaster$2,
    {
      theme,
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1e6;
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}
const toastTimeouts = /* @__PURE__ */ new Map();
const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId
    });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t)
      };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast2) => {
          addToRemoveQueue(toast2.id);
        });
      }
      return {
        ...state,
        toasts: state.toasts.map(
          (t) => t.id === toastId || toastId === void 0 ? {
            ...t,
            open: false
          } : t
        )
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === void 0) {
        return {
          ...state,
          toasts: []
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId)
      };
  }
};
const listeners = [];
let memoryState = { toasts: [] };
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}
function toast({ ...props }) {
  const id = genId();
  const update = (props2) => dispatch({
    type: "UPDATE_TOAST",
    toast: { ...props2, id }
  });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      }
    }
  });
  return {
    id,
    dismiss,
    update
  };
}
function useToast() {
  const [state, setState] = React.useState(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);
  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId })
  };
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Viewport,
  {
    ref,
    className: cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    ),
    ...props
  }
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
  return /* @__PURE__ */ jsx(ToastPrimitives.Root, { ref, className: cn(toastVariants({ variant }), className), ...props });
});
Toast.displayName = ToastPrimitives.Root.displayName;
const ToastAction = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Action,
  {
    ref,
    className: cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors group-[.destructive]:border-muted/40 hover:bg-secondary group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group-[.destructive]:focus:ring-destructive disabled:pointer-events-none disabled:opacity-50",
      className
    ),
    ...props
  }
));
ToastAction.displayName = ToastPrimitives.Action.displayName;
const ToastClose = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Close,
  {
    ref,
    className: cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-red-300 hover:text-foreground group-[.destructive]:hover:text-red-50 focus:opacity-100 focus:outline-none focus:ring-2 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    ),
    "toast-close": "",
    ...props,
    children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
  }
));
ToastClose.displayName = ToastPrimitives.Close.displayName;
const ToastTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(ToastPrimitives.Title, { ref, className: cn("text-sm font-semibold", className), ...props }));
ToastTitle.displayName = ToastPrimitives.Title.displayName;
const ToastDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(ToastPrimitives.Description, { ref, className: cn("text-sm opacity-90", className), ...props }));
ToastDescription.displayName = ToastPrimitives.Description.displayName;
function Toaster() {
  const { toasts } = useToast();
  return /* @__PURE__ */ jsxs(ToastProvider, { children: [
    toasts.map(function({ id, title, description, action, ...props }) {
      return /* @__PURE__ */ jsxs(Toast, { ...props, children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-1", children: [
          title && /* @__PURE__ */ jsx(ToastTitle, { children: title }),
          description && /* @__PURE__ */ jsx(ToastDescription, { children: description })
        ] }),
        action,
        /* @__PURE__ */ jsx(ToastClose, {})
      ] }, id);
    }),
    /* @__PURE__ */ jsx(ToastViewport, {})
  ] });
}
const TooltipProvider = TooltipPrimitive.Provider;
const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(
  TooltipPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
const SUPABASE_URL = "https://idnyrmdhdfyxdrvyjirj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbnlybWRoZGZ5eGRydnlqaXJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Njc1NDgsImV4cCI6MjA5MzE0MzU0OH0.KYkIrbVUWHYDq5YHxOkd-TcIYzrMM_Kg4hs_5a8uJiA";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true
  }
});
const Ctx$1 = createContext({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {
  }
});
const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser((s == null ? void 0 : s.user) ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      var _a;
      setSession(data.session);
      setUser(((_a = data.session) == null ? void 0 : _a.user) ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return /* @__PURE__ */ jsx(
    Ctx$1.Provider,
    {
      value: {
        user,
        session,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        }
      },
      children
    }
  );
};
const useAuth = () => useContext(Ctx$1);
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
const PLAN_LIMITS$1 = {
  free: { build: 20, runtime: 300, price: 0, label: "Free", rollover: false },
  starter: { build: 100, runtime: 2500, price: 19, label: "Starter", rollover: false },
  builder: { build: 300, runtime: 1e4, price: 49, label: "Builder", rollover: true },
  pro: { build: 800, runtime: 3e4, price: 99, label: "Pro", rollover: true },
  agency: { build: 2e3, runtime: 1e5, price: 199, label: "Agency", rollover: true }
};
const useProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user == null ? void 0 : user.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) throw error;
      return data;
    }
  });
};
const LANGUAGES$1 = [
  // PRIMARY (most widely spoken worldwide)
  { code: "en", label: "EN", flag: "🇺🇸", name: "English", englishName: "English", region: "Americas", primary: true },
  { code: "es", label: "ES", flag: "🇪🇸", name: "Español", englishName: "Spanish", region: "Europe", primary: true },
  { code: "pt", label: "PT", flag: "🇧🇷", name: "Português", englishName: "Portuguese", region: "Americas", primary: true },
  { code: "zh", label: "中", flag: "🇨🇳", name: "中文", englishName: "Chinese (Simplified)", region: "Asia", primary: true },
  { code: "ja", label: "日", flag: "🇯🇵", name: "日本語", englishName: "Japanese", region: "Asia", primary: true },
  { code: "ar", label: "AR", flag: "🇸🇦", name: "العربية", englishName: "Arabic", region: "Middle East", rtl: true, primary: true },
  { code: "hi", label: "HI", flag: "🇮🇳", name: "हिन्दी", englishName: "Hindi", region: "Asia", primary: true },
  { code: "fr", label: "FR", flag: "🇫🇷", name: "Français", englishName: "French", region: "Europe", primary: true },
  { code: "de", label: "DE", flag: "🇩🇪", name: "Deutsch", englishName: "German", region: "Europe", primary: true },
  { code: "ko", label: "KO", flag: "🇰🇷", name: "한국어", englishName: "Korean", region: "Asia", primary: true },
  { code: "it", label: "IT", flag: "🇮🇹", name: "Italiano", englishName: "Italian", region: "Europe", primary: true },
  { code: "ru", label: "RU", flag: "🇷🇺", name: "Русский", englishName: "Russian", region: "Europe", primary: true },
  { code: "id", label: "ID", flag: "🇮🇩", name: "Bahasa Indonesia", englishName: "Indonesian", region: "Asia", primary: true },
  { code: "tr", label: "TR", flag: "🇹🇷", name: "Türkçe", englishName: "Turkish", region: "Middle East", primary: true },
  { code: "vi", label: "VI", flag: "🇻🇳", name: "Tiếng Việt", englishName: "Vietnamese", region: "Asia", primary: true },
  { code: "th", label: "TH", flag: "🇹🇭", name: "ภาษาไทย", englishName: "Thai", region: "Asia", primary: true },
  // EUROPE
  { code: "nl", label: "NL", flag: "🇳🇱", name: "Nederlands", englishName: "Dutch", region: "Europe" },
  { code: "pl", label: "PL", flag: "🇵🇱", name: "Polski", englishName: "Polish", region: "Europe" },
  { code: "sv", label: "SV", flag: "🇸🇪", name: "Svenska", englishName: "Swedish", region: "Europe" },
  { code: "no", label: "NO", flag: "🇳🇴", name: "Norsk", englishName: "Norwegian", region: "Europe" },
  { code: "da", label: "DA", flag: "🇩🇰", name: "Dansk", englishName: "Danish", region: "Europe" },
  { code: "fi", label: "FI", flag: "🇫🇮", name: "Suomi", englishName: "Finnish", region: "Europe" },
  { code: "el", label: "EL", flag: "🇬🇷", name: "Ελληνικά", englishName: "Greek", region: "Europe" },
  { code: "ro", label: "RO", flag: "🇷🇴", name: "Română", englishName: "Romanian", region: "Europe" },
  { code: "hu", label: "HU", flag: "🇭🇺", name: "Magyar", englishName: "Hungarian", region: "Europe" },
  { code: "cs", label: "CS", flag: "🇨🇿", name: "Čeština", englishName: "Czech", region: "Europe" },
  { code: "sk", label: "SK", flag: "🇸🇰", name: "Slovenčina", englishName: "Slovak", region: "Europe" },
  { code: "bg", label: "BG", flag: "🇧🇬", name: "Български", englishName: "Bulgarian", region: "Europe" },
  { code: "hr", label: "HR", flag: "🇭🇷", name: "Hrvatski", englishName: "Croatian", region: "Europe" },
  { code: "sr", label: "SR", flag: "🇷🇸", name: "Српски", englishName: "Serbian", region: "Europe" },
  { code: "uk", label: "UK", flag: "🇺🇦", name: "Українська", englishName: "Ukrainian", region: "Europe" },
  // MIDDLE EAST
  { code: "he", label: "HE", flag: "🇮🇱", name: "עברית", englishName: "Hebrew", region: "Middle East", rtl: true },
  { code: "fa", label: "FA", flag: "🇮🇷", name: "فارسی", englishName: "Persian", region: "Middle East", rtl: true },
  { code: "ur", label: "UR", flag: "🇵🇰", name: "اردو", englishName: "Urdu", region: "Middle East", rtl: true },
  // ASIA
  { code: "zh-TW", label: "繁", flag: "🇹🇼", name: "繁體中文", englishName: "Chinese (Traditional)", region: "Asia" },
  { code: "bn", label: "BN", flag: "🇧🇩", name: "বাংলা", englishName: "Bengali", region: "Asia" },
  { code: "ms", label: "MS", flag: "🇲🇾", name: "Bahasa Melayu", englishName: "Malay", region: "Asia" },
  { code: "tl", label: "TL", flag: "🇵🇭", name: "Tagalog", englishName: "Tagalog/Filipino", region: "Asia" },
  { code: "ta", label: "TA", flag: "🇮🇳", name: "தமிழ்", englishName: "Tamil", region: "Asia" },
  { code: "te", label: "TE", flag: "🇮🇳", name: "తెలుగు", englishName: "Telugu", region: "Asia" },
  { code: "mr", label: "MR", flag: "🇮🇳", name: "मराठी", englishName: "Marathi", region: "Asia" },
  // AFRICA
  { code: "sw", label: "SW", flag: "🇰🇪", name: "Kiswahili", englishName: "Swahili", region: "Africa" },
  { code: "am", label: "AM", flag: "🇪🇹", name: "አማርኛ", englishName: "Amharic", region: "Africa" },
  { code: "ha", label: "HA", flag: "🇳🇬", name: "Hausa", englishName: "Hausa", region: "Africa" },
  { code: "yo", label: "YO", flag: "🇳🇬", name: "Yorùbá", englishName: "Yoruba", region: "Africa" },
  { code: "zu", label: "ZU", flag: "🇿🇦", name: "isiZulu", englishName: "Zulu", region: "Africa" },
  { code: "af", label: "AF", flag: "🇿🇦", name: "Afrikaans", englishName: "Afrikaans", region: "Africa" },
  // PACIFIC
  { code: "mi", label: "MI", flag: "🇳🇿", name: "Te Reo Māori", englishName: "Maori", region: "Pacific" },
  { code: "sm", label: "SM", flag: "🇼🇸", name: "Gagana Sāmoa", englishName: "Samoan", region: "Pacific" }
];
const RTL_LANGS = new Set(LANGUAGES$1.filter((l) => l.rtl).map((l) => l.code));
function isRTL(code) {
  if (RTL_LANGS.has(code)) return true;
  return ["ar", "he", "fa", "ur", "yi", "ps", "sd"].some((c) => code.toLowerCase().startsWith(c));
}
function getLanguageEntry(code) {
  return LANGUAGES$1.find((l) => l.code === code);
}
const STORAGE_KEY$1 = "veb_lang";
const dicts = {
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
    "hero.subtitle": "Type it or say it out loud. Virtual Engine Builder turns your business description into a real website, funnel, or landing page — live and ready to take customers.",
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
    "pricing.subtitle": "Pay for what you build. Unused credits roll over (50%, capped at one month).",
    "pricing.popular": "Most popular",
    "pricing.startFree": "Start free",
    "pricing.choose": "Choose plan",
    "footer.product": "A Virtual Engine product — virtualengine.ai →",
    "newsite.title": "Describe your site",
    "newsite.hint": "Plain English. The more detail, the better the site.",
    "newsite.placeholder": "e.g. A modern dental practice in Austin focused on cosmetic dentistry, with online booking and patient testimonials.",
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
    "billing.free": "Free"
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
    "billing.free": "Gratis"
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
    "billing.free": "Grátis"
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
    "billing.free": "Gratuit"
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
    "billing.plans": "الخطط"
  }
};
function detectLang() {
  if (typeof window === "undefined") return "en";
  let stored = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY$1);
  } catch {
  }
  if (stored) return stored;
  const nav = (typeof navigator !== "undefined" ? navigator.language || "en" : "en").toLowerCase();
  const exact = LANGUAGES$1.find((l) => l.code.toLowerCase() === nav);
  if (exact) return exact.code;
  const base = nav.split("-")[0];
  const baseHit = LANGUAGES$1.find((l) => l.code.toLowerCase() === base);
  if (baseHit) return baseHit.code;
  return "en";
}
const Ctx = createContext({
  lang: "en",
  setLang: () => {
  },
  t: (k) => k,
  rtl: false
});
function I18nProvider({ children }) {
  const [lang, setLangState] = useState("en");
  const rtl = isRTL(lang);
  useEffect(() => {
    setLangState(detectLang());
  }, []);
  const setLang = useCallback((l) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY$1, l);
    } catch {
    }
  }, []);
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = isRTL(lang) ? "rtl" : "ltr";
    }
  }, [lang]);
  const t = useCallback(
    (key, vars) => {
      const dict = dicts[lang] || {};
      let s = dict[key] ?? dicts.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replace(`{${k}}`, String(v));
        }
      }
      return s;
    },
    [lang]
  );
  return /* @__PURE__ */ jsx(Ctx.Provider, { value: { lang, setLang, t, rtl }, children });
}
const useI18n = () => useContext(Ctx);
const CHAT_URL = `${"https://idnyrmdhdfyxdrvyjirj.supabase.co"}/functions/v1/chat-assistant`;
const GREETINGS = {
  en: "Hi! How can we help you today?",
  es: "¡Hola! ¿Cómo podemos ayudarte hoy?",
  pt: "Olá! Como podemos ajudá-lo hoje?",
  ar: "مرحباً! كيف يمكننا مساعدتك اليوم؟",
  zh: "您好！今天我们能为您提供什么帮助？",
  fr: "Bonjour! Comment pouvons-nous vous aider aujourd'hui?",
  de: "Hallo! Wie können wir Ihnen heute helfen?",
  ja: "こんにちは！本日はどのようなご用件でしょうか？",
  hi: "नमस्ते! आज हम आपकी कैसे मदद कर सकते हैं?",
  ko: "안녕하세요! 오늘 어떻게 도와드릴까요?",
  it: "Ciao! Come possiamo aiutarti oggi?",
  ru: "Здравствуйте! Чем мы можем вам помочь сегодня?",
  tr: "Merhaba! Bugün size nasıl yardımcı olabiliriz?",
  vi: "Xin chào! Hôm nay chúng tôi có thể giúp gì cho bạn?",
  th: "สวัสดี! วันนี้เราจะช่วยอะไรคุณได้บ้าง?",
  id: "Halo! Ada yang bisa kami bantu hari ini?",
  he: "שלום! איך נוכל לעזור לך היום?",
  fa: "سلام! امروز چگونه می‌توانیم به شما کمک کنیم؟",
  ur: "ہیلو! آج ہم آپ کی کیسے مدد کر سکتے ہیں؟"
};
function ChatWidget() {
  const { lang, rtl } = useI18n();
  const greeting = useMemo(
    () => GREETINGS[lang] || GREETINGS[lang.split("-")[0]] || GREETINGS.en,
    [lang]
  );
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: greeting }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => {
    setMessages((prev) => prev.length <= 1 ? [{ role: "assistant", content: greeting }] : prev);
  }, [greeting]);
  useEffect(() => {
    var _a;
    (_a = scrollRef.current) == null ? void 0 : _a.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);
  const send = async () => {
    var _a, _b, _c;
    const text = input.trim();
    if (!text || streaming) return;
    const userMsg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setStreaming(true);
    let acc = "";
    const upsert = (chunk) => {
      acc += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if ((last == null ? void 0 : last.role) === "assistant" && last.content !== greeting) {
          if (last._pending) {
            return prev.map(
              (m, i) => i === prev.length - 1 ? { ...m, content: acc } : m
            );
          }
        }
        return [...prev, { role: "assistant", content: acc, _pending: true }];
      });
    };
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbnlybWRoZGZ5eGRydnlqaXJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Njc1NDgsImV4cCI6MjA5MzE0MzU0OH0.KYkIrbVUWHYDq5YHxOkd-TcIYzrMM_Kg4hs_5a8uJiA"}`
        },
        body: JSON.stringify({
          language: lang,
          messages: [...messages, userMsg].map(({ role, content }) => ({ role, content }))
        })
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error("Too many requests. Try again in a moment.");
        if (resp.status === 402) throw new Error("AI credits exhausted.");
        throw new Error("Chat unavailable");
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const delta = (_c = (_b = (_a = parsed.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.delta) == null ? void 0 : _c.content;
            if (delta) upsert(delta);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setMessages((p) => [...p, { role: "assistant", content: msg }]);
    } finally {
      setStreaming(false);
      setMessages(
        (prev) => prev.map((m) => {
          const mm = m;
          if (mm._pending) {
            delete mm._pending;
          }
          return mm;
        })
      );
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setOpen((o) => !o),
        "aria-label": "Open chat",
        className: "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition-transform hover:scale-105",
        children: open ? /* @__PURE__ */ jsx(X, { className: "h-6 w-6" }) : /* @__PURE__ */ jsx(MessageCircle, { className: "h-6 w-6" })
      }
    ),
    open && /* @__PURE__ */ jsxs("div", { dir: rtl ? "rtl" : "ltr", className: `animate-fade-in fixed bottom-24 ${rtl ? "left-6" : "right-6"} z-50 flex h-[480px] w-[360px] max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-primary/30 bg-card shadow-elevated`, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-t-xl bg-gradient-primary px-4 py-3 text-primary-foreground", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "Virtual Engine Builder" }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] opacity-80", children: "We typically reply instantly" })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setOpen(false), "aria-label": "Close chat", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { ref: scrollRef, className: "flex-1 space-y-3 overflow-y-auto p-4", children: messages.map((m, i) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: `max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"}`,
          children: [
            m.content,
            streaming && i === messages.length - 1 && m.role === "assistant" && /* @__PURE__ */ jsx("span", { className: "ml-1 inline-block h-3 w-1 animate-type-cursor bg-current align-middle" })
          ]
        },
        i
      )) }),
      /* @__PURE__ */ jsxs(
        "form",
        {
          onSubmit: (e) => {
            e.preventDefault();
            send();
          },
          className: "flex items-center gap-2 border-t p-3",
          children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                value: input,
                onChange: (e) => setInput(e.target.value),
                placeholder: "Ask anything…",
                className: "flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary",
                disabled: streaming
              }
            ),
            /* @__PURE__ */ jsx(Button, { type: "submit", size: "icon", disabled: streaming || !input.trim(), children: streaming ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }) })
          ]
        }
      )
    ] })
  ] });
}
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[state=open]:bg-accent focus:bg-accent",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(ChevronRight, { className: "ml-auto h-4 w-4" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
const DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.SubContent,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
const DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
const DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
    ...props
  }
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Separator, { ref, className: cn("-mx-1 my-1 h-px bg-muted", className), ...props }));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
const REGION_ORDER = [
  "Europe",
  "Middle East",
  "Asia",
  "Africa",
  "Americas",
  "Pacific"
];
function LanguageSelector({ variant = "ghost" }) {
  var _a;
  const { lang, setLang } = useI18n();
  const [showAll, setShowAll] = useState(false);
  const current = getLanguageEntry(lang) ?? { code: lang, label: lang.toUpperCase(), flag: "🌐", name: lang };
  const primary = LANGUAGES$1.filter((l) => l.primary);
  const grouped = {};
  for (const l of LANGUAGES$1.filter((l2) => !l2.primary)) {
    (grouped[_a = l.region] || (grouped[_a] = [])).push(l);
  }
  return /* @__PURE__ */ jsxs(DropdownMenu, { onOpenChange: (o) => !o && setShowAll(false), children: [
    /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant, size: "sm", className: "gap-1.5 px-2", "aria-label": "Select language", children: [
      /* @__PURE__ */ jsx(Globe, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold", children: current.label })
    ] }) }),
    /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "max-h-[70vh] min-w-[240px] overflow-y-auto", children: [
      /* @__PURE__ */ jsx(DropdownMenuLabel, { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "Most spoken" }),
      primary.map((l) => /* @__PURE__ */ jsxs(
        DropdownMenuItem,
        {
          onClick: () => setLang(l.code),
          className: l.code === lang ? "bg-accent" : "",
          children: [
            /* @__PURE__ */ jsx("span", { className: "mr-2", children: l.flag }),
            /* @__PURE__ */ jsx("span", { className: "flex-1", children: l.name }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: l.label })
          ]
        },
        l.code
      )),
      /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
      !showAll ? /* @__PURE__ */ jsxs(
        DropdownMenuItem,
        {
          onSelect: (e) => {
            e.preventDefault();
            setShowAll(true);
          },
          className: "text-primary",
          children: [
            /* @__PURE__ */ jsx(ChevronDown, { className: "mr-2 h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { className: "flex-1", children: "+ More languages" })
          ]
        }
      ) : REGION_ORDER.flatMap((region) => {
        const items = grouped[region];
        if (!(items == null ? void 0 : items.length)) return [];
        return [
          /* @__PURE__ */ jsx(
            DropdownMenuLabel,
            {
              className: "mt-1 text-[10px] uppercase tracking-wider text-muted-foreground",
              children: region
            },
            `label-${region}`
          ),
          ...items.map((l) => /* @__PURE__ */ jsxs(
            DropdownMenuItem,
            {
              onClick: () => setLang(l.code),
              className: l.code === lang ? "bg-accent" : "",
              children: [
                /* @__PURE__ */ jsx("span", { className: "mr-2", children: l.flag }),
                /* @__PURE__ */ jsx("span", { className: "flex-1", children: l.name }),
                l.rtl && /* @__PURE__ */ jsx("span", { className: "ml-1 rounded bg-muted px-1 text-[9px] font-semibold text-muted-foreground", children: "RTL" })
              ]
            },
            l.code
          ))
        ];
      })
    ] })
  ] });
}
const PLAN_TAGLINES = {
  free: "Try it out",
  starter: "Beginner & testing",
  builder: "Best for serious growth",
  pro: "Advanced scaling",
  agency: "Client work & white-label"
};
const PLAN_FEATURES = {
  free: ["20 build credits/mo", "300 runtime credits", "Live preview", "1 user"],
  starter: ["100 build credits/mo", "2,500 runtime credits", "All templates", "Email support"],
  builder: [
    "300 build credits/mo",
    "10,000 runtime credits",
    "50% build credit rollover",
    "Search Atlas SEO included",
    "Brand voice training"
  ],
  pro: [
    "800 build credits/mo",
    "30,000 runtime credits",
    "50% build credit rollover",
    "Search Atlas SEO included",
    "Priority generation queue"
  ],
  agency: [
    "2,000 build credits/mo",
    "100,000 runtime credits",
    "50% build credit rollover",
    "Search Atlas + client reports",
    "White-label & client workspaces"
  ]
};
const PLAN_TRUST = {
  free: ["GoHighLevel ready", "Cancel anytime"],
  starter: ["GoHighLevel ready", "Cancel anytime"],
  builder: ["GoHighLevel ready", "Credits roll over 50% monthly", "Search Atlas SEO included", "Cancel anytime"],
  pro: ["GoHighLevel ready", "Credits roll over 50% monthly", "Search Atlas SEO included", "Cancel anytime"],
  agency: ["GoHighLevel ready", "Credits roll over 50% monthly", "Search Atlas SEO included", "Cancel anytime"]
};
const ROTATING_PROMPTS = [
  "A medspa in Miami called Glow Aesthetics. Botox, fillers, laser treatments. Luxury feel, online booking required…",
  "Un restaurante de mariscos en Ciudad de México llamado El Rincón del Mar. Ambiente familiar, reservaciones en línea…",
  "مطعم عربي فاخر في دبي يقدم المأكولات الشامية التقليدية. نريد نظام حجز إلكتروني…",
  "Uma clínica de estética em São Paulo chamada Bella Vita. Tratamentos faciais, agendamento online obrigatório…",
  "東京にある和食レストラン「桜庭」。伝統的な日本料理、オンライン予約システム必須…"
];
function RotatingPrompt() {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  useEffect(() => {
    const full = ROTATING_PROMPTS[idx];
    let i = 0;
    setTyped("");
    const tick = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(tick);
        setTimeout(() => setIdx((p) => (p + 1) % ROTATING_PROMPTS.length), 2400);
      }
    }, 28);
    return () => clearInterval(tick);
  }, [idx]);
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto mt-10 max-w-2xl rounded-xl border border-primary/25 bg-navy-muted/60 p-4 text-left shadow-glow", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-primary-glow", children: [
      /* @__PURE__ */ jsx(Mic, { className: "h-3 w-3" }),
      "Try a prompt"
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "min-h-[3.5rem] text-sm leading-relaxed text-navy-foreground/90", children: [
      typed,
      /* @__PURE__ */ jsx("span", { className: "animate-type-cursor ml-0.5 inline-block h-4 w-[2px] bg-primary align-middle" })
    ] })
  ] });
}
const WHY_CARDS = [
  {
    icon: Link2,
    emoji: "🔗",
    title: "Built FOR GoHighLevel",
    body: "Every form submission on your site automatically creates a contact and drops them into your GHL pipeline. No Zapier. No setup. No copy-paste. The only AI builder with native GHL integration.",
    badge: "Available in GHL Marketplace"
  },
  {
    icon: TrendingUp,
    emoji: "📈",
    title: "SEO Built In — Powered by Search Atlas",
    body: "Every site we generate is automatically optimized with real keyword data from Search Atlas — the same professional SEO platform agencies pay $200/month for. Your site doesn't just look good. It gets found.",
    badge: "Exclusive Feature"
  },
  {
    icon: Globe,
    emoji: "🌍",
    title: "Built for Every Country Worldwide",
    body: "Available in 50+ Languages · 190+ Countries · 8 Billion Potential Customers. Type your description in any language — English, Spanish, Mandarin, Arabic, Hindi, Japanese, French, German — and get a fully native website in that same language. Full RTL support for Arabic, Hebrew, Persian, and Urdu.",
    badge: "50+ Languages · 190+ Countries"
  }
];
const COMPARISON_ROWS = [
  { feature: "Native GHL Integration", base: false, lov: false, veb: "Native" },
  { feature: "Search Atlas SEO", base: false, lov: false, veb: "Builder & up" },
  { feature: "Credits Roll Over", base: false, lov: false, veb: "Builder & up (50%)" },
  { feature: "Buy Extra Credits", base: false, lov: false, veb: "Anytime" },
  { feature: "Multi-Language", base: false, lov: false, veb: "50+ Languages + RTL" },
  { feature: "Agency Sub-Accounts", base: false, lov: false, veb: "Included" },
  { feature: "White-Label Mode", base: false, lov: false, veb: "Agency Plan" },
  { feature: "Voice Prompt Input", base: false, lov: false, veb: "Built In" },
  { feature: "SEO Optimization", base: false, lov: false, veb: "Search Atlas" },
  { feature: "GHL Marketplace Listed", base: false, lov: false, veb: "Official" },
  { feature: "Starting Price", base: "$16/mo", lov: "$20/mo", veb: "$19/mo ✅" }
];
const STEPS = [
  {
    icon: Mic,
    emoji: "🎤",
    title: "Describe or Say It",
    body: "Type your business description or tap the microphone and speak it — in any language, anywhere in the world."
  },
  {
    icon: Zap,
    emoji: "⚡",
    title: "AI Builds It in Minutes",
    body: "Watch your professional website generate live. Real copy. Real SEO. Real pages. Automatically optimized with Search Atlas keyword data to rank on Google."
  },
  {
    icon: Rocket,
    emoji: "🚀",
    title: "Publish and Start Growing",
    body: "Hit publish. Your site goes live instantly at your own domain. Connect GoHighLevel and every lead flows straight into your pipeline automatically."
  }
];
const GHL_COLS = [
  { icon: Link2, emoji: "🔗", title: "Pipeline Auto-Sync", body: "New form submission = new GHL contact. Automatically. Every time." },
  { icon: CalendarDays, emoji: "📅", title: "Calendar Embed", body: "Drop your GHL booking calendar into any page. One click. No code." },
  { icon: Settings2, emoji: "⚙️", title: "Workflow Triggers", body: "Site events fire your GHL automations. Form fills, purchases, signups — all connected." }
];
const SEO_BOXES = [
  { icon: Search, emoji: "🔍", title: "Keyword Research", body: "Real search volume data for your industry and location — built into every site." },
  { icon: BarChart3, emoji: "📊", title: "SEO Score", body: "Every site gets an SEO score out of 100 with specific improvement suggestions." },
  { icon: PenTool, emoji: "✍️", title: "Optimized Copy", body: "Headlines, descriptions, and page copy written around your highest-value search keywords." },
  { icon: CalendarDays, emoji: "📅", title: "Content Calendar", body: "5 blog topic suggestions ranked by difficulty so you can keep growing your organic traffic." }
];
const LANGUAGES = [
  { flag: "🌎", name: "Americas", body: "English, Español, Português, Français and every regional dialect — North, Central & South America" },
  { flag: "🌍", name: "Europe & Africa", body: "Deutsch, Italiano, Polski, Русский, Kiswahili, Yorùbá, isiZulu and 20+ more" },
  { flag: "🌏", name: "Asia & Pacific", body: "中文, 日本語, 한국어, हिन्दी, ภาษาไทย, Tiếng Việt, Bahasa Indonesia and many more" },
  { flag: "🕌", name: "Middle East (RTL)", body: "العربية, עברית, فارسی, اردو — full right-to-left layout support" }
];
const TESTIMONIALS = [
  {
    quote: "I was quoted $4,500 by a web agency. I described my business to Virtual Engine Builder and had a live website in 8 minutes. It ranks on Google and connects to my GoHighLevel account automatically. I genuinely could not believe it.",
    name: "David M.",
    role: "HVAC contractor, Texas"
  },
  {
    quote: "I described my medspa and had a fully designed website with online booking in under 2 minutes. The GoHighLevel connection is everything — leads go straight into my pipeline without me touching anything.",
    name: "Jessica R.",
    role: "Glow Aesthetics Miami"
  },
  {
    quote: "I manage 14 client websites from one dashboard. The white-label mode makes me look like I built a proprietary platform. My clients have no idea this exists and I charge premium prices.",
    name: "Marcus D.",
    role: "MD Digital Agency"
  },
  {
    quote: "Switched from Base44. The credit rollover alone saves me $40 a month. And the Search Atlas SEO built in means my clients actually rank on Google now. Nothing else does this.",
    name: "Tanya K.",
    role: "Real Estate Coach Atlanta"
  },
  {
    quote: "Creé el sitio web de mi restaurante en español en 60 segundos. Nunca pensé que algo así fuera posible para un negocio pequeño como el mío.",
    name: "Carlos M.",
    role: "Restaurante El Fogón, Ciudad de México"
  }
];
function Cell({ value }) {
  if (value === true) return /* @__PURE__ */ jsx(Check, { className: "mx-auto h-4 w-4 text-primary" });
  if (value === false) return /* @__PURE__ */ jsx(X, { className: "mx-auto h-4 w-4 text-muted-foreground/50" });
  return /* @__PURE__ */ jsx("span", { className: "text-sm", children: value });
}
function FadeIn({ children, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setShown(true), io.disconnect()),
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: `${className} transition-all duration-700 ${shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`,
      children
    }
  );
}
function Landing() {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx("header", { className: "absolute z-20 w-full", children: /* @__PURE__ */ jsxs("div", { className: "container flex h-16 items-center justify-between", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary", children: /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4 text-primary-foreground" }) }),
        /* @__PURE__ */ jsxs("span", { className: "font-semibold text-navy-foreground", children: [
          "Virtual Engine ",
          /* @__PURE__ */ jsx("span", { className: "text-primary-glow", children: "Builder" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(LanguageSelector, {}),
        /* @__PURE__ */ jsx(Link, { to: "/auth", className: "text-sm text-navy-foreground/80 hover:text-navy-foreground", children: "Sign in" }),
        /* @__PURE__ */ jsx(Button, { asChild: true, size: "sm", className: "bg-cta text-cta-foreground hover:bg-cta/90", children: /* @__PURE__ */ jsx(Link, { to: "/auth?mode=signup", children: "Get started" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden bg-gradient-hero pb-20 pt-36 text-navy-foreground", children: [
      /* @__PURE__ */ jsxs("div", { className: "container relative z-10 mx-auto max-w-5xl text-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary-glow", children: [
          /* @__PURE__ */ jsxs("span", { className: "relative flex h-2 w-2", children: [
            /* @__PURE__ */ jsx("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" }),
            /* @__PURE__ */ jsx("span", { className: "relative inline-flex h-2 w-2 rounded-full bg-primary" })
          ] }),
          "✦ Now Live in the GoHighLevel Marketplace"
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-balance text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl", children: [
          "Stop Paying $3,000 For a Website.",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-gradient", children: "You Can Build It Yourself in 10 Minutes." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mx-auto mt-6 max-w-2xl text-balance text-lg text-navy-foreground/75", children: "Websites, funnels, and landing pages — powered by embedded AI and built to rank on Google. Live before lunch." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-10 flex flex-wrap justify-center gap-3", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", className: "bg-cta text-cta-foreground shadow-glow-cta hover:bg-cta/90", children: /* @__PURE__ */ jsxs(Link, { to: "/auth?mode=signup", children: [
            "✦ Build My Website Free ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "ml-1 h-4 w-4" })
          ] }) }),
          /* @__PURE__ */ jsx(
            Button,
            {
              asChild: true,
              variant: "outline",
              size: "lg",
              className: "border-navy-foreground/20 bg-transparent text-navy-foreground hover:bg-navy-foreground/10",
              children: /* @__PURE__ */ jsxs("a", { href: "#how", children: [
                "Watch It Build in 60 Seconds ",
                /* @__PURE__ */ jsx(ArrowDown, { className: "ml-1 h-4 w-4" })
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-5 text-xs text-navy-foreground/60", children: "Free to start · No credit card · No tech skills needed · GoHighLevel pipeline ready" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs font-semibold text-primary-glow", children: "Available in 50+ Languages · 190+ Countries · 8 Billion Potential Customers" }),
        /* @__PURE__ */ jsx(RotatingPrompt, {})
      ] }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-x-0 top-1/2 h-[500px] -translate-y-1/2 bg-gradient-glow" })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "bg-background py-20", children: /* @__PURE__ */ jsxs("div", { className: "container max-w-6xl", children: [
      /* @__PURE__ */ jsx(FadeIn, { className: "mb-12 text-center", children: /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold tracking-tight md:text-5xl", children: "The Old Way Is Broken." }) }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-6 md:grid-cols-3", children: [
        {
          tone: "bad",
          icon: /* @__PURE__ */ jsx(X, { className: "h-5 w-5 text-destructive" }),
          title: "Hire a web agency",
          items: [
            "Wait 6–8 weeks",
            "Pay $3,000 – $15,000",
            "Request changes, wait again",
            "Pay monthly maintenance fees",
            "Still doesn't rank on Google"
          ]
        },
        {
          tone: "warn",
          icon: /* @__PURE__ */ jsx("span", { className: "text-lg", children: "⚠️" }),
          title: "Use Wix or Squarespace",
          items: [
            "Spend weeks learning the platform",
            "Generic templates everyone has seen",
            "No AI. No SEO. No CRM connection",
            "Still not live after a month"
          ]
        },
        {
          tone: "good",
          icon: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5 text-primary" }),
          title: "Use Virtual Engine Builder",
          items: [
            "Describe your business in plain English",
            "Live website in 10 minutes",
            "Built to rank on Google from day one",
            "Connected to GoHighLevel automatically",
            "Works in 50+ languages worldwide",
            "Start free — no credit card"
          ]
        }
      ].map((c) => /* @__PURE__ */ jsx(FadeIn, { children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: `h-full rounded-2xl border p-7 transition-all ${c.tone === "good" ? "border-primary/60 shadow-glow ring-2 ring-primary/30 md:scale-[1.03]" : c.tone === "warn" ? "border-yellow-500/30 bg-yellow-500/5" : "border-destructive/30 bg-destructive/5"}`,
          style: c.tone === "good" ? { background: "rgba(16,185,129,0.08)" } : void 0,
          children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
              c.icon,
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: c.title })
            ] }),
            /* @__PURE__ */ jsx("ul", { className: "space-y-2 text-sm text-muted-foreground", children: c.items.map((it) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: c.tone === "good" ? "text-primary" : "text-muted-foreground/60", children: "•" }),
              /* @__PURE__ */ jsx("span", { className: c.tone === "good" ? "text-foreground" : "", children: it })
            ] }, it)) })
          ]
        }
      ) }, c.title)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "border-y border-primary/30 bg-navy py-6 text-navy-foreground", children: /* @__PURE__ */ jsxs("div", { className: "container", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-center text-sm font-medium text-navy-foreground/90 md:text-base", children: [
        /* @__PURE__ */ jsx("span", { className: "font-bold text-primary-glow", children: "12,400+" }),
        " Websites Built ·",
        " ",
        /* @__PURE__ */ jsx("span", { className: "font-bold text-primary-glow", children: "3,200+" }),
        " Active Users ·",
        " ",
        /* @__PURE__ */ jsx("span", { className: "font-bold text-primary-glow", children: "10 Min" }),
        " Avg Build Time ·",
        " ",
        /* @__PURE__ */ jsx("span", { className: "font-bold text-primary-glow", children: "4.9★" }),
        " Rating"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-center text-sm font-semibold text-primary-glow md:text-base", children: "Available in 50+ Languages · 190+ Countries · 8 Billion Potential Customers" })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-background py-24", children: /* @__PURE__ */ jsxs("div", { className: "container max-w-6xl", children: [
      /* @__PURE__ */ jsxs(FadeIn, { className: "mx-auto mb-14 max-w-3xl text-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold tracking-tight md:text-5xl", children: "Not Just Another AI Builder." }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-muted-foreground", children: "Every other AI website builder builds a site and stops there. We build a site that ranks on Google, flows leads into your CRM, and works in any language. That is a completely different product." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-6 md:grid-cols-3", children: WHY_CARDS.map((c, i) => /* @__PURE__ */ jsx(FadeIn, { className: `delay-[${i * 100}ms]`, children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: "group h-full rounded-2xl border border-primary/20 p-7 shadow-card transition-all hover:border-primary/50 hover:shadow-glow",
          style: { background: "rgba(16,185,129,0.05)" },
          children: [
            /* @__PURE__ */ jsx("div", { className: "mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-2xl", children: c.emoji }),
            /* @__PURE__ */ jsx("h3", { className: "mb-3 text-xl font-semibold", children: c.title }),
            /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-muted-foreground", children: c.body }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3" }),
              " ",
              c.badge
            ] })
          ]
        }
      ) }, c.title)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-background py-24", children: /* @__PURE__ */ jsxs("div", { className: "container max-w-6xl", children: [
      /* @__PURE__ */ jsxs(FadeIn, { className: "mx-auto mb-14 max-w-3xl text-center", children: [
        /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary", children: "Business Growth Infrastructure" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-4 text-4xl font-bold tracking-tight md:text-5xl", children: "Everything you need to grow — in one platform." }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-muted-foreground", children: "Websites, SEO, CRM, and automation working together. Not a stack of disconnected tools." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-5 md:grid-cols-2 lg:grid-cols-3", children: [
        { title: "AI Website Building", body: "Generate complete, on-brand sites from a single description." },
        { title: "Existing Website Optimization", body: "Connect what you already have. Audit, improve, and grow." },
        { title: "SEO Optimization", body: "On-page, technical, and content SEO baked into every build." },
        { title: "Search Atlas Integration", body: "Real keyword data and ranking insights from a $200/mo SEO platform." },
        { title: "CRM Connectivity", body: "Sync contacts, leads, and pipeline stages — automatically." },
        { title: "GoHighLevel Ready", body: "Native GHL pipeline sync, calendars, and workflow triggers." },
        { title: "AI Automation", body: "Trigger flows from form fills, purchases, and site events." },
        { title: "Lead Capture", body: "Smart forms, exit intent, and instant CRM hand-off." },
        { title: "AI Business Intelligence", body: "Growth recommendations from your traffic, leads, and revenue." }
      ].map((f) => /* @__PURE__ */ jsx(FadeIn, { children: /* @__PURE__ */ jsxs("div", { className: "h-full rounded-xl border border-primary/15 bg-card p-6 shadow-card transition-all hover:border-primary/40 hover:shadow-elevated", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold", children: f.title }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted-foreground", children: f.body })
      ] }) }, f.title)) }),
      /* @__PURE__ */ jsx(FadeIn, { className: "mt-10", children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-8 md:flex md:items-center md:justify-between md:gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
          /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1.5 rounded-full border border-cta/40 bg-cta/10 px-2.5 py-1 text-[11px] font-semibold text-cta", children: "Already have a website?" }),
          /* @__PURE__ */ jsx("h3", { className: "mt-3 text-2xl font-bold tracking-tight md:text-3xl", children: "Connect it. Optimize it. Scale it." }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground md:text-base", children: "Connect your existing website and let Virtual Engine analyze SEO performance, identify growth opportunities, recommend improvements, and optimize your business systems." })
        ] }),
        /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", className: "mt-5 bg-cta text-cta-foreground hover:bg-cta/90 md:mt-0", children: /* @__PURE__ */ jsxs(Link, { to: "/auth?mode=signup&intent=optimize", children: [
          "Optimize my website ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "ml-1 h-4 w-4" })
        ] }) })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-navy py-24 text-navy-foreground", children: /* @__PURE__ */ jsxs("div", { className: "container max-w-5xl", children: [
      /* @__PURE__ */ jsxs(FadeIn, { className: "mx-auto mb-12 max-w-3xl text-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold tracking-tight md:text-5xl", children: "Connect your systems." }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-lg text-navy-foreground/70", children: "Plug in the tools your business already runs on. Virtual Engine ties them into one growth engine." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5", children: [
        "Google Search Console",
        "Google Analytics",
        "Search Atlas",
        "GoHighLevel",
        "Stripe"
      ].map((s) => /* @__PURE__ */ jsx(
        "div",
        {
          className: "flex h-24 items-center justify-center rounded-xl border border-primary/25 px-4 text-center text-sm font-semibold",
          style: { background: "rgba(16,185,129,0.06)" },
          children: s
        },
        s
      )) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-navy py-24 text-navy-foreground", children: /* @__PURE__ */ jsxs("div", { className: "container max-w-5xl", children: [
      /* @__PURE__ */ jsxs(FadeIn, { className: "mb-12 text-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-balance text-4xl font-bold tracking-tight md:text-5xl", children: "Why Smart Business Owners Are Switching to Virtual Engine Builder" }),
        /* @__PURE__ */ jsx("p", { className: "mx-auto mt-4 max-w-2xl text-lg text-navy-foreground/70", children: "Same price as the competition. Ten features they don't have." })
      ] }),
      /* @__PURE__ */ jsxs(FadeIn, { children: [
        /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-2xl border border-primary/30 shadow-glow", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse text-sm", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-navy-muted/80 text-navy-foreground", children: [
            /* @__PURE__ */ jsx("th", { className: "px-4 py-4 text-left font-semibold", children: "Feature" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-4 text-center font-semibold text-navy-foreground/70", children: "Base44" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-4 text-center font-semibold text-navy-foreground/70", children: "Lovable" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-4 text-center font-bold text-primary-foreground", style: { background: "hsl(var(--primary))" }, children: "Virtual Engine Builder" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: COMPARISON_ROWS.map((r, i) => /* @__PURE__ */ jsxs("tr", { className: i % 2 ? "bg-navy/40" : "bg-navy-muted/30", children: [
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3.5 text-navy-foreground/90", children: r.feature }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3.5 text-center text-navy-foreground/60", children: /* @__PURE__ */ jsx(Cell, { value: r.base }) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3.5 text-center text-navy-foreground/60", children: /* @__PURE__ */ jsx(Cell, { value: r.lov }) }),
            /* @__PURE__ */ jsx(
              "td",
              {
                className: "px-4 py-3.5 text-center font-semibold text-primary-glow",
                style: { background: "rgba(16,185,129,0.12)" },
                children: typeof r.veb === "string" ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Check, { className: "h-4 w-4 text-primary" }),
                  r.veb
                ] }) : null
              }
            )
          ] }, r.feature)) })
        ] }) }) }),
        /* @__PURE__ */ jsxs("p", { className: "mt-8 text-center text-2xl font-bold md:text-3xl", children: [
          "Same price. ",
          /* @__PURE__ */ jsx("span", { className: "text-gradient", children: "Ten features they don't have." })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { id: "how", className: "bg-background py-24", children: /* @__PURE__ */ jsxs("div", { className: "container max-w-6xl", children: [
      /* @__PURE__ */ jsx(FadeIn, { className: "mb-14 text-center", children: /* @__PURE__ */ jsx("h2", { className: "text-balance text-4xl font-bold tracking-tight md:text-5xl", children: "From Description to Live Website in Three Steps." }) }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-6 md:grid-cols-3", children: STEPS.map((s, i) => /* @__PURE__ */ jsx(FadeIn, { children: /* @__PURE__ */ jsxs("div", { className: "relative h-full rounded-2xl border bg-card p-7 shadow-card", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute -top-4 left-7 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cta text-sm font-bold text-cta-foreground", children: i + 1 }),
        /* @__PURE__ */ jsx("div", { className: "mb-4 text-3xl", children: s.emoji }),
        /* @__PURE__ */ jsx("h3", { className: "mb-2 text-xl font-semibold", children: s.title }),
        /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-muted-foreground", children: s.body })
      ] }) }, s.title)) })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "relative bg-navy py-24 text-navy-foreground", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 top-0 h-[2px] bg-gradient-primary" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 bottom-0 h-[2px] bg-gradient-primary" }),
      /* @__PURE__ */ jsxs("div", { className: "container max-w-6xl", children: [
        /* @__PURE__ */ jsxs(FadeIn, { className: "mb-14 text-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary-glow", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3" }),
            " Available in GHL Marketplace"
          ] }),
          /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold tracking-tight md:text-5xl", children: "GoHighLevel User?" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-lg text-navy-foreground/75", children: "This was built for you specifically." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-6 md:grid-cols-3", children: GHL_COLS.map((c) => /* @__PURE__ */ jsx(FadeIn, { children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: "h-full rounded-2xl border border-primary/25 p-7",
            style: { background: "rgba(16,185,129,0.06)" },
            children: [
              /* @__PURE__ */ jsx("div", { className: "mb-4 text-3xl", children: c.emoji }),
              /* @__PURE__ */ jsx("h3", { className: "mb-2 text-lg font-semibold", children: c.title }),
              /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-navy-foreground/70", children: c.body })
            ]
          }
        ) }, c.title)) }),
        /* @__PURE__ */ jsx(FadeIn, { className: "mt-10 text-center", children: /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", className: "bg-cta text-cta-foreground hover:bg-cta/90", children: /* @__PURE__ */ jsxs("a", { href: "https://marketplace.gohighlevel.com", target: "_blank", rel: "noopener noreferrer", children: [
          "✦ Find Us in the GHL Marketplace ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "ml-1 h-4 w-4" })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "bg-background py-24", children: /* @__PURE__ */ jsxs("div", { className: "container max-w-6xl", children: [
      /* @__PURE__ */ jsxs(FadeIn, { className: "mx-auto mb-14 max-w-3xl text-center", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-balance text-4xl font-bold tracking-tight md:text-5xl", children: [
          "Most Websites Never Get Found on Google.",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-gradient", children: "Yours Will Be Different." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-muted-foreground", children: "Every site generated on Virtual Engine Builder is automatically optimized using real keyword data from Search Atlas — the professional SEO platform used by thousands of agencies worldwide." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-5 md:grid-cols-2 lg:grid-cols-4", children: SEO_BOXES.map((b) => /* @__PURE__ */ jsx(FadeIn, { children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: "h-full rounded-xl border border-primary/20 p-6 transition-all hover:border-primary/50 hover:shadow-glow",
          style: { background: "rgba(16,185,129,0.04)" },
          children: [
            /* @__PURE__ */ jsx("div", { className: "mb-3 text-2xl", children: b.emoji }),
            /* @__PURE__ */ jsx("h3", { className: "mb-2 text-base font-semibold", children: b.title }),
            /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-muted-foreground", children: b.body })
          ]
        }
      ) }, b.title)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-navy py-24 text-navy-foreground", children: /* @__PURE__ */ jsxs("div", { className: "container max-w-6xl", children: [
      /* @__PURE__ */ jsx(FadeIn, { className: "mx-auto mb-14 max-w-3xl text-center", children: /* @__PURE__ */ jsxs("h2", { className: "text-balance text-4xl font-bold tracking-tight md:text-5xl", children: [
        "One Platform. Every Language.",
        /* @__PURE__ */ jsx("br", {}),
        /* @__PURE__ */ jsx("span", { className: "text-gradient", children: "8 Billion Potential Customers." })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-5 md:grid-cols-2 lg:grid-cols-4", children: LANGUAGES.map((l) => /* @__PURE__ */ jsx(FadeIn, { children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: "h-full rounded-xl border border-primary/25 p-6 text-center",
          style: { background: "rgba(16,185,129,0.08)" },
          children: [
            /* @__PURE__ */ jsx("div", { className: "mb-3 text-4xl", children: l.flag }),
            /* @__PURE__ */ jsx("h3", { className: "mb-2 text-lg font-semibold", children: l.name }),
            /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-navy-foreground/70", children: l.body })
          ]
        }
      ) }, l.name)) }),
      /* @__PURE__ */ jsx(FadeIn, { className: "mx-auto mt-10 max-w-2xl text-center text-base text-navy-foreground/75", children: "Type your description in any language. Get your complete website in that same language. No translation needed. No extra steps." })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-background py-24", children: /* @__PURE__ */ jsxs("div", { className: "container max-w-6xl", children: [
      /* @__PURE__ */ jsx(FadeIn, { className: "mx-auto mb-12 max-w-2xl text-center", children: /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold tracking-tight md:text-5xl", children: "Real Results. Real Business Owners." }) }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-6 md:grid-cols-2", children: TESTIMONIALS.map((t) => /* @__PURE__ */ jsx(FadeIn, { children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: "h-full rounded-xl border border-primary/15 p-7 shadow-card transition-shadow hover:shadow-elevated",
          style: { background: "rgba(16,185,129,0.04)" },
          children: [
            /* @__PURE__ */ jsx(Quote, { className: "mb-3 h-5 w-5 text-primary" }),
            /* @__PURE__ */ jsxs("p", { className: "text-base leading-relaxed text-foreground", children: [
              '"',
              t.quote,
              '"'
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-4 flex items-center gap-1 text-cta", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsx(Star, { className: "h-3.5 w-3.5 fill-current" }, i)) }),
            /* @__PURE__ */ jsx("div", { className: "mt-3 text-sm font-semibold", children: t.name }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: t.role })
          ]
        }
      ) }, t.name)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { id: "pricing", className: "bg-card py-24", children: /* @__PURE__ */ jsxs("div", { className: "container", children: [
      /* @__PURE__ */ jsxs(FadeIn, { className: "mx-auto max-w-2xl text-center", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-balance text-4xl font-bold tracking-tight md:text-5xl", children: [
          "Less Than Your Netflix Subscription.",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-gradient", children: "More Powerful Than a $3,000 Agency." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-muted-foreground", children: "Start free. Build unlimited. Scale when you are ready." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-5", children: Object.keys(PLAN_LIMITS$1).map((key) => {
        const p = PLAN_LIMITS$1[key];
        const featured = key === "builder";
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: `relative flex flex-col rounded-xl border bg-background p-6 ${featured ? "border-primary shadow-elevated lg:scale-105 ring-2 ring-primary/40" : "shadow-card"}`,
            children: [
              featured && /* @__PURE__ */ jsx("span", { className: "absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-cta px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cta-foreground shadow-glow-cta", children: "★ Most Popular" }),
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold uppercase tracking-wider text-muted-foreground", children: p.label }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-[11px] text-muted-foreground/80", children: PLAN_TAGLINES[key] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-baseline gap-1", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-4xl font-bold", children: [
                  "$",
                  p.price
                ] }),
                p.price > 0 && /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "/mo" })
              ] }),
              /* @__PURE__ */ jsx("ul", { className: "mt-6 space-y-2 text-sm", children: PLAN_FEATURES[key].map((f) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }),
                /* @__PURE__ */ jsx("span", { children: f })
              ] }, f)) }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  asChild: true,
                  className: `mt-6 w-full ${featured ? "bg-cta text-cta-foreground hover:bg-cta/90" : ""}`,
                  variant: featured ? "default" : "outline",
                  children: /* @__PURE__ */ jsx(Link, { to: "/auth?mode=signup", children: p.price === 0 ? "Start Free" : featured ? "Get Builder" : "Choose plan" })
                }
              ),
              /* @__PURE__ */ jsx("ul", { className: "mt-5 space-y-1.5 text-[11px] text-muted-foreground", children: PLAN_TRUST[key].map((t) => /* @__PURE__ */ jsxs("li", { className: "flex flex-col gap-0.5", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Check, { className: "h-3 w-3 text-primary" }),
                  " ",
                  t
                ] }),
                t === "GoHighLevel ready" && /* @__PURE__ */ jsx("span", { className: "ml-4 text-[10px] text-muted-foreground/70", children: "Connect your own GoHighLevel account seamlessly." })
              ] }, t)) })
            ]
          },
          key
        );
      }) }),
      /* @__PURE__ */ jsx(FadeIn, { className: "mt-10", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl rounded-xl border border-primary/30 bg-primary/5 p-5 text-center sm:flex sm:items-center sm:justify-between sm:text-left", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "Need a CRM setup?" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Virtual Engine can help connect and configure your GoHighLevel account." })
        ] }),
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", size: "sm", className: "mt-3 sm:mt-0", children: /* @__PURE__ */ jsxs("a", { href: "https://virtualengine.ai/contact", target: "_blank", rel: "noopener noreferrer", children: [
          "Talk to our team ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "ml-1 h-3.5 w-3.5" })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsx(FadeIn, { className: "mt-16", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl rounded-2xl border border-primary/25 p-7 text-center", style: { background: "rgba(16,185,129,0.05)" }, children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold", children: "Need more credits? Top up anytime." }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Buy extra build credits whenever you need them. They never expire." }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 grid gap-3 sm:grid-cols-3", children: [
          { credits: 50, price: 9 },
          { credits: 200, price: 29 },
          { credits: 500, price: 59 }
        ].map((pk) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border bg-background p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: pk.credits }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "build credits" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 text-base font-semibold text-primary", children: [
            "$",
            pk.price
          ] })
        ] }, pk.credits)) })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden bg-gradient-hero py-24 text-navy-foreground", children: [
      /* @__PURE__ */ jsx("div", { className: "container relative z-10 max-w-4xl text-center", children: /* @__PURE__ */ jsxs(FadeIn, { children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl", children: [
          "Your Website Should Not Cost $3,000",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-gradient", children: "And Take 6 Weeks To Build." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mx-auto mt-6 max-w-2xl text-lg text-navy-foreground/75", children: "It should cost nothing to start, take 10 minutes to build, rank on Google from day one, and connect to your CRM automatically. That is exactly what Virtual Engine Builder does." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-9 flex flex-wrap justify-center gap-3", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", className: "bg-cta text-cta-foreground shadow-glow-cta hover:bg-cta/90", children: /* @__PURE__ */ jsxs(Link, { to: "/auth?mode=signup", children: [
            "✦ Build My Free Website Now ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "ml-1 h-4 w-4" })
          ] }) }),
          /* @__PURE__ */ jsx(
            Button,
            {
              asChild: true,
              variant: "outline",
              size: "lg",
              className: "border-navy-foreground/20 bg-transparent text-navy-foreground hover:bg-navy-foreground/10",
              children: /* @__PURE__ */ jsxs(Link, { to: "/auth?mode=signup&intent=optimize", children: [
                "Already have a website? Optimize it instead ",
                /* @__PURE__ */ jsx(ArrowRight, { className: "ml-1 h-4 w-4" })
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-5 text-xs text-navy-foreground/60", children: "Free forever plan available · No credit card required · Works in 50+ languages · 190+ countries served" })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-x-0 top-1/2 h-[400px] -translate-y-1/2 bg-gradient-glow" })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "border-y border-primary/15 bg-primary/5 py-16", children: /* @__PURE__ */ jsxs("div", { className: "container max-w-3xl text-center", children: [
      /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-cta/40 bg-cta/10 px-3 py-1 text-xs font-medium text-cta", children: [
        /* @__PURE__ */ jsx(DollarSign, { className: "h-3 w-3" }),
        " Affiliate Program"
      ] }),
      /* @__PURE__ */ jsx("h2", { className: "mt-4 text-3xl font-bold md:text-4xl", children: "Know Someone Who Needs This?" }),
      /* @__PURE__ */ jsx("p", { className: "mx-auto mt-4 max-w-xl text-muted-foreground", children: "Join our affiliate program and earn 30% recurring commission for every customer you refer. Influencers, agencies, and marketers welcome." }),
      /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", className: "mt-6 bg-cta text-cta-foreground hover:bg-cta/90", children: /* @__PURE__ */ jsxs(Link, { to: "/affiliates", children: [
        "Become an Affiliate ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "ml-1 h-4 w-4" })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("footer", { className: "border-t border-primary/20 bg-navy py-14 text-navy-foreground", children: /* @__PURE__ */ jsxs("div", { className: "container", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-10 md:grid-cols-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary", children: /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4 text-primary-foreground" }) }),
            /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
              "Virtual Engine ",
              /* @__PURE__ */ jsx("span", { className: "text-primary-glow", children: "Builder" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-navy-foreground/60", children: "AI website builder with native GoHighLevel integration and Search Atlas SEO." })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "mb-3 text-xs font-semibold uppercase tracking-wider text-navy-foreground/80", children: "Products" }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-navy-foreground/70", children: [
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/app", className: "hover:text-primary-glow", children: "Dashboard" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/app", className: "hover:text-primary-glow", children: "Templates" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/app/integrations", className: "hover:text-primary-glow", children: "Integrations" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "https://marketplace.gohighlevel.com", target: "_blank", rel: "noopener noreferrer", className: "hover:text-primary-glow", children: "GHL Marketplace" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#pricing", className: "hover:text-primary-glow", children: "Pricing" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "mb-3 text-xs font-semibold uppercase tracking-wider text-navy-foreground/80", children: "Languages" }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-navy-foreground/70", children: [
            /* @__PURE__ */ jsx("li", { children: "🌎 Americas — EN, ES, PT, FR" }),
            /* @__PURE__ */ jsx("li", { children: "🌍 Europe & Africa — 20+ languages" }),
            /* @__PURE__ */ jsx("li", { children: "🌏 Asia & Pacific — 15+ languages" }),
            /* @__PURE__ */ jsx("li", { children: "🕌 Middle East — AR, HE, FA, UR (RTL)" }),
            /* @__PURE__ */ jsx("li", { className: "text-primary-glow", children: "+ 50 total languages worldwide" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "mb-3 text-xs font-semibold uppercase tracking-wider text-navy-foreground/80", children: "Support" }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-navy-foreground/70", children: [
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/affiliates", className: "hover:text-primary-glow", children: "Affiliate Program" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-primary-glow", children: "Help Center" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-primary-glow", children: "Contact" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-primary-glow", children: "Status" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-primary-glow", children: "Privacy Policy" }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-primary-glow", children: "Terms" }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-12 flex flex-col items-center justify-between gap-3 border-t border-primary/15 pt-6 text-sm md:flex-row", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-navy-foreground/60", children: [
          "© ",
          (/* @__PURE__ */ new Date()).getFullYear(),
          " Virtual Engine Builder"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1 text-center md:items-end", children: [
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "https://virtualengine.ai",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "font-semibold hover:underline",
              style: { color: "hsl(var(--parent-brand))" },
              children: "A Virtual Engine product — virtualengine.ai"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] text-navy-foreground/50", children: "Serving businesses worldwide in 50+ languages — every country, every continent" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(ChatWidget, {})
  ] });
}
const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
const Label = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(LabelPrimitive.Root, { ref, className: cn(labelVariants(), className), ...props }));
Label.displayName = LabelPrimitive.Root.displayName;
const KEY = "veb_ref";
const TTL_DAYS = 30;
function captureRefFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref && /^VEB-[A-Z0-9]{4,8}$/i.test(ref)) {
    const payload = { code: ref.toUpperCase(), exp: Date.now() + TTL_DAYS * 864e5 };
    try {
      localStorage.setItem(KEY, JSON.stringify(payload));
      document.cookie = `${KEY}=${encodeURIComponent(ref.toUpperCase())}; max-age=${TTL_DAYS * 86400}; path=/; SameSite=Lax`;
    } catch {
    }
  }
}
function getStoredRef() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, exp } = JSON.parse(raw);
    if (Date.now() > exp) {
      localStorage.removeItem(KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}
const schema$1 = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(128)
});
function Auth() {
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const intent = params.get("intent");
  const postAuthPath = intent === "optimize" ? "/app/optimize" : mode === "signup" ? "/app/onboarding" : "/app";
  useEffect(() => {
    if (user) navigate(postAuthPath, { replace: true });
  }, [user, navigate, postAuthPath]);
  const submit = async (e) => {
    e.preventDefault();
    const parsed = schema$1.safeParse({ email, password });
    if (!parsed.success) {
      toast$1.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const ref = getStoredRef();
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}${postAuthPath}`,
            data: ref ? { affiliate_ref: ref } : void 0
          }
        });
        if (error) throw error;
        toast$1.success("Account created. Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password
        });
        if (error) throw error;
        toast$1.success("Welcome back");
        navigate(postAuthPath);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast$1.error(msg);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-gradient-hero p-6", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-xl border border-navy-muted bg-card p-8 shadow-elevated", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/", className: "mb-6 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary", children: /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4 text-primary-foreground" }) }),
      /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "VirtualEngine" })
    ] }),
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: mode === "signup" ? "Create your account" : "Welcome back" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: mode === "signup" ? "Start with 20 free build credits." : "Sign in to continue building." }),
    params.get("reason") === "timeout" && /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200", children: "Your session expired after 24 hours of inactivity. Please sign in again." }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mt-6 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "email",
            type: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            required: true,
            autoComplete: "email"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Password" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "password",
            type: "password",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            required: true,
            minLength: 6,
            autoComplete: mode === "signup" ? "new-password" : "current-password"
          }
        )
      ] }),
      /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in" })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "mt-4 text-center text-sm text-muted-foreground", children: [
      mode === "signup" ? "Already have an account?" : "New here?",
      " ",
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setMode(mode === "signup" ? "signin" : "signup"),
          className: "font-medium text-primary hover:underline",
          children: mode === "signup" ? "Sign in" : "Create one"
        }
      )
    ] })
  ] }) });
}
function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: sites } = useQuery({
    queryKey: ["sites", user == null ? void 0 : user.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("sites").select("id, name, prompt, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });
  if (!profile) return null;
  const limits = PLAN_LIMITS$1[profile.plan];
  const isUnlimited = profile.plan === "agency";
  const totalCap = limits.build + profile.build_credits_rollover;
  const pct = isUnlimited ? 100 : Math.round(profile.build_credits / Math.max(totalCap, 1) * 100);
  return /* @__PURE__ */ jsxs("div", { className: "container max-w-6xl py-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Dashboard" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Welcome back, ",
          profile.display_name || profile.email,
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/app/new", children: [
        /* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }),
        " New Site"
      ] }) })
    ] }),
    !isUnlimited && profile.build_credits === 0 && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "mt-0.5 h-5 w-5 text-destructive" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-destructive", children: "You're out of build credits." }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Buy a top-up pack or upgrade your plan to keep generating sites." })
      ] }),
      /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", size: "sm", children: /* @__PURE__ */ jsx(Link, { to: "/app/billing", children: "Upgrade" }) })
    ] }),
    !isUnlimited && profile.build_credits > 0 && pct < 20 && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "mt-0.5 h-5 w-5 text-warning" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-warning", children: "Running low on credits." }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
          profile.build_credits,
          " of ",
          totalCap,
          " build credits remaining this month."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-4 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsx(
        StatCard$1,
        {
          label: "Plan",
          value: limits.label,
          sub: limits.price === 0 ? "Free" : `$${limits.price}/mo`,
          icon: Sparkles
        }
      ),
      /* @__PURE__ */ jsx(
        StatCard$1,
        {
          label: "Build credits",
          value: isUnlimited ? "∞" : profile.build_credits.toString(),
          sub: isUnlimited ? "Agency plan" : `of ${totalCap} this month${profile.build_credits_rollover > 0 ? ` (incl. ${profile.build_credits_rollover} rollover)` : ""}`
        }
      ),
      /* @__PURE__ */ jsx(
        StatCard$1,
        {
          label: "Runtime credits",
          value: profile.runtime_credits.toLocaleString(),
          sub: `of ${limits.runtime.toLocaleString()}`
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-10", children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold", children: "Your sites" }),
      !sites || sites.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-dashed bg-card py-16 text-center", children: [
        /* @__PURE__ */ jsx(Globe, { className: "mx-auto h-10 w-10 text-muted-foreground" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 font-medium", children: "No sites yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Describe a business and watch it come to life." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-4", children: /* @__PURE__ */ jsxs(Link, { to: "/app/new", children: [
          /* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }),
          " Generate your first site"
        ] }) })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: sites.map((s) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "group rounded-lg border bg-card p-4 shadow-card transition-shadow hover:shadow-elevated",
          children: [
            /* @__PURE__ */ jsxs(Link, { to: `/app/sites/${s.id}`, className: "block", children: [
              /* @__PURE__ */ jsx("h3", { className: "truncate font-semibold group-hover:text-primary", children: s.name }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 line-clamp-2 text-sm text-muted-foreground", children: s.prompt }),
              /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: format(new Date(s.created_at), "MMM d, yyyy") })
            ] }),
            /* @__PURE__ */ jsx(Button, { asChild: true, size: "sm", variant: "outline", className: "mt-3 w-full", children: /* @__PURE__ */ jsxs(Link, { to: `/app/sites/${s.id}`, children: [
              /* @__PURE__ */ jsx(Wand2, { className: "mr-1 h-3.5 w-3.5" }),
              " Edit with AI"
            ] }) })
          ]
        },
        s.id
      )) })
    ] })
  ] });
}
function StatCard$1({
  label,
  value,
  sub,
  icon: Icon
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border bg-card p-5 shadow-card", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: label }),
      Icon && /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4 text-muted-foreground" })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-bold tracking-tight", children: value }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: sub })
  ] });
}
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    "textarea",
    {
      className: cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ref,
      ...props
    }
  );
});
Textarea.displayName = "Textarea";
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxs(
    DialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs(DialogPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
const DialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className), ...props });
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className), ...props });
DialogFooter.displayName = "DialogFooter";
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DialogPrimitive.Description, { ref, className: cn("text-sm text-muted-foreground", className), ...props }));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
const SitePreview = ({ content }) => {
  const style = {
    "--site-primary": content.theme.primary,
    "--site-bg": content.theme.background,
    "--site-fg": content.theme.foreground,
    "--site-accent": content.theme.accent
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      style,
      className: "min-h-full",
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            background: `hsl(${content.theme.background})`,
            color: `hsl(${content.theme.foreground})`
          },
          children: [
            /* @__PURE__ */ jsx(
              "header",
              {
                style: {
                  borderBottom: `1px solid hsl(${content.theme.foreground} / 0.08)`
                },
                className: "px-6 py-4",
                children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: content.name }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      style: {
                        background: `hsl(${content.theme.primary})`,
                        color: "white"
                      },
                      className: "rounded-md px-3 py-1.5 text-xs font-medium",
                      children: "Get started"
                    }
                  )
                ] })
              }
            ),
            content.sections.map((s, i) => /* @__PURE__ */ jsx(Section, { section: s, theme: content.theme }, i)),
            /* @__PURE__ */ jsxs(
              "footer",
              {
                style: {
                  borderTop: `1px solid hsl(${content.theme.foreground} / 0.08)`,
                  color: `hsl(${content.theme.foreground} / 0.6)`
                },
                className: "px-6 py-6 text-center text-xs",
                children: [
                  "© ",
                  (/* @__PURE__ */ new Date()).getFullYear(),
                  " ",
                  content.name
                ]
              }
            )
          ]
        }
      )
    }
  );
};
const Section = ({
  section,
  theme
}) => {
  const accentBg = `hsl(${theme.accent})`;
  const primary = `hsl(${theme.primary})`;
  const muted = `hsl(${theme.foreground} / 0.7)`;
  if (section.type === "hero") {
    return /* @__PURE__ */ jsxs("section", { className: "px-6 py-20 text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-5xl", children: section.heading }),
      section.subheading && /* @__PURE__ */ jsx(
        "p",
        {
          className: "mx-auto mt-4 max-w-2xl text-lg",
          style: { color: muted },
          children: section.subheading
        }
      ),
      section.cta && /* @__PURE__ */ jsx(
        "button",
        {
          style: { background: primary, color: "white" },
          className: "mt-8 rounded-md px-6 py-3 text-sm font-semibold",
          children: section.cta
        }
      )
    ] });
  }
  if (section.type === "features" || section.type === "about") {
    return /* @__PURE__ */ jsx("section", { className: "px-6 py-16", style: { background: accentBg }, children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-center text-3xl font-bold", children: section.heading }),
      section.subheading && /* @__PURE__ */ jsx(
        "p",
        {
          className: "mx-auto mt-3 max-w-2xl text-center",
          style: { color: muted },
          children: section.subheading
        }
      ),
      section.items && section.items.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-10 grid gap-6 md:grid-cols-3", children: section.items.map((it, i) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "rounded-lg p-5",
          style: {
            background: `hsl(${theme.background})`,
            border: `1px solid hsl(${theme.foreground} / 0.08)`
          },
          children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: it.title }),
            it.body && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm", style: { color: muted }, children: it.body })
          ]
        },
        i
      )) })
    ] }) });
  }
  if (section.type === "pricing") {
    return /* @__PURE__ */ jsx("section", { className: "px-6 py-16", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-center text-3xl font-bold", children: section.heading }),
      section.subheading && /* @__PURE__ */ jsx(
        "p",
        {
          className: "mx-auto mt-3 max-w-2xl text-center",
          style: { color: muted },
          children: section.subheading
        }
      ),
      section.items && /* @__PURE__ */ jsx("div", { className: "mt-10 grid gap-4 md:grid-cols-3", children: section.items.map((it, i) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "rounded-lg p-6 text-center",
          style: {
            border: `1px solid hsl(${theme.foreground} / 0.1)`
          },
          children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: it.title }),
            it.price && /* @__PURE__ */ jsx("p", { className: "mt-3 text-3xl font-bold", children: it.price }),
            it.body && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm", style: { color: muted }, children: it.body })
          ]
        },
        i
      )) })
    ] }) });
  }
  if (section.type === "testimonials") {
    return /* @__PURE__ */ jsx("section", { className: "px-6 py-16", style: { background: accentBg }, children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-center text-3xl font-bold", children: section.heading }),
      section.items && /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-4 md:grid-cols-2", children: section.items.map((it, i) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "rounded-lg p-5",
          style: { background: `hsl(${theme.background})` },
          children: [
            /* @__PURE__ */ jsxs("p", { className: "text-sm italic", children: [
              '"',
              it.body || it.title,
              '"'
            ] }),
            it.author && /* @__PURE__ */ jsxs("p", { className: "mt-3 text-xs font-medium", style: { color: muted }, children: [
              "— ",
              it.author
            ] })
          ]
        },
        i
      )) })
    ] }) });
  }
  if (section.type === "faq") {
    return /* @__PURE__ */ jsx("section", { className: "px-6 py-16", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-center text-3xl font-bold", children: section.heading }),
      section.items && /* @__PURE__ */ jsx("div", { className: "mt-8 space-y-4", children: section.items.map((it, i) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "rounded-lg p-4",
          style: { border: `1px solid hsl(${theme.foreground} / 0.1)` },
          children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold", children: it.title }),
            it.body && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm", style: { color: muted }, children: it.body })
          ]
        },
        i
      )) })
    ] }) });
  }
  if (section.type === "cta") {
    return /* @__PURE__ */ jsxs(
      "section",
      {
        className: "px-6 py-20 text-center",
        style: { background: primary, color: "white" },
        children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold", children: section.heading }),
          section.subheading && /* @__PURE__ */ jsx("p", { className: "mx-auto mt-3 max-w-xl opacity-90", children: section.subheading }),
          section.cta && /* @__PURE__ */ jsx(
            "button",
            {
              className: "mt-6 rounded-md bg-white px-6 py-3 text-sm font-semibold",
              style: { color: primary },
              children: section.cta
            }
          )
        ]
      }
    );
  }
  return /* @__PURE__ */ jsx("section", { className: "px-6 py-16", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-xl", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-center text-3xl font-bold", children: section.heading }),
    section.subheading && /* @__PURE__ */ jsx(
      "p",
      {
        className: "mx-auto mt-3 text-center",
        style: { color: muted },
        children: section.subheading
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-3", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          placeholder: "Your name",
          className: "w-full rounded-md px-3 py-2 text-sm",
          style: { border: `1px solid hsl(${theme.foreground} / 0.15)` }
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          placeholder: "Email",
          className: "w-full rounded-md px-3 py-2 text-sm",
          style: { border: `1px solid hsl(${theme.foreground} / 0.15)` }
        }
      ),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          placeholder: "Message",
          rows: 4,
          className: "w-full rounded-md px-3 py-2 text-sm",
          style: { border: `1px solid hsl(${theme.foreground} / 0.15)` }
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          style: { background: primary, color: "white" },
          className: "w-full rounded-md py-2.5 text-sm font-semibold",
          children: section.cta || "Send"
        }
      )
    ] })
  ] }) });
};
const PACKS = [
  { id: "starter_boost", name: "Starter Boost", price: 9, build: 50, runtime: 1e3, icon: Zap },
  { id: "growth_pack", name: "Growth Pack", price: 24, build: 150, runtime: 4e3, icon: TrendingUp, popular: true },
  { id: "agency_burst", name: "Agency Burst", price: 69, build: 500, runtime: 15e3, icon: Rocket }
];
const TopUpModal = ({
  open,
  onOpenChange
}) => {
  const [loadingId, setLoadingId] = useState(null);
  const buy = async (packId) => {
    setLoadingId(packId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { kind: "topup", packId, returnUrl: window.location.origin }
      });
      if (error) throw error;
      if (data == null ? void 0 : data.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned");
    } catch (err) {
      toast$1.error("Checkout failed", {
        description: (err == null ? void 0 : err.message) ?? "Could not start Stripe checkout. Make sure products are set up."
      });
      setLoadingId(null);
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Buy more credits" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "One-time purchase. Credits added instantly and never expire on monthly reset." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-3", children: PACKS.map((p) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: `relative rounded-lg border bg-card p-4 transition-shadow hover:shadow-elevated ${p.popular ? "border-primary ring-1 ring-primary/40" : ""}`,
        children: [
          p.popular && /* @__PURE__ */ jsx("span", { className: "absolute -top-2 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground", children: "POPULAR" }),
          /* @__PURE__ */ jsx(p.icon, { className: "mb-2 h-5 w-5 text-primary" }),
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold", children: p.name }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-2xl font-bold", children: [
            "$",
            p.price
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "mt-3 space-y-1 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("li", { children: [
              "+",
              p.build,
              " build credits"
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              "+",
              p.runtime.toLocaleString(),
              " runtime credits"
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              className: "mt-4 w-full",
              size: "sm",
              variant: p.popular ? "default" : "outline",
              disabled: loadingId !== null,
              onClick: () => buy(p.id),
              children: [
                loadingId === p.id ? /* @__PURE__ */ jsx(Loader2, { className: "mr-1 h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsx(ExternalLink, { className: "mr-1 h-3.5 w-3.5" }),
                "Buy ",
                p.name
              ]
            }
          )
        ]
      },
      p.id
    )) })
  ] }) });
};
const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(ScrollAreaPrimitive.Root, { ref, className: cn("relative overflow-hidden", className), ...props, children: [
  /* @__PURE__ */ jsx(ScrollAreaPrimitive.Viewport, { className: "h-full w-full rounded-[inherit]", children }),
  /* @__PURE__ */ jsx(ScrollBar, {}),
  /* @__PURE__ */ jsx(ScrollAreaPrimitive.Corner, {})
] }));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;
const ScrollBar = React.forwardRef(({ className, orientation = "vertical", ...props }, ref) => /* @__PURE__ */ jsx(
  ScrollAreaPrimitive.ScrollAreaScrollbar,
  {
    ref,
    orientation,
    className: cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(ScrollAreaPrimitive.ScrollAreaThumb, { className: "relative flex-1 rounded-full bg-border" })
  }
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;
const QUICK_ACTIONS = [
  { label: "Change Colors", prompt: "Change the color scheme to " },
  { label: "Update Headline", prompt: "Change the hero headline to something about " },
  { label: "Add Section", prompt: "Add a new section for " },
  { label: "Make More Modern", prompt: "Make the design feel more modern and premium." },
  { label: "Add Booking", prompt: "Add a booking button in the hero linking to a booking flow." },
  { label: "Change Font", prompt: "Change the typography style to feel " },
  { label: "Add Testimonials", prompt: "Add a testimonials section with 3 realistic quotes." },
  { label: "Update Copy", prompt: "Rewrite the copy to be " }
];
function RefinementChat({
  siteId,
  originalPrompt,
  onContentUpdated,
  onTopUp
}) {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const isUnlimited = (profile == null ? void 0 : profile.plan) === "agency";
  const noCredits = !!profile && !isUnlimited && profile.build_credits <= 0;
  const { data: messages } = useQuery({
    queryKey: ["site-chat", siteId],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_chat_messages").select("*").eq("site_id", siteId).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    }
  });
  const { data: versions } = useQuery({
    queryKey: ["site-versions", siteId],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_versions").select("*").eq("site_id", siteId).order("version_number", { ascending: false });
      if (error) throw error;
      return data;
    }
  });
  useEffect(() => {
    var _a;
    (_a = scrollRef.current) == null ? void 0 : _a.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages == null ? void 0 : messages.length, sending]);
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const toggleMic = () => {
    var _a;
    if (!SR) return toast$1.error("Voice input not supported in this browser");
    if (listening) {
      try {
        (_a = recognitionRef.current) == null ? void 0 : _a.stop();
      } catch {
      }
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setInput((prev) => (prev ? prev.trimEnd() + " " : "") + text);
    };
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };
  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    if (noCredits) {
      onTopUp == null ? void 0 : onTopUp();
      return;
    }
    setSending(true);
    setInput("");
    const { data, error } = await supabase.functions.invoke("refine-site", {
      body: { site_id: siteId, message: msg }
    });
    setSending(false);
    if (error || (data == null ? void 0 : data.error)) {
      const errMsg = (data == null ? void 0 : data.error) || (error == null ? void 0 : error.message) || "Refinement failed";
      if (errMsg === "no_credits") {
        toast$1.error("Out of build credits", {
          action: { label: "Buy credits", onClick: () => onTopUp == null ? void 0 : onTopUp() }
        });
      } else {
        toast$1.error(errMsg);
      }
      setInput(msg);
      return;
    }
    qc.invalidateQueries({ queryKey: ["site-chat", siteId] });
    qc.invalidateQueries({ queryKey: ["site-versions", siteId] });
    qc.invalidateQueries({ queryKey: ["site", siteId] });
    qc.invalidateQueries({ queryKey: ["profile"] });
    if (data == null ? void 0 : data.content) onContentUpdated(data.content);
    toast$1.success("Site updated");
  };
  const restoreVersion = async (v) => {
    const { error } = await supabase.from("sites").update({ content: v.content }).eq("id", siteId);
    if (error) return toast$1.error(error.message);
    onContentUpdated(v.content);
    qc.invalidateQueries({ queryKey: ["site", siteId] });
    toast$1.success(`Restored v${v.version_number}`);
  };
  const handleQuick = (prompt2) => {
    var _a;
    setInput(prompt2);
    (_a = inputRef.current) == null ? void 0 : _a.focus();
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    });
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-col bg-card", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b p-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-primary" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: "Refine with AI" })
      ] }),
      /* @__PURE__ */ jsxs(DropdownMenu, { children: [
        /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "ghost", className: "h-7 gap-1 text-xs", children: [
          /* @__PURE__ */ jsx(History, { className: "h-3.5 w-3.5" }),
          "Versions"
        ] }) }),
        /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "max-h-80 w-72 overflow-y-auto", children: [
          /* @__PURE__ */ jsx(DropdownMenuLabel, { className: "text-xs", children: "Version history" }),
          /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
          !versions || versions.length === 0 ? /* @__PURE__ */ jsx("div", { className: "px-2 py-3 text-xs text-muted-foreground", children: "No previous versions yet." }) : versions.map((v, idx) => /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => restoreVersion(v), className: "flex flex-col items-start gap-0.5", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold", children: [
              "v",
              v.version_number,
              " ",
              idx === 0 && /* @__PURE__ */ jsx("span", { className: "text-primary", children: "· current" })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "line-clamp-1 text-[11px] text-muted-foreground", children: [
              v.label || "Snapshot",
              " · ",
              formatDistanceToNow(new Date(v.created_at), { addSuffix: true })
            ] })
          ] }, v.id))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setPromptOpen((o) => !o),
        className: "flex items-center justify-between border-b px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted/50",
        children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold uppercase tracking-wider", children: "Original prompt" }),
          promptOpen ? /* @__PURE__ */ jsx(ChevronUp, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "h-3.5 w-3.5" })
        ]
      }
    ),
    promptOpen && /* @__PURE__ */ jsx("div", { className: "border-b bg-muted/30 px-3 py-2 text-xs text-foreground", children: originalPrompt }),
    /* @__PURE__ */ jsx(ScrollArea, { className: "flex-1", children: /* @__PURE__ */ jsxs("div", { ref: scrollRef, className: "space-y-3 p-3", children: [
      (!messages || messages.length === 0) && /* @__PURE__ */ jsx("div", { className: "rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground", children: 'Type a refinement below — e.g. "Make it darker", "Add a FAQ section", "Translate to Spanish".' }),
      messages == null ? void 0 : messages.map((m) => /* @__PURE__ */ jsx(Message, { m }, m.id)),
      sending && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" }),
        "Refining your site…"
      ] })
    ] }) }),
    noCredits && /* @__PURE__ */ jsxs("div", { className: "border-t bg-destructive/5 p-3 text-xs", children: [
      /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground", children: "You've used all your build credits." }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Top up instantly to keep refining, or upgrade your plan for more credits monthly." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 flex gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { size: "sm", className: "h-7 text-xs", onClick: () => onTopUp == null ? void 0 : onTopUp(), children: [
          /* @__PURE__ */ jsx(CreditCard, { className: "mr-1 h-3 w-3" }),
          " Buy Credits — from $9"
        ] }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", className: "h-7 text-xs", asChild: true, children: /* @__PURE__ */ jsx("a", { href: "/app/billing", children: "Upgrade Plan" }) })
      ] })
    ] }),
    !noCredits && /* @__PURE__ */ jsx("div", { className: "border-t p-2", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-1.5", children: QUICK_ACTIONS.map((a) => /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => handleQuick(a.prompt),
        disabled: sending,
        className: "rounded border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50",
        children: a.label
      },
      a.label
    )) }) }),
    /* @__PURE__ */ jsxs("div", { className: "border-t p-3", children: [
      /* @__PURE__ */ jsx(
        Textarea,
        {
          ref: inputRef,
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyDown,
          placeholder: "Tell the AI what to change…",
          disabled: sending || noCredits,
          maxLength: 2e3,
          className: "min-h-[64px] resize-none text-sm"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-muted-foreground", children: [
          input.length,
          "/2000 · ",
          isUnlimited ? "Unlimited" : "1 credit"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              size: "sm",
              variant: listening ? "destructive" : "outline",
              onClick: toggleMic,
              disabled: sending,
              title: "Voice input",
              children: listening ? /* @__PURE__ */ jsx(MicOff, { className: "h-3.5 w-3.5 animate-pulse" }) : /* @__PURE__ */ jsx(Mic, { className: "h-3.5 w-3.5" })
            }
          ),
          /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: send, disabled: sending || !input.trim() || noCredits, children: [
            sending ? /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Send, { className: "h-3.5 w-3.5" }),
            /* @__PURE__ */ jsx("span", { className: "ml-1", children: "Send" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function Message({ m }) {
  if (m.role === "user") {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx("div", { className: "max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground", children: m.content }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsxs("div", { className: "max-w-[90%] rounded-lg border bg-muted/40 px-3 py-2 text-sm", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }),
      " AI"
    ] }),
    /* @__PURE__ */ jsx("p", { className: "whitespace-pre-wrap leading-relaxed", children: m.summary || m.content }),
    m.credits_used > 0 && /* @__PURE__ */ jsxs("p", { className: "mt-1.5 text-[10px] text-muted-foreground", children: [
      "— ",
      m.credits_used,
      " credit used"
    ] })
  ] }) });
}
const baseTheme = {
  primary: "221 83% 53%",
  background: "0 0% 100%",
  foreground: "222 47% 11%",
  accent: "210 40% 96%"
};
const TEMPLATES = [
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
          { title: "Walk-ins welcome", body: "We always keep the bar open." }
        ] },
        { type: "about", heading: "Our story", subheading: "Opened in {{CITY}} by a chef who believes great food starts with great ingredients." },
        { type: "testimonials", heading: "Loved by locals", items: [
          { title: "", body: "Best new restaurant in the neighborhood.", author: "{{CITY}} Eater" },
          { title: "", body: "We came for dinner and stayed for dessert.", author: "Maria K." }
        ] },
        { type: "contact", heading: "Find us", subheading: "Open Tue–Sun · {{CITY}}", cta: "Reserve" }
      ]
    }
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
          { title: "Treatments", body: "Bond repair, scalp care, gloss." }
        ] },
        { type: "pricing", heading: "Pricing", items: [
          { title: "Cut", price: "$65+", body: "Includes wash and style." },
          { title: "Color", price: "$140+", body: "Single process or balayage." },
          { title: "Treatment", price: "$45+", body: "Add to any service." }
        ] },
        { type: "cta", heading: "Ready for a refresh?", cta: "Book online" }
      ]
    }
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
          { title: "Estate planning", body: "Wills, trusts, probate." }
        ] },
        { type: "about", heading: "About the firm", subheading: "A boutique {{CITY}} practice with decades of combined experience." },
        { type: "contact", heading: "Talk to an attorney", cta: "Request a consultation" }
      ]
    }
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
          { title: "Emergency", body: "Same-day care when it counts." }
        ] },
        { type: "testimonials", heading: "Patient reviews", items: [
          { title: "", body: "Painless cleaning and a friendly team.", author: "Jordan M." }
        ] },
        { type: "cta", heading: "New patients welcome", cta: "Schedule online" }
      ]
    }
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
          { title: "Personal training", body: "1:1 with a certified coach." }
        ] },
        { type: "pricing", heading: "Memberships", items: [
          { title: "Drop in", price: "$25", body: "Single class." },
          { title: "Unlimited", price: "$179/mo", body: "All classes, no contract." },
          { title: "Coaching", price: "$299/mo", body: "Includes 4 PT sessions." }
        ] },
        { type: "cta", heading: "Try a class on us", cta: "Claim free week" }
      ]
    }
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
          { title: "Investors", body: "Cash-flow analysis and deal sourcing." }
        ] },
        { type: "about", heading: "About the agent", subheading: "A {{CITY}} native with deep neighborhood knowledge." },
        { type: "contact", heading: "Let's talk", cta: "Send a message" }
      ]
    }
  }
];
const STALL_MS = 45e3;
async function streamGenerateSite(body, cbs, signal) {
  var _a, _b;
  const { data: sessionData } = await supabase.auth.getSession();
  const token = (_a = sessionData.session) == null ? void 0 : _a.access_token;
  if (!token) {
    cbs.onError("Not authenticated. Please sign in again.", "auth");
    return;
  }
  const url = `${"https://idnyrmdhdfyxdrvyjirj.supabase.co"}/functions/v1/generate-site`;
  const ctrl = new AbortController();
  const onExternalAbort = () => ctrl.abort();
  signal == null ? void 0 : signal.addEventListener("abort", onExternalAbort);
  let resp;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbnlybWRoZGZ5eGRydnlqaXJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Njc1NDgsImV4cCI6MjA5MzE0MzU0OH0.KYkIrbVUWHYDq5YHxOkd-TcIYzrMM_Kg4hs_5a8uJiA"
      },
      body: JSON.stringify({ ...body, stream: true }),
      signal: ctrl.signal
    });
  } catch (e) {
    signal == null ? void 0 : signal.removeEventListener("abort", onExternalAbort);
    if (signal == null ? void 0 : signal.aborted) return cbs.onError("Cancelled", "aborted");
    cbs.onError(
      e instanceof Error ? e.message : "Network error. Check your connection and retry.",
      "network"
    );
    return;
  }
  if (!resp.ok || !resp.body) {
    let msg = "Generation failed";
    let code = "server";
    let payload = {};
    try {
      payload = await resp.json();
      msg = payload.error || msg;
    } catch {
    }
    const reason = payload.reason ?? payload.error;
    if (reason === "no_credits" || resp.status === 402) {
      code = "no_credits";
      msg = "You're out of build credits. Top up or upgrade your plan.";
    } else if (reason === "daily_limit") {
      code = "rate_limited";
      const mins = Math.ceil((payload.retry_after_seconds ?? 3600) / 60);
      msg = `Daily generation limit reached (${payload.daily_limit}/day on ${payload.plan} plan). Resets in ~${mins} min.`;
    } else if (reason === "hourly_limit") {
      code = "rate_limited";
      const mins = Math.ceil((payload.retry_after_seconds ?? 600) / 60);
      msg = `Hourly API limit reached. Try again in ~${mins} min.`;
    } else if (resp.status === 429) {
      code = "rate_limited";
    } else if (resp.status === 401) {
      code = "auth";
    }
    signal == null ? void 0 : signal.removeEventListener("abort", onExternalAbort);
    cbs.onError(msg, code);
    return;
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let currentEvent = "";
  let finished = false;
  let stallTimer;
  const armStall = () => {
    if (stallTimer) clearTimeout(stallTimer);
    stallTimer = window.setTimeout(() => {
      if (!finished) {
        try {
          ctrl.abort();
        } catch {
        }
      }
    }, STALL_MS);
  };
  armStall();
  try {
    while (true) {
      let chunk;
      try {
        chunk = await reader.read();
      } catch (e) {
        if (signal == null ? void 0 : signal.aborted) {
          finished = true;
          cbs.onError("Cancelled", "aborted");
          return;
        }
        if (ctrl.signal.aborted) {
          finished = true;
          cbs.onError(
            "The generation stalled. Please try again.",
            "stalled"
          );
          return;
        }
        throw e;
      }
      const { done, value } = chunk;
      if (done) break;
      armStall();
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line === "") {
          currentEvent = "";
          continue;
        }
        if (line.startsWith(":")) continue;
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
          continue;
        }
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6);
          try {
            const data = JSON.parse(dataStr);
            if (currentEvent === "delta" && data.partial_json) {
              (_b = cbs.onDelta) == null ? void 0 : _b.call(cbs, data.partial_json);
            } else if (currentEvent === "done" && data.site) {
              finished = true;
              cbs.onDone(data.site);
            } else if (currentEvent === "error") {
              finished = true;
              const raw = data.error || "Generation error";
              const cap = /storage_limit:sites:(\d+):(\w+)/.exec(raw);
              const friendly = cap ? `You've reached your plan limit of ${cap[1]} site${cap[1] === "1" ? "" : "s"} on the ${cap[2]} plan. Upgrade to save more.` : raw;
              cbs.onError(friendly, "server");
            }
          } catch {
            buf = "data: " + dataStr + "\n" + buf;
            break;
          }
        }
      }
    }
    if (!finished) {
      cbs.onError(
        "Generation ended without a result. Please try again.",
        "server"
      );
    }
  } catch (e) {
    if (!finished) {
      cbs.onError(
        e instanceof Error ? e.message : "Stream error",
        "network"
      );
    }
  } finally {
    if (stallTimer) clearTimeout(stallTimer);
    signal == null ? void 0 : signal.removeEventListener("abort", onExternalAbort);
  }
}
const VIEWPORTS$1 = {
  desktop: { width: "100%", icon: Monitor, label: "Desktop" },
  tablet: { width: "768px", icon: Tablet, label: "Tablet" },
  mobile: { width: "390px", icon: Smartphone, label: "Mobile" }
};
const SAMPLES = [
  "A modern coffee shop in Brooklyn serving single-origin pour-overs and pastries, with online ordering and a loyalty program.",
  "A boutique law firm specializing in startup contracts, with consultation booking and case study examples.",
  "A yoga studio offering classes, teacher training, and a 7-day free trial."
];
function tryParsePartial(s) {
  if (!s.trim().startsWith("{")) return null;
  for (let extra = 0; extra <= 6; extra++) {
    const candidate = s + "}".repeat(extra) + "]".repeat(extra);
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && parsed.name) return parsed;
    } catch {
    }
  }
  return null;
}
function NewSite() {
  const { t, lang } = useI18n();
  const [prompt2, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState(null);
  const [siteId, setSiteId] = useState(null);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [mobileTab, setMobileTab] = useState("chat");
  const [viewport, setViewport] = useState("desktop");
  const [templateModal, setTemplateModal] = useState(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [bizName, setBizName] = useState("");
  const [bizCity, setBizCity] = useState("");
  const accumulatedRef = useRef("");
  const abortRef = useRef(null);
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [liveFinal, setLiveFinal] = useState("");
  const [liveInterim, setLiveInterim] = useState("");
  const SpeechRecognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const speechSupported = !!SpeechRecognition;
  useEffect(() => {
    return () => {
      var _a;
      try {
        (_a = recognitionRef.current) == null ? void 0 : _a.stop();
      } catch {
      }
    };
  }, []);
  const toggleDictation = () => {
    var _a;
    if (!speechSupported) {
      toast$1.error("Voice input not supported", {
        description: "Try Chrome or Safari on desktop."
      });
      return;
    }
    if (listening) {
      try {
        (_a = recognitionRef.current) == null ? void 0 : _a.stop();
      } catch {
      }
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    setLiveFinal("");
    setLiveInterim("");
    rec.onstart = () => setListening(true);
    rec.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast$1.error("Microphone permission denied");
      } else if (e.error !== "aborted" && e.error !== "no-speech") {
        toast$1.error(`Voice input error: ${e.error}`);
      }
    };
    rec.onend = () => {
      setListening(false);
      setLiveInterim("");
    };
    rec.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setLiveFinal(finalText);
      setLiveInterim(interimText);
    };
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };
  const appendTranscript = () => {
    var _a;
    const text = (liveFinal + " " + liveInterim).trim();
    if (!text) return;
    setPrompt((p) => (p ? p.trimEnd() + " " : "") + text);
    setLiveFinal("");
    setLiveInterim("");
    try {
      (_a = recognitionRef.current) == null ? void 0 : _a.stop();
    } catch {
    }
  };
  const discardTranscript = () => {
    var _a;
    setLiveFinal("");
    setLiveInterim("");
    try {
      (_a = recognitionRef.current) == null ? void 0 : _a.stop();
    } catch {
    }
  };
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isUnlimited = (profile == null ? void 0 : profile.plan) === "agency";
  const noCredits = profile && !isUnlimited && profile.build_credits <= 0;
  const runGeneration = async (body) => {
    var _a;
    setGenerating(true);
    setContent(null);
    accumulatedRef.current = "";
    (_a = abortRef.current) == null ? void 0 : _a.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    await streamGenerateSite(
      { ...body, language: lang },
      {
        onDelta: (chunk) => {
          accumulatedRef.current += chunk;
          const partial = tryParsePartial(accumulatedRef.current);
          if (partial) setContent(partial);
        },
        onDone: (site) => {
          setContent(site.content);
          setSiteId(site.id);
          setGeneratedPrompt(body.prompt);
          setMobileTab("preview");
          qc.invalidateQueries({ queryKey: ["profile"] });
          qc.invalidateQueries({ queryKey: ["sites"] });
          toast$1.success(t("newsite.success"), {
            action: { label: t("newsite.open"), onClick: () => navigate(`/app/sites/${site.id}`) }
          });
          setGenerating(false);
          supabase.functions.invoke("seo-analyze", { body: { site_id: site.id } }).then(() => qc.invalidateQueries({ queryKey: ["site-seo", site.id] })).catch((e) => console.warn("seo-analyze failed", e));
        },
        onError: (msg, code) => {
          setGenerating(false);
          if (code === "aborted") return;
          if (code === "no_credits") {
            toast$1.error("Out of build credits", {
              description: "Top up to keep generating.",
              action: { label: "Buy credits", onClick: () => setTopUpOpen(true) }
            });
            setTopUpOpen(true);
            return;
          }
          if (code === "rate_limited") {
            toast$1.error("Rate limited", {
              description: "Too many requests. Wait a moment and try again."
            });
            return;
          }
          if (code === "stalled") {
            toast$1.error("Generation stalled", {
              description: "The AI took too long. Retry?",
              action: { label: "Retry", onClick: () => runGeneration(body) }
            });
            return;
          }
          toast$1.error(msg, {
            action: { label: "Retry", onClick: () => runGeneration(body) }
          });
        }
      },
      ctrl.signal
    );
  };
  const cancelGeneration = () => {
    var _a;
    (_a = abortRef.current) == null ? void 0 : _a.abort();
  };
  const generate = () => {
    if (!prompt2.trim()) return toast$1.error(t("newsite.describeFirst"));
    if (noCredits) {
      toast$1.error(t("newsite.outOfCredits"), {
        action: { label: t("newsite.buyCredits"), onClick: () => setTopUpOpen(true) }
      });
      setTopUpOpen(true);
      return;
    }
    runGeneration({ prompt: prompt2 });
  };
  const startTemplate = () => {
    if (!templateModal) return;
    if (!bizName.trim() || !bizCity.trim()) {
      toast$1.error("Business name and city required");
      return;
    }
    if (noCredits) {
      toast$1.error("Out of build credits", {
        action: { label: "Buy credits", onClick: () => setTopUpOpen(true) }
      });
      setTopUpOpen(true);
      return;
    }
    const replaced = JSON.parse(
      JSON.stringify(templateModal.draft).split("{{BUSINESS_NAME}}").join(bizName.trim()).split("{{CITY}}").join(bizCity.trim())
    );
    const tplPrompt = `${templateModal.industry}: ${bizName} in ${bizCity}. ${templateModal.description}`;
    setPrompt(tplPrompt);
    setTemplateModal(null);
    runGeneration({
      prompt: tplPrompt,
      template_draft: replaced,
      business_name: bizName.trim(),
      business_city: bizCity.trim()
    });
    setBizName("");
    setBizCity("");
  };
  const v = VIEWPORTS$1[viewport];
  const showChat = !!siteId && !!content;
  return /* @__PURE__ */ jsxs("div", { className: "grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[420px_1fr]", children: [
    showChat && /* @__PURE__ */ jsx("div", { className: "flex border-b bg-card lg:hidden", children: ["chat", "preview"].map((tab) => /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setMobileTab(tab),
        className: `flex-1 py-2 text-sm font-medium capitalize transition-colors ${mobileTab === tab ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`,
        children: tab
      },
      tab
    )) }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: `${showChat ? mobileTab === "chat" ? "flex" : "hidden lg:flex" : "flex"} flex-col gap-4 overflow-y-auto border-r bg-card ${showChat ? "p-0" : "p-6"}`,
        children: showChat && siteId && content ? /* @__PURE__ */ jsx(
          RefinementChat,
          {
            siteId,
            originalPrompt: generatedPrompt,
            onContentUpdated: setContent,
            onTopUp: () => setTopUpOpen(true)
          }
        ) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 p-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold", children: t("newsite.title") }),
              (profile == null ? void 0 : profile.brand_voice_active) && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary", children: "BRAND VOICE ON" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("newsite.hint") })
          ] }),
          noCredits && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "mt-0.5 h-4 w-4 shrink-0 text-destructive" }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground", children: t("newsite.outOfCredits") }),
              /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-muted-foreground", children: t("newsite.topup") }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  size: "sm",
                  variant: "default",
                  className: "mt-2 h-7 px-2 text-xs",
                  onClick: () => setTopUpOpen(true),
                  children: t("newsite.buyCredits")
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: prompt2,
              onChange: (e) => setPrompt(e.target.value),
              placeholder: t("newsite.placeholder"),
              className: "min-h-40 resize-none",
              maxLength: 4e3,
              disabled: generating
            }
          ),
          (listening || liveFinal || liveInterim) && /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-primary/30 bg-primary/5 p-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary", children: [
                listening && /* @__PURE__ */ jsxs("span", { className: "relative flex h-2 w-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" }),
                  /* @__PURE__ */ jsx("span", { className: "relative inline-flex h-2 w-2 rounded-full bg-primary" })
                ] }),
                listening ? t("newsite.recording") : t("newsite.transcriptReady")
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "h-7 px-2 text-xs", onClick: discardTranscript, type: "button", children: t("newsite.discard") }),
                /* @__PURE__ */ jsx(Button, { size: "sm", className: "h-7 px-2 text-xs", onClick: appendTranscript, disabled: !liveFinal.trim() && !liveInterim.trim(), type: "button", children: t("newsite.append") })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "min-h-[2.5rem] text-sm leading-relaxed", children: [
              /* @__PURE__ */ jsx("span", { className: "text-foreground", children: liveFinal }),
              liveInterim && /* @__PURE__ */ jsxs("span", { className: "italic text-muted-foreground", children: [
                " ",
                liveInterim
              ] }),
              !liveFinal && !liveInterim && /* @__PURE__ */ jsx("span", { className: "italic text-muted-foreground", children: t("newsite.startSpeaking") })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: generate,
                disabled: generating || !!noCredits || !prompt2.trim(),
                size: "lg",
                className: "flex-1",
                children: generating ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                  " ",
                  t("newsite.generating")
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Wand2, { className: "mr-2 h-4 w-4" }),
                  " ",
                  t("newsite.generate"),
                  /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs opacity-80", children: isUnlimited ? t("newsite.unlimited") : t("newsite.oneCredit") })
                ] })
              }
            ),
            !generating && /* @__PURE__ */ jsx(
              Button,
              {
                onClick: toggleDictation,
                size: "lg",
                variant: listening ? "destructive" : "outline",
                type: "button",
                title: !speechSupported ? "Voice input not supported in this browser" : listening ? "Stop recording" : "Dictate prompt",
                "aria-label": listening ? "Stop voice input" : "Start voice input",
                "aria-pressed": listening,
                children: listening ? /* @__PURE__ */ jsx(MicOff, { className: "h-4 w-4 animate-pulse" }) : /* @__PURE__ */ jsx(Mic, { className: "h-4 w-4" })
              }
            ),
            generating && /* @__PURE__ */ jsx(
              Button,
              {
                onClick: cancelGeneration,
                size: "lg",
                variant: "outline",
                type: "button",
                children: t("newsite.cancel")
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("p", { className: "mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: [
              /* @__PURE__ */ jsx(LayoutTemplate, { className: "h-3.5 w-3.5" }),
              "Or start from a template"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: TEMPLATES.map((t2) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setTemplateModal(t2),
                disabled: generating,
                className: "flex flex-col items-start rounded-md border bg-background p-3 text-left transition-colors hover:border-primary/50 disabled:opacity-50",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "text-lg", children: t2.emoji }),
                  /* @__PURE__ */ jsx("span", { className: "mt-1 text-xs font-semibold", children: t2.name }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: t2.industry })
                ]
              },
              t2.id
            )) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Need inspiration?" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: SAMPLES.map((s) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setPrompt(s),
                disabled: generating,
                className: "block w-full rounded-md border bg-background p-3 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground",
                children: s
              },
              s
            )) })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: `${showChat && mobileTab === "chat" ? "hidden lg:flex" : "flex"} min-w-0 flex-col bg-muted/30`, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b bg-card px-4 py-2", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 rounded-md border bg-background p-0.5", children: Object.keys(VIEWPORTS$1).map((k) => {
          const VP = VIEWPORTS$1[k];
          const active = viewport === k;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setViewport(k),
              className: `flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`,
              children: [
                /* @__PURE__ */ jsx(VP.icon, { className: "h-3.5 w-3.5" }),
                VP.label
              ]
            },
            k
          );
        }) }),
        content && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
          generating && /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 animate-spin" }),
          content.name
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-start justify-center overflow-y-auto p-6", children: [
        !content && !generating && /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10", children: /* @__PURE__ */ jsx(Sparkles, { className: "h-7 w-7 text-primary" }) }),
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: "Your generated site appears here" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Type a description, pick a template, then hit Generate." })
        ] }),
        generating && !content && /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "mb-3 h-8 w-8 animate-spin text-primary" }),
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: "Building your site…" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Streaming sections live." })
        ] }),
        content && /* @__PURE__ */ jsx(
          "div",
          {
            className: "overflow-hidden rounded-lg border bg-card shadow-elevated transition-all",
            style: { width: v.width, maxWidth: "100%" },
            children: /* @__PURE__ */ jsx(SitePreview, { content })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: !!templateModal, onOpenChange: (o) => !o && setTemplateModal(null), children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs(DialogTitle, { children: [
          templateModal == null ? void 0 : templateModal.emoji,
          " ",
          templateModal == null ? void 0 : templateModal.name,
          " template"
        ] }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "What's your business name and city? We'll personalize the copy and run it through AI." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "biz-name", children: "Business name" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "biz-name",
              value: bizName,
              onChange: (e) => setBizName(e.target.value),
              placeholder: "e.g. Atlas Coffee",
              autoFocus: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "biz-city", children: "City" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "biz-city",
              value: bizCity,
              onChange: (e) => setBizCity(e.target.value),
              placeholder: "e.g. Austin"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setTemplateModal(null), children: "Cancel" }),
        /* @__PURE__ */ jsxs(Button, { onClick: startTemplate, disabled: !bizName.trim() || !bizCity.trim(), children: [
          /* @__PURE__ */ jsx(Wand2, { className: "mr-2 h-4 w-4" }),
          "Generate (1 credit)"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(TopUpModal, { open: topUpOpen, onOpenChange: setTopUpOpen })
  ] });
}
const PUBLISH_ROOT = "builder.virtualengine.ai";
function getCustomerSubdomain(host = typeof window !== "undefined" ? window.location.hostname : "") {
  if (!host) return null;
  const h = host.toLowerCase();
  if (h === PUBLISH_ROOT) return null;
  if (h.endsWith(`.${PUBLISH_ROOT}`)) {
    const sub = h.slice(0, -1 - PUBLISH_ROOT.length);
    if (!sub || sub === "www") return null;
    return sub;
  }
  return null;
}
function ScoreRing$1({ score }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - score / 100 * c;
  const color = score >= 80 ? "hsl(var(--primary))" : score >= 50 ? "hsl(var(--accent))" : "hsl(var(--destructive))";
  return /* @__PURE__ */ jsxs("div", { className: "relative h-24 w-24", children: [
    /* @__PURE__ */ jsxs("svg", { className: "h-24 w-24 -rotate-90", viewBox: "0 0 88 88", children: [
      /* @__PURE__ */ jsx("circle", { cx: "44", cy: "44", r, fill: "none", stroke: "hsl(var(--muted))", strokeWidth: "8" }),
      /* @__PURE__ */ jsx(
        "circle",
        {
          cx: "44",
          cy: "44",
          r,
          fill: "none",
          stroke: color,
          strokeWidth: "8",
          strokeDasharray: c,
          strokeDashoffset: offset,
          strokeLinecap: "round",
          style: { transition: "stroke-dashoffset 600ms ease" }
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [
      /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold text-foreground", children: score }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "SEO" })
    ] })
  ] });
}
function SeoPanel({ siteId }) {
  const qc = useQueryClient();
  const [editTitle, setEditTitle] = useState(null);
  const [editDesc, setEditDesc] = useState(null);
  const { data: seo, isLoading } = useQuery({
    queryKey: ["site-seo", siteId],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_seo").select("*").eq("site_id", siteId).maybeSingle();
      if (error) throw error;
      return data;
    }
  });
  const optimize = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("seo-analyze", {
        body: { site_id: siteId }
      });
      if (error || (data == null ? void 0 : data.error)) throw new Error((error == null ? void 0 : error.message) || data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-seo", siteId] });
      toast$1.success("SEO refreshed");
    },
    onError: (e) => toast$1.error(e.message || "Failed")
  });
  const saveMeta = useMutation({
    mutationFn: async () => {
      const patch = {};
      if (editTitle !== null) patch.meta_title = editTitle;
      if (editDesc !== null) patch.meta_description = editDesc;
      const { error } = await supabase.from("site_seo").update(patch).eq("site_id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-seo", siteId] });
      setEditTitle(null);
      setEditDesc(null);
      toast$1.success("Saved");
    },
    onError: (e) => toast$1.error(e.message)
  });
  if (isLoading) {
    return /* @__PURE__ */ jsxs("div", { className: "flex h-40 items-center justify-center text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
      " Loading SEO…"
    ] });
  }
  if (!seo) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-3 rounded-lg border bg-card p-6 text-center", children: [
      /* @__PURE__ */ jsx(Search, { className: "mx-auto h-8 w-8 text-muted-foreground" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No SEO analysis yet." }),
      /* @__PURE__ */ jsxs(Button, { onClick: () => optimize.mutate(), disabled: optimize.isPending, children: [
        optimize.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
        "Analyze with Search Atlas"
      ] })
    ] });
  }
  const title = editTitle ?? seo.meta_title ?? "";
  const desc = editDesc ?? seo.meta_description ?? "";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-lg border bg-card p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(ScoreRing$1, { score: seo.score }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "SEO Score" }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            seo.industry,
            " ",
            seo.location && `· ${seo.location}`
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-[10px] uppercase tracking-wider text-muted-foreground", children: [
            "Source: ",
            seo.source.replace("_", " ")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: () => optimize.mutate(), disabled: optimize.isPending, children: [
        optimize.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
        "Optimize for SEO"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs("h3", { className: "flex items-center gap-2 text-sm font-semibold", children: [
        /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4 text-primary" }),
        " Meta tags"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 rounded-lg border bg-card p-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "text-xs font-medium text-muted-foreground", children: [
            "Meta title (",
            title.length,
            "/60)"
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: title,
              maxLength: 70,
              onChange: (e) => setEditTitle(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "text-xs font-medium text-muted-foreground", children: [
            "Meta description (",
            desc.length,
            "/160)"
          ] }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: desc,
              maxLength: 180,
              rows: 3,
              onChange: (e) => setEditDesc(e.target.value)
            }
          )
        ] }),
        (editTitle !== null || editDesc !== null) && /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => {
            setEditTitle(null);
            setEditDesc(null);
          }, children: "Cancel" }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: () => saveMeta.mutate(), disabled: saveMeta.isPending, children: [
            saveMeta.isPending && /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-3 w-3 animate-spin" }),
            "Save"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs("h3", { className: "flex items-center gap-2 text-sm font-semibold", children: [
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-primary" }),
        " Target keywords"
      ] }),
      seo.keywords.length === 0 ? /* @__PURE__ */ jsx("p", { className: "rounded-lg border bg-card p-4 text-xs text-muted-foreground", children: "No keywords returned from Search Atlas yet. Click Optimize to retry." }) : /* @__PURE__ */ jsx("ul", { className: "divide-y rounded-lg border bg-card", children: seo.keywords.map((k, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between px-4 py-2 text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: k.keyword }),
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            k.volume.toLocaleString(),
            "/mo"
          ] }),
          k.difficulty !== void 0 && /* @__PURE__ */ jsxs("span", { className: "rounded bg-muted px-1.5 py-0.5", children: [
            "KD ",
            k.difficulty
          ] })
        ] })
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs("h3", { className: "flex items-center gap-2 text-sm font-semibold", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-primary" }),
        " Blog topics to rank for"
      ] }),
      seo.blog_topics.length === 0 ? /* @__PURE__ */ jsx("p", { className: "rounded-lg border bg-card p-4 text-xs text-muted-foreground", children: "No suggestions yet." }) : /* @__PURE__ */ jsx("ol", { className: "space-y-1.5 rounded-lg border bg-card p-4 text-sm", children: seo.blog_topics.map((t, i) => /* @__PURE__ */ jsxs("li", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
          i + 1,
          "."
        ] }),
        /* @__PURE__ */ jsx("span", { children: t })
      ] }, i)) })
    ] })
  ] });
}
const VIEWPORTS = {
  desktop: { width: "100%", icon: Monitor, label: "Desktop" },
  tablet: { width: "768px", icon: Tablet, label: "Tablet" },
  mobile: { width: "390px", icon: Smartphone, label: "Mobile" }
};
function SiteDetail() {
  var _a, _b, _c;
  const { id } = useParams();
  const [viewport, setViewport] = useState("desktop");
  const [copied, setCopied] = useState(false);
  const [rewriteIdx, setRewriteIdx] = useState(null);
  const [variations, setVariations] = useState([]);
  const [rewriting, setRewriting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [repoUrl, setRepoUrl] = useState(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [subdomainInput, setSubdomainInput] = useState("");
  const [publishError, setPublishError] = useState(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState("preview");
  const [rightPane, setRightPane] = useState("preview");
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: ghIntegration } = useQuery({
    queryKey: ["integration", "github-for-push"],
    queryFn: async () => {
      const { data } = await supabase.from("integrations").select("metadata").eq("platform", "github").maybeSingle();
      return data;
    }
  });
  const ghConnected = !!ghIntegration;
  const existingRepoUrl = ((_c = (_b = (_a = ghIntegration == null ? void 0 : ghIntegration.metadata) == null ? void 0 : _a.sites) == null ? void 0 : _b[id ?? ""]) == null ? void 0 : _c.html_url) ?? null;
  const effectiveRepoUrl = repoUrl ?? existingRepoUrl;
  const { data: site, isLoading } = useQuery({
    queryKey: ["site", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("sites").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    }
  });
  const shareToggle = useMutation({
    mutationFn: async (next) => {
      const { error } = await supabase.from("sites").update({ is_shared: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site", id] })
  });
  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sites"] });
      navigate("/app");
      toast$1.success("Site deleted");
    }
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex h-[calc(100vh-3.5rem)] items-center justify-center text-muted-foreground", children: "Loading…" });
  }
  if (!site) {
    return /* @__PURE__ */ jsx("div", { className: "container py-10", children: /* @__PURE__ */ jsx("p", { children: "Site not found." }) });
  }
  const content = site.content;
  const v = VIEWPORTS[viewport];
  const shareUrl = site.is_shared ? `${window.location.origin}/share/${site.share_token}` : null;
  const liveUrl = site.published && site.subdomain ? `https://${site.subdomain}.${PUBLISH_ROOT}` : null;
  const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 63);
  const openPublish = () => {
    setPublishError(null);
    setSubdomainInput(site.subdomain || slugify(site.name || "my-site"));
    setPublishOpen(true);
  };
  const submitPublish = async () => {
    setPublishing(true);
    setPublishError(null);
    const { data, error } = await supabase.functions.invoke("publish-site", {
      body: { site_id: id, subdomain: subdomainInput }
    });
    setPublishing(false);
    const errMsg = (error == null ? void 0 : error.message) || (data == null ? void 0 : data.error);
    if (errMsg) {
      setPublishError(errMsg);
      return;
    }
    qc.invalidateQueries({ queryKey: ["site", id] });
    toast$1.success("Site published!", {
      description: data.url,
      action: { label: "Open", onClick: () => window.open(data.url, "_blank") }
    });
    setPublishOpen(false);
  };
  const unpublish = async () => {
    if (!confirm("Take this site offline?")) return;
    const { error } = await supabase.functions.invoke("publish-site", {
      body: { site_id: id, action: "unpublish" }
    });
    if (error) {
      toast$1.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["site", id] });
    toast$1.success("Site unpublished");
  };
  const copyShare = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast$1.success("Link copied");
    setTimeout(() => setCopied(false), 1500);
  };
  const openRewrite = async (idx) => {
    setRewriteIdx(idx);
    setVariations([]);
    setRewriting(true);
    const { data, error } = await supabase.functions.invoke("rewrite-section", {
      body: {
        section: content.sections[idx],
        business_context: `${content.name} — ${content.tagline}. Original prompt: ${site.prompt}`
      }
    });
    setRewriting(false);
    if (error || (data == null ? void 0 : data.error)) {
      toast$1.error((error == null ? void 0 : error.message) || (data == null ? void 0 : data.error) || "Rewrite failed");
      setRewriteIdx(null);
      return;
    }
    setVariations(data.variations || []);
  };
  const pushToGithub = async () => {
    if (!ghConnected) {
      toast$1.error("Connect GitHub first", {
        description: "Open Integrations to connect your GitHub account.",
        action: { label: "Open", onClick: () => navigate("/app/integrations") }
      });
      return;
    }
    setPushing(true);
    const { data, error } = await supabase.functions.invoke("github-push", {
      body: { site_id: id }
    });
    setPushing(false);
    if (error || (data == null ? void 0 : data.error)) {
      toast$1.error("Push failed", { description: (error == null ? void 0 : error.message) || (data == null ? void 0 : data.error) });
      return;
    }
    const url = data.html_url;
    setRepoUrl(url);
    qc.invalidateQueries({ queryKey: ["integration", "github-for-push"] });
    toast$1.success("Pushed to GitHub", {
      description: url,
      action: { label: "Open repo", onClick: () => window.open(url, "_blank") }
    });
  };
  const applyVariation = async (variation) => {
    if (rewriteIdx === null) return;
    const next = JSON.parse(JSON.stringify(content));
    next.sections[rewriteIdx] = { ...next.sections[rewriteIdx], ...variation };
    const { error } = await supabase.from("sites").update({ content: next }).eq("id", id);
    if (error) {
      toast$1.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["site", id] });
    toast$1.success("Section updated");
    setRewriteIdx(null);
    setVariations([]);
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex h-[calc(100vh-3.5rem)] flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b bg-card px-4 py-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "ghost", size: "sm", children: /* @__PURE__ */ jsxs(Link, { to: "/app", children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-1 h-4 w-4" }),
          " Back"
        ] }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-sm font-semibold", children: site.name }),
          /* @__PURE__ */ jsx("p", { className: "line-clamp-1 text-xs text-muted-foreground", children: site.prompt })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 rounded-md border bg-background p-0.5", children: Object.keys(VIEWPORTS).map((k) => {
          const VP = VIEWPORTS[k];
          const active = viewport === k;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setViewport(k),
              className: `flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`,
              children: [
                /* @__PURE__ */ jsx(VP.icon, { className: "h-3.5 w-3.5" }),
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: VP.label })
              ]
            },
            k
          );
        }) }),
        shareUrl ? /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: copyShare, children: [
          copied ? /* @__PURE__ */ jsx(Check, { className: "mr-1 h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(Copy, { className: "mr-1 h-3.5 w-3.5" }),
          "Copy share link"
        ] }) : /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => shareToggle.mutate(true), children: [
          /* @__PURE__ */ jsx(Share2, { className: "mr-1 h-3.5 w-3.5" }),
          " Share preview"
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: pushToGithub, disabled: pushing, children: [
          pushing ? /* @__PURE__ */ jsx(Loader2, { className: "mr-1 h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Github, { className: "mr-1 h-3.5 w-3.5" }),
          effectiveRepoUrl ? "Push update" : "Push to GitHub"
        ] }),
        effectiveRepoUrl && /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", asChild: true, children: /* @__PURE__ */ jsx("a", { href: effectiveRepoUrl, target: "_blank", rel: "noreferrer", title: "Open GitHub repo", children: /* @__PURE__ */ jsx(ExternalLink, { className: "h-3.5 w-3.5" }) }) }),
        liveUrl ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxs("a", { href: liveUrl, target: "_blank", rel: "noreferrer", children: [
            /* @__PURE__ */ jsx(Globe, { className: "mr-1 h-3.5 w-3.5" }),
            " ",
            site.subdomain,
            ".",
            PUBLISH_ROOT
          ] }) }),
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: openPublish, title: "Republish / change subdomain", children: /* @__PURE__ */ jsx(Rocket, { className: "h-3.5 w-3.5" }) })
        ] }) : /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: openPublish, children: [
          /* @__PURE__ */ jsx(Rocket, { className: "mr-1 h-3.5 w-3.5" }),
          " Publish"
        ] }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => {
          if (confirm("Delete this site?")) remove.mutate();
        }, children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex border-b bg-card lg:hidden", children: ["chat", "preview", "seo"].map((tab) => /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setMobileTab(tab),
        className: `flex-1 py-2 text-sm font-medium uppercase transition-colors ${mobileTab === tab ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`,
        children: tab
      },
      tab
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[360px_1fr]", children: [
      /* @__PURE__ */ jsxs("aside", { className: `${mobileTab === "chat" ? "flex" : "hidden lg:flex"} flex-col overflow-hidden border-r`, children: [
        /* @__PURE__ */ jsx(
          RefinementChat,
          {
            siteId: id,
            originalPrompt: site.prompt,
            onContentUpdated: () => qc.invalidateQueries({ queryKey: ["site", id] }),
            onTopUp: () => setTopUpOpen(true)
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "border-t bg-card p-2", children: [
          /* @__PURE__ */ jsx("p", { className: "mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: "Quick rewrite (free)" }),
          /* @__PURE__ */ jsx("ul", { className: "max-h-40 space-y-0.5 overflow-y-auto", children: content.sections.map((s, i) => /* @__PURE__ */ jsxs("li", { className: "group flex items-center justify-between rounded p-1.5 text-xs hover:bg-muted", children: [
            /* @__PURE__ */ jsxs("span", { className: "truncate", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[9px] uppercase text-muted-foreground", children: s.type }),
              " · ",
              s.heading
            ] }),
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "h-6 w-6 p-0", onClick: () => openRewrite(i), children: /* @__PURE__ */ jsx(Wand2, { className: "h-3 w-3" }) })
          ] }, i)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `${mobileTab === "chat" ? "hidden lg:flex" : "flex"} flex-1 flex-col overflow-hidden bg-muted/30`, children: [
        /* @__PURE__ */ jsx("div", { className: "hidden border-b bg-card px-3 py-1.5 lg:flex", children: /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 rounded-md border bg-background p-0.5", children: ["preview", "seo"].map((p) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setRightPane(p),
            className: `flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium uppercase transition-colors ${rightPane === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`,
            children: [
              p === "seo" && /* @__PURE__ */ jsx(Search, { className: "h-3 w-3" }),
              p
            ]
          },
          p
        )) }) }),
        mobileTab === "seo" || rightPane === "seo" ? /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsx(SeoPanel, { siteId: id }) }) : /* @__PURE__ */ jsx("div", { className: "flex flex-1 items-start justify-center overflow-y-auto p-6", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: "overflow-hidden rounded-lg border bg-card shadow-elevated transition-all",
            style: { width: v.width, maxWidth: "100%" },
            children: /* @__PURE__ */ jsx(SitePreview, { content })
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(TopUpModal, { open: topUpOpen, onOpenChange: setTopUpOpen }),
    /* @__PURE__ */ jsx(Dialog, { open: rewriteIdx !== null, onOpenChange: (o) => !o && setRewriteIdx(null), children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-4xl", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Rewrite copy — pick a variation" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Free refinement. Click one to apply it to your site." })
      ] }),
      rewriting ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-12", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "mb-3 h-8 w-8 animate-spin text-primary" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Generating 3 variations…" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-3", children: variations.map((v2, i) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => applyVariation(v2),
          className: "rounded-lg border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md",
          children: [
            /* @__PURE__ */ jsxs("p", { className: "mb-1 text-[10px] font-semibold uppercase text-muted-foreground", children: [
              "Variation ",
              i + 1
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "font-semibold leading-tight", children: v2.heading }),
            v2.subheading && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: v2.subheading }),
            v2.cta && /* @__PURE__ */ jsx("p", { className: "mt-2 inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary", children: v2.cta }),
            v2.items && v2.items.length > 0 && /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-1.5 text-xs", children: v2.items.slice(0, 3).map((it, j) => /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: it.title }),
              it.body && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                " — ",
                it.body
              ] })
            ] }, j)) })
          ]
        },
        i
      )) })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: publishOpen, onOpenChange: (o) => !o && setPublishOpen(false), children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: liveUrl ? "Republish site" : "Publish your site" }),
        /* @__PURE__ */ jsxs(DialogDescription, { children: [
          "Choose a subdomain. Your site will go live at",
          " ",
          /* @__PURE__ */ jsxs("code", { className: "text-foreground", children: [
            "your-name.",
            PUBLISH_ROOT
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center overflow-hidden rounded-md border bg-background", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              value: subdomainInput,
              onChange: (e) => {
                setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                setPublishError(null);
              },
              placeholder: "my-site",
              className: "border-0 focus-visible:ring-0",
              maxLength: 63,
              autoFocus: true
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "whitespace-nowrap border-l bg-muted px-3 py-2 text-sm text-muted-foreground", children: [
            ".",
            PUBLISH_ROOT
          ] })
        ] }),
        publishError && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: publishError }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Lowercase letters, numbers, and hyphens. 3–63 characters." }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between gap-2 pt-2", children: [
          liveUrl ? /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: unpublish, children: "Unpublish" }) : /* @__PURE__ */ jsx("span", {}),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setPublishOpen(false), disabled: publishing, children: "Cancel" }),
            /* @__PURE__ */ jsxs(Button, { onClick: submitPublish, disabled: publishing || !subdomainInput, children: [
              publishing && /* @__PURE__ */ jsx(Loader2, { className: "mr-1 h-3.5 w-3.5 animate-spin" }),
              liveUrl ? "Update" : "Publish"
            ] })
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
const Card = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("rounded-lg border bg-card text-card-foreground shadow-sm", className), ...props }));
Card.displayName = "Card";
const CardHeader = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex flex-col space-y-1.5 p-6", className), ...props })
);
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("h3", { ref, className: cn("text-2xl font-semibold leading-none tracking-tight", className), ...props })
);
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("p", { ref, className: cn("text-sm text-muted-foreground", className), ...props })
);
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("p-6 pt-0", className), ...props })
);
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex items-center p-6 pt-0", className), ...props })
);
CardFooter.displayName = "CardFooter";
function AccessCodeRedeem() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const redeem = async () => {
    if (!code.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("redeem_access_code", { _code: code.trim() });
    setLoading(false);
    if (error) return toast$1.error(error.message);
    const res = data;
    if (!(res == null ? void 0 : res.ok)) return toast$1.error((res == null ? void 0 : res.error) || "Could not redeem");
    toast$1.success(`Code applied · plan ${res.plan} +${res.credits} credits`);
    setCode("");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };
  return /* @__PURE__ */ jsxs(Card, { className: "border-cta/30 bg-cta/5 p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center gap-2 text-sm font-semibold text-cta", children: [
      /* @__PURE__ */ jsx(KeyRound, { className: "h-4 w-4" }),
      " Have an access code?"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx(Input, { value: code, onChange: (e) => setCode(e.target.value.toUpperCase()), placeholder: "VEB-XXXXXX" }),
      /* @__PURE__ */ jsx(Button, { onClick: redeem, disabled: loading, children: "Redeem" })
    ] })
  ] });
}
function Billing() {
  const { t } = useI18n();
  const { data: profile, refetch } = useProfile();
  const [topupOpen, setTopupOpen] = useState(false);
  const [interval, setInterval2] = useState("monthly");
  const [busyTier, setBusyTier] = useState(null);
  const [setupBusy, setSetupBusy] = useState(false);
  const [webhookBusy, setWebhookBusy] = useState(false);
  const [webhookResult, setWebhookResult] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast$1.success("Payment successful", { description: "Your credits/plan have been updated." });
      refetch();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("checkout") === "cancelled") {
      toast$1.info("Checkout cancelled");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refetch]);
  if (!profile) return null;
  const upgrade = async (tier) => {
    setBusyTier(tier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          kind: "subscription",
          planTier: tier,
          interval,
          returnUrl: window.location.origin
        }
      });
      if (error) throw error;
      if (data == null ? void 0 : data.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned");
    } catch (err) {
      toast$1.error("Checkout failed", {
        description: (err == null ? void 0 : err.message) ?? "Make sure Stripe products are set up first."
      });
      setBusyTier(null);
    }
  };
  const setupProducts = async () => {
    var _a;
    setSetupBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-stripe-products");
      if (error) throw error;
      toast$1.success("Stripe products ready", {
        description: `Created ${((_a = data == null ? void 0 : data.created) == null ? void 0 : _a.length) ?? 0} new products.`
      });
    } catch (err) {
      toast$1.error("Setup failed", { description: err == null ? void 0 : err.message });
    } finally {
      setSetupBusy(false);
    }
  };
  const setupWebhook = async () => {
    setWebhookBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-stripe-webhook");
      if (error) throw error;
      setWebhookResult({
        secret: data == null ? void 0 : data.webhookSecret,
        url: data == null ? void 0 : data.url,
        alreadyExists: data == null ? void 0 : data.alreadyExists,
        message: data == null ? void 0 : data.message
      });
    } catch (err) {
      toast$1.error("Webhook setup failed", { description: err == null ? void 0 : err.message });
    } finally {
      setWebhookBusy(false);
    }
  };
  const annualPrice = (monthly) => Math.round(monthly * 0.8);
  return /* @__PURE__ */ jsxs("div", { className: "container max-w-5xl py-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", children: t("billing.title") }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: t("billing.subtitle") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: setupWebhook, disabled: webhookBusy, children: [
          webhookBusy ? /* @__PURE__ */ jsx(Loader2, { className: "mr-1 h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Webhook, { className: "mr-1 h-3.5 w-3.5" }),
          "Create Stripe webhook"
        ] }),
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: setupProducts, disabled: setupBusy, children: [
          setupBusy ? /* @__PURE__ */ jsx(Loader2, { className: "mr-1 h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Settings$1, { className: "mr-1 h-3.5 w-3.5" }),
          "Sync Stripe products"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(AccessCodeRedeem, {}) }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 rounded-lg border bg-card p-6 shadow-card", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("billing.current") }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold", children: PLAN_LIMITS$1[profile.plan].label }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("billing.totalCredits", { n: profile.build_credits + profile.rollover_build_credits + profile.top_up_build_credits }) }),
        profile.top_up_build_credits > 0 && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
          "Includes ",
          profile.top_up_build_credits,
          " top-up credits"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: () => setTopupOpen(true), variant: "outline", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "mr-1 h-4 w-4" }),
        " ",
        t("billing.buyCredits")
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-10 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold", children: t("billing.plans") }),
      /* @__PURE__ */ jsxs("div", { className: "inline-flex rounded-md border bg-card p-1 text-xs", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setInterval2("monthly"),
            className: `rounded px-3 py-1.5 font-medium transition-colors ${interval === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`,
            children: t("billing.monthly")
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setInterval2("annual"),
            className: `rounded px-3 py-1.5 font-medium transition-colors ${interval === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`,
            children: [
              t("billing.annual"),
              " ",
              /* @__PURE__ */ jsx("span", { className: "ml-1 opacity-70", children: "−20%" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: Object.keys(PLAN_LIMITS$1).map((key) => {
      const p = PLAN_LIMITS$1[key];
      const current = profile.plan === key;
      const price = interval === "annual" && p.price > 0 ? annualPrice(p.price) : p.price;
      return /* @__PURE__ */ jsxs("div", { className: `rounded-lg border bg-card p-5 ${current ? "border-primary" : ""}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: p.label }),
          current && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary", children: t("billing.current_chip") })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-2xl font-bold", children: [
          "$",
          price,
          p.price > 0 && /* @__PURE__ */ jsx("span", { className: "text-sm font-normal text-muted-foreground", children: "/mo" })
        ] }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-3 space-y-1 text-sm", children: [
          /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-primary" }),
            p.build,
            " build credits/mo"
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-primary" }),
            p.runtime.toLocaleString(),
            " runtime credits"
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            className: "mt-4 w-full",
            variant: current ? "outline" : "default",
            disabled: current || busyTier !== null || key === "free",
            onClick: () => upgrade(key),
            children: [
              busyTier === key ? /* @__PURE__ */ jsx(Loader2, { className: "mr-1 h-4 w-4 animate-spin" }) : null,
              current ? t("billing.currentBtn") : key === "free" ? t("billing.free") : t("billing.upgrade")
            ]
          }
        )
      ] }, key);
    }) }),
    /* @__PURE__ */ jsx(GlobalCurrencyNote, {}),
    /* @__PURE__ */ jsxs("p", { className: "mt-6 text-center text-xs text-muted-foreground", children: [
      "First-time setup: click ",
      /* @__PURE__ */ jsx("strong", { children: "Sync Stripe products" }),
      " above to create all plans & packs in your Stripe account. After that, configure the webhook endpoint in Stripe pointing at ",
      /* @__PURE__ */ jsx("code", { className: "rounded bg-muted px-1", children: "/functions/v1/stripe-webhook" }),
      " ",
      "and paste the signing secret as ",
      /* @__PURE__ */ jsx("code", { className: "rounded bg-muted px-1", children: "STRIPE_WEBHOOK_SECRET" }),
      ".",
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsx(Link, { to: "/app", className: "underline", children: "Back to dashboard" })
    ] }),
    /* @__PURE__ */ jsx(TopUpModal, { open: topupOpen, onOpenChange: setTopupOpen }),
    /* @__PURE__ */ jsx(Dialog, { open: !!webhookResult, onOpenChange: (o) => !o && setWebhookResult(null), children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs(DialogTitle, { children: [
          "Stripe webhook ",
          (webhookResult == null ? void 0 : webhookResult.alreadyExists) ? "already exists" : "created"
        ] }),
        /* @__PURE__ */ jsx(DialogDescription, { children: (webhookResult == null ? void 0 : webhookResult.alreadyExists) ? webhookResult == null ? void 0 : webhookResult.message : "Copy the signing secret below and save it as STRIPE_WEBHOOK_SECRET in your project secrets. Stripe only shows this once." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase text-muted-foreground", children: "Endpoint URL" }),
          /* @__PURE__ */ jsx("code", { className: "mt-1 block break-all rounded bg-muted px-2 py-1 text-xs", children: webhookResult == null ? void 0 : webhookResult.url })
        ] }),
        (webhookResult == null ? void 0 : webhookResult.secret) && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase text-muted-foreground", children: "Signing secret" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("code", { className: "flex-1 break-all rounded bg-muted px-2 py-1 text-xs", children: webhookResult.secret }),
            /* @__PURE__ */ jsx(
              Button,
              {
                size: "sm",
                variant: "outline",
                onClick: () => {
                  navigator.clipboard.writeText(webhookResult.secret);
                  toast$1.success("Copied");
                },
                children: /* @__PURE__ */ jsx(Copy, { className: "h-3.5 w-3.5" })
              }
            )
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
const FX = [
  { code: "USD", symbol: "$", flag: "🇺🇸", rate: 1, name: "US Dollar" },
  { code: "EUR", symbol: "€", flag: "🇪🇺", rate: 0.92, name: "Euro" },
  { code: "GBP", symbol: "£", flag: "🇬🇧", rate: 0.79, name: "British Pound" },
  { code: "BRL", symbol: "R$", flag: "🇧🇷", rate: 5.1, name: "Brazilian Real" },
  { code: "MXN", symbol: "$", flag: "🇲🇽", rate: 17.5, name: "Mexican Peso" },
  { code: "INR", symbol: "₹", flag: "🇮🇳", rate: 83.5, name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", flag: "🇯🇵", rate: 150, name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", flag: "🇦🇺", rate: 1.52, name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", flag: "🇨🇦", rate: 1.36, name: "Canadian Dollar" }
];
function GlobalCurrencyNote() {
  const [country, setCountry] = useState("USD");
  const fx = FX.find((f) => f.code === country);
  const sample = (usd) => {
    const v = usd * fx.rate;
    if (fx.code === "JPY") return `${fx.symbol}${Math.round(v).toLocaleString()}`;
    return `${fx.symbol}${v.toFixed(2)}`;
  };
  return /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-lg border bg-muted/30 p-5 text-sm", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-start justify-between gap-3 md:flex-row md:items-center", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: "🌍 Global pricing" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Prices shown in USD. Your card will be charged in USD. Stripe handles currency conversion automatically for all countries." })
      ] }),
      /* @__PURE__ */ jsx(
        "select",
        {
          value: country,
          onChange: (e) => setCountry(e.target.value),
          className: "rounded-md border bg-background px-2 py-1.5 text-xs",
          "aria-label": "Show approximate prices in",
          children: FX.map((f) => /* @__PURE__ */ jsxs("option", { value: f.code, children: [
            f.flag,
            " ",
            f.code,
            " — ",
            f.name
          ] }, f.code))
        }
      )
    ] }),
    country !== "USD" && /* @__PURE__ */ jsx("div", { className: "mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-5", children: [
      { label: "Starter", usd: 19 },
      { label: "Builder", usd: 49 },
      { label: "Pro", usd: 99 },
      { label: "Agency", usd: 199 },
      { label: "Top-up Starter", usd: 9 }
    ].map((p) => /* @__PURE__ */ jsxs("div", { className: "rounded border bg-card px-2 py-1.5", children: [
      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: p.label }),
      /* @__PURE__ */ jsxs("div", { className: "font-semibold", children: [
        "≈ ",
        sample(p.usd)
      ] })
    ] }, p.label)) }),
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-[11px] text-muted-foreground", children: "Approximate prices for reference. Final charge in USD." })
  ] });
}
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  SelectPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs(
  SelectPrimitive.Content,
  {
    ref,
    className: cn(
      "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ jsx(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsx(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsx(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
const SelectLabel = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Label, { ref, className: cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className), ...props }));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Separator, { ref, className: cn("-mx-1 my-1 h-px bg-muted", className), ...props }));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
function Integrations() {
  var _a;
  const { user } = useAuth();
  const { toast: toast2 } = useToast();
  const qc = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const [pipelines, setPipelines] = useState(null);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const { data: integration, isLoading } = useQuery({
    queryKey: ["integration", "gohighlevel", user == null ? void 0 : user.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("integrations").select("*").eq("user_id", user.id).eq("platform", "gohighlevel").maybeSingle();
      if (error) throw error;
      return data;
    }
  });
  const { data: githubIntegration } = useQuery({
    queryKey: ["integration", "github", user == null ? void 0 : user.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("integrations").select("*").eq("user_id", user.id).eq("platform", "github").maybeSingle();
      if (error) throw error;
      return data;
    }
  });
  const ghConnected = !!(githubIntegration == null ? void 0 : githubIntegration.access_token);
  const ghLogin = ((_a = githubIntegration == null ? void 0 : githubIntegration.metadata) == null ? void 0 : _a.login) ?? null;
  const [ghConnecting, setGhConnecting] = useState(false);
  const connected = !!(integration == null ? void 0 : integration.access_token);
  useEffect(() => {
    const onFocus = () => {
      qc.invalidateQueries({ queryKey: ["integration", "gohighlevel", user == null ? void 0 : user.id] });
      qc.invalidateQueries({ queryKey: ["integration", "github", user == null ? void 0 : user.id] });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [qc, user == null ? void 0 : user.id]);
  useEffect(() => {
    if (!connected) {
      setPipelines(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingPipelines(true);
      const { data, error } = await supabase.functions.invoke("ghl-list-pipelines");
      if (cancelled) return;
      setLoadingPipelines(false);
      if (error) {
        toast2({ title: "Could not load pipelines", description: error.message, variant: "destructive" });
        return;
      }
      setPipelines((data == null ? void 0 : data.pipelines) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [connected, toast2]);
  const handleConnect = async () => {
    setConnecting(true);
    const { data, error } = await supabase.functions.invoke("ghl-oauth-start");
    setConnecting(false);
    if (error || !(data == null ? void 0 : data.url)) {
      toast2({ title: "Could not start connection", description: (error == null ? void 0 : error.message) ?? "Unknown error", variant: "destructive" });
      return;
    }
    window.open(data.url, "_blank", "width=600,height=750");
  };
  const handleDisconnect = async () => {
    if (!integration) return;
    const { error } = await supabase.from("integrations").delete().eq("id", integration.id);
    if (error) {
      toast2({ title: "Disconnect failed", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["integration", "gohighlevel", user == null ? void 0 : user.id] });
    toast2({ title: "Disconnected", description: "GoHighLevel has been removed." });
  };
  const handlePipelineChange = async (pipelineId) => {
    if (!integration) return;
    const { error } = await supabase.from("integrations").update({ pipeline_id: pipelineId }).eq("id", integration.id);
    if (error) {
      toast2({ title: "Could not save pipeline", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["integration", "gohighlevel", user == null ? void 0 : user.id] });
    toast2({ title: "Pipeline updated" });
  };
  const handleGithubConnect = async () => {
    setGhConnecting(true);
    const { data, error } = await supabase.functions.invoke("github-oauth-start");
    setGhConnecting(false);
    if (error || !(data == null ? void 0 : data.url)) {
      toast2({ title: "Could not start GitHub connection", description: (error == null ? void 0 : error.message) ?? "Unknown error", variant: "destructive" });
      return;
    }
    window.open(data.url, "_blank", "width=720,height=820");
  };
  const handleGithubDisconnect = async () => {
    if (!githubIntegration) return;
    const { error } = await supabase.from("integrations").delete().eq("id", githubIntegration.id);
    if (error) {
      toast2({ title: "Disconnect failed", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["integration", "github", user == null ? void 0 : user.id] });
    toast2({ title: "Disconnected", description: "GitHub has been removed." });
  };
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl p-6 md:p-10", children: [
    /* @__PURE__ */ jsxs("header", { className: "mb-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: "Integrations" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: "Connect external services so your sites can deliver leads where you work." })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            "GoHighLevel",
            connected && /* @__PURE__ */ jsxs(Badge, { className: "bg-green-500/15 text-green-500 hover:bg-green-500/20", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-1 h-3 w-3" }),
              " Connected"
            ] })
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Send form submissions from your published sites straight into a GHL pipeline as new contacts." })
        ] }),
        !isLoading && (connected ? /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: handleDisconnect, children: [
          /* @__PURE__ */ jsx(Unplug, { className: "mr-2 h-4 w-4" }),
          " Disconnect"
        ] }) : /* @__PURE__ */ jsxs(Button, { onClick: handleConnect, disabled: connecting, children: [
          connecting ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Plug, { className: "mr-2 h-4 w-4" }),
          "Connect GoHighLevel"
        ] }))
      ] }),
      connected && /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-muted/30 p-4 text-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "Connected location" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono", children: (integration == null ? void 0 : integration.location_id) ?? "—" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Pipeline for new contacts" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: (integration == null ? void 0 : integration.pipeline_id) ?? void 0,
              onValueChange: handlePipelineChange,
              disabled: loadingPipelines || !(pipelines == null ? void 0 : pipelines.length),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full md:w-[420px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: loadingPipelines ? "Loading pipelines…" : "Select a pipeline" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: pipelines == null ? void 0 : pipelines.map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p.id, children: p.name }, p.id)) })
              ]
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Each new form submission becomes a contact, and an opportunity will be created in the first stage of this pipeline." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-4 text-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-2 font-medium", children: "Webhook endpoint" }),
          /* @__PURE__ */ jsxs("div", { className: "font-mono text-xs text-muted-foreground break-all", children: [
            "https://idnyrmdhdfyxdrvyjirj.supabase.co",
            "/functions/v1/form-submission-webhook"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-muted-foreground", children: [
            "Generated sites POST ",
            /* @__PURE__ */ jsx("code", { children: `{ site_id, fields }` }),
            " here. Each delivered lead deducts 1 runtime credit."
          ] }),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "https://highlevel.stoplight.io/docs/integrations/0443d7d1a4bd0-overview",
              target: "_blank",
              rel: "noreferrer",
              className: "mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline",
              children: [
                "GHL API v2 docs ",
                /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" })
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "mt-6", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Github, { className: "h-5 w-5" }),
            " GitHub",
            ghConnected && /* @__PURE__ */ jsxs(Badge, { className: "bg-green-500/15 text-green-500 hover:bg-green-500/20", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-1 h-3 w-3" }),
              " Connected",
              ghLogin ? ` as @${ghLogin}` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Push any site's generated HTML, CSS and source JSON to a GitHub repo. New repos default to private." })
        ] }),
        ghConnected ? /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: handleGithubDisconnect, children: [
          /* @__PURE__ */ jsx(Unplug, { className: "mr-2 h-4 w-4" }),
          " Disconnect"
        ] }) : /* @__PURE__ */ jsxs(Button, { onClick: handleGithubConnect, disabled: ghConnecting, children: [
          ghConnecting ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Github, { className: "mr-2 h-4 w-4" }),
          "Connect GitHub"
        ] })
      ] }),
      ghConnected && /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "Open any site in your dashboard and click ",
        /* @__PURE__ */ jsx("strong", { children: "Push to GitHub" }),
        " to create or update its repo. Each push commits ",
        /* @__PURE__ */ jsx("code", { children: "index.html" }),
        ", ",
        /* @__PURE__ */ jsx("code", { children: "styles.css" }),
        ", ",
        /* @__PURE__ */ jsx("code", { children: "site.json" }),
        " and a README."
      ] }) })
    ] })
  ] });
}
const Switch = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SwitchPrimitives.Root,
  {
    className: cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ jsx(
      SwitchPrimitives.Thumb,
      {
        className: cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = SwitchPrimitives.Root.displayName;
function Settings() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [samples, setSamples] = useState("");
  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [training, setTraining] = useState(false);
  useEffect(() => {
    if (profile) {
      setSamples(profile.brand_voice_samples ?? "");
      setActive(profile.brand_voice_active);
    }
  }, [profile]);
  if (!profile) return null;
  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      brand_voice_samples: samples || null,
      brand_voice_active: active && !!samples.trim()
    }).eq("id", profile.id);
    setSaving(false);
    if (error) return toast$1.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast$1.success("Settings saved");
  };
  const train = async () => {
    if (!samples.trim()) return toast$1.error("Paste samples first");
    setTraining(true);
    const { data, error } = await supabase.functions.invoke("train-voice", {
      body: { samples }
    });
    setTraining(false);
    if (error || (data == null ? void 0 : data.error)) {
      toast$1.error((error == null ? void 0 : error.message) || (data == null ? void 0 : data.error) || "Training failed");
      return;
    }
    setActive(true);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast$1.success("Brand voice trained");
  };
  const rules = profile.voice_rules ?? [];
  return /* @__PURE__ */ jsxs("div", { className: "container max-w-3xl py-8", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Settings" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Personalize how AI writes your sites." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-lg border bg-card p-6 shadow-card", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-lg font-semibold", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-primary" }),
            "Brand Voice"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Paste 3–5 samples of your existing copy (emails, social posts, about page). We'll learn your tone and apply it to every site." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "brand-active", className: "text-sm", children: "Active" }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              id: "brand-active",
              checked: active,
              onCheckedChange: setActive,
              disabled: !samples.trim()
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          value: samples,
          onChange: (e) => setSamples(e.target.value),
          placeholder: "Paste a few writing samples here, separated by blank lines…",
          className: "mt-4 min-h-48",
          maxLength: 6e3
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx(Button, { onClick: train, disabled: training || !samples.trim(), children: training ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
          " Analyzing…"
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Wand2, { className: "mr-2 h-4 w-4" }),
          " Train my brand voice"
        ] }) }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: save, disabled: saving, children: saving ? "Saving…" : "Save" })
      ] }),
      rules.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-md border border-primary/20 bg-primary/5 p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs font-semibold uppercase tracking-wider text-primary", children: "Learned voice rules" }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-1 text-sm", children: rules.map((r, i) => /* @__PURE__ */ jsxs("li", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-primary", children: "•" }),
          /* @__PURE__ */ jsx("span", { children: r })
        ] }, i)) })
      ] })
    ] })
  ] });
}
function SharePage() {
  const { token } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["share", token],
    enabled: !!token,
    queryFn: async () => {
      const { data: data2, error } = await supabase.from("sites").select("*").eq("share_token", token).eq("is_shared", true).maybeSingle();
      if (error) throw error;
      return data2;
    }
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center text-muted-foreground", children: "Loading…" });
  }
  if (!data) {
    return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "This preview link is no longer active." }) });
  }
  const content = data.content;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "sticky top-0 z-10 flex items-center justify-between border-b bg-navy px-4 py-2 text-navy-foreground", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-xs font-medium opacity-80", children: [
        "Read-only preview · ",
        data.name
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-[10px] opacity-60", children: [
        /* @__PURE__ */ jsx(Eye, { className: "h-3 w-3" }),
        " Powered by VirtualEngine"
      ] })
    ] }),
    /* @__PURE__ */ jsx(SitePreview, { content })
  ] });
}
function LiveSite({ subdomain }) {
  const [state, setState] = useState({ kind: "loading" });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("sites").select("name, content, published").ilike("subdomain", subdomain).eq("published", true).maybeSingle();
      if (cancelled) return;
      if (!data || !data.content) {
        setState({ kind: "notfound" });
        return;
      }
      document.title = data.name || subdomain;
      setState({
        kind: "ok",
        content: data.content,
        name: data.name
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [subdomain]);
  if (state.kind === "loading") {
    return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center text-muted-foreground", children: "Loading…" });
  }
  if (state.kind === "notfound") {
    return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold", children: "Site not found" }),
      /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
        "No published site exists at ",
        /* @__PURE__ */ jsxs("code", { children: [
          subdomain,
          ".builder.virtualengine.ai"
        ] }),
        "."
      ] }),
      /* @__PURE__ */ jsx("a", { href: "https://builder.virtualengine.ai", className: "text-primary underline", children: "Build your own →" })
    ] });
  }
  return /* @__PURE__ */ jsx(SitePreview, { content: state.content });
}
function useAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["adminLevel", user == null ? void 0 : user.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("admin_users").select("access_level, name, email").eq("user_id", user.id).maybeSingle();
      return data ?? null;
    }
  });
}
const CreditBadge = () => {
  const { data: profile } = useProfile();
  const { data: admin } = useAdmin();
  const [open, setOpen] = useState(false);
  if (!profile) return null;
  if (admin) {
    return /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 rounded-full border border-cta/30 bg-cta/10 px-3 py-1.5 text-xs font-semibold text-cta", children: [
      /* @__PURE__ */ jsx(ShieldCheck, { className: "h-3.5 w-3.5" }),
      admin.access_level === "super_admin" ? "Super Admin" : "Admin",
      " — Unlimited"
    ] });
  }
  const limits = PLAN_LIMITS$1[profile.plan];
  const isUnlimited = profile.plan === "agency";
  const totalCap = limits.build + profile.build_credits_rollover;
  const pct = isUnlimited ? 100 : Math.round(profile.build_credits / Math.max(totalCap, 1) * 100);
  let color = "bg-success/10 text-success border-success/20";
  let Icon = Sparkles;
  if (!isUnlimited && pct <= 0) {
    color = "bg-destructive/10 text-destructive border-destructive/20";
    Icon = AlertTriangle;
  } else if (!isUnlimited && pct < 20) {
    color = "bg-warning/10 text-warning border-warning/20";
    Icon = AlertTriangle;
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setOpen(true),
        className: `flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80 ${color}`,
        children: [
          /* @__PURE__ */ jsx(Icon, { className: "h-3.5 w-3.5" }),
          isUnlimited ? "Unlimited builds" : `${profile.build_credits} credits`,
          /* @__PURE__ */ jsx("span", { className: "hidden text-[10px] opacity-70 sm:inline", children: "· top up" })
        ]
      }
    ),
    /* @__PURE__ */ jsx(TopUpModal, { open, onOpenChange: setOpen })
  ] });
};
function AnnouncementBanner() {
  const [items, setItems] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("veb_dismissed_ann") || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => {
    supabase.from("announcements").select("*").eq("active", true).then(({ data }) => setItems(data ?? []));
  }, []);
  const visible = items.filter((i) => !dismissed.includes(i.id));
  if (!visible.length) return null;
  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem("veb_dismissed_ann", JSON.stringify(next));
  };
  return /* @__PURE__ */ jsx("div", { className: "space-y-1 border-b border-primary/20", children: visible.map((a) => /* @__PURE__ */ jsxs(
    "div",
    {
      className: `flex items-center justify-between px-4 py-2 text-sm ${a.variant === "warning" ? "bg-warning/15 text-warning" : a.variant === "success" ? "bg-cta/15 text-cta" : "bg-primary/15 text-primary"}`,
      children: [
        /* @__PURE__ */ jsx("span", { children: a.message }),
        /* @__PURE__ */ jsx("button", { onClick: () => dismiss(a.id), className: "opacity-60 hover:opacity-100", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
      ]
    },
    a.id
  )) });
}
function useActivePause() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["account_pause", user == null ? void 0 : user.id],
    enabled: !!user,
    refetchInterval: 6e4,
    queryFn: async () => {
      const { data } = await supabase.from("account_flags").select("*").eq("user_id", user.id).is("resolved_at", null).in("flag_type", ["emergency_pause", "suspended"]).order("triggered_at", { ascending: false }).limit(1).maybeSingle();
      return data ?? null;
    }
  });
}
function BillingStatusBanner() {
  const { data: profile } = useProfile();
  const { data: pause } = useActivePause();
  if (!profile) return null;
  if (pause) {
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 border-b border-red-500/40 bg-red-500/10 px-6 py-3 text-sm", children: [
      /* @__PURE__ */ jsx(Pause, { className: "h-4 w-4 shrink-0 text-red-400" }),
      /* @__PURE__ */ jsxs("p", { className: "flex-1 text-red-100", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Your account has been temporarily paused" }),
        " due to unusual activity. Our team has been notified and will review your account within 24 hours. If you believe this is an error please contact support."
      ] })
    ] });
  }
  const status = profile.billing_status;
  if (status === "past_due") {
    const ends = profile.grace_period_ends_at ? new Date(profile.grace_period_ends_at) : null;
    const daysLeft = ends ? Math.max(0, Math.ceil((ends.getTime() - Date.now()) / 864e5)) : 3;
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 border-b border-yellow-500/30 bg-yellow-500/10 px-6 py-3 text-sm", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 shrink-0 text-yellow-400" }),
      /* @__PURE__ */ jsxs("p", { className: "flex-1 text-yellow-100", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Payment failed." }),
        " Please update your payment method to keep your account active. Your access continues for",
        " ",
        /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
          daysLeft,
          " more day",
          daysLeft === 1 ? "" : "s"
        ] }),
        "."
      ] }),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/app/billing",
          className: "rounded-md bg-yellow-400 px-3 py-1.5 text-xs font-semibold text-yellow-950 hover:bg-yellow-300",
          children: "Update payment"
        }
      )
    ] });
  }
  if (status === "canceled" && profile.plan === "free" && profile.plan_before_downgrade) {
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 border-b border-red-500/40 bg-red-500/10 px-6 py-3 text-sm", children: [
      /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4 shrink-0 text-red-400" }),
      /* @__PURE__ */ jsxs("p", { className: "flex-1 text-red-100", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Access removed." }),
        " Your subscription was canceled after the grace period expired. All your data and sites are safe — resubscribe to restore your ",
        /* @__PURE__ */ jsx("span", { className: "font-semibold capitalize", children: profile.plan_before_downgrade }),
        " plan."
      ] }),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/app/billing",
          className: "rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400",
          children: "Resubscribe"
        }
      )
    ] });
  }
  if (status === "disputed" || profile.dispute_flagged) {
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 border-b border-red-500/40 bg-red-500/10 px-6 py-3 text-sm", children: [
      /* @__PURE__ */ jsx(ShieldAlert, { className: "h-4 w-4 shrink-0 text-red-400" }),
      /* @__PURE__ */ jsxs("p", { className: "flex-1 text-red-100", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Account flagged for payment dispute." }),
        " Please contact support to resolve."
      ] })
    ] });
  }
  return null;
}
const TIMEOUT_MS = 24 * 60 * 60 * 1e3;
const STORAGE_KEY = "veb_last_activity";
function useSessionTimeout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const timer = useRef(null);
  useEffect(() => {
    if (!user) return;
    const bump = () => {
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
      }
      schedule();
    };
    const expire = async () => {
      try {
        await supabase.auth.signOut();
      } catch {
      }
      toast$1("Signed out", { description: "Your session expired after 24 hours of inactivity." });
      navigate("/auth?reason=timeout", { replace: true });
    };
    const schedule = () => {
      if (timer.current) window.clearTimeout(timer.current);
      const last2 = Number(localStorage.getItem(STORAGE_KEY)) || Date.now();
      const remaining = Math.max(0, TIMEOUT_MS - (Date.now() - last2));
      timer.current = window.setTimeout(expire, remaining);
    };
    const last = Number(localStorage.getItem(STORAGE_KEY)) || Date.now();
    if (Date.now() - last >= TIMEOUT_MS) {
      void expire();
      return;
    }
    bump();
    const events = ["mousedown", "keydown", "scroll", "touchstart", "visibilitychange"];
    events.forEach((e) => document.addEventListener(e, bump, { passive: true }));
    return () => {
      events.forEach((e) => document.removeEventListener(e, bump));
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [user, navigate]);
}
function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: admin } = useAdmin();
  const { t } = useI18n();
  const navigate = useNavigate();
  useSessionTimeout();
  const nav = [
    { to: "/app", label: t("nav.dashboard"), icon: LayoutDashboard, end: true },
    { to: "/app/new", label: t("nav.newsite"), icon: Plus },
    { to: "/app/optimize", label: "Optimize Site", icon: TrendingUp },
    { to: "/app/integrations", label: t("nav.integrations"), icon: Plug },
    { to: "/app/affiliate", label: "Affiliate Program", icon: DollarSign },
    { to: "/app/billing", label: t("nav.billing"), icon: CreditCard },
    { to: "/app/settings", label: t("nav.settings"), icon: Settings$1 },
    ...admin ? [{ to: "/admin", label: "Admin Panel", icon: ShieldCheck }] : []
  ];
  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);
  if (loading || !user) {
    return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center text-muted-foreground", children: "Loading…" });
  }
  const planLabel = profile ? PLAN_LIMITS$1[profile.plan].label : "Free";
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen w-full bg-background", children: [
    /* @__PURE__ */ jsxs("aside", { className: "hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-2 px-6 py-5", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary", children: /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4 text-primary-foreground" }) }),
        /* @__PURE__ */ jsxs("span", { className: "font-semibold text-sidebar-accent-foreground", children: [
          "Virtual Engine ",
          /* @__PURE__ */ jsx("span", { className: "text-sidebar-primary", children: "Builder" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "flex-1 space-y-1 px-3", children: nav.map((n) => /* @__PURE__ */ jsxs(
        NavLink,
        {
          to: n.to,
          end: n.end,
          className: ({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"}`,
          children: [
            /* @__PURE__ */ jsx(n.icon, { className: "h-4 w-4" }),
            n.label
          ]
        },
        n.to
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3 border-t border-sidebar-border p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-md bg-sidebar-accent/60 p-3 text-xs", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sidebar-accent-foreground", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }),
            /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
              planLabel,
              " ",
              t("common.plan")
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sidebar-foreground", children: (profile == null ? void 0 : profile.plan) === "agency" ? t("common.unlimitedBuilds") : t("common.creditsLeft", { n: (profile == null ? void 0 : profile.build_credits) ?? 0 }) })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => signOut(),
            className: "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/60",
            children: [
              /* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4" }),
              t("nav.signout")
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [
      /* @__PURE__ */ jsxs("header", { className: "flex h-14 items-center justify-between border-b bg-card px-6", children: [
        /* @__PURE__ */ jsx("div", { className: "md:hidden", children: /* @__PURE__ */ jsxs(Link, { to: "/app", className: "font-semibold", children: [
          "Virtual Engine ",
          /* @__PURE__ */ jsx("span", { className: "text-primary", children: "Builder" })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(LanguageSelector, {}),
          /* @__PURE__ */ jsx(CreditBadge, {}),
          /* @__PURE__ */ jsx(Button, { asChild: true, size: "sm", children: /* @__PURE__ */ jsxs(Link, { to: "/app/new", children: [
            /* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }),
            " ",
            t("nav.newsite")
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx(AnnouncementBanner, {}),
      /* @__PURE__ */ jsx(BillingStatusBanner, {}),
      /* @__PURE__ */ jsx("main", { className: "min-w-0 flex-1 overflow-x-hidden", children: /* @__PURE__ */ jsx(Outlet, {}) })
    ] })
  ] });
}
const NotFound = () => {
  const location = useLocation();
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-muted", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "mb-4 text-4xl font-bold", children: "404" }),
    /* @__PURE__ */ jsx("p", { className: "mb-4 text-xl text-muted-foreground", children: "Oops! Page not found" }),
    /* @__PURE__ */ jsx("a", { href: "/", className: "text-primary underline hover:text-primary/90", children: "Return to Home" })
  ] }) });
};
const Slider = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs(
  SliderPrimitive.Root,
  {
    ref,
    className: cn("relative flex w-full touch-none select-none items-center", className),
    ...props,
    children: [
      /* @__PURE__ */ jsx(SliderPrimitive.Track, { className: "relative h-2 w-full grow overflow-hidden rounded-full bg-secondary", children: /* @__PURE__ */ jsx(SliderPrimitive.Range, { className: "absolute h-full bg-primary" }) }),
      /* @__PURE__ */ jsx(SliderPrimitive.Thumb, { className: "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" })
    ]
  }
));
Slider.displayName = SliderPrimitive.Root.displayName;
const Checkbox = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  CheckboxPrimitive.Root,
  {
    ref,
    className: cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(CheckboxPrimitive.Indicator, { className: cn("flex items-center justify-center text-current"), children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) })
  }
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
const COPY = {
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
    success: "Application received! We'll review it within 24h."
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
    success: "¡Solicitud recibida! Revisaremos en 24h."
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
    success: "Solicitação recebida! Vamos revisar em 24h."
  }
};
const AVG_PLAN_PRICE = 49;
const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  website_url: z.string().trim().max(500).optional().or(z.literal("")),
  promotion_plan: z.string().trim().max(2e3).optional().or(z.literal("")),
  expected_referrals: z.string().trim().max(50).optional().or(z.literal("")),
  paypal_email: z.string().trim().email().max(255)
});
function Affiliates() {
  const { lang: routeLang } = useParams();
  const lang = routeLang === "es" ? "es" : routeLang === "pt" ? "pt" : "en";
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
    paypal_email: ""
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return toast$1.error("Please agree to the affiliate terms.");
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast$1.error(parsed.error.issues[0].message);
    setSubmitting(true);
    const row = {
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      paypal_email: parsed.data.paypal_email,
      website_url: parsed.data.website_url || null,
      promotion_plan: parsed.data.promotion_plan || null,
      expected_referrals: parsed.data.expected_referrals || null,
      user_id: (user == null ? void 0 : user.id) ?? null,
      affiliate_code: "VEB-PEND" + Math.random().toString(36).slice(2, 6).toUpperCase()
    };
    const { error } = await supabase.from("affiliates").insert(row);
    setSubmitting(false);
    if (error) return toast$1.error(error.message);
    toast$1.success(t.success);
    if (user) navigate("/app/affiliate");
    else navigate("/auth?mode=signup");
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-30 border-b border-primary/15 bg-background/85 backdrop-blur", children: /* @__PURE__ */ jsxs("div", { className: "container flex h-16 items-center justify-between", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary", children: /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4 text-primary-foreground" }) }),
        /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
          "Virtual Engine ",
          /* @__PURE__ */ jsx("span", { className: "text-primary", children: "Builder" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 text-xs", children: [
        /* @__PURE__ */ jsx(Link, { to: "/affiliates", className: lang === "en" ? "font-bold text-primary" : "opacity-60 hover:opacity-100", children: "EN" }),
        /* @__PURE__ */ jsx(Link, { to: "/affiliates/es", className: lang === "es" ? "font-bold text-primary" : "opacity-60 hover:opacity-100", children: "ES" }),
        /* @__PURE__ */ jsx(Link, { to: "/affiliates/pt", className: lang === "pt" ? "font-bold text-primary" : "opacity-60 hover:opacity-100", children: "PT" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "relative overflow-hidden py-20", children: /* @__PURE__ */ jsxs("div", { className: "container text-center", children: [
      /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-medium text-primary", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }),
        " ",
        t.badge
      ] }),
      /* @__PURE__ */ jsxs("h1", { className: "mt-6 text-4xl font-bold tracking-tight md:text-6xl", children: [
        t.h1a,
        /* @__PURE__ */ jsx("br", {}),
        /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-primary to-cta bg-clip-text text-transparent", children: t.h1b })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mx-auto mt-6 max-w-2xl text-lg text-muted-foreground", children: t.sub }),
      /* @__PURE__ */ jsxs(Card, { className: "mx-auto mt-10 max-w-xl border-primary/30 bg-primary/5 p-6 text-left shadow-glow", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2 text-sm font-semibold", children: [
          /* @__PURE__ */ jsx(DollarSign, { className: "h-4 w-4 text-cta" }),
          " ",
          t.calcTitle
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-2 text-sm", children: t.calcRefs.replace("{n}", String(refs)) }),
          /* @__PURE__ */ jsx(Slider, { value: [refs], onValueChange: (v) => setRefs(v[0]), min: 1, max: 200, step: 1 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-primary/20 bg-background/50 p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: t.calcMonthly }),
            /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-cta", children: [
              "$",
              monthly,
              "/mo"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-primary/20 bg-background/50 p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: t.calcLifetime }),
            /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-primary", children: [
              "$",
              monthly * 12
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", className: "mt-8 bg-cta text-cta-foreground hover:bg-cta/90", children: /* @__PURE__ */ jsxs("a", { href: "#apply", children: [
        t.apply,
        " ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "ml-1 h-4 w-4" })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "border-y border-primary/10 bg-card/40 py-16", children: /* @__PURE__ */ jsx("div", { className: "container grid gap-6 md:grid-cols-3", children: [t.step1, t.step2, t.step3].map((s, i) => /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 bg-card p-6 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-bold text-primary", children: i + 1 }),
      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: s })
    ] }, i)) }) }),
    /* @__PURE__ */ jsx("section", { className: "py-16", children: /* @__PURE__ */ jsxs("div", { className: "container", children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-8 text-center text-3xl font-bold", children: t.tiersTitle }),
      /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-xl border border-primary/20", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-primary/10", children: /* @__PURE__ */ jsxs("tr", { className: "text-left", children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Tier" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Referrals" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Commission" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: [
          ["Starter", "1-10", "20% recurring"],
          ["Pro", "11-50", "30% recurring"],
          ["Elite", "51+", "40% recurring"],
          ["Agency Partner", "Custom", "50% first month + 20% recurring"]
        ].map(([tier, range, rate]) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-primary/10", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: tier }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: range }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right font-semibold text-cta", children: rate })
        ] }, tier)) })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { id: "apply", className: "bg-card/40 py-20", children: /* @__PURE__ */ jsxs("div", { className: "container max-w-2xl", children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-2 text-center text-3xl font-bold", children: t.formTitle }),
      /* @__PURE__ */ jsx(Card, { className: "mt-8 border-primary/20 p-6", children: /* @__PURE__ */ jsxs("form", { onSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: t.fullName }),
            /* @__PURE__ */ jsx(Input, { value: form.full_name, onChange: (e) => setForm({ ...form, full_name: e.target.value }), required: true })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: t.email }),
            /* @__PURE__ */ jsx(Input, { type: "email", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), required: true })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: t.site }),
          /* @__PURE__ */ jsx(Input, { value: form.website_url, onChange: (e) => setForm({ ...form, website_url: e.target.value }), placeholder: "https://..." })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: t.promo }),
          /* @__PURE__ */ jsx(Textarea, { value: form.promotion_plan, onChange: (e) => setForm({ ...form, promotion_plan: e.target.value }), rows: 3 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: t.expected }),
            /* @__PURE__ */ jsx(Input, { value: form.expected_referrals, onChange: (e) => setForm({ ...form, expected_referrals: e.target.value }), placeholder: "e.g. 10-25" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: t.paypal }),
            /* @__PURE__ */ jsx(Input, { type: "email", value: form.paypal_email, onChange: (e) => setForm({ ...form, paypal_email: e.target.value }), required: true }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-[11px] text-muted-foreground", children: "🌍 Global payouts via PayPal (200+ countries) or Wise/TransferWise for regions where PayPal is limited. Tell us which you prefer in the notes above." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx(Checkbox, { checked: agreed, onCheckedChange: (v) => setAgreed(!!v) }),
          t.terms
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: submitting, className: "w-full bg-cta text-cta-foreground hover:bg-cta/90", children: submitting ? "..." : t.submit })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("footer", { className: "border-t border-primary/15 py-8 text-center text-sm text-muted-foreground", children: /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:text-primary", children: "← Back to Virtual Engine Builder" }) })
  ] });
}
function useAffiliate() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["affiliate", user == null ? void 0 : user.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliates").select("*").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    }
  });
}
function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["isAdmin", user == null ? void 0 : user.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
      return !!data;
    }
  });
}
function AffiliateDashboard() {
  var _a;
  const { data: affiliate, isLoading } = useAffiliate();
  const qc = useQueryClient();
  const link = affiliate ? `${window.location.origin}/?ref=${affiliate.affiliate_code}` : "";
  const { data: conversions = [] } = useQuery({
    queryKey: ["conversions", affiliate == null ? void 0 : affiliate.id],
    enabled: !!affiliate,
    queryFn: async () => {
      const { data } = await supabase.from("referral_conversions").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false });
      return data ?? [];
    }
  });
  const { data: payouts = [] } = useQuery({
    queryKey: ["payouts", affiliate == null ? void 0 : affiliate.id],
    enabled: !!affiliate,
    queryFn: async () => {
      const { data } = await supabase.from("affiliate_payouts").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false });
      return data ?? [];
    }
  });
  const monthly = useMemo(() => {
    const map = {};
    conversions.forEach((c) => {
      const m = new Date(c.created_at).toISOString().slice(0, 7);
      map[m] = (map[m] || 0) + Number(c.commission_amount);
    });
    return Object.entries(map).sort().slice(-6);
  }, [conversions]);
  const maxMonthly = Math.max(1, ...monthly.map(([, v]) => v));
  const copy = (txt) => {
    navigator.clipboard.writeText(txt);
    toast$1.success("Copied!");
  };
  const share = (url) => window.open(url, "_blank", "noopener");
  const requestPayout = async () => {
    if (!affiliate) return;
    if (Number(affiliate.pending_payout) < 50) return toast$1.error("Minimum payout is $50.");
    const { error } = await supabase.from("affiliate_payouts").insert({
      affiliate_id: affiliate.id,
      amount: affiliate.pending_payout,
      method: "paypal",
      status: "pending"
    });
    if (error) return toast$1.error(error.message);
    toast$1.success("Payout requested. Processing within 7 business days.");
    qc.invalidateQueries({ queryKey: ["payouts"] });
  };
  if (isLoading) return /* @__PURE__ */ jsx("div", { className: "p-10 text-muted-foreground", children: "Loading…" });
  if (!affiliate) {
    return /* @__PURE__ */ jsxs("div", { className: "container max-w-xl py-16 text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "You're not an affiliate yet" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Apply to the program to start earning 30% recurring commission." }),
      /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-6 bg-cta text-cta-foreground hover:bg-cta/90", children: /* @__PURE__ */ jsx("a", { href: "/affiliates", children: "Apply Now" }) })
    ] });
  }
  if (affiliate.status === "pending") {
    return /* @__PURE__ */ jsxs("div", { className: "container max-w-xl py-16 text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Application under review" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "We'll email you within 24 hours once you're approved." })
    ] });
  }
  if (affiliate.status === "suspended") {
    return /* @__PURE__ */ jsxs("div", { className: "container max-w-xl py-16 text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-destructive", children: "Account suspended" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Please contact support." })
    ] });
  }
  const stats = [
    { label: "Affiliate Code", value: affiliate.affiliate_code },
    { label: "Total Referrals", value: affiliate.total_referrals },
    { label: "Active Subscribers", value: affiliate.active_subscribers },
    { label: "Monthly Earnings", value: `$${((_a = monthly.at(-1)) == null ? void 0 : _a[1]) ?? 0}` },
    { label: "Total Earned", value: `$${Number(affiliate.total_earnings).toFixed(2)}` },
    { label: "Pending Payout", value: `$${Number(affiliate.pending_payout).toFixed(2)}` }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "container space-y-8 py-8", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Affiliate Dashboard" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "Tier: ",
        /* @__PURE__ */ jsx("span", { className: "font-semibold capitalize text-primary", children: affiliate.tier })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-3 lg:grid-cols-6", children: stats.map((s) => /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 p-4", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: s.label }),
      /* @__PURE__ */ jsx("div", { className: "mt-1 text-lg font-bold", children: s.value })
    ] }, s.label)) }),
    /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 p-6", children: [
      /* @__PURE__ */ jsxs("h2", { className: "mb-3 flex items-center gap-2 font-semibold", children: [
        /* @__PURE__ */ jsx(Share2, { className: "h-4 w-4" }),
        " Your affiliate link"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("input", { readOnly: true, value: link, className: "flex-1 rounded-md border border-primary/20 bg-background px-3 py-2 text-sm" }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => copy(link), children: /* @__PURE__ */ jsx(Copy, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => share(`https://twitter.com/intent/tweet?text=${encodeURIComponent("Build a website in 60 seconds with AI: " + link)}`), children: [
          /* @__PURE__ */ jsx(Twitter, { className: "h-4 w-4" }),
          " X"
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => share(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`), children: [
          /* @__PURE__ */ jsx(Facebook, { className: "h-4 w-4" }),
          " Facebook"
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => share(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`), children: [
          /* @__PURE__ */ jsx(Linkedin, { className: "h-4 w-4" }),
          " LinkedIn"
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => share(`https://wa.me/?text=${encodeURIComponent("Mira esto: " + link)}`), children: [
          /* @__PURE__ */ jsx(MessageCircle, { className: "h-4 w-4" }),
          " WhatsApp"
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => toast$1.info("Affiliate kit coming soon — banners + copy templates"), children: [
          /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }),
          " Affiliate kit"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-4 font-semibold", children: "Monthly earnings" }),
      monthly.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No earnings yet." }) : /* @__PURE__ */ jsx("div", { className: "flex h-32 items-end gap-3", children: monthly.map(([m, v]) => /* @__PURE__ */ jsxs("div", { className: "flex flex-1 flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsx("div", { className: "w-full rounded-t bg-gradient-to-t from-primary to-cta", style: { height: `${v / maxMonthly * 100}%` } }),
        /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: m }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold", children: [
          "$",
          v.toFixed(0)
        ] })
      ] }, m)) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-4 font-semibold", children: "Referrals" }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "text-left text-xs text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Date" }),
          /* @__PURE__ */ jsx("th", { children: "Plan" }),
          /* @__PURE__ */ jsx("th", { children: "Monthly" }),
          /* @__PURE__ */ jsx("th", { children: "Commission" }),
          /* @__PURE__ */ jsx("th", { children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          conversions.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "py-4 text-muted-foreground", children: "No referrals yet." }) }),
          conversions.map((c) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-primary/10", children: [
            /* @__PURE__ */ jsx("td", { className: "py-2", children: new Date(c.created_at).toLocaleDateString() }),
            /* @__PURE__ */ jsx("td", { className: "capitalize", children: c.plan_subscribed }),
            /* @__PURE__ */ jsxs("td", { children: [
              "$",
              Number(c.monthly_value).toFixed(2)
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "text-cta", children: [
              "$",
              Number(c.commission_amount).toFixed(2)
            ] }),
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "capitalize", children: c.status }) })
          ] }, c.id))
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Payout history" }),
        /* @__PURE__ */ jsx(Button, { onClick: requestPayout, className: "bg-cta text-cta-foreground hover:bg-cta/90", children: "Request payout" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mb-3 text-xs text-muted-foreground", children: [
        "Min $50 · PayPal: ",
        affiliate.paypal_email,
        " · 7 business days"
      ] }),
      /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "text-left text-xs text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Date" }),
          /* @__PURE__ */ jsx("th", { children: "Amount" }),
          /* @__PURE__ */ jsx("th", { children: "Method" }),
          /* @__PURE__ */ jsx("th", { children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          payouts.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "py-4 text-muted-foreground", children: "No payouts yet." }) }),
          payouts.map((p) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-primary/10", children: [
            /* @__PURE__ */ jsx("td", { className: "py-2", children: new Date(p.created_at).toLocaleDateString() }),
            /* @__PURE__ */ jsxs("td", { children: [
              "$",
              Number(p.amount).toFixed(2)
            ] }),
            /* @__PURE__ */ jsx("td", { className: "capitalize", children: p.method }),
            /* @__PURE__ */ jsx("td", { className: "capitalize", children: p.status })
          ] }, p.id))
        ] })
      ] })
    ] })
  ] });
}
function AdminAffiliates() {
  const { data: isAdmin, isLoading: checking } = useIsAdmin();
  const qc = useQueryClient();
  const { data: affiliates = [] } = useQuery({
    queryKey: ["admin-affiliates"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("affiliates").select("*").order("created_at", { ascending: false });
      return data ?? [];
    }
  });
  const { data: payouts = [] } = useQuery({
    queryKey: ["admin-payouts"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("affiliate_payouts").select("*, affiliates(affiliate_code, paypal_email)").order("created_at", { ascending: false });
      return data ?? [];
    }
  });
  if (checking) return /* @__PURE__ */ jsx("div", { className: "p-10", children: "Loading…" });
  if (!isAdmin) return /* @__PURE__ */ jsx("div", { className: "container py-20 text-center", children: /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Access denied" }) });
  const approve = async (id) => {
    const code = "VEB-" + Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[01OIL]/g, "X");
    const { error } = await supabase.from("affiliates").update({ status: "active", affiliate_code: code }).eq("id", id);
    if (error) return toast$1.error(error.message);
    toast$1.success("Approved");
    qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
  };
  const reject = async (id) => {
    const { error } = await supabase.from("affiliates").delete().eq("id", id);
    if (error) return toast$1.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
  };
  const suspend = async (id) => {
    const { error } = await supabase.from("affiliates").update({ status: "suspended" }).eq("id", id);
    if (error) return toast$1.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
  };
  const markPaid = async (p) => {
    const { error } = await supabase.from("affiliate_payouts").update({ status: "paid", paid_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", p.id);
    if (error) return toast$1.error(error.message);
    const { data: aff } = await supabase.from("affiliates").select("pending_payout, paid_out_total").eq("id", p.affiliate_id).single();
    if (aff) {
      await supabase.from("affiliates").update({
        pending_payout: Math.max(0, Number(aff.pending_payout) - Number(p.amount)),
        paid_out_total: Number(aff.paid_out_total) + Number(p.amount)
      }).eq("id", p.affiliate_id);
    }
    qc.invalidateQueries({ queryKey: ["admin-payouts"] });
    qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
  };
  const exportCsv = () => {
    const rows = [
      ["code", "name", "email", "tier", "status", "referrals", "earnings", "pending", "paid_out", "paypal"],
      ...affiliates.map((a2) => [a2.affiliate_code, a2.full_name, a2.email, a2.tier, a2.status, a2.total_referrals, a2.total_earnings, a2.pending_payout, a2.paid_out_total, a2.paypal_email])
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "affiliates.csv";
    a.click();
  };
  const pending = affiliates.filter((a) => a.status === "pending");
  const active = affiliates.filter((a) => a.status !== "pending");
  const totalOwed = active.reduce((s, a) => s + Number(a.pending_payout), 0);
  return /* @__PURE__ */ jsxs("div", { className: "container space-y-8 py-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Affiliate Admin" }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: exportCsv, children: [
        /* @__PURE__ */ jsx(Download, { className: "h-4 w-4 mr-1" }),
        " Export CSV"
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 p-4", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Total commissions owed" }),
      /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-cta", children: [
        "$",
        totalOwed.toFixed(2)
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 p-6", children: [
      /* @__PURE__ */ jsxs("h2", { className: "mb-4 font-semibold", children: [
        "Pending applications (",
        pending.length,
        ")"
      ] }),
      pending.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No pending applications." }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: pending.map((a) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded border border-primary/10 p-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
            a.full_name,
            " · ",
            a.email
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            a.website_url,
            " · expects ",
            a.expected_referrals,
            " · ",
            a.promotion_plan
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: () => approve(a.id), children: [
            /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }),
            " Approve"
          ] }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => reject(a.id), children: [
            /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
            " Reject"
          ] })
        ] })
      ] }, a.id)) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 p-6", children: [
      /* @__PURE__ */ jsxs("h2", { className: "mb-4 font-semibold", children: [
        "Active affiliates (",
        active.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "text-left text-xs text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Code" }),
          /* @__PURE__ */ jsx("th", { children: "Name" }),
          /* @__PURE__ */ jsx("th", { children: "Tier" }),
          /* @__PURE__ */ jsx("th", { children: "Refs" }),
          /* @__PURE__ */ jsx("th", { children: "Earnings" }),
          /* @__PURE__ */ jsx("th", { children: "Pending" }),
          /* @__PURE__ */ jsx("th", {})
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: active.map((a) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-primary/10", children: [
          /* @__PURE__ */ jsx("td", { className: "py-2 font-mono text-xs", children: a.affiliate_code }),
          /* @__PURE__ */ jsx("td", { children: a.full_name }),
          /* @__PURE__ */ jsx("td", { className: "capitalize", children: a.tier }),
          /* @__PURE__ */ jsx("td", { children: a.total_referrals }),
          /* @__PURE__ */ jsxs("td", { children: [
            "$",
            Number(a.total_earnings).toFixed(2)
          ] }),
          /* @__PURE__ */ jsxs("td", { className: "text-cta", children: [
            "$",
            Number(a.pending_payout).toFixed(2)
          ] }),
          /* @__PURE__ */ jsx("td", { children: a.status === "active" && /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => suspend(a.id), children: /* @__PURE__ */ jsx(Pause, { className: "h-3 w-3" }) }) })
        ] }, a.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-4 font-semibold", children: "Payout requests" }),
      /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "text-left text-xs text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Date" }),
          /* @__PURE__ */ jsx("th", { children: "Affiliate" }),
          /* @__PURE__ */ jsx("th", { children: "PayPal" }),
          /* @__PURE__ */ jsx("th", { children: "Amount" }),
          /* @__PURE__ */ jsx("th", { children: "Status" }),
          /* @__PURE__ */ jsx("th", {})
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: payouts.map((p) => {
          var _a, _b;
          return /* @__PURE__ */ jsxs("tr", { className: "border-t border-primary/10", children: [
            /* @__PURE__ */ jsx("td", { className: "py-2", children: new Date(p.created_at).toLocaleDateString() }),
            /* @__PURE__ */ jsx("td", { className: "font-mono text-xs", children: (_a = p.affiliates) == null ? void 0 : _a.affiliate_code }),
            /* @__PURE__ */ jsx("td", { children: (_b = p.affiliates) == null ? void 0 : _b.paypal_email }),
            /* @__PURE__ */ jsxs("td", { children: [
              "$",
              Number(p.amount).toFixed(2)
            ] }),
            /* @__PURE__ */ jsx("td", { className: "capitalize", children: p.status }),
            /* @__PURE__ */ jsx("td", { children: p.status === "pending" && /* @__PURE__ */ jsx(Button, { size: "sm", onClick: () => markPaid(p), children: "Mark paid" }) })
          ] }, p.id);
        }) })
      ] })
    ] })
  ] });
}
function useAdminAlerts() {
  return useQuery({
    queryKey: ["admin_alerts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_alerts").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 3e4
  });
}
function useUnreadAlertCount() {
  return useQuery({
    queryKey: ["admin_alerts_unread_count"],
    queryFn: async () => {
      const { count: count2, error } = await supabase.from("admin_alerts").select("*", { count: "exact", head: true }).eq("status", "new");
      if (error) return 0;
      return count2 ?? 0;
    },
    refetchInterval: 3e4
  });
}
function useUpdateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars) => {
      var _a, _b, _c;
      const { data: u } = await supabase.auth.getUser();
      const patch = { ...vars.patch };
      if (patch.status === "reviewed" && !patch.reviewed_at) {
        patch.reviewed_at = (/* @__PURE__ */ new Date()).toISOString();
        patch.reviewed_by = (_a = u.user) == null ? void 0 : _a.id;
      }
      if (patch.status === "resolved" && !patch.resolved_at) {
        patch.resolved_at = (/* @__PURE__ */ new Date()).toISOString();
        patch.resolved_by = (_b = u.user) == null ? void 0 : _b.id;
        if (!patch.reviewed_at) {
          patch.reviewed_at = (/* @__PURE__ */ new Date()).toISOString();
          patch.reviewed_by = (_c = u.user) == null ? void 0 : _c.id;
        }
      }
      const { error } = await supabase.from("admin_alerts").update(patch).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_alerts"] });
      qc.invalidateQueries({ queryKey: ["admin_alerts_unread_count"] });
    }
  });
}
function AdminLayout() {
  const { user, loading } = useAuth();
  const { data: admin, isLoading } = useAdmin();
  const { data: unreadAlerts = 0 } = useUnreadAlertCount();
  if (loading || isLoading) return /* @__PURE__ */ jsx("div", { className: "p-10 text-muted-foreground", children: "Loading…" });
  if (!user) return /* @__PURE__ */ jsx(Navigate, { to: "/auth", replace: true });
  if (!admin) return /* @__PURE__ */ jsx(Navigate, { to: "/app", replace: true });
  const isSuper = admin.access_level === "super_admin";
  const nav = [
    { to: "/admin", end: true, label: "Overview", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/sites", label: "Sites", icon: Globe },
    { to: "/admin/usage", label: "Usage Analytics", icon: Activity },
    { to: "/admin/affiliates", label: "Affiliates", icon: DollarSign },
    { to: "/admin/alerts", label: "Alerts", icon: Bell, badge: unreadAlerts },
    { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { to: "/admin/codes", label: "Access Codes", icon: KeyRound },
    { to: "/admin/launch-tests", label: "Launch Tests", icon: FlaskConical },
    ...isSuper ? [{ to: "/admin/admins", label: "Admin Users", icon: UserCog }] : []
  ];
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen w-full bg-background", children: [
    /* @__PURE__ */ jsxs("aside", { className: "hidden w-64 flex-col border-r border-primary/10 bg-sidebar text-sidebar-foreground md:flex", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-6 py-5", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-md bg-cta", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "h-4 w-4 text-cta-foreground" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: "Admin Console" }),
          /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-cta", children: admin.access_level.replace("_", " ") })
        ] })
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "flex-1 space-y-1 px-3", children: nav.map((n) => /* @__PURE__ */ jsxs(
        NavLink,
        {
          to: n.to,
          end: n.end,
          className: ({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"}`,
          children: [
            /* @__PURE__ */ jsx(n.icon, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { className: "flex-1", children: n.label }),
            "badge" in n && n.badge > 0 && /* @__PURE__ */ jsx("span", { className: "ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cta px-1.5 text-[10px] font-bold text-cta-foreground", children: n.badge })
          ]
        },
        n.to
      )) }),
      /* @__PURE__ */ jsxs(Link, { to: "/app", className: "m-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent/60", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to app"
      ] })
    ] }),
    /* @__PURE__ */ jsx("main", { className: "min-w-0 flex-1 overflow-x-hidden p-6", children: /* @__PURE__ */ jsx(Outlet, {}) })
  ] });
}
function Stat({ icon: Icon, label, value, hint }) {
  return /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 bg-card p-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Icon, { className: "h-3.5 w-3.5" }),
      " ",
      label
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-2 text-2xl font-bold", children: value }),
    hint && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: hint })
  ] });
}
function AdminOverview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const dayAgo = new Date(Date.now() - 864e5).toISOString();
      const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
      const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString();
      const [u, paid, sToday, sWeek, sMonth, signups, aff] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).neq("plan", "free"),
        supabase.from("sites").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
        supabase.from("sites").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("sites").select("id", { count: "exact", head: true }).gte("created_at", monthAgo),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
        supabase.from("affiliates").select("id", { count: "exact", head: true }).eq("status", "pending")
      ]);
      return {
        users: u.count ?? 0,
        paid: paid.count ?? 0,
        sToday: sToday.count ?? 0,
        sWeek: sWeek.count ?? 0,
        sMonth: sMonth.count ?? 0,
        signups: signups.count ?? 0,
        pendingAff: aff.count ?? 0
      };
    }
  });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Platform Overview" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Live snapshot of platform activity." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsx(Stat, { icon: Users, label: "Total users", value: (data == null ? void 0 : data.users) ?? "—" }),
      /* @__PURE__ */ jsx(Stat, { icon: DollarSign, label: "Paid subscribers", value: (data == null ? void 0 : data.paid) ?? "—" }),
      /* @__PURE__ */ jsx(Stat, { icon: UserPlus, label: "New signups today", value: (data == null ? void 0 : data.signups) ?? "—" }),
      /* @__PURE__ */ jsx(Stat, { icon: TrendingUp, label: "Pending affiliates", value: (data == null ? void 0 : data.pendingAff) ?? "—" }),
      /* @__PURE__ */ jsx(Stat, { icon: Globe, label: "Sites today", value: (data == null ? void 0 : data.sToday) ?? "—" }),
      /* @__PURE__ */ jsx(Stat, { icon: Globe, label: "Sites this week", value: (data == null ? void 0 : data.sWeek) ?? "—" }),
      /* @__PURE__ */ jsx(Stat, { icon: Globe, label: "Sites this month", value: (data == null ? void 0 : data.sMonth) ?? "—" }),
      /* @__PURE__ */ jsx(Stat, { icon: Sparkles, label: "MRR", value: "—", hint: "Connect Stripe reports" })
    ] })
  ] });
}
function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users", q],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
      if (q) query = query.or(`email.ilike.%${q}%,display_name.ilike.%${q}%`);
      const { data } = await query;
      return data ?? [];
    }
  });
  const addCredits = async (id) => {
    const n = Number(prompt("How many build credits to add?", "10") || 0);
    if (!n) return;
    const u = users.find((x) => x.id === id);
    await supabase.from("profiles").update({ build_credits: ((u == null ? void 0 : u.build_credits) ?? 0) + n }).eq("id", id);
    toast$1.success(`Added ${n} credits`);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };
  const setPlan = async (id) => {
    const plan = prompt("Plan (free/starter/builder/pro/agency):", "builder");
    if (!plan) return;
    const { error } = await supabase.from("profiles").update({ plan }).eq("id", id);
    if (error) return toast$1.error(error.message);
    toast$1.success("Plan updated");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "User Management" }),
    /* @__PURE__ */ jsx(Input, { placeholder: "Search by email or name…", value: q, onChange: (e) => setQ(e.target.value) }),
    /* @__PURE__ */ jsx(Card, { className: "border-primary/20 p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "border-b border-primary/10 text-left text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "p-3", children: "Email" }),
        /* @__PURE__ */ jsx("th", { children: "Name" }),
        /* @__PURE__ */ jsx("th", { children: "Plan" }),
        /* @__PURE__ */ jsx("th", { children: "Credits" }),
        /* @__PURE__ */ jsx("th", { children: "Joined" }),
        /* @__PURE__ */ jsx("th", { children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: users.map((u) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-primary/10", children: [
        /* @__PURE__ */ jsx("td", { className: "p-3", children: u.email }),
        /* @__PURE__ */ jsx("td", { children: u.display_name }),
        /* @__PURE__ */ jsx("td", { className: "capitalize", children: u.plan }),
        /* @__PURE__ */ jsx("td", { children: u.build_credits }),
        /* @__PURE__ */ jsx("td", { className: "text-xs text-muted-foreground", children: new Date(u.created_at).toLocaleDateString() }),
        /* @__PURE__ */ jsxs("td", { className: "space-x-2 py-2", children: [
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => addCredits(u.id), children: "+Credits" }),
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => setPlan(u.id), children: "Plan" })
        ] })
      ] }, u.id)) })
    ] }) }) })
  ] });
}
function AdminSites() {
  const qc = useQueryClient();
  const { data: sites = [] } = useQuery({
    queryKey: ["admin-sites"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("*").order("created_at", { ascending: false }).limit(200);
      return data ?? [];
    }
  });
  const del = async (id) => {
    if (!confirm("Delete site?")) return;
    const { error } = await supabase.from("sites").delete().eq("id", id);
    if (error) return toast$1.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-sites"] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Sites" }),
    /* @__PURE__ */ jsx(Card, { className: "border-primary/20 p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "border-b border-primary/10 text-left text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "p-3", children: "Name" }),
        /* @__PURE__ */ jsx("th", { children: "Owner" }),
        /* @__PURE__ */ jsx("th", { children: "Created" }),
        /* @__PURE__ */ jsx("th", { children: "Published" }),
        /* @__PURE__ */ jsx("th", { children: "Subdomain" }),
        /* @__PURE__ */ jsx("th", {})
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: sites.map((s) => {
        var _a;
        return /* @__PURE__ */ jsxs("tr", { className: "border-b border-primary/10", children: [
          /* @__PURE__ */ jsx("td", { className: "p-3", children: s.name }),
          /* @__PURE__ */ jsxs("td", { className: "text-xs", children: [
            (_a = s.user_id) == null ? void 0 : _a.slice(0, 8),
            "…"
          ] }),
          /* @__PURE__ */ jsx("td", { className: "text-xs", children: new Date(s.created_at).toLocaleDateString() }),
          /* @__PURE__ */ jsx("td", { children: s.published ? "Yes" : "No" }),
          /* @__PURE__ */ jsx("td", { className: "text-xs", children: s.subdomain ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "py-2", children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => del(s.id), children: "Delete" }) })
        ] }, s.id);
      }) })
    ] }) }) })
  ] });
}
function AdminAnnouncements() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const [variant, setVariant] = useState("info");
  const { data = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? []
  });
  const create = async () => {
    if (!msg.trim()) return;
    const { error } = await supabase.from("announcements").insert({ message: msg, variant });
    if (error) return toast$1.error(error.message);
    setMsg("");
    toast$1.success("Announcement live");
    qc.invalidateQueries({ queryKey: ["announcements"] });
  };
  const toggle = async (a) => {
    await supabase.from("announcements").update({ active: !a.active }).eq("id", a.id);
    qc.invalidateQueries({ queryKey: ["announcements"] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Announcements" }),
    /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 p-4 space-y-3", children: [
      /* @__PURE__ */ jsx(Textarea, { value: msg, onChange: (e) => setMsg(e.target.value), placeholder: "Platform-wide message…" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(Input, { value: variant, onChange: (e) => setVariant(e.target.value), placeholder: "info | warning | success", className: "max-w-xs" }),
        /* @__PURE__ */ jsx(Button, { onClick: create, children: "Publish" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: data.map((a) => /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 p-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm", children: a.message }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          a.variant,
          " · ",
          a.active ? "active" : "inactive"
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => toggle(a), children: a.active ? "Disable" : "Enable" })
    ] }, a.id)) })
  ] });
}
const randomCode = (prefix = "VEB") => `${prefix}-${Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("")}`;
function AdminAccessCodes() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ code: randomCode(), plan: "builder", credits: 100, runtime: 5e3, max: 1, notes: "" });
  const { data: codes = [] } = useQuery({
    queryKey: ["access-codes"],
    queryFn: async () => (await supabase.from("access_codes").select("*").order("created_at", { ascending: false })).data ?? []
  });
  const create = async () => {
    const { error } = await supabase.from("access_codes").insert({
      code: form.code.toUpperCase(),
      plan_granted: form.plan,
      credits_granted: form.credits,
      runtime_credits_granted: form.runtime,
      max_uses: form.max,
      notes: form.notes
    });
    if (error) return toast$1.error(error.message);
    toast$1.success("Code created");
    setForm({ ...form, code: randomCode(), notes: "" });
    qc.invalidateQueries({ queryKey: ["access-codes"] });
  };
  const toggle = async (c) => {
    await supabase.from("access_codes").update({ active: !c.active }).eq("id", c.id);
    qc.invalidateQueries({ queryKey: ["access-codes"] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Free Access Codes" }),
    /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 p-4 grid gap-3 md:grid-cols-3", children: [
      /* @__PURE__ */ jsx(Input, { value: form.code, onChange: (e) => setForm({ ...form, code: e.target.value }), placeholder: "Code" }),
      /* @__PURE__ */ jsx(Input, { value: form.plan, onChange: (e) => setForm({ ...form, plan: e.target.value }), placeholder: "Plan" }),
      /* @__PURE__ */ jsx(Input, { type: "number", value: form.credits, onChange: (e) => setForm({ ...form, credits: +e.target.value }), placeholder: "Build credits" }),
      /* @__PURE__ */ jsx(Input, { type: "number", value: form.runtime, onChange: (e) => setForm({ ...form, runtime: +e.target.value }), placeholder: "Runtime credits" }),
      /* @__PURE__ */ jsx(Input, { type: "number", value: form.max, onChange: (e) => setForm({ ...form, max: +e.target.value }), placeholder: "Max uses (0=∞)" }),
      /* @__PURE__ */ jsx(Input, { value: form.notes, onChange: (e) => setForm({ ...form, notes: e.target.value }), placeholder: "Notes" }),
      /* @__PURE__ */ jsx(Button, { onClick: create, className: "md:col-span-3", children: "Create code" })
    ] }),
    /* @__PURE__ */ jsx(Card, { className: "border-primary/20 p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "border-b border-primary/10 text-left text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "p-3", children: "Code" }),
        /* @__PURE__ */ jsx("th", { children: "Plan" }),
        /* @__PURE__ */ jsx("th", { children: "Credits" }),
        /* @__PURE__ */ jsx("th", { children: "Uses" }),
        /* @__PURE__ */ jsx("th", { children: "Notes" }),
        /* @__PURE__ */ jsx("th", {})
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: codes.map((c) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-primary/10", children: [
        /* @__PURE__ */ jsx("td", { className: "p-3 font-mono", children: c.code }),
        /* @__PURE__ */ jsx("td", { children: c.plan_granted }),
        /* @__PURE__ */ jsxs("td", { children: [
          c.credits_granted,
          "/",
          c.runtime_credits_granted,
          "rt"
        ] }),
        /* @__PURE__ */ jsxs("td", { children: [
          c.times_used,
          "/",
          c.max_uses || "∞"
        ] }),
        /* @__PURE__ */ jsx("td", { className: "text-xs text-muted-foreground", children: c.notes }),
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => toggle(c), children: c.active ? "Disable" : "Enable" }) })
      ] }, c.id)) })
    ] }) }) })
  ] });
}
function AdminAdmins() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: "", level: "admin", notes: "" });
  const { data: admins = [] } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => (await supabase.from("admin_users").select("*").order("created_at", { ascending: false })).data ?? []
  });
  const add = async () => {
    if (!form.email) return;
    const { data: prof } = await supabase.from("profiles").select("id, display_name, email").eq("email", form.email).maybeSingle();
    if (!prof) return toast$1.error("No user with that email — they must sign up first.");
    const { error } = await supabase.from("admin_users").insert([{
      user_id: prof.id,
      email: prof.email,
      name: prof.display_name,
      access_level: form.level,
      notes: form.notes
    }]);
    if (error) return toast$1.error(error.message);
    await supabase.from("profiles").update({ role: "admin" }).eq("id", prof.id);
    toast$1.success("Admin added");
    setForm({ email: "", level: "admin", notes: "" });
    qc.invalidateQueries({ queryKey: ["admins"] });
  };
  const remove = async (userId, level) => {
    if (level === "super_admin") return toast$1.error("Super admin can only be removed in DB");
    if (!confirm("Remove admin access?")) return;
    await supabase.from("admin_users").delete().eq("user_id", userId);
    await supabase.from("profiles").update({ role: "user" }).eq("id", userId);
    qc.invalidateQueries({ queryKey: ["admins"] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Admin Users" }),
    /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 p-4 grid gap-3 md:grid-cols-4", children: [
      /* @__PURE__ */ jsx(Input, { value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), placeholder: "user@email.com" }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: form.level,
          onChange: (e) => setForm({ ...form, level: e.target.value }),
          className: "rounded-md border border-input bg-background px-3 text-sm",
          children: [
            /* @__PURE__ */ jsx("option", { value: "admin", children: "admin" }),
            /* @__PURE__ */ jsx("option", { value: "support", children: "support" })
          ]
        }
      ),
      /* @__PURE__ */ jsx(Input, { value: form.notes, onChange: (e) => setForm({ ...form, notes: e.target.value }), placeholder: "Notes" }),
      /* @__PURE__ */ jsx(Button, { onClick: add, children: "Add admin" })
    ] }),
    /* @__PURE__ */ jsx(Card, { className: "border-primary/20 p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "border-b border-primary/10 text-left text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "p-3", children: "Email" }),
        /* @__PURE__ */ jsx("th", { children: "Name" }),
        /* @__PURE__ */ jsx("th", { children: "Level" }),
        /* @__PURE__ */ jsx("th", { children: "Last active" }),
        /* @__PURE__ */ jsx("th", { children: "Notes" }),
        /* @__PURE__ */ jsx("th", {})
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: admins.map((a) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-primary/10", children: [
        /* @__PURE__ */ jsx("td", { className: "p-3", children: a.email }),
        /* @__PURE__ */ jsx("td", { children: a.name }),
        /* @__PURE__ */ jsx("td", { className: "capitalize", children: a.access_level }),
        /* @__PURE__ */ jsx("td", { className: "text-xs", children: a.last_active ? new Date(a.last_active).toLocaleDateString() : "—" }),
        /* @__PURE__ */ jsx("td", { className: "text-xs text-muted-foreground", children: a.notes }),
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => remove(a.user_id, a.access_level), children: "Remove" }) })
      ] }, a.user_id)) })
    ] }) }) })
  ] });
}
const sevStyle = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  info: "bg-sky-500/15 text-sky-400 border-sky-500/30"
};
const sevIcon = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info
};
const typeLabel = {
  dispute: "Dispute",
  abuse: "Abuse",
  server_error: "500 Error",
  credit_anomaly: "Credit Anomaly",
  signup_abuse: "Signup Abuse",
  account_paused: "Account Paused",
  grace_period_expired: "Grace Expired",
  other: "Other"
};
const statusStyle = {
  new: "bg-cta/15 text-cta border-cta/30",
  reviewed: "bg-muted text-muted-foreground border-border",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
};
function AdminAlerts() {
  const { data: alerts, isLoading } = useAdminAlerts();
  const update = useUpdateAlert();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const filtered = useMemo(
    () => (alerts ?? []).filter((a) => filter === "all" ? true : a.status === filter),
    [alerts, filter]
  );
  useEffect(() => {
    if (selected && selected.status === "new") {
      update.mutate({ id: selected.id, patch: { status: "reviewed" } });
    }
    setNotes((selected == null ? void 0 : selected.action_notes) ?? "");
  }, [selected == null ? void 0 : selected.id]);
  const counts = useMemo(() => {
    const c = { all: 0, new: 0, reviewed: 0, resolved: 0 };
    (alerts ?? []).forEach((a) => {
      c.all++;
      c[a.status]++;
    });
    return c;
  }, [alerts]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Alerts" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "System alerts for disputes, abuse, errors and anomalies. Newest first." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: ["all", "new", "reviewed", "resolved"].map((s) => /* @__PURE__ */ jsxs(
      Button,
      {
        size: "sm",
        variant: filter === s ? "default" : "outline",
        onClick: () => setFilter(s),
        className: "capitalize",
        children: [
          s,
          " ",
          /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs opacity-70", children: counts[s] })
        ]
      },
      s
    )) }),
    isLoading ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Loading…" }) : filtered.length === 0 ? /* @__PURE__ */ jsx(Card, { className: "p-8 text-center text-sm text-muted-foreground", children: "No alerts. Everything looks good." }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: filtered.map((a) => {
      const Icon = sevIcon[a.severity];
      return /* @__PURE__ */ jsxs(
        Card,
        {
          className: `flex cursor-pointer items-start gap-3 p-4 transition hover:border-cta/40 ${a.status === "new" ? "border-cta/30 bg-cta/[0.02]" : ""}`,
          onClick: () => setSelected(a),
          children: [
            /* @__PURE__ */ jsx("div", { className: `mt-0.5 rounded-md border p-1.5 ${sevStyle[a.severity]}`, children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                /* @__PURE__ */ jsx(Badge, { variant: "outline", className: sevStyle[a.severity], children: a.severity }),
                /* @__PURE__ */ jsx(Badge, { variant: "outline", children: typeLabel[a.alert_type] }),
                /* @__PURE__ */ jsx(Badge, { variant: "outline", className: statusStyle[a.status], children: a.status }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: formatDistanceToNow(new Date(a.created_at), { addSuffix: true }) })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-sm", children: a.description }),
              a.affected_user_email && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
                "User: ",
                a.affected_user_email,
                a.affected_user_id ? ` · ${a.affected_user_id.slice(0, 8)}…` : ""
              ] })
            ] })
          ]
        },
        a.id
      );
    }) }),
    /* @__PURE__ */ jsx(Dialog, { open: !!selected, onOpenChange: (o) => !o && setSelected(null), children: /* @__PURE__ */ jsx(DialogContent, { className: "max-w-lg", children: selected && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" }),
        " Alert detail"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: sevStyle[selected.severity], children: selected.severity }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", children: typeLabel[selected.alert_type] }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: statusStyle[selected.status], children: selected.status })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "What happened" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1", children: selected.description })
        ] }),
        selected.affected_user_email && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Affected user" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 font-mono text-xs", children: [
            selected.affected_user_email,
            selected.affected_user_id ? ` · ${selected.affected_user_id}` : ""
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Created" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1", children: new Date(selected.created_at).toLocaleString() })
        ] }),
        selected.metadata && Object.keys(selected.metadata).length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Metadata" }),
          /* @__PURE__ */ jsx("pre", { className: "mt-1 max-h-40 overflow-auto rounded bg-muted/40 p-2 text-xs", children: JSON.stringify(selected.metadata, null, 2) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Action notes" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: notes,
              onChange: (e) => setNotes(e.target.value),
              placeholder: "What did you do about this?",
              className: "mt-1",
              rows: 3
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "flex-wrap gap-2", children: [
        selected.alert_type === "account_paused" && selected.affected_user_id && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              className: "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10",
              onClick: async () => {
                const { error } = await supabase.rpc("resume_account", {
                  _uid: selected.affected_user_id,
                  _notes: notes || null
                });
                if (error) return toast$1.error(error.message);
                toast$1.success("Account resumed");
                update.mutate(
                  { id: selected.id, patch: { status: "resolved", action_notes: notes || "Resumed" } },
                  { onSuccess: () => setSelected(null) }
                );
              },
              children: [
                /* @__PURE__ */ jsx(Play, { className: "mr-2 h-4 w-4" }),
                " Resume Account"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              className: "border-red-500/40 text-red-300 hover:bg-red-500/10",
              onClick: async () => {
                if (!confirm("Permanently suspend this account?")) return;
                const { error } = await supabase.from("account_flags").insert({
                  user_id: selected.affected_user_id,
                  flag_type: "suspended",
                  triggered_by: "admin",
                  reason: notes || "Manual suspension"
                });
                if (error) return toast$1.error(error.message);
                toast$1.success("Account suspended");
                update.mutate(
                  { id: selected.id, patch: { status: "resolved", action_notes: `Suspended. ${notes}` } },
                  { onSuccess: () => setSelected(null) }
                );
              },
              children: [
                /* @__PURE__ */ jsx(Ban, { className: "mr-2 h-4 w-4" }),
                " Suspend Account"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            onClick: () => update.mutate(
              { id: selected.id, patch: { action_notes: notes } },
              { onSuccess: () => setSelected(null) }
            ),
            children: "Save notes"
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            onClick: () => update.mutate(
              { id: selected.id, patch: { status: "resolved", action_notes: notes } },
              { onSuccess: () => setSelected(null) }
            ),
            children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-2 h-4 w-4" }),
              " Resolve"
            ]
          }
        )
      ] })
    ] }) }) })
  ] });
}
const PLAN_LIMITS = {
  free: { build: 20, runtime: 300 },
  starter: { build: 100, runtime: 2500 },
  builder: { build: 300, runtime: 1e4 },
  pro: { build: 800, runtime: 3e4 },
  agency: { build: 2e3, runtime: 1e5 }
};
function StatCard({ label, value, icon: Icon }) {
  return /* @__PURE__ */ jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wider text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold", children: value })
    ] }),
    /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5 text-cta" })
  ] }) });
}
function AdminUsage() {
  const { data: users = [] } = useQuery({
    queryKey: ["admin-usage-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, email, plan, build_credits, runtime_credits, monthly_build_limit, monthly_runtime_limit, updated_at, created_at").order("updated_at", { ascending: false }).limit(500);
      return data ?? [];
    }
  });
  const { data: siteCounts = {} } = useQuery({
    queryKey: ["admin-usage-sites"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("user_id").limit(5e3);
      const m = {};
      (data ?? []).forEach((r) => {
        m[r.user_id] = (m[r.user_id] ?? 0) + 1;
      });
      return m;
    }
  });
  const { data: txns = [] } = useQuery({
    queryKey: ["admin-usage-txns"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const { data } = await supabase.from("credit_transactions").select("user_id, credit_kind, transaction_type, amount_changed, created_at").gte("created_at", since).limit(1e4);
      return data ?? [];
    }
  });
  const { data: pauses = [] } = useQuery({
    queryKey: ["admin-usage-pauses"],
    queryFn: async () => {
      const { data } = await supabase.from("account_flags").select("user_id, flag_type, reason, triggered_at").is("resolved_at", null).limit(50);
      return data ?? [];
    }
  });
  const monthAgo = Date.now() - 30 * 864e5;
  const userStats = useMemo(() => {
    const stats = {};
    txns.forEach((t) => {
      const ts = new Date(t.created_at).getTime();
      if (ts < monthAgo) return;
      stats[t.user_id] = stats[t.user_id] ?? { runtime: 0, api: 0, lastActive: 0 };
      if (t.credit_kind === "runtime" && t.transaction_type === "deduction") {
        stats[t.user_id].runtime += -(t.amount_changed ?? 0);
      }
      stats[t.user_id].api += 1;
      if (ts > stats[t.user_id].lastActive) stats[t.user_id].lastActive = ts;
    });
    return stats;
  }, [txns]);
  const topUsers = useMemo(() => {
    return [...users].map((u) => {
      var _a, _b, _c;
      return {
        ...u,
        sites: siteCounts[u.id] ?? 0,
        runtimeUsed: ((_a = userStats[u.id]) == null ? void 0 : _a.runtime) ?? 0,
        apiCalls: ((_b = userStats[u.id]) == null ? void 0 : _b.api) ?? 0,
        lastActive: ((_c = userStats[u.id]) == null ? void 0 : _c.lastActive) ?? new Date(u.updated_at).getTime()
      };
    }).sort((a, b) => b.sites - a.sites || b.runtimeUsed - a.runtimeUsed).slice(0, 20);
  }, [users, siteCounts, userStats]);
  const highUsageUsers = useMemo(() => {
    const flagged = [];
    const sorted = [...users].map((u) => {
      var _a;
      return {
        ...u,
        runtime: ((_a = userStats[u.id]) == null ? void 0 : _a.runtime) ?? 0
      };
    }).sort((a, b) => b.runtime - a.runtime);
    const top1pctCutoff = Math.max(1, Math.floor(sorted.length * 0.01));
    const top1pct = new Set(sorted.slice(0, top1pctCutoff).map((u) => u.id));
    users.forEach((u) => {
      var _a;
      const lim = PLAN_LIMITS[u.plan] ?? PLAN_LIMITS.free;
      const runtimeUsed = ((_a = userStats[u.id]) == null ? void 0 : _a.runtime) ?? 0;
      const reasons = [];
      if (runtimeUsed > 0.8 * lim.runtime) reasons.push(`${Math.round(100 * runtimeUsed / lim.runtime)}% runtime`);
      if (top1pct.has(u.id) && runtimeUsed > 0) reasons.push("Top 1% runtime");
      const buildPct = (lim.build - u.build_credits) / lim.build;
      if (buildPct > 0.8) reasons.push(`${Math.round(100 * buildPct)}% build`);
      if (reasons.length) flagged.push({ ...u, reasons, runtimeUsed });
    });
    return flagged.slice(0, 12);
  }, [users, userStats]);
  const dailySeries = useMemo(() => {
    const buckets = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
      buckets[d] = { date: d.slice(5), gens: 0, runtime: 0, users: /* @__PURE__ */ new Set() };
    }
    txns.forEach((t) => {
      const d = t.created_at.slice(0, 10);
      const b = buckets[d];
      if (!b) return;
      b.users.add(t.user_id);
      if (t.transaction_type === "deduction") {
        if (t.credit_kind === "build") b.gens += 1;
        if (t.credit_kind === "runtime") b.runtime += -(t.amount_changed ?? 0);
      }
    });
    return Object.values(buckets).map((b) => ({
      date: b.date,
      gens: b.gens,
      runtime: b.runtime,
      dau: b.users.size
    }));
  }, [txns]);
  const todayStart = /* @__PURE__ */ new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = txns.filter((t) => new Date(t.created_at) >= todayStart);
  const todayGens = today.filter((t) => t.credit_kind === "build" && t.transaction_type === "deduction").length;
  const todayRuntime = today.filter((t) => t.credit_kind === "runtime" && t.transaction_type === "deduction").reduce((s, t) => s + -(t.amount_changed ?? 0), 0);
  const resumeUser = async (userId) => {
    const notes = prompt("Resume notes (optional):", "");
    const { error } = await supabase.rpc("resume_account", { _uid: userId, _notes: notes });
    if (error) toast$1.error(error.message);
    else toast$1.success("Account resumed");
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Usage Analytics" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Platform health, top users, abuse signals." })
    ] }),
    pauses.length > 0 && /* @__PURE__ */ jsxs(Card, { className: "border-red-500/40 bg-red-500/[0.06] p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-red-300", children: [
        /* @__PURE__ */ jsx(Pause, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
          pauses.length,
          " account(s) auto-paused — needs review"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 space-y-1.5 text-sm", children: pauses.slice(0, 5).map((p) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-red-100", children: [
          /* @__PURE__ */ jsxs("code", { className: "text-xs", children: [
            p.user_id.slice(0, 8),
            "…"
          ] }),
          " — ",
          p.reason
        ] }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => resumeUser(p.user_id), children: "Resume" })
      ] }, p.user_id + p.triggered_at)) })
    ] }),
    highUsageUsers.length > 0 && /* @__PURE__ */ jsxs(Card, { className: "border-amber-500/40 bg-amber-500/[0.05] p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center gap-2 text-amber-300", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "High usage signals" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-2 md:grid-cols-2", children: highUsageUsers.map((u) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded border border-amber-500/20 bg-background/40 p-2 text-xs", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: u.email }),
          /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
            "Plan: ",
            u.plan
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: u.reasons.map((r) => /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: r }, r)) })
      ] }, u.id)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-4", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Generations today", value: todayGens, icon: Zap }),
      /* @__PURE__ */ jsx(StatCard, { label: "Runtime credits today", value: todayRuntime.toLocaleString(), icon: Activity }),
      /* @__PURE__ */ jsx(StatCard, { label: "Total users", value: users.length, icon: Users }),
      /* @__PURE__ */ jsx(StatCard, { label: "Avg credits / user / day", value: (txns.length / Math.max(1, users.length) / 30).toFixed(1), icon: TrendingUp })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxs(Card, { className: "p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "mb-2 text-sm font-semibold", children: "Daily generations — last 30 days" }),
        /* @__PURE__ */ jsx("div", { className: "h-56", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(BarChart, { data: dailySeries, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: { fontSize: 10 } }),
          /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 10 } }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Bar, { dataKey: "gens", fill: "hsl(var(--primary))" })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "mb-2 text-sm font-semibold", children: "Daily runtime credits — last 30 days" }),
        /* @__PURE__ */ jsx("div", { className: "h-56", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(LineChart, { data: dailySeries, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: { fontSize: 10 } }),
          /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 10 } }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "runtime", stroke: "hsl(var(--cta))", dot: false })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "p-0", children: [
      /* @__PURE__ */ jsx("div", { className: "border-b p-4", children: /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Top 20 users" }) }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b text-left text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "p-3", children: "Email" }),
          /* @__PURE__ */ jsx("th", { children: "Plan" }),
          /* @__PURE__ */ jsx("th", { children: "Sites" }),
          /* @__PURE__ */ jsx("th", { children: "Runtime used" }),
          /* @__PURE__ */ jsx("th", { children: "API calls" }),
          /* @__PURE__ */ jsx("th", { children: "Last active" }),
          /* @__PURE__ */ jsx("th", {})
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: topUsers.map((u) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/40", children: [
          /* @__PURE__ */ jsx("td", { className: "p-3", children: u.email }),
          /* @__PURE__ */ jsx("td", { className: "capitalize", children: u.plan }),
          /* @__PURE__ */ jsx("td", { children: u.sites }),
          /* @__PURE__ */ jsx("td", { children: u.runtimeUsed.toLocaleString() }),
          /* @__PURE__ */ jsx("td", { children: u.apiCalls }),
          /* @__PURE__ */ jsx("td", { className: "text-xs text-muted-foreground", children: u.lastActive ? new Date(u.lastActive).toLocaleDateString() : "—" }),
          /* @__PURE__ */ jsx("td", { className: "space-x-2 py-2", children: /* @__PURE__ */ jsx(Link, { to: "/admin/users", className: "text-xs text-cta underline", children: "View" }) })
        ] }, u.id)) })
      ] }) })
    ] })
  ] });
}
const SECTIONS = [
  {
    id: "billing",
    title: "Account & Billing",
    tests: [
      { key: "signup_trigger", label: "New user profile creation", description: "Verifies signup trigger creates profile with default credits (free plan)." },
      { key: "plan_caps_seeded", label: "Plan caps configured", description: "All 5 plans (free/starter/builder/pro/agency) have correct credit allocations." },
      { key: "feature_gates", label: "Feature gate matrix", description: "Search Atlas/priority queue/white label unlocked at correct tiers." },
      { key: "stripe_products", label: "Stripe subscription products active", description: "All 4 paid tiers have active Stripe products configured." },
      { key: "topup_packs", label: "Top-up packs configured", description: "Starter ($19), Growth ($39), Agency ($69) packs match spec." },
      { key: "stripe_events_idempotency", label: "Webhook idempotency table", description: "stripe_events table prevents duplicate webhook processing." },
      { key: "grace_period_function", label: "Grace period downgrade job", description: "downgrade_past_due_users RPC is callable (cron daily)." }
    ]
  },
  {
    id: "credits",
    title: "Credits & Audit Trail",
    tests: [
      { key: "credit_consume_rpc", label: "Atomic credit consumption", description: "check_and_consume RPC handles plan/rate/credit checks in one transaction." },
      { key: "refund_credits_rpc", label: "Refund credits RPC", description: "refund_credits writes audit row and updates balance." },
      { key: "credit_transactions_audit", label: "Credit transaction audit log", description: "All deductions/refunds logged with before/after balances." }
    ]
  },
  {
    id: "abuse",
    title: "Admin & Abuse Detection",
    tests: [
      { key: "admin_alerts_table", label: "Admin alerts pipeline", description: "Critical events route to /admin/alerts." },
      { key: "account_flags_table", label: "Account flag system", description: "Pause/suspend mechanism wired up." },
      { key: "abuse_detection", label: "Hourly abuse detection", description: "detect_abuse_and_pause RPC runs without errors." }
    ]
  },
  {
    id: "security",
    title: "Security",
    tests: [
      { key: "secrets_present", label: "Required secrets configured", description: "Stripe, AI gateway, and service role keys present in edge runtime." },
      { key: "rls_anonymous_blocked", label: "RLS blocks anonymous reads", description: "Anonymous clients cannot read profiles or admin_alerts." }
    ]
  }
];
function StatusBadge({ s }) {
  if (s === "pass") return /* @__PURE__ */ jsxs(Badge, { className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15", children: [
    /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-1 h-3 w-3" }),
    "Pass"
  ] });
  if (s === "fail") return /* @__PURE__ */ jsxs(Badge, { className: "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/15", children: [
    /* @__PURE__ */ jsx(XCircle, { className: "mr-1 h-3 w-3" }),
    "Fail"
  ] });
  if (s === "running") return /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
    /* @__PURE__ */ jsx(Loader2, { className: "mr-1 h-3 w-3 animate-spin" }),
    "Running"
  ] });
  return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-muted-foreground", children: [
    /* @__PURE__ */ jsx(Circle, { className: "mr-1 h-3 w-3" }),
    "Not tested"
  ] });
}
function AdminLaunchTests() {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(/* @__PURE__ */ new Set());
  const { data: latest, refetch } = useQuery({
    queryKey: ["launch-test-latest"],
    queryFn: async () => {
      const { data, error } = await supabase.from("launch_test_results").select("test_key,status,error_message,details,created_at").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    }
  });
  useEffect(() => {
    if (!latest) return;
    const map = {};
    for (const row of latest) if (!map[row.test_key]) map[row.test_key] = row;
    setResults((prev) => ({ ...map, ...prev }));
  }, [latest]);
  async function runTest(test_key, section) {
    setRunning((s) => new Set(s).add(test_key));
    setResults((r) => ({ ...r, [test_key]: { ...r[test_key] ?? {}, test_key, status: "running", error_message: null, details: null, created_at: (/* @__PURE__ */ new Date()).toISOString() } }));
    try {
      const { data, error } = await supabase.functions.invoke("launch-tests", {
        body: { test_key, section }
      });
      if (error) throw error;
      const r = data;
      setResults((prev) => ({
        ...prev,
        [test_key]: { test_key, status: r.status, error_message: r.error ?? null, details: r.details, created_at: (/* @__PURE__ */ new Date()).toISOString() }
      }));
    } catch (e) {
      setResults((prev) => ({
        ...prev,
        [test_key]: { test_key, status: "fail", error_message: (e == null ? void 0 : e.message) ?? String(e), details: null, created_at: (/* @__PURE__ */ new Date()).toISOString() }
      }));
    } finally {
      setRunning((s) => {
        const n = new Set(s);
        n.delete(test_key);
        return n;
      });
      refetch();
    }
  }
  async function runSection(section) {
    for (const t of section.tests) await runTest(t.key, section.id);
  }
  async function runAll() {
    for (const s of SECTIONS) await runSection(s);
  }
  const total = SECTIONS.reduce((n, s) => n + s.tests.length, 0);
  const passed = Object.values(results).filter((r) => r.status === "pass").length;
  const failed = Object.values(results).filter((r) => r.status === "fail").length;
  const tested = Object.values(results).filter((r) => r.status === "pass" || r.status === "fail").length;
  const pct = Math.round(passed / total * 100);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2 text-2xl font-bold", children: [
          /* @__PURE__ */ jsx(FlaskConical, { className: "h-6 w-6 text-cta" }),
          "Launch Tests"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Pre-launch QA control center. Read-only diagnostics against the live system." })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: runAll, className: "bg-cta text-cta-foreground hover:bg-cta/90", children: [
        /* @__PURE__ */ jsx(Play, { className: "mr-2 h-4 w-4" }),
        "Run all tests"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: [
      /* @__PURE__ */ jsx(SummaryCard, { label: "Total", value: total }),
      /* @__PURE__ */ jsx(SummaryCard, { label: "Passed", value: passed, tone: "pass" }),
      /* @__PURE__ */ jsx(SummaryCard, { label: "Failed", value: failed, tone: "fail" }),
      /* @__PURE__ */ jsx(SummaryCard, { label: "Coverage", value: `${tested}/${total} (${pct}%)` })
    ] }),
    SECTIONS.map((section) => {
      const sPass = section.tests.filter((t) => {
        var _a;
        return ((_a = results[t.key]) == null ? void 0 : _a.status) === "pass";
      }).length;
      return /* @__PURE__ */ jsxs(Card, { className: "border-primary/10", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg", children: [
            section.title,
            /* @__PURE__ */ jsxs("span", { className: "ml-2 text-xs font-normal text-muted-foreground", children: [
              sPass,
              "/",
              section.tests.length,
              " passing"
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => runSection(section), children: [
            /* @__PURE__ */ jsx(Play, { className: "mr-2 h-3 w-3" }),
            "Run section"
          ] })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "space-y-2", children: section.tests.map((t) => {
          const r = results[t.key];
          const status = running.has(t.key) ? "running" : (r == null ? void 0 : r.status) ?? "not_tested";
          return /* @__PURE__ */ jsx("div", { className: "rounded-md border border-primary/10 bg-card/50 p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: t.label }),
                /* @__PURE__ */ jsx(StatusBadge, { s: status })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: t.description }),
              (r == null ? void 0 : r.error_message) && /* @__PURE__ */ jsx("p", { className: "mt-2 rounded bg-red-500/10 px-2 py-1 text-xs text-red-400", children: r.error_message }),
              (r == null ? void 0 : r.details) && Object.keys(r.details).length > 0 && /* @__PURE__ */ jsxs("details", { className: "mt-1 text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsx("summary", { className: "cursor-pointer", children: "Details" }),
                /* @__PURE__ */ jsx("pre", { className: "mt-1 overflow-x-auto rounded bg-background/50 p-2 text-[11px]", children: JSON.stringify(r.details, null, 2) })
              ] }),
              (r == null ? void 0 : r.created_at) && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-[10px] text-muted-foreground/70", children: [
                "Last run: ",
                new Date(r.created_at).toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => runTest(t.key, section.id), disabled: running.has(t.key), children: running.has(t.key) ? /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Play, { className: "mr-1 h-3 w-3" }),
              "Run"
            ] }) })
          ] }) }, t.key);
        }) })
      ] }, section.id);
    })
  ] });
}
function SummaryCard({ label, value, tone }) {
  const color = tone === "pass" ? "text-emerald-400" : tone === "fail" ? "text-red-400" : "text-foreground";
  return /* @__PURE__ */ jsx(Card, { className: "border-primary/10", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wider text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: `mt-1 text-2xl font-bold ${color}`, children: value })
  ] }) });
}
class ErrorBoundary extends Component {
  constructor() {
    super(...arguments);
    __publicField(this, "state", { error: null });
    __publicField(this, "handleReload", () => {
      this.setState({ error: null });
      window.location.reload();
    });
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  async componentDidCatch(error, info) {
    var _a, _b, _c, _d, _e;
    try {
      const { data } = await supabase.auth.getUser();
      await supabase.from("admin_alerts").insert({
        alert_type: "frontend_crash",
        severity: "warning",
        affected_user_id: ((_a = data == null ? void 0 : data.user) == null ? void 0 : _a.id) ?? null,
        affected_user_email: ((_b = data == null ? void 0 : data.user) == null ? void 0 : _b.email) ?? null,
        description: `Frontend crash: ${((_c = error.message) == null ? void 0 : _c.slice(0, 200)) ?? "unknown"}`,
        metadata: {
          stack: (_d = error.stack) == null ? void 0 : _d.slice(0, 2e3),
          componentStack: (_e = info.componentStack) == null ? void 0 : _e.slice(0, 2e3),
          url: typeof window !== "undefined" ? window.location.href : null
        }
      });
    } catch {
    }
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return /* @__PURE__ */ jsx("div", { className: "flex min-h-[60vh] items-center justify-center p-6", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-lg border border-destructive/30 bg-card p-6 text-center shadow-lg", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "h-6 w-6 text-destructive" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Something went wrong" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "We hit an unexpected error. Your work is safe — try reloading the page." }),
      this.state.error.message && /* @__PURE__ */ jsx("p", { className: "mt-3 rounded bg-muted/30 px-3 py-2 text-left text-xs text-muted-foreground", children: this.state.error.message }),
      /* @__PURE__ */ jsxs(Button, { onClick: this.handleReload, className: "mt-5 w-full", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
        " Reload page"
      ] })
    ] }) });
  }
}
function getAccess(plan, isAdmin = false) {
  if (isAdmin) {
    return {
      plan,
      isAdmin: true,
      fullScores: true,
      topAndLowPages: true,
      keywordOpportunities: true,
      technicalAudit: true,
      mobileSpeed: true,
      contentClusterEngine: true,
      internalLinkingMap: true,
      blogClusterSuggestions: true,
      automationInsights: true,
      gscIntegration: true,
      gaIntegration: true,
      multiClient: true,
      whiteLabel: true,
      pdfExport: true,
      monthlyGrowthEmail: true,
      aiRecommendationsPerMonth: -1,
      visibleIssues: 999,
      upgradeTo: null
    };
  }
  switch (plan) {
    case "free":
    case "starter":
      return {
        plan,
        isAdmin: false,
        fullScores: false,
        topAndLowPages: false,
        keywordOpportunities: false,
        technicalAudit: false,
        mobileSpeed: false,
        contentClusterEngine: false,
        internalLinkingMap: false,
        blogClusterSuggestions: false,
        automationInsights: false,
        gscIntegration: false,
        gaIntegration: false,
        multiClient: false,
        whiteLabel: false,
        pdfExport: false,
        monthlyGrowthEmail: false,
        aiRecommendationsPerMonth: 0,
        visibleIssues: 3,
        upgradeTo: "builder"
      };
    case "builder":
      return {
        plan,
        isAdmin: false,
        fullScores: true,
        topAndLowPages: true,
        keywordOpportunities: true,
        technicalAudit: true,
        mobileSpeed: true,
        contentClusterEngine: false,
        internalLinkingMap: false,
        blogClusterSuggestions: false,
        automationInsights: false,
        gscIntegration: false,
        gaIntegration: false,
        multiClient: false,
        whiteLabel: false,
        pdfExport: false,
        monthlyGrowthEmail: false,
        aiRecommendationsPerMonth: 5,
        visibleIssues: 999,
        upgradeTo: "pro"
      };
    case "pro":
      return {
        plan,
        isAdmin: false,
        fullScores: true,
        topAndLowPages: true,
        keywordOpportunities: true,
        technicalAudit: true,
        mobileSpeed: true,
        contentClusterEngine: true,
        internalLinkingMap: true,
        blogClusterSuggestions: true,
        automationInsights: true,
        gscIntegration: true,
        gaIntegration: true,
        multiClient: false,
        whiteLabel: false,
        pdfExport: false,
        monthlyGrowthEmail: true,
        aiRecommendationsPerMonth: -1,
        visibleIssues: 999,
        upgradeTo: "agency"
      };
    case "agency":
      return {
        plan,
        isAdmin: false,
        fullScores: true,
        topAndLowPages: true,
        keywordOpportunities: true,
        technicalAudit: true,
        mobileSpeed: true,
        contentClusterEngine: true,
        internalLinkingMap: true,
        blogClusterSuggestions: true,
        automationInsights: true,
        gscIntegration: true,
        gaIntegration: true,
        multiClient: true,
        whiteLabel: true,
        pdfExport: true,
        monthlyGrowthEmail: true,
        aiRecommendationsPerMonth: -1,
        visibleIssues: 999,
        upgradeTo: null
      };
  }
}
function scoreColor(value) {
  if (value <= 40) return "#EF4444";
  if (value <= 70) return "#F59E0B";
  return "#10B981";
}
function Optimize() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const { data: profile } = useProfile();
  const { data: adminLevel } = useAdmin();
  const access = getAccess((profile == null ? void 0 : profile.plan) ?? "free", !!adminLevel);
  const { data: projects } = useQuery({
    queryKey: ["optimization-projects", user == null ? void 0 : user.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("optimization_projects").select("id, user_id, website_url, name, status, last_analyzed_at, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });
  const createMut = useMutation({
    mutationFn: async (websiteUrl) => {
      if (!user) throw new Error("Not signed in");
      if (!access.multiClient && ((projects == null ? void 0 : projects.length) ?? 0) >= 1) {
        throw new Error("Multi-site management is an Agency feature. Upgrade to add unlimited client sites.");
      }
      let normalized = websiteUrl.trim();
      if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
      const host = new URL(normalized).hostname.replace(/^www\./, "");
      const { data, error } = await supabase.from("optimization_projects").insert({ user_id: user.id, website_url: normalized, name: host }).select().single();
      if (error) {
        const m = error.message || "";
        const cap = m.match(/storage_limit:[^:]+:(\d+):(\w+)/);
        if (cap) {
          throw new Error(`You've reached your plan limit of ${cap[1]} site${cap[1] === "1" ? "" : "s"} on the ${cap[2]} plan. Upgrade to add more.`);
        }
        throw error;
      }
      return data;
    },
    onSuccess: (p) => {
      setUrl("");
      qc.invalidateQueries({ queryKey: ["optimization-projects"] });
      toast$1.success("Site added");
      window.location.href = `/app/optimize/${p.id}`;
    },
    onError: (e) => toast$1.error(e instanceof Error ? e.message : "Failed to add site")
  });
  const deleteMut = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("optimization_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["optimization-projects"] });
      toast$1.success("Removed");
    }
  });
  return /* @__PURE__ */ jsxs("div", { className: "container max-w-5xl py-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Website optimization" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Connect your existing site and let AI analyze SEO, growth opportunities, and automation gaps." })
    ] }),
    /* @__PURE__ */ jsx(Card, { className: "p-5", children: /* @__PURE__ */ jsxs(
      "form",
      {
        onSubmit: (e) => {
          e.preventDefault();
          if (!url.trim()) return;
          createMut.mutate(url);
        },
        className: "flex flex-col gap-3 sm:flex-row",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-center gap-2 rounded-md border bg-background px-3", children: [
            /* @__PURE__ */ jsx(Globe, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "text",
                placeholder: "yourwebsite.com",
                value: url,
                onChange: (e) => setUrl(e.target.value),
                className: "border-0 px-0 shadow-none focus-visible:ring-0"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: createMut.isPending, children: [
            /* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }),
            createMut.isPending ? "Adding…" : "Add site"
          ] })
        ]
      }
    ) }),
    !access.multiClient && ((projects == null ? void 0 : projects.length) ?? 0) >= 1 && /* @__PURE__ */ jsxs(Card, { className: "mt-4 flex items-start gap-3 border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-500/5", children: [
      /* @__PURE__ */ jsx(Lock, { className: "mt-0.5 h-4 w-4 text-amber-600" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "Want to optimize multiple client sites?" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "The Agency plan ($199/mo) unlocks multi-client workspaces, white-label reports, and PDF exports." })
      ] }),
      /* @__PURE__ */ jsxs(Link, { to: "/app/billing", className: "inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }),
        " Upgrade"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-4 text-lg font-semibold", children: "Connected sites" }),
      !projects || projects.length === 0 ? /* @__PURE__ */ jsxs(Card, { className: "border-dashed py-14 text-center", children: [
        /* @__PURE__ */ jsx(BarChart3, { className: "mx-auto h-9 w-9 text-muted-foreground" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 font-medium", children: "No sites yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Add a website above to get an AI optimization report." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: projects.map((p) => /* @__PURE__ */ jsx(Card, { className: "group p-5 transition-shadow hover:shadow-elevated", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxs(Link, { to: `/app/optimize/${p.id}`, className: "block", children: [
            /* @__PURE__ */ jsx("h3", { className: "truncate font-semibold group-hover:text-primary", children: p.name }),
            /* @__PURE__ */ jsx("p", { className: "truncate text-xs text-muted-foreground", children: p.website_url })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-2 text-xs", children: [
            /* @__PURE__ */ jsx(StatusPill, { status: p.status }),
            p.last_analyzed_at && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              "Last run ",
              format(new Date(p.last_analyzed_at), "MMM d, h:mm a")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, size: "sm", variant: "ghost", children: /* @__PURE__ */ jsxs(Link, { to: `/app/optimize/${p.id}`, children: [
            "Open ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "ml-1 h-3.5 w-3.5" })
          ] }) }),
          /* @__PURE__ */ jsx(
            Button,
            {
              size: "icon",
              variant: "ghost",
              onClick: () => deleteMut.mutate(p.id),
              "aria-label": "Remove",
              children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4 text-muted-foreground" })
            }
          )
        ] })
      ] }) }, p.id)) })
    ] })
  ] });
}
function StatusPill({ status }) {
  const map = {
    pending: { label: "Not analyzed", className: "bg-muted text-muted-foreground" },
    analyzing: { label: "Analyzing…", className: "bg-warning/15 text-warning" },
    ready: { label: "Ready", className: "bg-primary/15 text-primary" },
    error: { label: "Error", className: "bg-destructive/15 text-destructive" }
  };
  const v = map[status] ?? map.pending;
  return /* @__PURE__ */ jsx("span", { className: `inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${v.className}`, children: v.label });
}
function exportReportPDF(opts) {
  var _a, _b, _c, _d, _e, _f, _g;
  const { siteName, websiteUrl, report, whiteLabel } = opts;
  const doc = new jsPDF();
  const brand = (whiteLabel == null ? void 0 : whiteLabel.agencyName) || "Virtual Engine Builder";
  const tagline = (whiteLabel == null ? void 0 : whiteLabel.agencyTagline) || "AI Business Growth Infrastructure";
  doc.setFillColor(8, 13, 24);
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(brand, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(132, 204, 22);
  doc.text(tagline, 14, 24);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text((/* @__PURE__ */ new Date()).toLocaleDateString(), 196, 16, { align: "right" });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.text("Website Optimization Report", 14, 50);
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(siteName, 14, 58);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(websiteUrl, 14, 64);
  const scores = [
    ["SEO", ((_a = report.scores) == null ? void 0 : _a.seo) ?? 0],
    ["Mobile", ((_b = report.scores) == null ? void 0 : _b.mobile) ?? 0],
    ["Speed", ((_c = report.scores) == null ? void 0 : _c.speed) ?? 0],
    ["Conversion", ((_d = report.scores) == null ? void 0 : _d.conversion) ?? 0]
  ];
  let y = 76;
  doc.setFontSize(13);
  doc.setTextColor(20);
  doc.text("Scores", 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Score / 100"]],
    body: scores.map(([k, v]) => [k, String(v)]),
    theme: "striped",
    headStyles: { fillColor: [16, 185, 129] }
  });
  y = ((_e = doc.lastAutoTable) == null ? void 0 : _e.finalY) ?? y + 30;
  y += 10;
  doc.setFontSize(13);
  doc.text("Executive summary", 14, y);
  y += 5;
  doc.setFontSize(10);
  doc.setTextColor(60);
  const lines = doc.splitTextToSize(report.summary || "—", 180);
  doc.text(lines, 14, y);
  y += lines.length * 5 + 6;
  if ((_f = report.aiRecommendations) == null ? void 0 : _f.length) {
    doc.setFontSize(13);
    doc.setTextColor(20);
    doc.text("AI recommendations", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Impact", "Title", "Detail"]],
      body: report.aiRecommendations.map((r) => [r.impact, r.title, r.body]),
      headStyles: { fillColor: [8, 13, 24] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 50 } }
    });
  }
  if ((_g = report.keywordOpportunities) == null ? void 0 : _g.length) {
    autoTable(doc, {
      head: [["Keyword opportunity", "Volume", "Difficulty"]],
      body: report.keywordOpportunities.map((k) => [k.keyword, String(k.volume), String(k.difficulty)]),
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 9 }
    });
  }
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated by ${brand} • Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
  }
  doc.save(`${siteName.replace(/[^a-z0-9]+/gi, "-")}-optimization-report.pdf`);
}
function ScoreRing({ value, label, size = 120 }) {
  const v = Math.max(0, Math.min(100, Math.round(value || 0)));
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      setAnimated(Math.round(p * v));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [v]);
  const color = scoreColor(v);
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - animated / 100 * c;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative", style: { width: size, height: size }, children: [
      /* @__PURE__ */ jsxs("svg", { width: size, height: size, className: "-rotate-90", children: [
        /* @__PURE__ */ jsx("circle", { cx: size / 2, cy: size / 2, r, stroke: "rgba(255,255,255,0.06)", strokeWidth: stroke, fill: "none" }),
        /* @__PURE__ */ jsx(
          "circle",
          {
            cx: size / 2,
            cy: size / 2,
            r,
            stroke: color,
            strokeWidth: stroke,
            fill: "none",
            strokeLinecap: "round",
            strokeDasharray: c,
            strokeDashoffset: offset,
            style: { transition: "stroke-dashoffset 80ms linear", filter: `drop-shadow(0 0 8px ${color}55)` }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [
        /* @__PURE__ */ jsx("span", { className: "text-3xl font-bold tabular-nums", style: { color }, children: animated }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wider text-white/50", children: "/ 100" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("span", { className: "text-xs font-medium uppercase tracking-wider text-white/70", children: label })
  ] });
}
function ClusterMap({ clusters, onGenerate }) {
  const [active, setActive] = useState(null);
  if (!clusters || clusters.length === 0) {
    return /* @__PURE__ */ jsx("p", { className: "text-sm text-white/40", children: "No content clusters yet." });
  }
  const w = 900, h = 560, cx = w / 2, cy = h / 2;
  const N = clusters.length;
  const pillarR = 200;
  return /* @__PURE__ */ jsxs("div", { className: "relative w-full overflow-x-auto", children: [
    /* @__PURE__ */ jsxs("svg", { viewBox: `0 0 ${w} ${h}`, className: "w-full", style: { minWidth: 700 }, children: [
      /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("radialGradient", { id: "coreGlow", children: [
        /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#10B981", stopOpacity: "0.6" }),
        /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#10B981", stopOpacity: "0" })
      ] }) }),
      /* @__PURE__ */ jsx("circle", { cx, cy, r: "90", fill: "url(#coreGlow)" }),
      /* @__PURE__ */ jsx("circle", { cx, cy, r: "48", fill: "#0E1A2B", stroke: "#10B981", strokeWidth: "1.5" }),
      /* @__PURE__ */ jsx("text", { x: cx, y: cy - 4, textAnchor: "middle", fill: "#fff", fontSize: "11", fontWeight: "600", children: "Topical" }),
      /* @__PURE__ */ jsx("text", { x: cx, y: cy + 10, textAnchor: "middle", fill: "#10B981", fontSize: "11", fontWeight: "600", children: "Authority" }),
      clusters.map((c, i) => {
        const angle = i / N * Math.PI * 2 - Math.PI / 2;
        const px = cx + Math.cos(angle) * pillarR;
        const py = cy + Math.sin(angle) * pillarR;
        const postR = 110;
        return /* @__PURE__ */ jsxs("g", { children: [
          /* @__PURE__ */ jsx("line", { x1: cx, y1: cy, x2: px, y2: py, stroke: "rgba(16,185,129,0.35)", strokeWidth: "1.5" }),
          /* @__PURE__ */ jsxs(
            "g",
            {
              onClick: () => setActive({ topic: c.pillar, x: px, y: py }),
              className: "cursor-pointer",
              children: [
                /* @__PURE__ */ jsx("circle", { cx: px, cy: py, r: "38", fill: "rgba(16,185,129,0.12)", stroke: "#10B981", strokeWidth: "1" }),
                /* @__PURE__ */ jsx("text", { x: px, y: py + 3, textAnchor: "middle", fill: "#fff", fontSize: "10", fontWeight: "600", children: c.pillar.length > 16 ? c.pillar.slice(0, 14) + "…" : c.pillar })
              ]
            }
          ),
          c.posts.slice(0, 4).map((p, j) => {
            const sub = j / 4 * Math.PI - Math.PI / 2 + angle;
            const sx = px + Math.cos(sub) * postR;
            const sy = py + Math.sin(sub) * postR;
            return /* @__PURE__ */ jsxs("g", { onClick: () => setActive({ topic: p, x: sx, y: sy }), className: "cursor-pointer", children: [
              /* @__PURE__ */ jsx("line", { x1: px, y1: py, x2: sx, y2: sy, stroke: "rgba(255,255,255,0.1)", strokeWidth: "1" }),
              /* @__PURE__ */ jsx("circle", { cx: sx, cy: sy, r: "5", fill: "#0E1A2B", stroke: "#84CC16", strokeWidth: "1" }),
              /* @__PURE__ */ jsx("text", { x: sx + 8, y: sy + 3, fill: "rgba(255,255,255,0.7)", fontSize: "9", children: p.length > 26 ? p.slice(0, 24) + "…" : p })
            ] }, j);
          })
        ] }, i);
      })
    ] }),
    active && /* @__PURE__ */ jsxs(
      "div",
      {
        className: "absolute z-10 max-w-xs rounded-md border border-white/10 bg-[#0E1A2B] p-3 shadow-2xl",
        style: { left: `min(${active.x / w * 100}%, calc(100% - 280px))`, top: active.y / h * 560 + 30 },
        children: [
          /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-emerald-400", children: "Cluster node" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm font-semibold text-white", children: active.topic }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => {
                onGenerate == null ? void 0 : onGenerate(active.topic);
                setActive(null);
              },
              className: "mt-3 inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400",
              children: [
                /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }),
                " Generate this page"
              ]
            }
          ),
          /* @__PURE__ */ jsx("button", { onClick: () => setActive(null), className: "ml-2 text-xs text-white/40 hover:text-white/70", children: "close" })
        ]
      }
    )
  ] });
}
function LockedOverlay({
  plan,
  feature,
  upgradeTo
}) {
  if (!upgradeTo) return null;
  const labels = {
    builder: { name: "Builder", price: "$49/mo" },
    pro: { name: "Pro", price: "$99/mo" },
    agency: { name: "Agency", price: "$199/mo" }
  };
  const t = labels[upgradeTo];
  return /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-[#080D18]/40 via-[#080D18]/85 to-[#080D18]/95 backdrop-blur-[2px]", children: [
    /* @__PURE__ */ jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5", children: /* @__PURE__ */ jsx(Lock, { className: "h-5 w-5 text-emerald-400" }) }),
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm font-semibold text-white", children: feature }),
    /* @__PURE__ */ jsxs("p", { className: "mt-1 max-w-xs text-center text-xs text-white/50", children: [
      "Available on ",
      /* @__PURE__ */ jsxs("span", { className: "font-medium text-white/80", children: [
        t.name,
        " (",
        t.price,
        ")"
      ] }),
      " and above."
    ] }),
    /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/app/billing",
        className: "mt-4 inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-400",
        children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5" }),
          " Upgrade to ",
          t.name
        ]
      }
    )
  ] });
}
const INTEGRATIONS = [
  { key: "google_search_console", label: "Search Console", icon: Search, gateKey: "gscIntegration" },
  { key: "google_analytics", label: "Google Analytics", icon: TrendingUp, gateKey: "gaIntegration" },
  { key: "search_atlas", label: "Search Atlas", icon: Cpu, gateKey: null },
  { key: "gohighlevel", label: "GoHighLevel", icon: Zap, gateKey: null },
  { key: "stripe", label: "Stripe", icon: ShieldCheck, gateKey: null }
];
function OptimizeDashboard() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { data: adminLevel } = useAdmin();
  const access = getAccess((profile == null ? void 0 : profile.plan) ?? "free", !!adminLevel);
  const { data: project, refetch } = useQuery({
    queryKey: ["optimization-project", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("optimization_projects").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: (q) => {
      var _a;
      return ((_a = q.state.data) == null ? void 0 : _a.status) === "analyzing" ? 3e3 : false;
    }
  });
  const integrations = (project == null ? void 0 : project.integrations) || {};
  const report = project == null ? void 0 : project.latest_report;
  const toggleMut = useMutation({
    mutationFn: async ({ key, value }) => {
      const next = { ...integrations, [key]: value };
      const { error } = await supabase.from("optimization_projects").update({ integrations: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["optimization-project", id] })
  });
  const analyzeMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("analyze-website", {
        body: { projectId: id }
      });
      if (error) {
        const ctx = error.context;
        let payload = {};
        try {
          payload = (ctx == null ? void 0 : ctx.body) ? JSON.parse(ctx.body) : {};
        } catch {
        }
        const reason = payload.reason ?? payload.error;
        if (reason === "daily_limit") {
          const mins = Math.ceil((payload.retry_after_seconds ?? 3600) / 60);
          throw new Error(`Daily optimization limit reached (${payload.daily_limit}/day on ${payload.plan} plan). Resets in ~${mins} min. Upgrade for more.`);
        }
        if (reason === "hourly_limit") {
          const mins = Math.ceil((payload.retry_after_seconds ?? 600) / 60);
          throw new Error(`Hourly API limit reached. Try again in ~${mins} min.`);
        }
        if (reason === "blocked") throw new Error("Temporarily blocked. Please contact support.");
        throw new Error(payload.error || error.message || "Analysis failed");
      }
      return data;
    },
    onSuccess: () => {
      toast$1.success("Analysis complete");
      refetch();
    },
    onError: (e) => toast$1.error(e instanceof Error ? e.message : "Analysis failed")
  });
  useEffect(() => {
    if (project && project.status === "pending" && !project.latest_report && !analyzeMut.isPending) {
      analyzeMut.mutate();
    }
  }, [project == null ? void 0 : project.id]);
  const isRunning = (project == null ? void 0 : project.status) === "analyzing" || analyzeMut.isPending;
  if (!project) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-[#080D18] text-white", children: /* @__PURE__ */ jsx("div", { className: "container py-10 text-sm text-white/50", children: "Loading…" }) });
  }
  const ghlConnected = !!integrations["gohighlevel"];
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-[#080D18] text-white", style: {
    backgroundImage: "radial-gradient(ellipse at top, rgba(16,185,129,0.08), transparent 60%)"
  }, children: /* @__PURE__ */ jsxs("div", { className: "container max-w-7xl py-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs(Link, { to: "/app/optimize", className: "inline-flex items-center text-xs text-white/50 hover:text-white", children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-1 h-3 w-3" }),
          " All sites"
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "mt-2 text-3xl font-bold tracking-tight", children: project.name }),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: project.website_url,
            target: "_blank",
            rel: "noreferrer",
            className: "inline-flex items-center gap-1 text-xs text-white/50 hover:text-emerald-400",
            children: [
              /* @__PURE__ */ jsx(Globe, { className: "h-3 w-3" }),
              " ",
              project.website_url,
              " ",
              /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        access.pdfExport && report && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => exportReportPDF({ siteName: project.name, websiteUrl: project.website_url, report }),
            className: "inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium hover:bg-white/[0.08]",
            children: [
              /* @__PURE__ */ jsx(Download, { className: "h-3.5 w-3.5" }),
              " Export PDF"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => analyzeMut.mutate(),
            disabled: isRunning,
            className: "inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold hover:bg-emerald-400 disabled:opacity-50",
            children: isRunning ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "h-3.5 w-3.5 animate-spin" }),
              " Analyzing…"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5" }),
              " Re-run analysis"
            ] })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-6 lg:grid-cols-[1fr_260px]", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        !report && /* @__PURE__ */ jsx(Panel, { children: /* @__PURE__ */ jsx("div", { className: "flex flex-col items-center justify-center gap-3 py-14 text-center", children: isRunning ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "h-8 w-8 animate-spin text-emerald-400" }),
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: "Generating your AI optimization report…" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-white/50", children: "Crawling, scoring, and benchmarking — usually 15-30s." })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-8 w-8 text-emerald-400" }),
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: "Ready to analyze your site." }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => analyzeMut.mutate(),
              className: "rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold hover:bg-emerald-400",
              children: "Run analysis"
            }
          )
        ] }) }) }),
        report && /* @__PURE__ */ jsx(
          ReportView,
          {
            report,
            access,
            ghlConnected,
            onConnectGhl: () => toggleMut.mutate({ key: "gohighlevel", value: true })
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        Sidebar,
        {
          integrations,
          access,
          onToggle: (k, v) => toggleMut.mutate({ key: k, value: v }),
          project
        }
      )
    ] })
  ] }) });
}
function Sidebar({
  integrations,
  access,
  onToggle,
  project
}) {
  const connectedCount = Object.values(integrations).filter(Boolean).length;
  return /* @__PURE__ */ jsxs("aside", { className: "space-y-4 lg:sticky lg:top-6 lg:self-start", children: [
    /* @__PURE__ */ jsxs(Panel, { children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-[11px] font-semibold uppercase tracking-wider text-white/50", children: "Connected systems" }),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-300", children: [
          connectedCount,
          "/",
          INTEGRATIONS.length
        ] })
      ] }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: INTEGRATIONS.map((i) => {
        const on = !!integrations[i.key];
        const locked = i.gateKey ? !access[i.gateKey] : false;
        const Icon = i.icon;
        return /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between gap-2 rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
            /* @__PURE__ */ jsx(Icon, { className: `h-3.5 w-3.5 shrink-0 ${on ? "text-emerald-400" : "text-white/40"}` }),
            /* @__PURE__ */ jsx("span", { className: "truncate text-xs", children: i.label }),
            locked && /* @__PURE__ */ jsx("span", { className: "ml-1 rounded bg-white/5 px-1 py-0.5 text-[9px] uppercase text-white/40", children: "Pro" })
          ] }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              checked: on,
              disabled: locked,
              onCheckedChange: (v) => onToggle(i.key, v),
              className: "data-[state=checked]:bg-emerald-500"
            }
          )
        ] }, i.key);
      }) })
    ] }),
    /* @__PURE__ */ jsxs(Panel, { children: [
      /* @__PURE__ */ jsx("h3", { className: "mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/50", children: "Plan" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(ShieldAlert, { className: "h-4 w-4 text-amber-400" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold capitalize", children: access.plan }),
        access.isAdmin && /* @__PURE__ */ jsx(Badge, { className: "bg-emerald-500/15 text-emerald-300", children: "Admin" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2 text-[11px] text-white/50", children: [
        "AI recommendations: ",
        access.aiRecommendationsPerMonth === -1 ? "Unlimited" : `${access.aiRecommendationsPerMonth}/mo`
      ] }),
      access.upgradeTo && /* @__PURE__ */ jsxs(Link, { to: "/app/billing", className: "mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }),
        " Upgrade to unlock more →"
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Panel, { children: [
      /* @__PURE__ */ jsx("h3", { className: "mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/50", children: "Last run" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-white/70", children: project.last_analyzed_at ? new Date(project.last_analyzed_at).toLocaleString() : "—" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-1 text-[11px] capitalize text-white/40", children: [
        "Status: ",
        project.status
      ] })
    ] })
  ] });
}
function ReportView({
  report,
  access,
  ghlConnected,
  onConnectGhl
}) {
  var _a;
  const trend = useMemo(() => report.trafficTrend ?? [], [report]);
  const visibleRecs = access.aiRecommendationsPerMonth === -1 ? report.aiRecommendations : (report.aiRecommendations || []).slice(0, Math.max(access.aiRecommendationsPerMonth, access.visibleIssues));
  const buckets = {
    Critical: (visibleRecs == null ? void 0 : visibleRecs.filter((r) => r.impact === "high")) ?? [],
    Important: (visibleRecs == null ? void 0 : visibleRecs.filter((r) => r.impact === "medium")) ?? [],
    Suggested: (visibleRecs == null ? void 0 : visibleRecs.filter((r) => r.impact === "low")) ?? []
  };
  const keywordChartData = (report.keywordRankings || []).slice(0, 8).map((k) => ({
    name: k.keyword.length > 14 ? k.keyword.slice(0, 12) + "…" : k.keyword,
    pos: k.position
  }));
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Panel, { children: [
      /* @__PURE__ */ jsx(SectionHeader, { icon: Target, title: "Performance scores" }),
      access.fullScores ? /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-6 md:grid-cols-4", children: [
        /* @__PURE__ */ jsx(ScoreRing, { label: "SEO", value: report.scores.seo }),
        /* @__PURE__ */ jsx(ScoreRing, { label: "Speed", value: report.scores.speed }),
        /* @__PURE__ */ jsx(ScoreRing, { label: "Mobile", value: report.scores.mobile }),
        /* @__PURE__ */ jsx(ScoreRing, { label: "Conversion", value: report.scores.conversion })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-6 md:grid-cols-4", children: [
        /* @__PURE__ */ jsx(ScoreRing, { label: "SEO", value: report.scores.seo }),
        /* @__PURE__ */ jsx(LockedScore, { label: "Speed", upgrade: access.upgradeTo }),
        /* @__PURE__ */ jsx(LockedScore, { label: "Mobile", upgrade: access.upgradeTo }),
        /* @__PURE__ */ jsx(LockedScore, { label: "Conversion", upgrade: access.upgradeTo })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-6 border-t border-white/5 pt-4 text-sm leading-relaxed text-white/70", children: report.summary })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxs(Panel, { children: [
        /* @__PURE__ */ jsx(SectionHeader, { icon: Search, title: "Keyword rankings" }),
        /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: keywordChartData, margin: { top: 10, right: 10, bottom: 0, left: -20 }, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { stroke: "rgba(255,255,255,0.05)", vertical: false }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "name", tick: { fontSize: 10, fill: "rgba(255,255,255,0.5)" } }),
          /* @__PURE__ */ jsx(YAxis, { reversed: true, tick: { fontSize: 10, fill: "rgba(255,255,255,0.5)" } }),
          /* @__PURE__ */ jsx(Tooltip, { contentStyle: { background: "#0E1A2B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 } }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "pos", fill: "#10B981", radius: [3, 3, 0, 0] })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { children: [
        /* @__PURE__ */ jsx(SectionHeader, { icon: TrendingUp, title: "Traffic trend (6mo)" }),
        /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: trend, margin: { top: 10, right: 10, bottom: 0, left: -20 }, children: [
          /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "ot", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#10B981", stopOpacity: 0.5 }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#10B981", stopOpacity: 0 })
          ] }) }),
          /* @__PURE__ */ jsx(CartesianGrid, { stroke: "rgba(255,255,255,0.05)", vertical: false }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "month", tick: { fontSize: 10, fill: "rgba(255,255,255,0.5)" } }),
          /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 10, fill: "rgba(255,255,255,0.5)" } }),
          /* @__PURE__ */ jsx(Tooltip, { contentStyle: { background: "#0E1A2B", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 } }),
          /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "organic", stroke: "#10B981", fill: "url(#ot)", strokeWidth: 2 }),
          /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "direct", stroke: "#84CC16", fill: "transparent", strokeWidth: 2 }),
          /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "referral", stroke: "rgba(255,255,255,0.4)", fill: "transparent", strokeWidth: 2 })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Panel, { children: [
      /* @__PURE__ */ jsx(SectionHeader, { icon: Sparkles, title: "AI recommendations", right: /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wider text-white/40", children: access.aiRecommendationsPerMonth === -1 ? "Unlimited" : `${(visibleRecs == null ? void 0 : visibleRecs.length) ?? 0}/${access.aiRecommendationsPerMonth} this month` }) }),
      ["Critical", "Important", "Suggested"].map((b) => buckets[b].length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-4 last:mb-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(PriorityDot, { bucket: b }),
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-semibold uppercase tracking-wider text-white/70", children: b }),
          /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-white/40", children: [
            "(",
            buckets[b].length,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-2 md:grid-cols-2", children: buckets[b].map((r, i) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-white/5 bg-white/[0.02] p-3", children: [
          /* @__PURE__ */ jsx("h5", { className: "text-sm font-semibold text-white", children: r.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-white/60", children: r.body })
        ] }, i)) })
      ] }, b)),
      access.aiRecommendationsPerMonth !== -1 && (((_a = report.aiRecommendations) == null ? void 0 : _a.length) ?? 0) > ((visibleRecs == null ? void 0 : visibleRecs.length) ?? 0) && /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center text-xs text-emerald-200", children: [
        report.aiRecommendations.length - visibleRecs.length,
        " more recommendations available on",
        " ",
        /* @__PURE__ */ jsx(Link, { to: "/app/billing", className: "font-semibold underline", children: "Pro" }),
        "."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxs(Panel, { className: "relative", children: [
        /* @__PURE__ */ jsx(SectionHeader, { icon: TrendingUp, title: "Top performing pages" }),
        access.topAndLowPages ? /* @__PURE__ */ jsx(
          DataTable,
          {
            headers: ["URL", "Clicks", "Impr", "CTR", "Pos"],
            rows: (report.topPages || []).map((p) => {
              var _a2;
              return [
                truncUrl(p.url),
                fmtNum(p.clicks),
                fmtNum(p.impressions),
                `${(p.ctr * 100).toFixed(1)}%`,
                (_a2 = p.position) == null ? void 0 : _a2.toFixed(1)
              ];
            })
          }
        ) : /* @__PURE__ */ jsx(Locked, { feature: "Top performing pages", plan: access.plan, upgrade: access.upgradeTo })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { className: "relative", children: [
        /* @__PURE__ */ jsx(SectionHeader, { icon: AlertTriangle, title: "Low performing pages" }),
        access.topAndLowPages ? /* @__PURE__ */ jsx("ul", { className: "divide-y divide-white/5 text-sm", children: (report.lowPages || []).map((p, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start justify-between gap-3 py-2", children: [
          /* @__PURE__ */ jsx("span", { className: "truncate font-medium text-white/80", children: truncUrl(p.url) }),
          /* @__PURE__ */ jsx("span", { className: "shrink-0 text-[11px] text-amber-300", children: p.issue })
        ] }, i)) }) : /* @__PURE__ */ jsx(Locked, { feature: "Low performing pages", plan: access.plan, upgrade: access.upgradeTo })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxs(Panel, { className: "relative", children: [
        /* @__PURE__ */ jsx(SectionHeader, { icon: Target, title: "Keyword opportunities" }),
        access.keywordOpportunities ? /* @__PURE__ */ jsx(
          DataTable,
          {
            headers: ["Keyword", "Volume", "Diff", "Why"],
            rows: (report.keywordOpportunities || []).map((k) => {
              var _a2;
              return [
                k.keyword,
                fmtNum(k.volume),
                /* @__PURE__ */ jsx("span", { className: "text-[11px]", children: (_a2 = k.difficulty) == null ? void 0 : _a2.toFixed(0) }, k.keyword),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-white/50", children: k.why }, k.keyword + "w")
              ];
            })
          }
        ) : /* @__PURE__ */ jsx(Locked, { feature: "Keyword opportunities", plan: access.plan, upgrade: access.upgradeTo })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { className: "relative", children: [
        /* @__PURE__ */ jsx(SectionHeader, { icon: FileText, title: "Technical audit" }),
        access.technicalAudit ? /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50", children: "Missing metadata" }),
            /* @__PURE__ */ jsx(BulletList, { items: (report.missingMetadata || []).map((m) => `${truncUrl(m.url)} — ${m.missing}`) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h4", { className: "mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-white/50", children: [
              /* @__PURE__ */ jsx(Image, { className: "h-3 w-3" }),
              " Missing alt text"
            ] }),
            /* @__PURE__ */ jsx(BulletList, { items: (report.missingAltText || []).map((m) => `${truncUrl(m.url)} — ${m.count} images`) })
          ] })
        ] }) : /* @__PURE__ */ jsx(Locked, { feature: "Technical audit", plan: access.plan, upgrade: access.upgradeTo })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Panel, { className: "relative", children: [
      /* @__PURE__ */ jsx(SectionHeader, { icon: Layers, title: "Content cluster engine", right: /* @__PURE__ */ jsx(Badge, { className: "bg-emerald-500/15 text-emerald-300", children: "Mind-map" }) }),
      access.contentClusterEngine ? /* @__PURE__ */ jsx(
        ClusterMap,
        {
          clusters: report.blogClusters || [],
          onGenerate: (topic) => toast$1.info(`Drafting page: ${topic}`, {
            description: "AI is generating a brief — this will appear in Sites soon."
          })
        }
      ) : /* @__PURE__ */ jsx(Locked, { feature: "Content cluster engine", plan: access.plan, upgrade: access.upgradeTo })
    ] }),
    access.internalLinkingMap && /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxs(Panel, { children: [
        /* @__PURE__ */ jsx(SectionHeader, { icon: Plug, title: "Internal linking opportunities" }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-2 text-sm", children: (report.internalLinking || []).map((l, i) => /* @__PURE__ */ jsxs("li", { className: "rounded-md border border-white/5 bg-white/[0.02] p-2.5", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-white/50", children: [
            /* @__PURE__ */ jsx("span", { className: "text-white/80", children: truncUrl(l.from) }),
            " →",
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-emerald-300", children: truncUrl(l.to) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 text-[11px]", children: [
            "Anchor: ",
            /* @__PURE__ */ jsxs("span", { className: "font-medium text-white/80", children: [
              '"',
              l.anchor,
              '"'
            ] })
          ] })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { children: [
        /* @__PURE__ */ jsx(SectionHeader, { icon: FileText, title: "Blog cluster suggestions" }),
        /* @__PURE__ */ jsx(BulletList, { items: (report.suggestedServicePages || []).concat(report.contentGaps || []) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxs(Panel, { children: [
        /* @__PURE__ */ jsx(SectionHeader, { icon: Target, title: "CTA suggestions" }),
        /* @__PURE__ */ jsx(BulletList, { items: report.ctaSuggestions || [] })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { children: [
        /* @__PURE__ */ jsx(SectionHeader, { icon: Zap, title: "Lead capture" }),
        /* @__PURE__ */ jsx(BulletList, { items: report.leadCapture || [] })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { children: [
        /* @__PURE__ */ jsx(SectionHeader, { icon: CheckCircle2, title: "Conversion optimization" }),
        /* @__PURE__ */ jsx(BulletList, { items: report.conversionOptimization || [] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Panel, { className: "relative", children: [
      /* @__PURE__ */ jsx(SectionHeader, { icon: Zap, title: "Automation opportunities (GoHighLevel)", right: ghlConnected ? /* @__PURE__ */ jsx(Badge, { className: "bg-emerald-500/15 text-emerald-300", children: "GHL connected" }) : /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "border-amber-400/30 text-amber-300", children: "GHL not connected" }) }),
      access.automationInsights ? /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-2 lg:grid-cols-3", children: (report.automationInsights || []).map((a, i) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col rounded-lg border border-white/5 bg-white/[0.02] p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-lime-500/10", children: /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4 text-lime-400" }) }),
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-white", children: a.title }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 flex-1 text-xs text-white/60", children: a.body }),
        ghlConnected ? /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => toast$1.success("Queued for GHL", { description: a.title }),
            className: "mt-3 inline-flex items-center justify-center gap-1 rounded-md bg-lime-500 px-2.5 py-1.5 text-xs font-semibold text-[#0a1a0f] hover:bg-lime-400",
            children: [
              /* @__PURE__ */ jsx(Plug, { className: "h-3 w-3" }),
              " Add to GHL"
            ]
          }
        ) : /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onConnectGhl,
            className: "mt-3 inline-flex items-center justify-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/5 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/10",
            children: "Connect GoHighLevel to activate"
          }
        )
      ] }, i)) }) : /* @__PURE__ */ jsx(Locked, { feature: "Automation insights", plan: access.plan, upgrade: access.upgradeTo })
    ] })
  ] });
}
function Panel({ children, className = "" }) {
  return /* @__PURE__ */ jsx(
    "section",
    {
      className: `rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm ${className}`,
      style: { boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset" },
      children
    }
  );
}
function SectionHeader({
  icon: Icon,
  title,
  right
}) {
  return /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4 text-emerald-400" }),
      /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold uppercase tracking-wider text-white/80", children: title })
    ] }),
    right
  ] });
}
function PriorityDot({ bucket }) {
  const c = bucket === "Critical" ? "#EF4444" : bucket === "Important" ? "#F59E0B" : "#10B981";
  return /* @__PURE__ */ jsx("span", { className: "h-2 w-2 rounded-full", style: { background: c, boxShadow: `0 0 6px ${c}` } });
}
function DataTable({ headers, rows }) {
  return /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: headers.map((h) => /* @__PURE__ */ jsx("th", { className: "border-b border-white/5 pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-white/40", children: h }, h)) }) }),
    /* @__PURE__ */ jsx("tbody", { children: rows.map((r, i) => /* @__PURE__ */ jsx("tr", { className: "border-b border-white/[0.03] last:border-0", children: r.map((c, j) => /* @__PURE__ */ jsx("td", { className: "py-2 text-xs text-white/80", children: c }, j)) }, i)) })
  ] }) });
}
function BulletList({ items }) {
  if (!(items == null ? void 0 : items.length)) return /* @__PURE__ */ jsx("p", { className: "text-xs text-white/40", children: "—" });
  return /* @__PURE__ */ jsx("ul", { className: "space-y-1.5 text-sm text-white/70", children: items.map((it, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
    /* @__PURE__ */ jsx("span", { className: "mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" }),
    /* @__PURE__ */ jsx("span", { children: it })
  ] }, i)) });
}
function LockedScore({ label, upgrade }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2 opacity-60", children: [
    /* @__PURE__ */ jsx("div", { className: "relative flex h-[120px] w-[120px] items-center justify-center rounded-full border border-dashed border-white/15 bg-white/[0.02]", children: /* @__PURE__ */ jsx("span", { className: "text-2xl", children: "🔒" }) }),
    /* @__PURE__ */ jsx("span", { className: "text-xs font-medium uppercase tracking-wider text-white/50", children: label }),
    upgrade && /* @__PURE__ */ jsx(Link, { to: "/app/billing", className: "text-[10px] text-emerald-400 hover:underline", children: "Upgrade" })
  ] });
}
function Locked({ feature, plan, upgrade }) {
  return /* @__PURE__ */ jsxs("div", { className: "relative min-h-[180px]", children: [
    /* @__PURE__ */ jsx("div", { className: "opacity-30 blur-sm", children: /* @__PURE__ */ jsx(BulletList, { items: ["Sample row one to give a sense of layout", "Another locked example value", "And a third example placeholder"] }) }),
    /* @__PURE__ */ jsx(LockedOverlay, { plan, feature, upgradeTo: upgrade })
  ] });
}
function truncUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname;
    const s = `${u.hostname}${path}`;
    return s.length > 40 ? s.slice(0, 38) + "…" : s;
  } catch {
    return (url == null ? void 0 : url.slice(0, 40)) ?? "";
  }
}
function fmtNum(n) {
  return (n ?? 0).toLocaleString();
}
function Onboarding() {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxs("div", { className: "container max-w-4xl py-16", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold tracking-tight", children: "What would you like to do first?" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "Pick a path. You can always switch later from your dashboard." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-10 grid gap-5 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxs(
        Card,
        {
          onClick: () => navigate("/app/new"),
          className: "group cursor-pointer p-7 transition-all hover:border-primary hover:shadow-elevated",
          children: [
            /* @__PURE__ */ jsx("div", { className: "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15", children: /* @__PURE__ */ jsx(Sparkles, { className: "h-5 w-5 text-primary" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Build a new website" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Describe your business and Virtual Engine generates a complete, SEO-optimized site in 60 seconds." }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 inline-flex items-center text-sm font-medium text-primary", children: [
              "Start building ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Card,
        {
          onClick: () => navigate("/app/optimize"),
          className: "group cursor-pointer p-7 transition-all hover:border-primary hover:shadow-elevated",
          children: [
            /* @__PURE__ */ jsx("div", { className: "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15", children: /* @__PURE__ */ jsx(Search, { className: "h-5 w-5 text-primary" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Optimize an existing website" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Connect your existing site and let our AI analyze SEO, identify growth opportunities, and recommend improvements." }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 inline-flex items-center text-sm font-medium text-primary", children: [
              "Optimize my site ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" })
            ] })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-8 text-center", children: /* @__PURE__ */ jsx(Link, { to: "/app", className: "text-xs text-muted-foreground hover:text-foreground", children: "Skip for now" }) })
  ] });
}
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 3e4, refetchOnWindowFocus: false } }
});
function RootLayout() {
  useEffect(() => {
    captureRefFromUrl();
  }, []);
  if (typeof window !== "undefined") {
    const customerSubdomain = getCustomerSubdomain();
    if (customerSubdomain) {
      return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxs(TooltipProvider, { children: [
        /* @__PURE__ */ jsx(Toaster, {}),
        /* @__PURE__ */ jsx(Toaster$1, {}),
        /* @__PURE__ */ jsx(LiveSite, { subdomain: customerSubdomain })
      ] }) });
    }
  }
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxs(TooltipProvider, { children: [
    /* @__PURE__ */ jsx(Toaster, {}),
    /* @__PURE__ */ jsx(Toaster$1, {}),
    /* @__PURE__ */ jsx(I18nProvider, { children: /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(Outlet, {}) }) }) })
  ] }) });
}
const routes = [
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Landing },
      { path: "auth", Component: Auth },
      { path: "share/:token", Component: SharePage },
      { path: "affiliates", Component: Affiliates },
      { path: "affiliates/:lang", Component: Affiliates, getStaticPaths: () => ["affiliates/es", "affiliates/pt"] },
      {
        path: "admin",
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminOverview },
          { path: "users", Component: AdminUsers },
          { path: "sites", Component: AdminSites },
          { path: "affiliates", Component: AdminAffiliates },
          { path: "announcements", Component: AdminAnnouncements },
          { path: "codes", Component: AdminAccessCodes },
          { path: "admins", Component: AdminAdmins },
          { path: "alerts", Component: AdminAlerts },
          { path: "usage", Component: AdminUsage },
          { path: "launch-tests", Component: AdminLaunchTests }
        ]
      },
      {
        path: "app",
        Component: AppLayout,
        children: [
          { index: true, Component: Dashboard },
          { path: "onboarding", Component: Onboarding },
          { path: "optimize", Component: Optimize },
          { path: "optimize/:id", Component: OptimizeDashboard },
          { path: "new", Component: NewSite },
          { path: "sites/:id", Component: SiteDetail },
          { path: "billing", Component: Billing },
          { path: "integrations", Component: Integrations },
          { path: "settings", Component: Settings },
          { path: "affiliate", Component: AffiliateDashboard }
        ]
      },
      { path: "*", Component: NotFound }
    ]
  }
];
const createRoot = ViteReactSSG(
  { routes, basename: "/" },
  () => {
  }
);
export {
  createRoot
};
