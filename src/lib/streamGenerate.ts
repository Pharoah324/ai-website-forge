import { supabase } from "@/integrations/supabase/client";
import type { SiteContent } from "@/types/site";

export type StreamCallbacks = {
  onDelta?: (partial: string) => void;
  onDone: (site: { id: string; content: SiteContent; name: string }) => void;
  onError: (msg: string) => void;
};

type GenerateBody = {
  prompt: string;
  template_draft?: SiteContent | null;
  business_name?: string;
  business_city?: string;
};

export async function streamGenerateSite(
  body: GenerateBody,
  cbs: StreamCallbacks,
  signal?: AbortSignal,
) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    cbs.onError("Not authenticated");
    return;
  }
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-site`;
  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ ...body, stream: true }),
      signal,
    });
  } catch (e) {
    cbs.onError(e instanceof Error ? e.message : "Network error");
    return;
  }

  if (!resp.ok || !resp.body) {
    let msg = "Generation failed";
    try {
      const j = await resp.json();
      msg = j.error || msg;
    } catch { /* noop */ }
    cbs.onError(msg);
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let currentEvent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, idx).replace(/\r$/, "");
      buf = buf.slice(idx + 1);
      if (line === "") {
        currentEvent = "";
        continue;
      }
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
        continue;
      }
      if (line.startsWith("data: ")) {
        const dataStr = line.slice(6);
        try {
          const data = JSON.parse(dataStr);
          if (currentEvent === "delta" && data.partial_json) {
            cbs.onDelta?.(data.partial_json);
          } else if (currentEvent === "done" && data.site) {
            cbs.onDone(data.site);
          } else if (currentEvent === "error") {
            cbs.onError(data.error || "Generation error");
          }
        } catch { /* ignore partial */ }
      }
    }
  }
}
