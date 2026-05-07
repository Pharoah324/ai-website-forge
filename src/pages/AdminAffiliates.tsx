import { useIsAdmin } from "@/hooks/useAffiliate";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Check, X, Pause } from "lucide-react";

export default function AdminAffiliates() {
  const { data: isAdmin, isLoading: checking } = useIsAdmin();
  const qc = useQueryClient();

  const { data: affiliates = [] } = useQuery({
    queryKey: ["admin-affiliates"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("affiliates").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ["admin-payouts"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("affiliate_payouts").select("*, affiliates(affiliate_code, paypal_email)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (checking) return <div className="p-10">Loading…</div>;
  if (!isAdmin) return <div className="container py-20 text-center"><h1 className="text-2xl font-bold">Access denied</h1></div>;

  const approve = async (id: string) => {
    const code = "VEB-" + Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[01OIL]/g, "X");
    const { error } = await supabase.from("affiliates").update({ status: "active", affiliate_code: code }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Approved");
    qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
  };
  const reject = async (id: string) => {
    const { error } = await supabase.from("affiliates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
  };
  const suspend = async (id: string) => {
    const { error } = await supabase.from("affiliates").update({ status: "suspended" }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
  };
  const markPaid = async (p: any) => {
    const { error } = await supabase.from("affiliate_payouts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", p.id);
    if (error) return toast.error(error.message);
    // decrement pending, add to paid_out_total
    const { data: aff } = await supabase.from("affiliates").select("pending_payout, paid_out_total").eq("id", p.affiliate_id).single();
    if (aff) {
      await supabase.from("affiliates").update({
        pending_payout: Math.max(0, Number(aff.pending_payout) - Number(p.amount)),
        paid_out_total: Number(aff.paid_out_total) + Number(p.amount),
      }).eq("id", p.affiliate_id);
    }
    qc.invalidateQueries({ queryKey: ["admin-payouts"] });
    qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
  };

  const exportCsv = () => {
    const rows = [
      ["code", "name", "email", "tier", "status", "referrals", "earnings", "pending", "paid_out", "paypal"],
      ...affiliates.map((a: any) => [a.affiliate_code, a.full_name, a.email, a.tier, a.status, a.total_referrals, a.total_earnings, a.pending_payout, a.paid_out_total, a.paypal_email]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "affiliates.csv";
    a.click();
  };

  const pending = affiliates.filter((a: any) => a.status === "pending");
  const active = affiliates.filter((a: any) => a.status !== "pending");
  const totalOwed = active.reduce((s: number, a: any) => s + Number(a.pending_payout), 0);

  return (
    <div className="container space-y-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Affiliate Admin</h1>
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
      </div>

      <Card className="border-primary/20 p-4">
        <div className="text-xs text-muted-foreground">Total commissions owed</div>
        <div className="text-2xl font-bold text-cta">${totalOwed.toFixed(2)}</div>
      </Card>

      <Card className="border-primary/20 p-6">
        <h2 className="mb-4 font-semibold">Pending applications ({pending.length})</h2>
        {pending.length === 0 && <p className="text-sm text-muted-foreground">No pending applications.</p>}
        <div className="space-y-2">
          {pending.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between rounded border border-primary/10 p-3">
              <div className="text-sm">
                <div className="font-medium">{a.full_name} · {a.email}</div>
                <div className="text-xs text-muted-foreground">{a.website_url} · expects {a.expected_referrals} · {a.promotion_plan}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => approve(a.id)}><Check className="h-4 w-4" /> Approve</Button>
                <Button size="sm" variant="outline" onClick={() => reject(a.id)}><X className="h-4 w-4" /> Reject</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-primary/20 p-6">
        <h2 className="mb-4 font-semibold">Active affiliates ({active.length})</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr><th className="py-2">Code</th><th>Name</th><th>Tier</th><th>Refs</th><th>Earnings</th><th>Pending</th><th></th></tr>
          </thead>
          <tbody>
            {active.map((a: any) => (
              <tr key={a.id} className="border-t border-primary/10">
                <td className="py-2 font-mono text-xs">{a.affiliate_code}</td>
                <td>{a.full_name}</td>
                <td className="capitalize">{a.tier}</td>
                <td>{a.total_referrals}</td>
                <td>${Number(a.total_earnings).toFixed(2)}</td>
                <td className="text-cta">${Number(a.pending_payout).toFixed(2)}</td>
                <td>{a.status === "active" && <Button size="sm" variant="outline" onClick={() => suspend(a.id)}><Pause className="h-3 w-3" /></Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="border-primary/20 p-6">
        <h2 className="mb-4 font-semibold">Payout requests</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr><th className="py-2">Date</th><th>Affiliate</th><th>PayPal</th><th>Amount</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {payouts.map((p: any) => (
              <tr key={p.id} className="border-t border-primary/10">
                <td className="py-2">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="font-mono text-xs">{p.affiliates?.affiliate_code}</td>
                <td>{p.affiliates?.paypal_email}</td>
                <td>${Number(p.amount).toFixed(2)}</td>
                <td className="capitalize">{p.status}</td>
                <td>{p.status === "pending" && <Button size="sm" onClick={() => markPaid(p)}>Mark paid</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
