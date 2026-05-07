import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function LockedOverlay({
  plan,
  feature,
  upgradeTo,
}: {
  plan: string;
  feature: string;
  upgradeTo: "builder" | "pro" | "agency" | null;
}) {
  if (!upgradeTo) return null;
  const labels: Record<string, { name: string; price: string }> = {
    builder: { name: "Builder", price: "$49/mo" },
    pro: { name: "Pro", price: "$99/mo" },
    agency: { name: "Agency", price: "$199/mo" },
  };
  const t = labels[upgradeTo];
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-[#080D18]/40 via-[#080D18]/85 to-[#080D18]/95 backdrop-blur-[2px]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
        <Lock className="h-5 w-5 text-emerald-400" />
      </div>
      <p className="mt-3 text-sm font-semibold text-white">{feature}</p>
      <p className="mt-1 max-w-xs text-center text-xs text-white/50">
        Available on <span className="font-medium text-white/80">{t.name} ({t.price})</span> and above.
      </p>
      <Link
        to="/app/billing"
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-400"
      >
        <Sparkles className="h-3.5 w-3.5" /> Upgrade to {t.name}
      </Link>
    </div>
  );
}
