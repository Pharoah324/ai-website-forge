import { Component, ErrorInfo, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  async componentDidCatch(error: Error, info: ErrorInfo) {
    // Best-effort log to admin_alerts (RLS will silently drop if user is not admin —
    // that's fine; we don't want to leak stack traces to all users via DB writes
    // anyway. Server-side error correlation will pick up the rest.)
    try {
      const { data } = await supabase.auth.getUser();
      try {
        await supabase.from("admin_alerts" as any).insert({
          alert_type: "frontend_crash",
          severity: "warning",
          affected_user_id: data?.user?.id ?? null,
          affected_user_email: data?.user?.email ?? null,
          description: `Frontend crash: ${error.message?.slice(0, 200) ?? "unknown"}`,
          metadata: {
            stack: error.stack?.slice(0, 2000),
            componentStack: info.componentStack?.slice(0, 2000),
            url: typeof window !== "undefined" ? window.location.href : null,
          },
        });
      } catch (dbErr) {
        console.warn("Could not log alert (table may not exist):", dbErr);
      }
    
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border border-destructive/30 bg-card p-6 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We hit an unexpected error. Your work is safe — try reloading the page.
          </p>
          {this.state.error.message && (
            <p className="mt-3 rounded bg-muted/30 px-3 py-2 text-left text-xs text-muted-foreground">
              {this.state.error.message}
            </p>
          )}
          <Button onClick={this.handleReload} className="mt-5 w-full">
            <RefreshCw className="mr-2 h-4 w-4" /> Reload page
          </Button>
        </div>
      </div>
    );
  }
}
