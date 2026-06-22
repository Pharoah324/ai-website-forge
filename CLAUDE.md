# VIRTUAL ENGINE BUILDER — PROJECT BRAIN
# Claude reads this at the start of every session. Stay within these rails.

## PROJECT IDENTITY
- **Product:** Virtual Engine Builder — AI-powered website/funnel builder SaaS (competes with Lovable)
- **Scope:** Must generate BOTH websites AND apps — mobile apps, web app dashboards, client portals, booking apps, directory apps, SaaS MVPs — not just websites
- **Live URL:** https://builder.virtualengine.ai
- **Stack:** React + Vite + TypeScript + Supabase + Vercel + Lovable
- **AI Engine:** Claude Sonnet 4 (claude-sonnet-4-20250514)
- **GitHub:** Pharoah324/ai-website-forge (PRIVATE)
- **Supabase Project:** gcapzcjyfjwmyheeydvt
- **Founder:** Pharoah Owens | support@virtualengine.ai

---

## TECH STACK — NEVER DEVIATE WITHOUT ASKING
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend/DB:** Supabase (Postgres + Auth + Edge Functions + RLS)
- **Hosting:** Vercel (project: ai-website-forge)
- **Payments:** Stripe LIVE MODE — handle with extreme care
- **Email:** Resend (noreply@virtualengine.ai)
- **SEO:** Search Atlas — integrated on every generated site
- **GHL:** GoHighLevel native integration via form-submission-webhook
- **Images:** Unsplash API (in review for production access)
- **Status:** virtualengine.instatus.com

---

## ENVIRONMENT VARIABLES (Vercel — never hardcode these)
- `VITE_SUPABASE_URL` → gcapzcjyfjwmyheeydvt.supabase.co
- `VITE_SUPABASE_PUBLISHABLE_KEY` → anon public key
- `SUPABASE_SERVICE_ROLE_KEY` → server-side only, never expose client-side
- `VITE_STRIPE_PUBLISHABLE_KEY` → live mode
- `STRIPE_SECRET_KEY` → server-side only
- `STRIPE_WEBHOOK_SECRET` → webhook verification
- `ANTHROPIC_API_KEY` → Claude Sonnet 4
- `VITE_STRIPE_FREE_PRICE_ID` → price_1TYwYmBkYCVYS0BWOpd840Yh
- `VITE_STRIPE_STARTER_PRICE_ID` → price_1TYwb6BkYCVYS0BW68vw2mFX
- `VITE_STRIPE_BUILDER_PRICE_ID` → price_1TYwcIBkYCVYS0BWXbAn0Of8
- `VITE_STRIPE_PRO_PRICE_ID` → price_1TYwdEBkYCVYS0BWoc9JW93b
- `VITE_STRIPE_AGENCY_PRICE_ID` → price_1TYweSBkYCVYS0BWMS00m46W

---

## DATABASE — SUPABASE SCHEMA (20 tables, all with RLS enabled)
Core: profiles, sites, site_versions, templates
Billing: plans, subscriptions, credit_transactions, stripe_webhook_events
Infrastructure: deploy_logs, domains, ai_generation_logs
Product: site_feedback, integrations, integration_logs
Growth: affiliates, affiliate_referrals, onboarding_steps, waitlist
Content: announcements, announcement_reads

**Always use RLS policies. Never bypass auth.uid() checks.**
**Service role key is only for Edge Functions — never client-side.**

---

## ⚠️ SCHEMA DRIFT — READ BEFORE DEBUGGING "BROKEN" FEATURES
The live Supabase DB (gcapzcjyfjwmyheeydvt) was **never built from the repo migrations**. The code routinely references tables/columns/functions that don't exist live — this is what caused the refine, version-history, Optimize, and "missing table" failures (June 2026).

