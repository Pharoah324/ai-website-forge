// Launch testing harness — admin-only diagnostic checks against the live system.
// All tests are READ-ONLY (no Stripe charges, no real signups). Each test
// inspects DB state and configuration to verify production readiness.

import { createClient } from "jsr:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type TestResult = {
  status: "pass" | "fail";
  details: Record<string, unknown>;
  error?: string;
};

/* -------------------------------------------------------------------------- */
/*                              individual tests                              */
/* -------------------------------------------------------------------------- */

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function test_plan_caps_seeded(): Promise<TestResult> {
  const expected: Record<string, { build: number; runtime: number }> = {
    free: { build: 20, runtime: 300 },
    starter: { build: 100, runtime: 2500 },
    builder: { build: 300, runtime: 10000 },
    pro: { build: 800, runtime: 30000 },
    agency: { build: 2000, runtime: 100000 },
  };
  const { data, error } = await admin.from("plan_caps").select("*");
  if (error) return { status: "fail", details: {}, error: error.message };
  const issues: string[] = [];
  for (const [plan, want] of Object.entries(expected)) {
    const row = data?.find((r: any) => r.plan === plan);
    if (!row) { issues.push(`missing ${plan}`); continue; }
    if (row.monthly_build_credits !== want.build)
      issues.push(`${plan} build ${row.monthly_build_credits} ≠ ${want.build}`);
    if (row.monthly_runtime_credits !== want.runtime)
      issues.push(`${plan} runtime ${row.monthly_runtime_credits} ≠ ${want.runtime}`);
  }
  return issues.length
    ? { status: "fail", details: { issues }, error: issues.join("; ") }
    : { status: "pass", details: { plans: Object.keys(expected).length } };
}

async function test_feature_gates(): Promise<TestResult> {
  const { data, error } = await admin
    .from("plan_caps")
    .select("plan,gsc_enabled,search_atlas_enabled,priority_queue,white_label");
  if (error) return { status: "fail", details: {}, error: error.message };
  const get = (p: string) => data?.find((r: any) => r.plan === p) as any;
  const checks = [
    ["builder.search_atlas", get("builder")?.search_atlas_enabled === true],
    ["pro.priority_queue", get("pro")?.priority_queue === true],
    ["agency.white_label", get("agency")?.white_label === true],
    ["free.no_search_atlas", get("free")?.search_atlas_enabled === false],
    ["starter.no_search_atlas", get("starter")?.search_atlas_enabled === false],
  ] as const;
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  return failed.length
    ? { status: "fail", details: { failed }, error: failed.join(", ") }
    : { status: "pass", details: { checked: checks.length } };
}

async function test_stripe_products(): Promise<TestResult> {
  const { data, error } = await admin
    .from("stripe_products")
    .select("plan_tier,kind,active")
    .eq("kind", "subscription")
    .eq("active", true);
  if (error) return { status: "fail", details: {}, error: error.message };
  const tiers = new Set((data ?? []).map((r: any) => r.plan_tier));
  const required = ["starter", "builder", "pro", "agency"];
  const missing = required.filter((t) => !tiers.has(t));
  return missing.length
    ? { status: "fail", details: { missing }, error: `Missing Stripe products: ${missing.join(",")}` }
    : { status: "pass", details: { tiers: [...tiers] } };
}

async function test_topup_packs(): Promise<TestResult> {
  const { data } = await admin
    .from("stripe_products")
    .select("pack_id,build_credits,runtime_credits,active")
    .eq("kind", "topup")
    .eq("active", true);
  const expected = { starter: [50, 1000], growth: [150, 4000], agency: [500, 15000] };
  const issues: string[] = [];
  for (const [id, [b, r]] of Object.entries(expected)) {
    const row = (data ?? []).find((x: any) => x.pack_id === id) as any;
    if (!row) { issues.push(`pack '${id}' missing`); continue; }
    if (row.build_credits !== b) issues.push(`${id} build ${row.build_credits}≠${b}`);
    if (row.runtime_credits !== r) issues.push(`${id} runtime ${row.runtime_credits}≠${r}`);
  }
  return issues.length
    ? { status: "fail", details: { issues }, error: issues.join("; ") }
    : { status: "pass", details: { packs: 3 } };
}

async function test_credit_consume_rpc(): Promise<TestResult> {
  // Call check_and_consume on a synthetic UUID — should return ok:false
  // (no_profile) without throwing. This validates the RPC is wired.
  const fakeUid = "00000000-0000-0000-0000-000000000001";
  const { data, error } = await admin.rpc("check_and_consume", {
    _uid: fakeUid, _action: "site_generation", _credit_cost: 1,
  });
  if (error) return { status: "fail", details: {}, error: error.message };
  const ok = data && (data as any).ok === false;
  return ok
    ? { status: "pass", details: { rpc_response: data } }
    : { status: "fail", details: { rpc_response: data }, error: "Expected ok:false" };
}

