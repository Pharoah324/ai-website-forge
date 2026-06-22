import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getConsent, setConsent, hasDecision } from "@/lib/consent";

// Global GDPR consent UI: a banner until a choice is made, plus a settings
// dialog (re-openable from anywhere via the "veb:cookie-settings" event) so
// users can change or withdraw consent as easily as they gave it.
export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setShowBanner(!hasDecision());
    const open = () => {
      const rec = getConsent();
      setAnalytics(!!rec?.analytics);
      setMarketing(!!rec?.marketing);
      setSettingsOpen(true);
    };
    window.addEventListener("veb:cookie-settings", open);
    return () => window.removeEventListener("veb:cookie-settings", open);
  }, []);

  const decide = (a: boolean, m: boolean) => {
    setConsent({ analytics: a, marketing: m });
    setShowBanner(false);
    setSettingsOpen(false);
  };

  return (
    <>
      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-[100] border-t bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              We use essential cookies to run the app. With your consent we also use marketing/analytics
              cookies (e.g. affiliate attribution). You can accept, reject non-essential, or choose what to allow.{" "}
              <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => {
                const rec = getConsent();
                setAnalytics(!!rec?.analytics);
                setMarketing(!!rec?.marketing);
                setSettingsOpen(true);
              }}>Cookie settings</Button>
              <Button variant="outline" size="sm" onClick={() => decide(false, false)}>Reject non-essential</Button>
              <Button size="sm" onClick={() => decide(true, true)}>Accept all</Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cookie settings</DialogTitle>
            <DialogDescription>
              Manage how we use cookies. Essential cookies are always on; you can turn the rest on or off
              and change this anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Essential</p>
                <p className="text-xs text-muted-foreground">Required for login, security, and saving your preferences. Always active.</p>
              </div>
              <Switch checked disabled aria-label="Essential cookies (always on)" />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Analytics</p>
                <p className="text-xs text-muted-foreground">Helps us understand usage to improve the product.</p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} aria-label="Analytics cookies" />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Marketing</p>
                <p className="text-xs text-muted-foreground">Affiliate attribution and campaign tracking.</p>
              </div>
              <Switch checked={marketing} onCheckedChange={setMarketing} aria-label="Marketing cookies" />
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => decide(false, false)}>Reject non-essential</Button>
            <Button size="sm" onClick={() => decide(analytics, marketing)}>Save preferences</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
