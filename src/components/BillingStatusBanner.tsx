import { AlertTriangle, XCircle, ShieldAlert, Pause } from "lucide-react";
import { Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useActivePause } from "@/hooks/useAccountStatus";

export function BillingStatusBanner() {
  const { data: profile } = useProfile();
  const { data: pause } = useActivePause();
  if (!profile) return null;

  if (pause) {
    return (
      <div className="flex items-center gap-3 border-b border-red-500/40 bg-red-500/10 px-6 py-3 text-sm">
        <Pause className="h-4 w-4 shrink-0 text-red-400" />
        <p className="flex-1 text-red-100">
          <span className="font-semibold">Your account has been temporarily paused</span> due to
          unusual activity. Our team has been notified and will review your account within 24 hours.
          If you believe this is an error please contact support.
        </p>
      </div>
    );
  }

  const status = profile.billing_status;

  if (status === "past_due") {
    const ends = profile.grace_period_ends_at ? new Date(profile.grace_period_ends_at) : null;
    const daysLeft = ends
      ? Math.max(0, Math.ceil((ends.getTime() - Date.now()) / 86400_000))
      : 3;
    return (
      <div className="flex items-center gap-3 border-b border-yellow-500/30 bg-yellow-500/10 px-6 py-3 text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-400" />
        <p className="flex-1 text-yellow-100">
          <span className="font-semibold">Payment failed.</span> Please update your payment
          method to keep your account active. Your access continues for{" "}
          <span className="font-semibold">
            {daysLeft} more day{daysLeft === 1 ? "" : "s"}
          </span>
          .
        </p>
        <Link
          to="/app/billing"
          className="rounded-md bg-yellow-400 px-3 py-1.5 text-xs font-semibold text-yellow-950 hover:bg-yellow-300"
        >
          Update payment
        </Link>
      </div>
    );
  }

  if (status === "canceled" && profile.plan === "free" && profile.plan_before_downgrade) {
    return (
      <div className="flex items-center gap-3 border-b border-red-500/40 bg-red-500/10 px-6 py-3 text-sm">
        <XCircle className="h-4 w-4 shrink-0 text-red-400" />
        <p className="flex-1 text-red-100">
          <span className="font-semibold">Access removed.</span> Your subscription was
          canceled after the grace period expired. All your data and sites are safe — resubscribe
          to restore your <span className="font-semibold capitalize">{profile.plan_before_downgrade}</span> plan.
        </p>
        <Link
          to="/app/billing"
          className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400"
        >
          Resubscribe
        </Link>
      </div>
    );
  }

  if (status === "disputed" || profile.dispute_flagged) {
    return (
      <div className="flex items-center gap-3 border-b border-red-500/40 bg-red-500/10 px-6 py-3 text-sm">
        <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
        <p className="flex-1 text-red-100">
          <span className="font-semibold">Account flagged for payment dispute.</span> Please
          contact support to resolve.
        </p>
      </div>
    );
  }

  return null;
}
