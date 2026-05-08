REVOKE EXECUTE ON FUNCTION public.check_and_consume(uuid, public.rate_action, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_credits(uuid, int, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_storage_caps() FROM PUBLIC, anon, authenticated;
-- get_effective_plan is read-only and safe to expose
GRANT EXECUTE ON FUNCTION public.get_effective_plan(uuid) TO authenticated;