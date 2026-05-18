import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

const POST_AUTH_PATH_KEY = "veb_post_auth_path";

const getStoredPostAuthPath = () => {
  if (typeof window === "undefined") return null;
  const path = window.sessionStorage.getItem(POST_AUTH_PATH_KEY);
  window.sessionStorage.removeItem(POST_AUTH_PATH_KEY);
  return path?.startsWith("/app") ? path : null;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener first
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      // Ensure a profile row exists for this user (OAuth or email signup).
      // Defer to avoid running inside the auth callback.
      if (s?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED")) {
        const u = s.user;
        setTimeout(() => {
          void (async () => {
            try {
              const { data: existing } = await supabase
                .from("profiles")
                .select("id, display_name, avatar_url, email")
                .eq("id", u.id)
                .maybeSingle();
              const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
              const fullName =
                (meta.full_name as string | undefined) ??
                (meta.name as string | undefined) ??
                null;
              const avatar =
                (meta.avatar_url as string | undefined) ??
                (meta.picture as string | undefined) ??
                null;
              if (!existing) {
                await supabase.from("profiles").insert({
                  id: u.id,
                  email: u.email ?? null,
                  display_name: fullName,
                  avatar_url: avatar,
                  onboarding_completed: false,
                } as never);
              } else {
                // Backfill missing fields from OAuth metadata without overwriting user edits.
                const patch: Record<string, unknown> = {};
                if (!existing.email && u.email) patch.email = u.email;
                if (!existing.display_name && fullName) patch.display_name = fullName;
                if (!existing.avatar_url && avatar) patch.avatar_url = avatar;
                if (Object.keys(patch).length > 0) {
                  await supabase.from("profiles").update(patch as never).eq("id", u.id);
                }
              }
            } catch {
              // Ignore — RLS or schema may differ; UI handles missing profile gracefully.
            }
          })();
        }, 0);
      }
    });
    // Then existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      const postAuthPath = data.session ? getStoredPostAuthPath() : null;
      if (postAuthPath && window.location.pathname === "/") {
        window.history.replaceState(null, "", postAuthPath);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