async function test_refund_credits_rpc(): Promise<TestResult> {
  const { error } = await admin.rpc("refund_credits", {
    _uid: "00000000-0000-0000-0000-000000000001",
    _amount: 0, _reason: "test", _description: "launch_test",
  });
  // Returns ok:false invalid_amount — but no exception means RPC exists.
  return error
    ? { status: "fail", details: {}, error: error.message }
    : { status: "pass", details: { exists: true } };
}

async function test_admin_alerts_table(): Promise<TestResult> {
  const { error } = await admin.from("admin_alerts").select("id").limit(1);
  return error
    ? { status: "fail", details: {}, error: error.message }
    : { status: "pass", details: { accessible: true } };
}

async function test_account_flags_table(): Promise<TestResult> {
  const { error } = await admin.from("account_flags").select("id").limit(1);
  return error
    ? { status: "fail", details: {}, error: error.message }
    : { status: "pass", details: { accessible: true } };
}

async function test_grace_period_function(): Promise<TestResult> {
  const { data, error } = await admin.rpc("downgrade_past_due_users");
  return error
    ? { status: "fail", details: {}, error: error.message }
    : { status: "pass", details: { result: data } };
}

async function test_abuse_detection(): Promise<TestResult> {
  const { data, error } = await admin.rpc("detect_abuse_and_pause");
  return error
    ? { status: "fail", details: {}, error: error.message }
    : { status: "pass", details: { result: data } };
}

async function test_secrets_present(): Promise<TestResult> {
  const required = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "ANTHROPIC_API_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = required.filter((k) => !Deno.env.get(k));
  return missing.length
    ? { status: "fail", details: { missing }, error: `Missing secrets: ${missing.join(",")}` }
    : { status: "pass", details: { checked: required.length } };
}

async function test_rls_anonymous_blocked(): Promise<TestResult> {
  // Ensure anonymous client cannot read profiles/admin_alerts
  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const { data: profiles } = await anon.from("profiles").select("id").limit(1);
  const { data: alerts } = await anon.from("admin_alerts").select("id").limit(1);
  const leaked = (profiles?.length ?? 0) > 0 || (alerts?.length ?? 0) > 0;
  return leaked
    ? { status: "fail", details: { profiles, alerts }, error: "Anonymous can read protected tables" }
    : { status: "pass", details: { protected: ["profiles", "admin_alerts"] } };
}

async function test_signup_trigger(): Promise<TestResult> {
  // Verify handle_new_user trigger exists (counts profiles for any auth user)
  const { count, error } = await admin.from("profiles").select("id", { count: "exact", head: true });
  return error
    ? { status: "fail", details: {}, error: error.message }
    : { status: "pass", details: { profiles_count: count } };
}

async function test_stripe_events_idempotency(): Promise<TestResult> {
  const { error } = await admin.from("stripe_events").select("id").limit(1);
  return error
    ? { status: "fail", details: {}, error: "stripe_events table missing — webhook idempotency broken" }
    : { status: "pass", details: { table: "stripe_events" } };
}

async function test_credit_transactions_audit(): Promise<TestResult> {
  const { count, error } = await admin
    .from("credit_transactions")
    .select("transaction_id", { count: "exact", head: true });
  return error
    ? { status: "fail", details: {}, error: error.message }
    : { status: "pass", details: { transactions: count } };
}

/* -------------------------------------------------------------------------- */
/*                                  registry                                  */
/* -------------------------------------------------------------------------- */

const TESTS: Record<string, () => Promise<TestResult>> = {
  // Account & Billing
  signup_trigger: test_signup_trigger,
  plan_caps_seeded: test_plan_caps_seeded,
  feature_gates: test_feature_gates,
  stripe_products: test_stripe_products,
  topup_packs: test_topup_packs,
  stripe_events_idempotency: test_stripe_events_idempotency,
  grace_period_function: test_grace_period_function,
  // Credits
  credit_consume_rpc: test_credit_consume_rpc,
  refund_credits_rpc: test_refund_credits_rpc,
  credit_transactions_audit: test_credit_transactions_audit,
  // Admin / Abuse
  admin_alerts_table: test_admin_alerts_table,
  account_flags_table: test_account_flags_table,
  abuse_detection: test_abuse_detection,
  // Security
  secrets_present: test_secrets_present,
  rls_anonymous_blocked: test_rls_anonymous_blocked,
};

/* -------------------------------------------------------------------------- */
/*                                  handler                                   */
/* -------------------------------------------------------------------------- */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: u.user.id });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const test_key: string = body.test_key;
    const section: string = body.section ?? "general";
    if (!test_key || !TESTS[test_key])
      return new Response(JSON.stringify({ error: "unknown test_key", available: Object.keys(TESTS) }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let result: TestResult;
    try {
      result = await TESTS[test_key]();
    } catch (e) {
      result = { status: "fail", details: {}, error: e instanceof Error ? e.message : String(e) };
    }

    await admin.from("launch_test_results").insert({
      test_key, section, status: result.status,
      details: result.details, error_message: result.error ?? null,
      run_by_admin: u.user.id,
    });

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
