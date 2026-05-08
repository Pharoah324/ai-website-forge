import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AdminAnnouncements() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const [variant, setVariant] = useState("info");
  const { data = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const create = async () => {
    if (!msg.trim()) return;
    const { error } = await supabase.from("announcements").insert({ message: msg, variant });
    if (error) return toast.error(error.message);
    setMsg(""); toast.success("Announcement live");
    qc.invalidateQueries({ queryKey: ["announcements"] });
  };
  const toggle = async (a: any) => {
    await supabase.from("announcements").update({ active: !a.active }).eq("id", a.id);
    qc.invalidateQueries({ queryKey: ["announcements"] });
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Announcements</h1>
      <Card className="border-primary/20 p-4 space-y-3">
        <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Platform-wide message…" />
        <div className="flex gap-2">
          <Input value={variant} onChange={(e) => setVariant(e.target.value)} placeholder="info | warning | success" className="max-w-xs" />
          <Button onClick={create}>Publish</Button>
        </div>
      </Card>
      <div className="space-y-2">
        {data.map((a: any) => (
          <Card key={a.id} className="border-primary/20 p-3 flex items-center justify-between">
            <div>
              <div className="text-sm">{a.message}</div>
              <div className="text-xs text-muted-foreground">{a.variant} · {a.active ? "active" : "inactive"}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => toggle(a)}>{a.active ? "Disable" : "Enable"}</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
