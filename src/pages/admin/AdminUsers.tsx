import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users", q],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
      if (q) query = query.or(`email.ilike.%${q}%,display_name.ilike.%${q}%`);
      const { data } = await query;
      return data ?? [];
    },
  });

  const addCredits = async (id: string) => {
    const n = Number(prompt("How many build credits to add?", "10") || 0);
    if (!n) return;
    const u = users.find((x: any) => x.id === id);
    await supabase.from("profiles").update({ build_credits: (u?.build_credits ?? 0) + n }).eq("id", id);
    toast.success(`Added ${n} credits`);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };
  const setPlan = async (id: string) => {
    const plan = prompt("Plan (free/starter/builder/pro/agency):", "builder");
    if (!plan) return;
    const { error } = await supabase.from("profiles").update({ plan }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Plan updated");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">User Management</h1>
      <Input placeholder="Search by email or name…" value={q} onChange={(e) => setQ(e.target.value)} />
      <Card className="border-primary/20 p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-primary/10 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Email</th><th>Name</th><th>Plan</th><th>Credits</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-primary/10">
                  <td className="p-3">{u.email}</td>
                  <td>{u.display_name}</td>
                  <td className="capitalize">{u.plan}</td>
                  <td>{u.build_credits}</td>
                  <td className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="space-x-2 py-2">
                    <Button size="sm" variant="outline" onClick={() => addCredits(u.id)}>+Credits</Button>
                    <Button size="sm" variant="outline" onClick={() => setPlan(u.id)}>Plan</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
