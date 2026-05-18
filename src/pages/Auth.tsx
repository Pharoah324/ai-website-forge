import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Apple } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { getStoredRef } from "@/lib/affiliateTracking";
import { useI18n } from "@/lib/i18n";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(128),
});

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.232-2.51c-.895.6-2.041.955-3.386.955-2.605 0-4.81-1.76-5.596-4.122H3.064v2.59A9.996 9.996 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.404 13.9a6.005 6.005 0 0 1 0-3.8V7.51H3.064a10.003 10.003 0 0 0 0 8.98l3.34-2.59Z" />
      <path fill="#EA4335" d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.96 2.99 14.696 2 12 2 8.13 2 4.785 4.224 3.064 7.51l3.34 2.59C7.19 7.736 9.395 5.977 12 5.977Z" />
    </svg>
  );
}

export default function Auth() {
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<null | "google" | "apple">(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { lang } = useI18n();

  const intent = params.get("intent");
  const postAuthPath =
    intent === "optimize"
      ? "/app/optimize"
      : intent === "build"
        ? "/app/new"
        : mode === "signup"
          ? "/app/onboarding"
          : "/app";

  // Localized labels for the social/auth UI. Falls back to English if lang missing.
  const L = (() => {
    const dicts: Record<string, Record<string, string>> = {
      en: {
        google: "Continue with Google",
        apple: "Continue with Apple",
        or: "or sign in with email",
      },
      es: {
        google: "Continuar con Google",
        apple: "Continuar con Apple",
        or: "o inicia sesión con tu correo",
      },
      pt: {
        google: "Continuar com Google",
        apple: "Continuar com Apple",
        or: "ou entre com seu email",
      },
      fr: {
        google: "Continuer avec Google",
        apple: "Continuer avec Apple",
        or: "ou connectez-vous avec votre email",
      },
      de: {
        google: "Mit Google fortfahren",
        apple: "Mit Apple fortfahren",
        or: "oder mit E-Mail anmelden",
      },
      ar: {
        google: "المتابعة مع Google",
        apple: "المتابعة مع Apple",
        or: "أو سجل الدخول بالبريد الإلكتروني",
      },
    };
    const base = lang.split("-")[0];
    return dicts[lang] || dicts[base] || dicts.en;
  })();

  useEffect(() => {
    if (user) navigate(postAuthPath, { replace: true });
  }, [user, navigate, postAuthPath]);

  const signInWithProvider = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    try {
      const ref = getStoredRef();
      window.sessionStorage.setItem("veb_post_auth_path", postAuthPath);
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
        extraParams: ref ? { affiliate_ref: ref } : undefined,
      });
      if (result.redirected) return; // browser is redirecting
      if (result.error) throw result.error;
      window.sessionStorage.removeItem("veb_post_auth_path");
      navigate(postAuthPath);
    } catch (err) {
      window.sessionStorage.removeItem("veb_post_auth_path");
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      const isFetchFailure = /failed to fetch/i.test(msg);
      toast.error(
        isFetchFailure
          ? "Couldn't reach the authentication server. Check your internet connection — if this persists on the live site, the Supabase environment variables may be missing in your hosting provider."
          : msg,
      );
    } finally {
      setOauthLoading(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
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
            data: ref ? { affiliate_ref: ref } : undefined,
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Welcome back");
        navigate(postAuthPath);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      const isFetchFailure = /failed to fetch/i.test(msg);
      toast.error(
        isFetchFailure
          ? "Couldn't reach the authentication server. Check your internet connection — if this persists on the live site, the Supabase environment variables may be missing in your hosting provider."
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  const anyLoading = loading || oauthLoading !== null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-6">
      <div className="w-full max-w-md rounded-xl border border-navy-muted bg-card p-8 shadow-elevated">
        <Link to="/" className="mb-6 flex items-center justify-center">
          <img
            src="/VEB_Logo_AllGreen_Tight.png"
            alt="Virtual Engine Builder"
            className="h-12 w-auto"
          />
        </Link>
        <h1 className="text-2xl font-bold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Start with 20 free build credits."
            : "Sign in to continue building."}
        </p>
        {params.get("reason") === "timeout" && (
          <div className="mt-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">
            Your session expired after 24 hours of inactivity. Please sign in again.
          </div>
        )}

        <div className="mt-6 space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={anyLoading}
            onClick={() => signInWithProvider("google")}
          >
            <GoogleIcon className="mr-2 h-4 w-4" />
            {oauthLoading === "google" ? "Please wait…" : L.google}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={anyLoading}
            onClick={() => signInWithProvider("apple")}
          >
            <Apple className="mr-2 h-4 w-4" />
            {oauthLoading === "apple" ? "Please wait…" : L.apple}
          </Button>
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">{L.or}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>
          <Button type="submit" className="w-full" disabled={anyLoading}>
            {loading
              ? "Please wait…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="font-medium text-primary hover:underline"
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
