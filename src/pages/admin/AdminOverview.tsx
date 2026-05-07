import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Globe, DollarSign, TrendingUp, Sparkles, UserPlus } from "lucide-react";

function Stat({ icon: Icon, label, value, hint }: any) {
  return (
    <Card className="border-primary/20 bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

export default function AdminOverview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const dayAgo = new Date(Date.now() - 86400000).toISOString();
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const [u, paid, sToday, sWeek, sMonth, signups, aff] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).neq("plan", "free"),
        supabase.from("sites").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
        supabase.from("sites").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("sites").select("id", { count: "exact", head: true }).gte("created_at", monthAgo),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
        supabase.from("affiliates").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return {
        users: u.count ?? 0,
        paid: paid.count ?? 0,
        sToday: sToday.count ?? 0,
        sWeek: sWeek.count ?? 0,
        sMonth: sMonth.count ?? 0,
        signups: signups.count ?? 0,
        pendingAff: aff.count ?? 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">Live snapshot of platform activity.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Stat icon={Users} label="Total users" value={data?.users ?? "—"} />
        <Stat icon={DollarSign} label="Paid subscribers" value={data?.paid ?? "—"} />
        <Stat icon={UserPlus} label="New signups today" value={data?.signups ?? "—"} />
        <Stat icon={TrendingUp} label="Pending affiliates" value={data?.pendingAff ?? "—"} />
        <Stat icon={Globe} label="Sites today" value={data?.sToday ?? "—"} />
        <Stat icon={Globe} label="Sites this week" value={data?.sWeek ?? "—"} />
        <Stat icon={Globe} label="Sites this month" value={data?.sMonth ?? "—"} />
        <Stat icon={Sparkles} label="MRR" value="—" hint="Connect Stripe reports" />
      </div>
    </div>
  );
}
