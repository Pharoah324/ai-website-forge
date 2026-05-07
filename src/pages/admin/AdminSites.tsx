import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminSites() {
  const qc = useQueryClient();
  const { data: sites = [] } = useQuery({
    queryKey: ["admin-sites"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("*").order("created_at", { ascending: false }).limit(200);
      return data ?? [];
    },
  });
  const del = async (id: string) => {
    if (!confirm("Delete site?")) return;
    const { error } = await supabase.from("sites").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-sites"] });
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sites</h1>
      <Card className="border-primary/20 p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-primary/10 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Name</th><th>Owner</th><th>Created</th><th>Published</th><th>Subdomain</th><th /></tr>
            </thead>
            <tbody>
              {sites.map((s: any) => (
                <tr key={s.id} className="border-b border-primary/10">
                  <td className="p-3">{s.name}</td>
                  <td className="text-xs">{s.user_id?.slice(0, 8)}…</td>
                  <td className="text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td>{s.published ? "Yes" : "No"}</td>
                  <td className="text-xs">{s.subdomain ?? "—"}</td>
                  <td className="py-2"><Button size="sm" variant="outline" onClick={() => del(s.id)}>Delete</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
