import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [samples, setSamples] = useState("");
  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [training, setTraining] = useState(false);

  useEffect(() => {
    if (profile) {
      setSamples(profile.brand_voice_samples ?? "");
      setActive(profile.brand_voice_active);
    }
  }, [profile]);

  if (!profile) return null;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        brand_voice_samples: samples || null,
        brand_voice_active: active && !!samples.trim(),
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Settings saved");
  };

  const train = async () => {
    if (!samples.trim()) return toast.error("Paste samples first");
    setTraining(true);
    const { data, error } = await supabase.functions.invoke("train-voice", {
      body: { samples },
    });
    setTraining(false);
    if (error || data?.error) {
      toast.error(error?.message || data?.error || "Training failed");
      return;
    }
    setActive(true);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Brand voice trained");
  };

  const rules = profile.voice_rules ?? [];

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Personalize how AI writes your sites.
      </p>

      <div className="mt-8 rounded-lg border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Brand Voice
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste 3–5 samples of your existing copy (emails, social posts,
              about page). We'll learn your tone and apply it to every site.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="brand-active" className="text-sm">Active</Label>
            <Switch
              id="brand-active"
              checked={active}
              onCheckedChange={setActive}
              disabled={!samples.trim()}
            />
          </div>
        </div>
        <Textarea
          value={samples}
          onChange={(e) => setSamples(e.target.value)}
          placeholder="Paste a few writing samples here, separated by blank lines…"
          className="mt-4 min-h-48"
          maxLength={6000}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={train} disabled={training || !samples.trim()}>
            {training ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…</>
            ) : (
              <><Wand2 className="mr-2 h-4 w-4" /> Train my brand voice</>
            )}
          </Button>
          <Button variant="outline" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>

        {rules.length > 0 && (
          <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
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
    </div>
  );
}
