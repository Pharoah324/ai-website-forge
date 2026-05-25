import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Rocket, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PACKS = [
  { id: "starter_boost", name: "Starter Boost", price: 9, build: 50, runtime: 1000, icon: Zap },
  { id: "growth_pack", name: "Growth Pack", price: 24, build: 150, runtime: 4000, icon: TrendingUp, popular: true },
  { id: "agency_burst", name: "Agency Burst", price: 69, build: 500, runtime: 15000, icon: Rocket },
];

export const TopUpModal = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const buy = async (packId: string) => {
    setLoadingId(packId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { kind: "topup", packId, returnUrl: window.location.origin },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned");
    } catch (err: any) {
      toast.error("Checkout failed", {
        description: err?.message ?? "Could not start Stripe checkout. Make sure products are set up.",
      });
      setLoadingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buy more credits</DialogTitle>
          <DialogDescription>
            One-time purchase. Credits added instantly and never expire on monthly reset.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          {PACKS.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-lg border bg-card p-4 transition-shadow hover:shadow-elevated ${
                p.popular ? "border-primary ring-1 ring-primary/40" : ""
              }`}
            >
              {p.popular && (
                <span className="absolute -top-2 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  POPULAR
                </span>
              )}
              <p.icon className="mb-2 h-5 w-5 text-primary" />
              <h4 className="text-sm font-semibold">{p.name}</h4>
              <p className="mt-1 text-2xl font-bold">${p.price}</p>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                <li>+{p.build} build credits</li>
                <li>+{(p.runtime ?? 0).toLocaleString()} runtime credits</li>
              </ul>
              <Button
                className="mt-4 w-full"
                size="sm"
                variant={p.popular ? "default" : "outline"}
                disabled={loadingId !== null}
                onClick={() => buy(p.id)}
              >
                {loadingId === p.id ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                )}
                Buy {p.name}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
