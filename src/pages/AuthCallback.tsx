import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const POST_AUTH_PATH_KEY = "veb_post_auth_path";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const finish = (path: string) => {
      if (cancelled) return;
      window.sessionStorage.removeItem(POST_AUTH_PATH_KEY);
      navigate(path, { replace: true });
    };

    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const errorDescription =
          url.searchParams.get("error_description") ||
          url.hash.match(/error_description=([^&]+)/)?.[1];

        if (errorDescription) {
          toast.error(decodeURIComponent(errorDescription));
          finish("/auth");
          return;
        }

        // PKCE code-exchange flow
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(
            window.location.href,
          );
          if (error) throw error;
        }

        // For implicit/hash flow, the Supabase client auto-detects the session
        // from the URL on init; just confirm a session exists (poll briefly).
        let session = (await supabase.auth.getSession()).data.session;
        if (!session) {
          for (let i = 0; i < 10 && !session; i++) {
            await new Promise((r) => setTimeout(r, 100));
            session = (await supabase.auth.getSession()).data.session;
          }
        }

        const stored = window.sessionStorage.getItem(POST_AUTH_PATH_KEY);
        const dest = stored?.startsWith("/app") ? stored : "/app";

        if (!session) {
          toast.error("Sign-in didn't complete. Please try again.");
          finish("/auth");
          return;
        }
        finish(dest);
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
