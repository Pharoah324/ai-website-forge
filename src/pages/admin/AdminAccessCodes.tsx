import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const randomCode = (prefix = "VEB") =>
  `${prefix}-${Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("")}`;

export default function AdminAccessCodes() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ code: randomCode(), plan: "builder", credits: 100, runtime: 5000, max: 1, notes: "" });
  const { data: codes = [] } = useQuery({
    queryKey: ["access-codes"],
    queryFn: async () => (await supabase.from("access_codes").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const create = async () => {
    const { error } = await supabase.from("access_codes").insert({
      code: form.code.toUpperCase(),
      plan_granted: form.plan,
      credits_granted: form.credits,
      runtime_credits_granted: form.runtime,
      max_uses: form.max,
      notes: form.notes,
    });
    if (error) return toast.error(error.message);
    toast.success("Code created");
    setForm({ ...form, code: randomCode(), notes: "" });
    qc.invalidateQueries({ queryKey: ["access-codes"] });
  };
  const toggle = async (c: any) => {
    await supabase.from("access_codes").update({ active: !c.active }).eq("id", c.id);
    qc.invalidateQueries({ queryKey: ["access-codes"] });
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Free Access Codes</h1>
      <Card className="border-primary/20 p-4 grid gap-3 md:grid-cols-3">
        <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Code" />
        <Input value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} placeholder="Plan" />
        <Input type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: +e.target.value })} placeholder="Build credits" />
        <Input type="number" value={form.runtime} onChange={(e) => setForm({ ...form, runtime: +e.target.value })} placeholder="Runtime credits" />
        <Input type="number" value={form.max} onChange={(e) => setForm({ ...form, max: +e.target.value })} placeholder="Max uses (0=∞)" />
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />
        <Button onClick={create} className="md:col-span-3">Create code</Button>
      </Card>
      <Card className="border-primary/20 p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-primary/10 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Code</th><th>Plan</th><th>Credits</th><th>Uses</th><th>Notes</th><th /></tr>
            </thead>
            <tbody>
              {codes.map((c: any) => (
                <tr key={c.id} className="border-b border-primary/10">
                  <td className="p-3 font-mono">{c.code}</td>
                  <td>{c.plan_granted}</td>
                  <td>{c.credits_granted}/{c.runtime_credits_granted}rt</td>
                  <td>{c.times_used}/{c.max_uses || "∞"}</td>
                  <td className="text-xs text-muted-foreground">{c.notes}</td>
                  <td><Button size="sm" variant="outline" onClick={() => toggle(c)}>{c.active ? "Disable" : "Enable"}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
