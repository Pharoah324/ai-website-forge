import { supabase } from "@/integrations/supabase/client";
import type { SiteContent } from "@/types/site";

export type StreamErrorCode =
  | "auth"
  | "network"
  | "no_credits"
  | "rate_limited"
  | "stalled"
  | "parse"
  | "server"
  | "aborted";

export type StreamCallbacks = {
  onDelta?: (partial: string) => void;
  onDone: (site: { id: string; content: SiteContent; name: string }) => void;
  onError: (msg: string, code: StreamErrorCode) => void;
};

type GenerateBody = {
  prompt: string;
  template_draft?: SiteContent | null;
  business_name?: string;
  business_city?: string;
  language?: string;
  funnel_type?: string;
  workspace_id?: string | null;
};

const STALL_MS = 45_000; // no data for 45s = stalled

export async function streamGenerateSite(
  body: GenerateBody,
  cbs: StreamCallbacks,
  signal?: AbortSignal,
) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    cbs.onError("Not authenticated. Please sign in again.", "auth");
    return;
  }
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-site`;

  // Internal abort that combines external signal + stall watchdog.
  const ctrl = new AbortController();
  const onExternalAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onExternalAbort);

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
      signal: ctrl.signal,
    });
  } catch (e) {
    signal?.removeEventListener("abort", onExternalAbort);
    if (signal?.aborted) return cbs.onError("Cancelled", "aborted");
    cbs.onError(
      e instanceof Error ? e.message : "Network error. Check your connection and retry.",
      "network",
    );
    return;
  }

  if (!resp.ok || !resp.body) {
    let msg = "Generation failed";
    let code: StreamErrorCode = "server";
    let payload: { error?: string; reason?: string; retry_after_seconds?: number; daily_limit?: number; hourly_limit?: number; plan?: string } = {};
    try {
      payload = await resp.json();
      msg = payload.error || msg;
    } catch { /* noop */ }
    const reason = payload.reason ?? payload.error;
    if (reason === "no_credits" || resp.status === 402) {
      code = "no_credits";
      msg = "You're out of build credits. Top up or upgrade your plan.";
    } else if (reason === "daily_limit") {
      code = "rate_limited";
      const mins = Math.ceil((payload.retry_after_seconds ?? 3600) / 60);
      msg = `Daily generation limit reached (${payload.daily_limit}/day on ${payload.plan} plan). Resets in ~${mins} min.`;
    } else if (reason === "hourly_limit") {
      code = "rate_limited";
      const mins = Math.ceil((payload.retry_after_seconds ?? 600) / 60);
      msg = `Hourly API limit reached. Try again in ~${mins} min.`;
    } else if (resp.status === 429) {
      code = "rate_limited";
    } else if (resp.status === 401) {
      code = "auth";
    }
    signal?.removeEventListener("abort", onExternalAbort);
    cbs.onError(msg, code);
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let currentEvent = "";
  let finished = false;

  // Stall watchdog: if no data arrives for STALL_MS, abort and surface "stalled".
  let stallTimer: number | undefined;
  const armStall = () => {
    if (stallTimer) clearTimeout(stallTimer);
    stallTimer = window.setTimeout(() => {
      if (!finished) {
        try { ctrl.abort(); } catch { /* noop */ }
      }
    }, STALL_MS);
  };
  armStall();

  try {
    while (true) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch (e) {
        if (signal?.aborted) {
          finished = true;
          cbs.onError("Cancelled", "aborted");
          return;
        }
        if (ctrl.signal.aborted) {
          finished = true;
          cbs.onError(
            "The generation stalled. Please try again.",
            "stalled",
          );
          return;
        }
        throw e;
      }
      const { done, value } = chunk;
      if (done) break;
      armStall();
      buf += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);

        if (line === "") {
          currentEvent = "";
          continue;
        }
        if (line.startsWith(":")) continue; // SSE comment / keepalive
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
              finished = true;
              cbs.onDone(data.site);
            } else if (currentEvent === "error") {
              finished = true;
              const raw = data.error || "Generation error";
              const cap = /storage_limit:sites:(\d+):(\w+)/.exec(raw);
              const friendly = cap
                ? `You've reached your plan limit of ${cap[1]} site${cap[1] === "1" ? "" : "s"} on the ${cap[2]} plan. Upgrade to save more.`
                : raw;
              cbs.onError(friendly, "server");
            }
          } catch {
            // Partial JSON across chunks: re-buffer and wait for more.
            buf = "data: " + dataStr + "\n" + buf;
            break;
          }
        }
      }
    }

    if (!finished) {
      cbs.onError(
        "Generation ended without a result. Please try again.",
        "server",
      );
    }
  } catch (e) {
    if (!finished) {
      cbs.onError(
        e instanceof Error ? e.message : "Stream error",
        "network",
      );
    }
  } finally {
    if (stallTimer) clearTimeout(stallTimer);
    signal?.removeEventListener("abort", onExternalAbort);
  }
}
