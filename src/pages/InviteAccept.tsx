import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "working" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // Save token, redirect to auth, come back after login.
      sessionStorage.setItem("veb_pending_invite", token ?? "");
      navigate(`/auth?redirect=/invite/${token}`, { replace: true });
      return;
    }
    if (!token || status !== "idle") return;
    setStatus("working");
    void (async () => {
      const { data, error } = await supabase.rpc(
        "accept_workspace_invite" as never,
        { _token: token } as never,
      );
      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }
      const result = data as unknown as { ok: boolean; reason?: string };
      if (!result?.ok) {
        setStatus("error");
        setMessage(result?.reason === "invalid_or_used" ? "This invite is invalid or already used." : "Could not accept invite.");
        return;
      }
      setStatus("ok");
      setTimeout(() => navigate("/app", { replace: true }), 1500);
    })();
  }, [user, loading, token, navigate, status]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md rounded-lg border bg-card p-8 shadow-card text-center">
        {status === "working" || status === "idle" ? (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-bold">Joining workspace…</h1>
          </>
        ) : status === "ok" ? (
          <>
            <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
            <h1 className="mt-4 text-xl font-bold">You're in</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Redirecting to your dashboard…
            </p>
          </>
        ) : (
          <>
            <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
            <h1 className="mt-4 text-xl font-bold">Invite issue</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <Button asChild className="mt-4">
              <Link to="/app">Go to dashboard</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
