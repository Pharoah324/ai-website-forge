import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const POST_AUTH_PATH_KEY = "veb_post_auth_path";
const AUTH_SESSION_READY_EVENT = "veb-auth-session-ready";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getHashParams = () => {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash);
};

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const finish = (path: string, reload = false) => {
      if (cancelled) return;
      window.sessionStorage.removeItem(POST_AUTH_PATH_KEY);
      if (reload) {
        window.location.replace(path);
        return;
      }
      navigate(path, { replace: true });
    };

    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const hashParams = getHashParams();
        const errorDescription =
          url.searchParams.get("error_description") ||
          hashParams.get("error_description");

        if (errorDescription) {
          toast.error(decodeURIComponent(errorDescription));
          finish("/auth");
          return;
        }

        // PKCE code-exchange flow
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // Some Supabase projects still use the implicit flow, where tokens are
        // returned in the URL hash. Set them explicitly instead of relying on
        // auto-detection, then remove the hash before entering protected routes.
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          window.history.replaceState(null, document.title, url.pathname + url.search);
        }

        // For implicit/hash flow, the Supabase client auto-detects the session
        // from the URL on init; just confirm a session exists (poll briefly).
        let session = (await supabase.auth.getSession()).data.session;
        if (!session) {
          for (let i = 0; i < 50 && !session; i++) {
            await wait(100);
            session = (await supabase.auth.getSession()).data.session;
          }
        }

        // Ensure session is persisted to storage before navigation to avoid race condition
        if (!session) {
          // Final attempt to verify storage has the session
          const { data } = await supabase.auth.getSession();
          session = data.session;
        }

        const stored = window.sessionStorage.getItem(POST_AUTH_PATH_KEY);
        const dest = stored?.startsWith("/app") ? stored : "/app";

        if (!session) {
          toast.error("Sign-in didn't complete. Please try again.");
          finish("/auth");
          return;
        }
        window.dispatchEvent(new Event(AUTH_SESSION_READY_EVENT));
        await wait(50);
        finish(dest, true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Sign-in failed";
        toast.error(msg);
        finish("/auth");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero text-muted-foreground">
      Completing sign-in…
    </div>
  );
}
