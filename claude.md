# Virtual Engine Builder — Claude Code Context

## What This Is
AI-powered website builder SaaS. Users describe their 
business, get a live website in 60 seconds.
Parent company: Virtual Engine (virtualengine.ai)

## Stack
- React + Vite + React Router (NOT Next.js)
- Supabase (database + edge functions in Deno)
- Stripe billing
- Anthropic Claude API for site generation
- GoHighLevel integration
- GitHub OAuth integration

## What Is Built
- Marketing homepage
- Auth (signup/login)
- Dashboard with credit balance
- AI site generation with streaming
- Stripe billing (5 plans + 3 top-up packs)
- Credit rollover (50% unused carries forward)
- GoHighLevel OAuth + form webhook
- GitHub OAuth + push to repo
- Site publishing at /s/:subdomain

## What Still Needs Building
1. Stripe webhook signing secret finalized
2. Domain builder.virtualengine.ai connected
3. Agency sub-accounts
4. White-label mode
5. Client handoff preview links
6. Brand voice training
7. Industry templates (8 industries)
8. PWA export
9. Form debugger
10. Performance checker
11. SEO wizard
12. Email sequence via Resend

## Key Rules
- This is Vite/React NOT Next.js
- All backend = Supabase Edge Functions (Deno)
- VITE_ prefix required for frontend env vars
- Stripe prices pulled from Stripe not hardcoded
- Test card: 4242 4242 4242 4242

## Supabase Project
URL: https://idnyrmdhdfyxdrvyjirj.supabase.co

## Brand
Name: Virtual Engine Builder
Colors: Dark navy + electric blue #2563EB
Tagline: Your website. Built by AI. Backed by 
Virtual Engine.
Domain: builder.virtualengine.ai
