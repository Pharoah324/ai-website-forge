// Shared AI-call logger for Virtual Engine Builder edge functions.
//
// Writes exactly ONE row to `ai_generation_logs` per AI call — success OR
// rejection — so launch-day spend and limit-hits are queryable (Part A).
//
// ─────────────────────────────────────────────────────────────────────────────
// NON-FATAL BUT NOT SILENT
// The insert is wrapped in try/catch and NEVER throws into the caller's request
// path — a logging failure must not break a user's AI call. But it fails LOUDLY:
// every failure is console.error'd, it does not vanish.
//
// ─────────────────────────────────────────────────────────────────────────────
// CALL PATTERN (A3 relies on this) — hand logAiCall() to EdgeRuntime.waitUntil()
// so logging runs AFTER the response is returned (zero added latency) and is not
// dropped when the isolate winds down. Guard for local/dev where EdgeRuntime is
// undefined by falling back to a fire-and-forget await-less call:
//
//   import { logAiCall } from "../_shared/aiLog.ts";
//
//   const logPromise = logAiCall({
//     fn: "translate-batch", model: "claude-sonnet-4-5-20250929",
//     tokensIn: usage?.input_tokens, tokensOut: usage?.output_tokens,
//     durationMs: Date.now() - startedAt, success: true,
//   });
//   // deno-lint-ignore no-explicit-any
//   const er = (globalThis as any).EdgeRuntime;
//   if (er?.waitUntil) er.waitUntil(logPromise); // else: helper already
//   // caught its own errors, so leaving logPromise un-awaited is safe.
//
// For a rejection row, pass success:false + errorMessage + meta:
//   logAiCall({ fn: "translate-batch", model: MODEL, success: false,
//     errorMessage: "rate_limited",
//     meta: { http_status: 429, limit_hit_reason: "rate_limited" } });
//
// ─────────────────────────────────────────────────────────────────────────────
// COLUMN MAPPING (ai_generation_logs)
//   user_id       ← userId          (nullable — anon calls pass undefined)
//   site_id       ← siteId          (nullable)
//   model         ← model           (NOT NULL — always pass it)
//   prompt        ← prompt          (null unless passed)
//   system_prompt ← systemPrompt    (null unless passed)
//   tokens_input  ← tokensIn
//   tokens_output ← tokensOut
//   duration_ms   ← durationMs
//   success       ← success
//   error_message ← errorMessage
//   metadata      ← { ...meta, fn }  (there is NO fn column — fn lives here, and
//                                     is written LAST so a stray meta.fn can't
//                                     clobber the real function name)
//   created_at    ← DB default now()
//
// SDK specifier pinned to match the existing edge functions exactly
// (https://esm.sh/@supabase/supabase-js@2.45.0) so we don't pull a second copy.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Service-role client built ONCE at module load (reused across invocations in a
// warm isolate). Service role bypasses RLS, so the insert always lands even
// though there is no INSERT policy on the table.
const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

export interface LogAiCallArgs {
  /** Function name — stored in metadata.fn (there is no fn column). */
  fn: string;
  userId?: string | null;
  siteId?: string | null;
  /** Anthropic model id. Maps to the NOT NULL `model` column — always pass it. */
  model: string;
  prompt?: string | null;
  systemPrompt?: string | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  durationMs?: number | null;
  /** true for a 2xx AI call, false for a rejection/failure row. */
  success: boolean;
  errorMessage?: string | null;
  /** Merged into metadata alongside fn — e.g. { http_status, limit_hit_reason }. */
  meta?: Record<string, unknown>;
}

/**
 * Insert one ai_generation_logs row. Resolves either way — NEVER rejects, so it
 * is safe to hand to EdgeRuntime.waitUntil() or leave un-awaited. Failures are
 * console.error'd (loud), not swallowed (silent).
 */
export async function logAiCall(args: LogAiCallArgs): Promise<void> {
  try {
    const { error } = await admin.from("ai_generation_logs").insert({
      user_id: args.userId ?? null,
      site_id: args.siteId ?? null,
      model: args.model,
      prompt: args.prompt ?? null,
      system_prompt: args.systemPrompt ?? null,
      tokens_input: args.tokensIn ?? null,
      tokens_output: args.tokensOut ?? null,
      duration_ms: args.durationMs ?? null,
      success: args.success,
      error_message: args.errorMessage ?? null,
      // fn written LAST so a stray meta.fn can never clobber the real name.
      metadata: { ...(args.meta ?? {}), fn: args.fn },
    });
    if (error) {
      console.error(`[aiLog] insert failed (${args.fn}):`, error.message);
    }
  } catch (e) {
    console.error(
      `[aiLog] insert threw (${args.fn}):`,
      e instanceof Error ? e.message : String(e),
    );
  }
}
