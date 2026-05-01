import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ExternalLink, Github, Loader2, Plug, Unplug } from "lucide-react";

type Integration = {
  id: string;
  platform: string;
  location_id: string | null;
  pipeline_id: string | null;
  access_token: string | null;
  metadata: any;
  created_at: string;
};

type Pipeline = { id: string; name: string };

export default function Integrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const [pipelines, setPipelines] = useState<Pipeline[] | null>(null);
  const [loadingPipelines, setLoadingPipelines] = useState(false);

  const { data: integration, isLoading } = useQuery({
    queryKey: ["integration", "gohighlevel", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", user!.id)
        .eq("platform", "gohighlevel")
        .maybeSingle();
      if (error) throw error;
      return data as Integration | null;
    },
  });

  const { data: githubIntegration } = useQuery({
    queryKey: ["integration", "github", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", user!.id)
        .eq("platform", "github")
        .maybeSingle();
      if (error) throw error;
      return data as Integration | null;
    },
  });

  const ghConnected = !!githubIntegration?.access_token;
  const ghLogin: string | null = (githubIntegration?.metadata as any)?.login ?? null;
  const [ghConnecting, setGhConnecting] = useState(false);

  const connected = !!integration?.access_token;

  // Refetch on focus (after OAuth popup closes)
  useEffect(() => {
    const onFocus = () => {
      qc.invalidateQueries({ queryKey: ["integration", "gohighlevel", user?.id] });
      qc.invalidateQueries({ queryKey: ["integration", "github", user?.id] });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [qc, user?.id]);

  // Load pipelines once connected
  useEffect(() => {
    if (!connected) { setPipelines(null); return; }
    let cancelled = false;
    (async () => {
      setLoadingPipelines(true);
      const { data, error } = await supabase.functions.invoke("ghl-list-pipelines");
      if (cancelled) return;
      setLoadingPipelines(false);
      if (error) {
        toast({ title: "Could not load pipelines", description: error.message, variant: "destructive" });
        return;
      }
      setPipelines((data as any)?.pipelines ?? []);
    })();
    return () => { cancelled = true; };
  }, [connected, toast]);

  const handleConnect = async () => {
    setConnecting(true);
    const { data, error } = await supabase.functions.invoke("ghl-oauth-start");
    setConnecting(false);
    if (error || !(data as any)?.url) {
      toast({ title: "Could not start connection", description: error?.message ?? "Unknown error", variant: "destructive" });
      return;
    }
    window.open((data as any).url, "_blank", "width=600,height=750");
  };

  const handleDisconnect = async () => {
    if (!integration) return;
    const { error } = await supabase.from("integrations").delete().eq("id", integration.id);
    if (error) {
      toast({ title: "Disconnect failed", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["integration", "gohighlevel", user?.id] });
    toast({ title: "Disconnected", description: "GoHighLevel has been removed." });
  };

  const handlePipelineChange = async (pipelineId: string) => {
    if (!integration) return;
    const { error } = await supabase.from("integrations")
      .update({ pipeline_id: pipelineId }).eq("id", integration.id);
    if (error) {
      toast({ title: "Could not save pipeline", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["integration", "gohighlevel", user?.id] });
    toast({ title: "Pipeline updated" });
  };

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-1 text-muted-foreground">
          Connect external services so your sites can deliver leads where you work.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              GoHighLevel
              {connected && (
                <Badge className="bg-green-500/15 text-green-500 hover:bg-green-500/20">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Send form submissions from your published sites straight into a GHL pipeline as new contacts.
            </CardDescription>
          </div>
          {!isLoading && (
            connected ? (
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                <Unplug className="mr-2 h-4 w-4" /> Disconnect
              </Button>
            ) : (
              <Button onClick={handleConnect} disabled={connecting}>
                {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plug className="mr-2 h-4 w-4" />}
                Connect GoHighLevel
              </Button>
            )
          )}
        </CardHeader>

        {connected && (
          <CardContent className="space-y-6">
            <div className="rounded-md border bg-muted/30 p-4 text-sm">
              <div className="text-muted-foreground">Connected location</div>
              <div className="font-mono">{integration?.location_id ?? "—"}</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Pipeline for new contacts
              </label>
              <Select
                value={integration?.pipeline_id ?? undefined}
                onValueChange={handlePipelineChange}
                disabled={loadingPipelines || !pipelines?.length}
              >
                <SelectTrigger className="w-full md:w-[420px]">
                  <SelectValue placeholder={loadingPipelines ? "Loading pipelines…" : "Select a pipeline"} />
                </SelectTrigger>
                <SelectContent>
                  {pipelines?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Each new form submission becomes a contact, and an opportunity will be created in the first stage of this pipeline.
              </p>
            </div>

            <div className="rounded-md border p-4 text-sm">
              <div className="mb-2 font-medium">Webhook endpoint</div>
              <div className="font-mono text-xs text-muted-foreground break-all">
                {import.meta.env.VITE_SUPABASE_URL}/functions/v1/form-submission-webhook
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Generated sites POST <code>{`{ site_id, fields }`}</code> here. Each delivered lead deducts 1 runtime credit.
              </p>
              <a
                href="https://highlevel.stoplight.io/docs/integrations/0443d7d1a4bd0-overview"
                target="_blank" rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                GHL API v2 docs <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
