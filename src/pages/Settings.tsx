import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Wand2, Loader2, Palette, Upload, X } from "lucide-react";
import { toast } from "sonner";

// Convert "#RRGGBB" → "h s% l%"
function hexToHsl(hex: string): string | null {
  const m = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(m)) return null;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(hsl?: string | null, fallback = "#10b981"): string {
  if (!hsl) return fallback;
  const m = hsl.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return fallback;
  const h = parseFloat(m[1]);
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m_ = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (n: number) => Math.round((n + m_) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export default function Settings() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();

  // Brand voice state
  const [samples, setSamples] = useState("");
  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [training, setTraining] = useState(false);

  // White-label state
  const [wlEnabled, setWlEnabled] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [primary, setPrimary] = useState("#10b981");
  const [accent, setAccent] = useState("#84cc16");
  const [hideBranding, setHideBranding] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savingWL, setSavingWL] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setSamples(profile.brand_voice_samples ?? "");
    setActive(profile.brand_voice_active);
    const p = profile as unknown as Record<string, unknown>;
    setWlEnabled(!!p.wl_enabled);
    setBrandName((p.wl_brand_name as string) ?? "");
    setPrimary(hslToHex(p.wl_primary_color as string | null, "#10b981"));
    setAccent(hslToHex(p.wl_accent_color as string | null, "#84cc16"));
    setHideBranding(!!p.wl_hide_branding);
    setLogoUrl((p.wl_logo_url as string) ?? null);
  }, [profile]);

  if (!profile) return null;

  const isAgency = profile.plan === "agency";

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

  const onUpload = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) return toast.error("Image files only");
    if (file.size > 2 * 1024 * 1024) return toast.error("Logo must be under 2 MB");
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("agency-branding")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("agency-branding").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
    toast.success("Logo uploaded");
  };

  const saveWhiteLabel = async () => {
    setSavingWL(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        wl_enabled: wlEnabled,
        wl_brand_name: brandName.trim() || null,
        wl_logo_url: logoUrl,
        wl_primary_color: hexToHsl(primary),
        wl_accent_color: hexToHsl(accent),
        wl_hide_branding: hideBranding,
      } as never)
      .eq("id", profile.id);
    setSavingWL(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("White-label saved");
  };

  const rules = profile.voice_rules ?? [];

  return (
    <div className="min-h-full bg-navy text-navy-foreground">
      <div className="container max-w-3xl py-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-navy-mint">
          Personalize how AI writes your sites and how your brand appears to clients.
        </p>

        {/* Brand Voice */}
        <section className="mt-8 rounded-lg border border-sidebar-border bg-navy-muted p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="h-4 w-4 text-primary-glow" />
                Brand Voice
              </h2>
              <p className="mt-1 text-sm text-navy-mint">
                Paste 3–5 samples of your existing copy (emails, social posts, about page).
                We'll learn your tone and apply it to every site.
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
            className="mt-4 min-h-48 bg-navy/60 border-sidebar-border text-navy-foreground placeholder:text-navy-mint/60"
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
            <div className="mt-6 rounded-md border border-primary/30 bg-primary/10 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-glow">
                Learned voice rules
              </p>
              <ul className="space-y-1 text-sm">
                {rules.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary-glow">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* White-label (Agency only) */}
        {isAgency && (
          <section className="mt-6 rounded-lg border border-sidebar-border bg-navy-muted p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Palette className="h-4 w-4 text-primary-glow" />
                  White-label Branding
                </h2>
                <p className="mt-1 text-sm text-navy-mint">
                  Replace Virtual Engine branding with your agency's identity on shared previews
                  and published sites. Applied to all sites by default; per-workspace overrides
                  available in Client Workspaces.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="wl-active" className="text-sm">Enabled</Label>
                <Switch id="wl-active" checked={wlEnabled} onCheckedChange={setWlEnabled} />
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <Label>Brand name</Label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Acme Studio"
                  className="mt-1 bg-navy/60 border-sidebar-border text-navy-foreground placeholder:text-navy-mint/60"
                />
              </div>

              <div>
                <Label>Logo</Label>
                <div className="mt-1 flex items-center gap-3">
                  {logoUrl ? (
                    <div className="relative">
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-12 w-auto rounded border bg-white p-1 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setLogoUrl(null)}
                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-12 w-20 items-center justify-center rounded border border-dashed border-sidebar-border text-xs text-navy-mint">
                      No logo
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUpload(f);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Uploading…</>
                    ) : (
                      <><Upload className="mr-1 h-3.5 w-3.5" /> Upload</>
                    )}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-navy-mint/80">PNG or SVG, under 2 MB.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Primary color</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={primary}
                      onChange={(e) => setPrimary(e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded border border-sidebar-border bg-navy"
                    />
                    <Input
                      value={primary}
                      onChange={(e) => setPrimary(e.target.value)}
                      className="bg-navy/60 border-sidebar-border text-navy-foreground"
                    />
                  </div>
                </div>
                <div>
                  <Label>Accent color</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded border border-sidebar-border bg-navy"
                    />
                    <Input
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                      className="bg-navy/60 border-sidebar-border text-navy-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-sidebar-border bg-navy/50 p-3">
                <div>
                  <Label className="text-sm font-medium">Hide "Powered by Virtual Engine Builder"</Label>
                  <p className="text-xs text-navy-mint">
                    Removes the badge on share previews and published sites.
                  </p>
                </div>
                <Switch checked={hideBranding} onCheckedChange={setHideBranding} />
              </div>

              <div>
                <Button onClick={saveWhiteLabel} disabled={savingWL}>
                  {savingWL ? "Saving…" : "Save white-label"}
                </Button>
              </div>
            </div>
          </section>
        )}

        {!isAgency && (
          <section className="mt-6 rounded-lg border border-dashed border-sidebar-border bg-navy-muted/50 p-6 text-sm text-navy-mint">
            <div className="flex items-center gap-2 font-medium text-navy-foreground">
              <Palette className="h-4 w-4 text-primary-glow" />
              White-label Branding
            </div>
            <p className="mt-1">
              Available on the Agency plan. Upgrade to add your logo, colors, and remove
              Virtual Engine branding from client sites.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
