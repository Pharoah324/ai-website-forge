import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

export function AnnouncementBanner() {
  const [items, setItems] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("veb_dismissed_ann") || "[]"); } catch { return []; }
  });
  useEffect(() => {
    supabase.from("announcements").select("*").eq("active", true).then(({ data }) => setItems(data ?? []));
  }, []);
  const visible = items.filter((i) => !dismissed.includes(i.id));
  if (!visible.length) return null;
  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem("veb_dismissed_ann", JSON.stringify(next));
  };
  return (
    <div className="space-y-1 border-b border-primary/20">
      {visible.map((a) => (
        <div key={a.id}
          className={`flex items-center justify-between px-4 py-2 text-sm ${
            a.variant === "warning" ? "bg-warning/15 text-warning" :
            a.variant === "success" ? "bg-cta/15 text-cta" : "bg-primary/15 text-primary"
          }`}>
          <span>{a.message}</span>
          <button onClick={() => dismiss(a.id)} className="opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}
