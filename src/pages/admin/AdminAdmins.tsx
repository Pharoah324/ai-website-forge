import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminAdmins() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: "", level: "admin", notes: "" });
  const { data: admins = [] } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => (await supabase.from("admin_users").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const add = async () => {
    if (!form.email) return;
    // find user
    const { data: prof } = await supabase.from("profiles").select("id, display_name, email").eq("email", form.email).maybeSingle();
    if (!prof) return toast.error("No user with that email — they must sign up first.");
    const { error } = await supabase.from("admin_users").insert([{
      user_id: prof.id, email: prof.email, name: prof.display_name, access_level: form.level as any, notes: form.notes,
    }]);
    if (error) return toast.error(error.message);
    await supabase.from("profiles").update({ role: "admin" }).eq("id", prof.id);
    toast.success("Admin added");
    setForm({ email: "", level: "admin", notes: "" });
    qc.invalidateQueries({ queryKey: ["admins"] });
  };
  const remove = async (userId: string, level: string) => {
    if (level === "super_admin") return toast.error("Super admin can only be removed in DB");
    if (!confirm("Remove admin access?")) return;
    await supabase.from("admin_users").delete().eq("user_id", userId);
    await supabase.from("profiles").update({ role: "user" }).eq("id", userId);
    qc.invalidateQueries({ queryKey: ["admins"] });
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin Users</h1>
      <Card className="border-primary/20 p-4 grid gap-3 md:grid-cols-4">
        <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@email.com" />
        <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
          className="rounded-md border border-input bg-background px-3 text-sm">
          <option value="admin">admin</option>
          <option value="support">support</option>
        </select>
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />
        <Button onClick={add}>Add admin</Button>
      </Card>
      <Card className="border-primary/20 p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-primary/10 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Email</th><th>Name</th><th>Level</th><th>Last active</th><th>Notes</th><th /></tr>
            </thead>
            <tbody>
              {admins.map((a: any) => (
                <tr key={a.user_id} className="border-b border-primary/10">
                  <td className="p-3">{a.email}</td>
                  <td>{a.name}</td>
                  <td className="capitalize">{a.access_level}</td>
                  <td className="text-xs">{a.last_active ? new Date(a.last_active).toLocaleDateString() : "—"}</td>
                  <td className="text-xs text-muted-foreground">{a.notes}</td>
                  <td><Button size="sm" variant="outline" onClick={() => remove(a.user_id, a.access_level)}>Remove</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
