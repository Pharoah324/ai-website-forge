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

**STILL OPEN:**
- **`detect_abuse_and_pause`** — still deferred; needs an abuse subsystem that doesn't exist live (`rate_limits` table, `pause_account`/`is_account_paused` functions, `plan_caps.monthly_runtime_credits`). Only the admin launch-test calls it.
- The deployed `check_and_consume` is a minimal stub (no admin bypass, no rate limiting, no credit_transactions logging) — much simpler than the migrations imply.

---

## ⚠️ AFFILIATE PROGRAM — TRACKS REFERRALS, DOES NOT YET PAY (verified June 17, 2026)
Stage-by-stage verification result. **Stages 1-3 work; Stage 4 (earnings/payout) is UNBUILT.**
- **Apply** ✅ — must be logged in (apply form gates logged-out → signup; `affiliates.user_id` is NOT NULL). RLS: user sees own row, admin sees all.
- **Attribution** ✅ — `attribute_affiliate_referral()` trigger on `auth.users` (migration `20260617_affiliate_referral_attribution.sql`) records a `pending` `referral_conversions` row from the new user's `affiliate_ref` metadata and bumps `total_referrals`. Safe (can't block signup), self-referral guarded.
- **Dashboard** ✅ — reads/displays own data under RLS, cross-user isolated.
- **Earnings/Payout** ❌ **NOT BUILT.** Nothing computes commission or aggregates earnings: conversions stay `monthly_value=0 / commission_amount=0 / status='pending'`, and `total_earnings`/`pending_payout`/`active_subscribers` are never populated. So a real affiliate sees referrals climb but **$0 earnings forever** and can never reach the $50 payout threshold.

**To finish:** wire the **Stripe webhook** to, on a referred user's subscription becoming active, confirm the conversion + set `monthly_value`/`commission_amount` (30%) + roll up to the affiliate totals. Payout disbursement itself stays a **manual admin action** (request → `affiliate_payouts` row → admin marks paid) — no auto-PayPal. This depends on the Stripe billing flow being verified first.

**Launch rule:** GHL Marketplace launch does NOT require this (affiliate is an internal growth channel, not part of the installed app). But the landing page publicly promises "30% recurring," so **if earnings aren't finished by launch, gate the affiliate Apply CTA as "coming soon"** rather than advertise an unfulfillable payout.

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
- [ ] Cookie consent banner (GDPR)
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
