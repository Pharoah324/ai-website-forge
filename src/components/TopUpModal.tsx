import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Rocket, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const PACKS = [
  {
    id: "starter_boost",
    name: "Starter Boost",
    price: 9,
    build: 50,
    runtime: 1000,
    icon: Zap,
  },
  {
    id: "growth_pack",
    name: "Growth Pack",
    price: 24,
    build: 150,
    runtime: 5000,
    icon: TrendingUp,
    popular: true,
  },
  {
    id: "agency_burst",
    name: "Agency Burst",
    price: 69,
    build: 500,
    runtime: 20000,
    icon: Rocket,
  },
];

export const TopUpModal = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buy more credits</DialogTitle>
          <DialogDescription>
            One-time purchase, credits added instantly. No subscription change.
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
                <li>+{p.runtime.toLocaleString()} runtime credits</li>
              </ul>
              <Button
                className="mt-4 w-full"
                size="sm"
                variant={p.popular ? "default" : "outline"}
                onClick={() => {
                  toast.info("Stripe checkout coming next phase", {
                    description: `${p.name} ($${p.price}) — Stripe integration to be wired in the next build.`,
                  });
                }}
              >
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                Buy {p.name}
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Stripe checkout will be wired in the next build. Pack definitions and
          credit math are already live.
        </p>
      </DialogContent>
    </Dialog>
  );
};
