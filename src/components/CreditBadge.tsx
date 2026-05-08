import { useState } from "react";
import { Sparkles, Zap, AlertTriangle, ShieldCheck } from "lucide-react";
import { useProfile, PLAN_LIMITS } from "@/hooks/useProfile";
import { useAdmin } from "@/hooks/useAdmin";
import { TopUpModal } from "@/components/TopUpModal";

export const CreditBadge = () => {
  const { data: profile } = useProfile();
  const { data: admin } = useAdmin();
  const [open, setOpen] = useState(false);
  if (!profile) return null;

  if (admin) {
    return (
      <span className="flex items-center gap-2 rounded-full border border-cta/30 bg-cta/10 px-3 py-1.5 text-xs font-semibold text-cta">
        <ShieldCheck className="h-3.5 w-3.5" />
        {admin.access_level === "super_admin" ? "Super Admin" : "Admin"} — Unlimited
      </span>
    );
  }

  const limits = PLAN_LIMITS[profile.plan];
  const isUnlimited = profile.plan === "agency";
  const totalCap = limits.build + profile.build_credits_rollover;
  const pct = isUnlimited ? 100 : Math.round((profile.build_credits / Math.max(totalCap, 1)) * 100);

  let color = "bg-success/10 text-success border-success/20";
  let Icon = Sparkles;
  if (!isUnlimited && pct <= 0) {
    color = "bg-destructive/10 text-destructive border-destructive/20";
    Icon = AlertTriangle;
  } else if (!isUnlimited && pct < 20) {
    color = "bg-warning/10 text-warning border-warning/20";
    Icon = AlertTriangle;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80 ${color}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {isUnlimited ? "Unlimited builds" : `${profile.build_credits} credits`}
        <span className="hidden text-[10px] opacity-70 sm:inline">· top up</span>
      </button>
      <TopUpModal open={open} onOpenChange={setOpen} />
    </>
  );
};
