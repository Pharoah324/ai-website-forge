-- Part A / A1 — make ai_generation_logs loggable for anonymous AI calls.
--
-- The two public functions (chat-assistant, translate-batch) have neither a
-- user nor (for rejections) a prompt, but user_id + prompt were NOT NULL, which
-- would reject those inserts. Table is EMPTY (0 rows) → additive, zero data risk.
--
-- Scope: ONLY relax the two NOT NULL constraints. No new columns. The existing
-- SELECT RLS policy ("Users can view own generation logs") is left untouched —
-- service-role writes bypass RLS so no INSERT policy is needed, and anon rows
-- (user_id NULL) staying invisible to the own-logs policy is intended (admins
-- read via the SQL editor / service role).

ALTER TABLE public.ai_generation_logs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.ai_generation_logs ALTER COLUMN prompt  DROP NOT NULL;
