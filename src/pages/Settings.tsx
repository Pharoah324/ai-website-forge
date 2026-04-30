import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [samples, setSamples] = useState("");
  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Settings saved");
  };

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
              about page). Generated sites will mirror your tone.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="brand-active" className="text-sm">
              Active
            </Label>
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
          placeholder="Paste a few writing samples here…"
          className="mt-4 min-h-48"
          maxLength={6000}
        />
        <Button className="mt-4" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save brand voice"}
        </Button>
      </div>
    </div>
  );
}
