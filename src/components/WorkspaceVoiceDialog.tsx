import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Wand2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { AgencyWorkspace } from "@/contexts/WorkspaceContext";

type VoiceWorkspace = AgencyWorkspace & {
  brand_voice_samples?: string | null;
  brand_voice_active?: boolean;
  voice_rules?: string[] | null;
};

export function WorkspaceVoiceDialog({
  workspace,
  onClose,
  onSaved,
}: {
  workspace: VoiceWorkspace | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [samples, setSamples] = useState("");
  const [active, setActive] = useState(false);
  const [rules, setRules] = useState<string[]>([]);
  const [training, setTraining] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workspace) {
      setSamples(workspace.brand_voice_samples ?? "");
      setActive(!!workspace.brand_voice_active);
      setRules(Array.isArray(workspace.voice_rules) ? workspace.voice_rules : []);
    }
  }, [workspace]);

  if (!workspace) return null;

  const train = async () => {
    if (!samples.trim()) return toast.error("Paste samples first");
    setTraining(true);
    const { data, error } = await supabase.functions.invoke("train-voice", {
      body: { samples, workspace_id: workspace.id },
    });
    setTraining(false);
    if (error || data?.error) {
      toast.error(error?.message || data?.error || "Training failed");
      return;
    }
    setRules(data.voice_rules ?? []);
    setActive(true);
    toast.success("Brand voice trained");
    onSaved();
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("agency_workspaces" as never)
      .update({
        brand_voice_samples: samples || null,
        brand_voice_active: active && !!samples.trim(),
      } as never)
      .eq("id", workspace.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Voice settings saved");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={!!workspace} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Brand Voice — {workspace.name}
          </DialogTitle>
          <DialogDescription>
            Paste 3–5 samples of this client's existing copy (emails, social posts, About page).
            We'll learn their tone and apply it whenever we generate or refine sites in this workspace.
            This overrides your personal brand voice for this workspace only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="ws-voice-active" className="text-sm">
              Active for this workspace
            </Label>
            <Switch
              id="ws-voice-active"
              checked={active}
              onCheckedChange={setActive}
              disabled={!samples.trim()}
            />
          </div>

          <Textarea
            value={samples}
            onChange={(e) => setSamples(e.target.value)}
            placeholder="Paste a few writing samples here, separated by blank lines…"
            className="min-h-48"
            maxLength={6000}
          />

          {rules.length > 0 && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Learned voice rules
              </p>
              <ul className="space-y-1 text-sm">
                {rules.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="outline" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button onClick={train} disabled={training || !samples.trim()}>
            {training ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…</>
            ) : (
              <><Wand2 className="mr-2 h-4 w-4" /> Train voice</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
