import { useEffect, useMemo, useState } from "react";
import { useAffiliate } from "@/hooks/useAffiliate";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Twitter, Facebook, Linkedin, MessageCircle, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function AffiliateDashboard() {
  const { data: affiliate, isLoading } = useAffiliate();
  const qc = useQueryClient();

  const link = affiliate ? `${window.location.origin}/?ref=${affiliate.affiliate_code}` : "";

  const { data: conversions = [] } = useQuery({
    queryKey: ["conversions", affiliate?.id],
    enabled: !!affiliate,
    queryFn: async () => {
      const { data } = await supabase
        .from("referral_conversions")
        .select("*")
        .eq("affiliate_id", affiliate!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ["payouts", affiliate?.id],
    enabled: !!affiliate,
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_payouts")
        .select("*")
        .eq("affiliate_id", affiliate!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const monthly = useMemo(() => {
    const map: Record<string, number> = {};
    conversions.forEach((c: any) => {
      const m = new Date(c.created_at).toISOString().slice(0, 7);
      map[m] = (map[m] || 0) + Number(c.commission_amount);
    });
    return Object.entries(map).sort().slice(-6);
  }, [conversions]);
  const maxMonthly = Math.max(1, ...monthly.map(([, v]) => v));

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Copied!");
  };
  const share = (url: string) => window.open(url, "_blank", "noopener");

  const requestPayout = async () => {
    if (!affiliate) return;
    if (Number(affiliate.pending_payout) < 50) return toast.error("Minimum payout is $50.");
    const { error } = await supabase.from("affiliate_payouts").insert({
      affiliate_id: affiliate.id,
      amount: affiliate.pending_payout,
      method: "paypal",
      status: "pending",
    });
    if (error) return toast.error(error.message);
    toast.success("Payout requested. Processing within 7 business days.");
    qc.invalidateQueries({ queryKey: ["payouts"] });
  };

  if (isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;

  if (!affiliate) {
    return (
      <div className="container max-w-xl py-16 text-center">
        <h1 className="text-2xl font-bold">You're not an affiliate yet</h1>
        <p className="mt-2 text-muted-foreground">Apply to the program to start earning 30% recurring commission.</p>
        <Button asChild className="mt-6 bg-cta text-cta-foreground hover:bg-cta/90">
          <a href="/affiliates">Apply Now</a>
        </Button>
      </div>
    );
  }

  if (affiliate.status === "pending") {
    return (
      <div className="container max-w-xl py-16 text-center">
        <h1 className="text-2xl font-bold">Application under review</h1>
        <p className="mt-2 text-muted-foreground">We'll email you within 24 hours once you're approved.</p>
      </div>
    );
  }

  if (affiliate.status === "suspended") {
    return (
      <div className="container max-w-xl py-16 text-center">
        <h1 className="text-2xl font-bold text-destructive">Account suspended</h1>
        <p className="mt-2 text-muted-foreground">Please contact support.</p>
      </div>
    );
  }

  const stats = [
    { label: "Affiliate Code", value: affiliate.affiliate_code },
    { label: "Total Referrals", value: affiliate.total_referrals },
    { label: "Active Subscribers", value: affiliate.active_subscribers },
    { label: "Monthly Earnings", value: `$${monthly.at(-1)?.[1] ?? 0}` },
    { label: "Total Earned", value: `$${Number(affiliate.total_earnings).toFixed(2)}` },
    { label: "Pending Payout", value: `$${Number(affiliate.pending_payout).toFixed(2)}` },
  ];

  return (
    <div className="container space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Affiliate Dashboard</h1>
        <p className="text-sm text-muted-foreground">Tier: <span className="font-semibold capitalize text-primary">{affiliate.tier}</span></p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="border-primary/20 p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-lg font-bold">{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Link + share */}
      <Card className="border-primary/20 p-6">
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><Share2 className="h-4 w-4" /> Your affiliate link</h2>
        <div className="flex gap-2">
          <input readOnly value={link} className="flex-1 rounded-md border border-primary/20 bg-background px-3 py-2 text-sm" />
          <Button variant="outline" onClick={() => copy(link)}><Copy className="h-4 w-4" /></Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => share(`https://twitter.com/intent/tweet?text=${encodeURIComponent("Build a website in 60 seconds with AI: " + link)}`)}>
            <Twitter className="h-4 w-4" /> X
          </Button>
          <Button size="sm" variant="outline" onClick={() => share(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`)}>
            <Facebook className="h-4 w-4" /> Facebook
          </Button>
          <Button size="sm" variant="outline" onClick={() => share(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`)}>
            <Linkedin className="h-4 w-4" /> LinkedIn
          </Button>
          <Button size="sm" variant="outline" onClick={() => share(`https://wa.me/?text=${encodeURIComponent("Mira esto: " + link)}`)}>
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast.info("Affiliate kit coming soon — banners + copy templates")}>
            <Download className="h-4 w-4" /> Affiliate kit
          </Button>
        </div>
      </Card>

      {/* Earnings chart */}
      <Card className="border-primary/20 p-6">
        <h2 className="mb-4 font-semibold">Monthly earnings</h2>
        {monthly.length === 0 ? (
          <p className="text-sm text-muted-foreground">No earnings yet.</p>
        ) : (
          <div className="flex h-32 items-end gap-3">
            {monthly.map(([m, v]) => (
              <div key={m} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-gradient-to-t from-primary to-cta" style={{ height: `${(v / maxMonthly) * 100}%` }} />
                <div className="text-[10px] text-muted-foreground">{m}</div>
                <div className="text-xs font-semibold">${v.toFixed(0)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Referrals */}
      <Card className="border-primary/20 p-6">
        <h2 className="mb-4 font-semibold">Referrals</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="py-2">Date</th><th>Plan</th><th>Monthly</th><th>Commission</th><th>Status</th></tr>
            </thead>
            <tbody>
              {conversions.length === 0 && <tr><td colSpan={5} className="py-4 text-muted-foreground">No referrals yet.</td></tr>}
              {conversions.map((c: any) => (
                <tr key={c.id} className="border-t border-primary/10">
                  <td className="py-2">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="capitalize">{c.plan_subscribed}</td>
                  <td>${Number(c.monthly_value).toFixed(2)}</td>
                  <td className="text-cta">${Number(c.commission_amount).toFixed(2)}</td>
                  <td><span className="capitalize">{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payouts */}
      <Card className="border-primary/20 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Payout history</h2>
          <Button onClick={requestPayout} className="bg-cta text-cta-foreground hover:bg-cta/90">Request payout</Button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">Min $50 · PayPal: {affiliate.paypal_email} · 7 business days</p>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr><th className="py-2">Date</th><th>Amount</th><th>Method</th><th>Status</th></tr>
          </thead>
          <tbody>
            {payouts.length === 0 && <tr><td colSpan={4} className="py-4 text-muted-foreground">No payouts yet.</td></tr>}
            {payouts.map((p: any) => (
              <tr key={p.id} className="border-t border-primary/10">
                <td className="py-2">{new Date(p.created_at).toLocaleDateString()}</td>
                <td>${Number(p.amount).toFixed(2)}</td>
                <td className="capitalize">{p.method}</td>
                <td className="capitalize">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
