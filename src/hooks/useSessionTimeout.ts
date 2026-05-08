import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24h
const STORAGE_KEY = "veb_last_activity";

/**
 * Tracks user activity. If 24h passes with no interaction, signs the user
 * out and redirects to /auth?reason=timeout.
 */
export function useSessionTimeout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const bump = () => {
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* ignore */ }
      schedule();
    };

    const expire = async () => {
      try { await supabase.auth.signOut(); } catch { /* ignore */ }
      toast("Signed out", { description: "Your session expired after 24 hours of inactivity." });
      navigate("/auth?reason=timeout", { replace: true });
    };

    const schedule = () => {
      if (timer.current) window.clearTimeout(timer.current);
      const last = Number(localStorage.getItem(STORAGE_KEY)) || Date.now();
      const remaining = Math.max(0, TIMEOUT_MS - (Date.now() - last));
      timer.current = window.setTimeout(expire, remaining);
    };

    // If we resume a session that already expired
    const last = Number(localStorage.getItem(STORAGE_KEY)) || Date.now();
    if (Date.now() - last >= TIMEOUT_MS) { void expire(); return; }

    bump();
    const events: (keyof DocumentEventMap)[] = ["mousedown", "keydown", "scroll", "touchstart", "visibilitychange"];
    events.forEach((e) => document.addEventListener(e, bump, { passive: true }));
    return () => {
      events.forEach((e) => document.removeEventListener(e, bump));
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [user, navigate]);
}
