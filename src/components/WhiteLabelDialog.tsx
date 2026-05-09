import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AgencyWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Upload, X, Palette, Loader2 } from "lucide-react";
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

function hslToHex(hsl?: string | null): string {
  if (!hsl) return "#10b981";
  const m = hsl.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return "#10b981";
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

export function WhiteLabelDialog({
  workspace,
  onClose,
  onSaved,
}: {
  workspace: AgencyWorkspace | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [primary, setPrimary] = useState("#10b981");
  const [accent, setAccent] = useState("#84cc16");
  const [hideBranding, setHideBranding] = useState(false);
  const [footer, setFooter] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!workspace) return;
    setEnabled(!!workspace.wl_enabled);
    setBrandName(workspace.wl_brand_name ?? "");
    setPrimary(hslToHex(workspace.wl_primary_color));
    setAccent(hslToHex(workspace.wl_accent_color));
    setHideBranding(!!workspace.wl_hide_branding);
    setFooter(workspace.wl_footer_text ?? "");
    setSupportEmail(workspace.wl_support_email ?? "");
    setLogoUrl(workspace.wl_logo_url ?? null);
  }, [workspace]);

  if (!workspace || !user) return null;

  const onUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Image files only");
    if (file.size > 2 * 1024 * 1024) return toast.error("Logo must be under 2 MB");
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/${workspace.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("workspace-branding")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("workspace-branding").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
    toast.success("Logo uploaded");
  };

  const submit = async () => {
    setBusy(true);
    const primaryHsl = hexToHsl(primary);
    const accentHsl = hexToHsl(accent);
    const { error } = await supabase
      .from("agency_workspaces" as never)
      .update({
        wl_enabled: enabled,
        wl_brand_name: brandName.trim() || null,
        wl_logo_url: logoUrl,
        wl_primary_color: primaryHsl,
        wl_accent_color: accentHsl,
        wl_hide_branding: hideBranding,
        wl_footer_text: footer.trim() || null,
        wl_support_email: supportEmail.trim() || null,
      } as never)
      .eq("id", workspace.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("White-label settings saved");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={!!workspace} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            White-label · {workspace.name}
          </DialogTitle>
          <DialogDescription>
            Replace Virtual Engine branding with this client's identity on shared previews and
            published sites.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
            <div>
              <Label className="text-sm font-medium">Enable white-label</Label>
              <p className="text-xs text-muted-foreground">
                Apply branding to all sites in this workspace.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div>
            <Label>Brand name</Label>
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Acme Studio"
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
                <div className="flex h-12 w-20 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Primary color</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border"
                />
                <Input value={primary} onChange={(e) => setPrimary(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Accent color</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border"
                />
                <Input value={accent} onChange={(e) => setAccent(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm font-medium">Hide "Powered by" badge</Label>
              <p className="text-xs text-muted-foreground">
                Removes Virtual Engine attribution on share previews.
              </p>
            </div>
            <Switch checked={hideBranding} onCheckedChange={setHideBranding} />
          </div>

          <div>
            <Label>Custom footer text (optional)</Label>
            <Textarea
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              placeholder="© 2025 Acme Studio. All rights reserved."
              rows={2}
            />
          </div>

          <div>
            <Label>Support email (optional)</Label>
            <Input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="hello@acme.com"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
