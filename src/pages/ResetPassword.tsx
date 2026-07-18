import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { passwordSchema } from "./Auth";

// Landing page for the recovery link (redirectTo target of resetPasswordForEmail).
// The recovery session is parsed from the URL hash ASYNCHRONOUSLY by
// detectSessionInUrl, so we must NOT decide "expired" from a synchronous mount
// check — that would false-flash on a valid link. Instead: show "checking…",
// wait for getSession / a late onAuthStateChange, then show the form if a session
// is present, or the expired state only after that resolves to null. The form is
// gated on session-present (not on having seen PASSWORD_RECOVERY) so a page reload
// — which keeps the session but loses the event — still works.
type Phase = "checking" | "ready" | "expired";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const markReady = () => {
      if (mounted) setPhase("ready");
    };
    // Late-arriving recovery/sign-in session (hash parsed after mount) flips to ready.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) markReady();
    });
    // Cover the already-parsed case, then re-check once after a grace period for the
    // async hash parse before concluding the link is expired.
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        markReady();
        return;
      }
      await new Promise((r) => setTimeout(r, 800));
      const { data: again } = await supabase.auth.getSession();
      if (!mounted) return;
      setPhase(again.session ? "ready" : "expired");
    })();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data });
      if (error) throw error;
      toast.success("Password updated. You're all set.");
      navigate("/app");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update your password");
    } finally {
      setSaving(false);
    }
  };

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

        {phase === "checking" && (
          <p className="text-center text-sm text-muted-foreground">
            Checking your reset link…
          </p>
        )}

        {phase === "expired" && (
          <div className="text-center">
            <h1 className="text-2xl font-bold">Reset link expired</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This password reset link is invalid or has expired. Request a new one from the sign-in page.
            </p>
            <Link
              to="/auth"
              className="mt-4 inline-block font-medium text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        )}

        {phase === "ready" && (
          <>
            <h1 className="text-2xl font-bold">Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter a new password for your account.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-muted-foreground">At least 8 characters</p>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving…" : "Update password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