**RULE: when a feature throws "failed to fetch" or fails silently, check whether its table/columns/RPC actually exist in the live DB BEFORE assuming a code bug.** Verify columns too, not just table existence (e.g. `affiliates` exists but has drifted columns). Query the live DB via the Supabase Management API using the CLI's keychain token.

**Backfilled June 11, 2026** (migration `20260611_schema_drift_backfill.sql`):
- **11 tables:** access_codes, account_flags, affiliate_payouts, credit_ledger, launch_test_results, plan_caps, referral_conversions, site_seo, stripe_events, stripe_products, workspace_invites (+ supporting access_code_redemptions)
- **3 functions:** is_admin, set_updated_at, get_site_branding
- Earlier fixes: created site_chat_messages, optimization_projects/optimization_reports; added content/label cols to site_versions

**Resolved June 14, 2026:**
- **`affiliates` schema reconciled** (migration `20260614_affiliates_reconcile.sql`) — added the 10 code-expected columns (affiliate_code, status, tier, paypal_email, pending_payout, paid_out_total, total_earnings, full_name, email, active_subscribers), defaulted the legacy NOT-NULL `referral_code`, and added the missing apply-insert + admin view/manage RLS policies. Table was empty so no backfill. Untested end-to-end (no affiliate data yet) — verify the apply → dashboard → admin payout flow.
- **4 of 5 deferred functions deployed** (migration `20260614_deferred_functions.sql`), validated against live schema: redeem_access_code, resume_account, downgrade_past_due_users (verbatim); refund_credits (rewritten to live conventions — adjusts profiles.build_credits only, since the deployed check_and_consume doesn't use credit_transactions).

**Resolved June 22, 2026:**
- **`integrations` schema reconciled** (migration `20260622_integrations_reconcile.sql`) — the live table (`type`/`credentials`/`account_id`, unique `user_id,type`) never matched what ALL the integration code expects, so **connecting GHL or GitHub failed the upsert and lead delivery errored on `.eq("platform")`** — the GHL Marketplace integration was non-functional. Added the 7 code-expected columns (platform, access_token, refresh_token, token_expires_at, location_id, pipeline_id, metadata), made legacy `type` nullable, swapped the unique key to `(user_id, platform)`. Empty table, additive, verified (synthetic upsert in the code's shape succeeds; RLS intact). **NOT yet end-to-end tested** — needs `GHL_CLIENT_ID`/`GHL_CLIENT_SECRET` secrets + a real OAuth connect + a published-site form lead.

**STILL OPEN:**
- **`detect_abuse_and_pause`** — still deferred; needs an abuse subsystem that doesn't exist live (`rate_limits` table, `pause_account`/`is_account_paused` functions, `plan_caps.monthly_runtime_credits`). Only the admin launch-test calls it.
- The deployed `check_and_consume` is a minimal stub (no admin bypass, no rate limiting, no credit_transactions logging) — much simpler than the migrations imply.

---

## ⚠️ AFFILIATE PROGRAM — TRACKS REFERRALS, DOES NOT YET PAY (verified June 17, 2026)
Stage-by-stage verification result. **Stages 1-3 work; Stage 4 (earnings/payout) is UNBUILT.**
- **Apply** ✅ — must be logged in (apply form gates logged-out → signup; `affiliates.user_id` is NOT NULL). RLS: user sees own row, admin sees all.
- **Attribution** ✅ — `attribute_affiliate_referral()` trigger on `auth.users` (migration `20260617_affiliate_referral_attribution.sql`) records a `pending` `referral_conversions` row from the new user's `affiliate_ref` metadata and bumps `total_referrals`. Safe (can't block signup), self-referral guarded.
- **Dashboard** ✅ — reads/displays own data under RLS, cross-user isolated.
- **Earnings/Payout** ✅ **BUILT (June 22, 2026).** The Stripe webhook now accrues commission on every successful recurring payment via two SECURITY DEFINER functions (migration `20260622_affiliate_commission.sql`):
  - `record_affiliate_commission(referred_user, plan, monthly, is_first)` — on `invoice.payment_succeeded` (subscription_create + subscription_cycle only; NOT the duplicate `invoice.paid`): confirms the conversion (`status='confirmed'`, sets `monthly_value`/`commission_amount`) and accrues `commission_rate%` (default **30%**) of the plan's **monthly price** to `total_earnings`/`pending_payout`/`total_earned`; bumps `active_subscribers` on the first paid month. Recurring/lifetime: accrues every paid month.
  - `release_affiliate_subscriber(referred_user)` — on `customer.subscription.deleted`: decrements `active_subscribers`; earned commission stays.
  - Monthly value is read from **`invoice.lines[0].price.unit_amount`, NOT `stripe_products`** (catalog-independent; chosen so verification never touches the live catalog). `stripe_events` idempotency => credited once/month.
  - **Verified via direct RPC** (June 22): $19@30% → $5.70 first month → $11.40 after one renewal → `active_subscribers` 1 then 0 on cancel, earned retained. **Dashboard + "Request payout" UI already existed** and now populate.
  - **⚠️ Webhook→function WIRING is review-verified, NOT runtime-exercised.** Post-go-live the webhook validates the LIVE signing secret, so test-mode test clocks can't reach it (they 400) and live mode has no test clocks — so the only runtime exercise is a real referred subscription. The commission math itself is fully verified (RPC). Watch the first real referred subscriber to confirm the invoice-line read + RPC call fire.

**Payout disbursement** stays a **manual admin action** (affiliate clicks Request payout ≥$50 → `affiliate_payouts` row → admin marks paid in `AdminAffiliates.tsx`) — no auto-PayPal.

**Launch rule:** the "30% recurring" landing promise is now fulfillable — no need to gate the Apply CTA.

**⚠️ GDPR-vs-attribution tradeoff (by design, NOT a bug):** the `veb_ref` affiliate-attribution cookie is gated behind **marketing** cookie consent (see GDPR section). So a referral from a visitor who **rejects or ignores** the cookie banner is **not captured** → that signup has no `affiliate_ref` → no `referral_conversions` row → the affiliate gets no credit for them. This is correct GDPR behavior. **Do not later mistake a "missing referral / missing commission" for a billing/affiliate bug** — first check whether the referred visitor consented to marketing cookies.

---

## ✅ STRIPE BILLING — LIVE & VERIFIED (June 22, 2026)
**Billing is now in LIVE mode and verified end-to-end with a real charge.** Go-live done June 22:
- **Live products/prices created fresh** in this account's live mode (it was empty — the May-19 `price_1TYw…` IDs in the env-var list below NEVER existed here; ignore them). Live monthly price IDs now in `stripe_products`: starter `price_1Tk5puKArVNbWL53RSGmEHpZ` · builder `price_1Tk5rXKArVNbWL535CEGoWin` · pro `price_1Tk5sbKArVNbWL53qVMOzfQF` · agency `price_1Tk5tYKArVNbWL53KAZM7aIl`.
- **Live webhook endpoint** `we_1Tk6BeKArVNbWL53OV7v3RDR` (10 events) + **live `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`** set.
- **Live loop verified:** real $19 Starter charge → Starter granted (100/2500); refund → $19 returned; cancel → free + credits capped to 20/300, webhook 200. Admin profile reset to pristine free after.
- **Launch config:** monthly-only (annual toggle hidden); top-ups hidden (no live top-up products seeded — `stripe_products` has only the 4 subs).
- **🔥 GO-LIVE GOTCHA (cost us a real charge):** if `STRIPE_WEBHOOK_SECRET` is unset/wrong, the charge still SUCCEEDS (sk_live) but every webhook delivery 400s ("Missing signature/secret") so the **plan is never granted** — customer pays, gets nothing. Probe with `curl -X POST .../stripe-webhook -H "stripe-signature: t=1,v1=x"`: "Missing signature/secret" = secret unset; "Webhook Error: No signatures…" = secret set. Fix the secret, then **resend the `checkout.session.completed` event from the Stripe dashboard** to reconcile (CLI restricted key is READ-ONLY for live — it can't create products / resend / refund / cancel; all live writes are dashboard-only).
- Schema-drift check **CLEAR**: every table/column/enum the webhook writes exists.

**Canonical pricing (confirmed):** monthly-only at launch. Free $0 (NO Stripe sub — free users just sit at free limits), Starter $19, Builder $49, Pro $99, Agency $199. Credits per webhook `PLAN_LIMITS` (build/runtime): 20/300 · 100/2500 · 300/10000 · 800/30000 · 2000/100000. Build-credit rollover (50% unused, ≤1mo) on Builder/Pro/Agency; runtime never rolls. **No annual prices** (add clean numbers post-launch). The live `plans` table is **STALE** (free/starter/pro/enterprise, $29/$79, single credits) — reconcile/remove later; the billing flow uses `stripe_products`, not `plans`.

**✅ DONE (June 22) — was: re-seed LIVE prices + set LIVE secrets.** `stripe_products` now holds the live price IDs and the live secrets are set (see above). `stripe_products` is shared test/prod, so it is now LIVE — any test-mode work must re-point it back to test prices first.

**🚨 BILLING LAUNCH-BLOCKERS found in test-mode verification (June 17, 2026) — do NOT promote billing until fixed:**
1. **✅ FIXED (test-verified June 18, 2026) — Plan change created duplicate/orphaned subscriptions → double-billing.** Old behavior: changing plans went through `create-checkout` → a NEW Checkout → a NEW subscription; the old sub was never canceled and `checkout.session.completed` overwrote `profiles.stripe_subscription_id`. **Fix shipped (single-subscription-per-customer model):**
   - New edge fn **`change-subscription`** handles existing-customer plan changes by `subscriptions.update`-ing the ONE sub (never creates another). `preview` action returns the prorated charge; `apply` does it.
   - **Upgrade** = `proration_behavior:'always_invoice'` + `payment_behavior:'error_if_incomplete'` (prorated diff charged now; failed charge throws before any grant) + immediate full new-tier credit grant in DB.
   - **Downgrade** = `proration_behavior:'none'` (no charge now; next cycle bills lower price) + set `profiles.scheduled_plan` (new column, migration `20260618_scheduled_plan.sql`). Webhook renewal (`invoice.payment_succeeded` / `subscription_cycle`) applies `scheduled_plan` and computes rollover with the **DESTINATION** tier's rule (so Builder→Starter renewal rolls 0 — no leak into a non-rollover tier).
   - `create-checkout` now **guards**: if the caller already has a live sub it returns 409 (`active_subscription_exists`) instead of minting a second one. First-time subscribers still use Checkout.
   - `Billing.tsx` routes existing subscribers to `change-subscription` and shows a confirmation dialog with the exact prorated charge BEFORE any upgrade charge (no silent charge).
   - **Sandbox test (Stripe test clock, June 18):** Starter→Builder upgrade = exactly 1 sub, $30 proration (not $49, not $0), Builder 300/10000 granted immediately, webhook didn't double-grant. Builder→Starter downgrade = no charge, stayed Builder that cycle, `scheduled_plan` set. Renewal = downgrade applied, rollover **0** with 300 unused credits (destination Starter rule). Sandbox cleaned up after.
   - **✅ Browser smoke test PASSED (June 18, 2026)** on the live test-mode UI: downgrade Builder→Starter showed the "no charge today / applies \<date\>" dialog, set `scheduled_plan=starter`, kept Builder + 300 credits, 1 sub, next-cycle bills Starter, **no charge**. Upgrade Builder→Pro showed "Charged today (prorated): $79.93 / $99/mo", confirmed → `plan=pro` 800/30000 immediately, `scheduled_plan` cleared, **1 sub** (Pro price), prorated `subscription_update` invoice. Test sub canceled + profile reset to clean free after.
   - **Known edge case (documented, NOT a blocker):** if a user *schedules a downgrade and then upgrades before period end*, the upgrade proration credits against the already-swapped lower price (we saw "Unused time on Starter" not Builder), so they lose the difference of paid value (~$30 in the test). Consequence of doing downgrades via immediate price-swap + `proration_behavior:none`. Clean fix if we ever care: do downgrades via a **Stripe Subscription Schedule** (keeps the paid price until period end). Rare sequence; deferred.
2. **✅ FIXED (test-verified June 18, 2026) — in-app cancellation.** Implemented **cancel-at-period-end** (custom flow, no Stripe portal): new `cancel-subscription` edge fn (`action: 'cancel'` sets `cancel_at_period_end=true` on the single sub; `'resume'` clears it). The Billing **Free** card button becomes "Cancel plan" for subscribers → confirm dialog (keep plan + credits until period end, then Free, reversible); a banner shows "cancels on \<date\>" + Resume when canceling. New cols `profiles.cancel_at_period_end` + `current_period_end` (migration `20260618_cancel_flow.sql`), synced by the webhook `customer.subscription.updated`. **Browser smoke test PASSED (June 18):** cancel → dialog + "Plan canceled until 7/18/2026" + amber banner/Resume, sub stayed active w/ `cancel_at_period_end=true`, no charge, Builder+300 retained; resume → `cancel_at_period_end=false`, sub continues. (Note: `current_period_end` is read as `sub.current_period_end ?? items[0].current_period_end` in both the webhook and cancel fn — webhook events arrive in a newer API version where it's on the item, else the banner date nulls out.)
3. **✅ FIXED (test-verified June 18, 2026) — cancel now caps credits to free.** `customer.subscription.deleted` now sets `build_credits=min(current,20)`, `runtime_credits=min(current,300)` (min never raises), clears `scheduled_plan`/cancel fields, sets `plan='free'` + 20/300 limits. **Verified via Stripe test clock:** a Builder user with a 300/10000 balance who canceled-at-period-end dropped to free=20/300 at the period boundary (capped from 300/10000), `plan_before_downgrade=builder` (no double-fire). Top-up credits (separately purchased) are intentionally preserved.
- **Downstream-corruption evidence for Bug 1:** on the cancel test, `plan_before_downgrade` was clobbered to `free` instead of `starter` because the duplicate subscriptions made `customer.subscription.deleted` fire twice (the 2nd ran when plan was already free). Concrete proof Bug 1 corrupts data elsewhere — fix it first.

**Verified working (Stripe TEST mode, June 17, 2026):** new subscription → correct plan/credits/status; cancellation → plan=free, status=canceled, limits→20/300, `.deleted` handled (idempotent, signature-verified).
**Untested branches — verify POST-FIX (lower priority):** `invoice.payment_failed` → past_due/grace; renewal `invoice.payment_succeeded` (`subscription_cycle`) → credit refresh + rollover (needs a Stripe **test clock**); `customer.subscription.paused`/`resumed`; `charge.dispute.created`. Don't gate launch on these; fix the blockers above first.

---

## REPO LAYOUT (KEY FILES)
- `src/pages/NewSite.tsx` — generation UI, Website/App toggle + app types
- `src/pages/Projects.tsx` — persistent site library (/app/projects)
- `src/App.tsx` — routes
- `src/layouts/AppLayout.tsx` — sidebar nav
- `supabase/functions/generate-site/index.ts` — edge function (generation + persistSite)

---

## PRICING PLANS
| Plan | Price | Build Credits | Runtime Credits |
|------|-------|--------------|----------------|
| Free | $0 | 20 | 300 |
| Starter | $19/mo | 100 | 2,500 |
| Builder | $49/mo | 300 | 10,000 (50% rollover) |
| Pro | $99/mo | 800 | 30,000 (50% rollover) |
| Agency | $199/mo | 2,000 | 100,000 (white-label) |

Affiliate commission: 30% recurring lifetime.

---

## CORE FEATURES (already built — do not rebuild)
- AI site generation with Claude Sonnet 4
- Voice input in any language
- 6 funnel types: Business Website, Lead Capture, Sales Landing, Appointment, Coming Soon, Link in Bio
- 15 industry-specific design systems
- Unsplash photo queries with attribution
- Contact forms → GoHighLevel via webhook
- 50+ language support + RTL
- Search Atlas SEO on every generated site
- Stripe billing (LIVE MODE) — 5 plans
- Credit system with 50% rollover
- Affiliate program
- Agency sub-accounts + white label
- Admin dashboard + usage analytics
- Emergency abuse cutoffs
- Google/Apple/Facebook social login (OAuth via Supabase)

---

## PAGES (all exist — do not recreate)
- / → Homepage (builder.virtualengine.ai)
- /auth → Login/signup
- /app → Main builder dashboard
- /app/new → New site creation
- /privacy → Privacy Policy
- /terms → Terms of Service
- /contact → Contact page
- /help → Help Center / FAQ
- /admin/pre-launch → Pre-launch checklist
- /admin/launch-tests → Launch test suite

---

## STRICT RULES — ALWAYS FOLLOW

### Security (non-negotiable)
1. NEVER expose secret keys, service role keys, or API keys client-side
2. NEVER bypass RLS policies — all data access must go through auth.uid()
3. NEVER commit .env files — .env is in .gitignore
4. All Stripe operations server-side only via Edge Functions
5. Validate Stripe webhook signatures on every webhook event
6. GHL webhook only fires on published sites

### Code Quality
1. Always use TypeScript — no `any` types unless absolutely necessary
2. All Supabase queries must handle errors explicitly
3. Never create duplicate components — check existing ones first
4. Use shadcn/ui components before building custom ones
5. Tailwind only — no inline styles, no custom CSS unless necessary

### Deployment
1. All env vars live in Vercel — never hardcode
2. Test locally before pushing to main
3. After any auth changes, verify login flow at builder.virtualengine.ai
4. After Stripe changes, verify webhook fires in Stripe dashboard

#### Edge function deploys (do this, NOT the dashboard button)
The Supabase dashboard "Deploy updates" button does NOT reliably deploy the latest
GitHub code. Always deploy from the local repo via CLI:

    git pull origin main
    supabase functions deploy generate-site --project-ref gcapzcjyfjwmyheeydvt --no-verify-jwt

Verify endpoint (should return `{"ok": true}` with all keys present):

    https://gcapzcjyfjwmyheeydvt.supabase.co/functions/v1/generate-site?verify=1

### Database
1. Always run migrations through Supabase SQL editor
2. Never drop tables or columns without explicit instruction
3. Use `IF NOT EXISTS` and `IF EXISTS` for safe migrations
4. Every new table needs RLS enabled + policies

---

## WORKFLOW — HOW TO BUILD ANYTHING

### Before writing any code:
1. Switch to **Plan Mode** — research first, build second
2. Read relevant existing files before creating new ones
3. Check if component/function already exists
4. Identify which env vars are needed

### Build loop:
1. Plan → implement → screenshot/test → verify → iterate
2. Never assume it worked — always verify output
3. If something breaks, check Vercel logs + Supabase logs first

### Context management:
- Write concisely — high information density
- Use /compact when context fills up
- Start fresh sessions for unrelated tasks
- Reference this CLAUDE.md instead of re-explaining the stack

---

## KNOWN ISSUES / RECENT FIXES
- OAuth redirect was broken — fixed by hardcoding builder.virtualengine.ai as redirect URL
- .env was accidentally tracked in git — removed May 19, 2026 (all keys already rotated)
- Supabase project gcapzcjyfjwmyheeydvt created May 19, 2026 — replaces old project
- Stripe products created May 19, 2026 in live mode — price IDs above are correct

---

## PROJECT-SPECIFIC LESSONS (hard-won — read before debugging)
- Missing tables/columns (agency_workspaces, admin_users, admin_alerts, sites.content)
  have repeatedly looked like auth bugs. Check the schema FIRST.
- Edge functions must use the Supabase ADMIN client (service role key), never the
  anon client, to write data — otherwise RLS silently blocks inserts.
- Service role key is read from `SUPABASE_SERVICE_ROLE_KEY` (injected default secret).
  Custom secrets cannot be named with a `SUPABASE_` prefix in the Secrets UI.
- vite-react-ssg build crashes SILENTLY on: emoji literals in JSX, and nested ternaries
  with template literals in className. Use plain text + string concat instead.
- Vercel "Staged" deploys: an active manual rollback silently overrides new deployments
  — click "Undo Rollback" in the Overview banner. Also confirm "Auto-assign Custom
  Production Domains" is enabled (Settings → Git).
- Unsplash: generic queries return wrong images; enrich queries per industry/context.
- **`npx tsc --noEmit` is a NO-OP here** — root `tsconfig.json` uses project references with `files: []`, so bare `tsc --noEmit` type-checks ZERO files and always "passes." It will NOT catch syntax/type errors. **Always verify frontend code with `npx tsc -p tsconfig.app.json --noEmit`** (local `npm run build` is also broken by an esbuild host/binary version mismatch — `0.21.5` vs `0.25.12` — so the real build only happens on Vercel).
- **A syntax error silently froze Vercel for ~11 commits (June 2026):** `PHO NE_RE` (stray space) in `SitePreview.tsx` from the transparent-header commit made esbuild fail EVERY production build; Vercel kept serving the last good bundle, so weeks of frontend work (3D, affiliate, billing) never went live and smoke tests ran old code. **When the live site doesn't reflect a pushed change, FIRST check Vercel deploy state** (via the Vercel MCP `list_deployments` — look for `state: ERROR`) and grep the served bundle for a known new string, before debugging app logic. Don't trust the false-green local `tsc`.

---

## LAUNCH CHECKLIST STATUS
- [x] Supabase schema (20 tables, RLS, triggers)
- [x] Vercel ↔ Supabase integration connected
- [x] Google OAuth working
- [x] .env removed from git history
- [x] All API keys rotated
- [x] Stripe live mode products created
- [x] Resend domain verified
- [ ] Stripe end-to-end test (all 5 tiers)
- [ ] GHL end-to-end test
- [x] Cookie consent banner (GDPR) — real gating (not just a notice): `src/lib/consent.ts` + `CookieConsent.tsx`. Essential always on; analytics/marketing blocked until opt-in; reject/withdraw clears `veb_ref`. Withdraw reachable from Landing footer + in-app sidebar ("Cookie settings"). Future analytics/marketing scripts MUST be injected via `loadGatedScripts()` in consent.ts, never in index.html.
- [ ] Private beta — 10 GHL power users

---

## OPEN ITEMS / IN PROGRESS
- [ ] Validate site persistence end-to-end (sites.content column was the last blocker)
- [ ] Layout variation system (per-industry skeletons; see layout_variation_prompt.txt)
- [ ] Spanish/multilingual end-to-end verification
- [ ] GHL Marketplace listing (doc done; pending end-to-end GHL test + Stripe live confirm)
- [ ] Resend DNS verification + Supabase SMTP (noreply@virtualengine.ai)
- [ ] Google OAuth redirect URI fix in Google Cloud Console

---

## WHAT NOT TO DO
- Do not rebuild existing features from scratch
- Do not change the tech stack without asking Pharoah
- Do not use test Stripe keys on production
- Do not skip RLS on any new tables
- Do not dump entire API docs into context — ask for specific endpoints
- Do not make design changes without a screenshot comparison loop
- Do not create new Supabase projects — use gcapzcjyfjwmyheeydvt
