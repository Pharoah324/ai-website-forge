import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

export function AccessCodeRedeem() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const redeem = async () => {
    if (!code.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("redeem_access_code", { _code: code.trim() });
    setLoading(false);
    if (error) return toast.error(error.message);
    const res = data as any;
    if (!res?.ok) return toast.error(res?.error || "Could not redeem");
    toast.success(`Code applied · plan ${res.plan} +${res.credits} credits`);
    setCode("");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };
  return (
    <Card className="border-cta/30 bg-cta/5 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cta">
        <KeyRound className="h-4 w-4" /> Have an access code?
      </div>
      <div className="flex gap-2">
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="VEB-XXXXXX" />
        <Button onClick={redeem} disabled={loading}>Redeem</Button>
      </div>
    </Card>
  );
}
