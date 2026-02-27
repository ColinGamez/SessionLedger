# SessionLedger — Vercel Deploy Checklist

## 1. Supabase Setup

- [ ] Create new Supabase project
- [ ] Run `supabase/migrations/001_initial_schema.sql` in SQL Editor
- [ ] Run `supabase/policies/rls.sql` in SQL Editor
- [ ] Verify RLS is enabled on all tables (Authentication > Policies)
- [ ] Set `Site URL` in Supabase Auth settings → your Vercel domain
- [ ] Add `https://<your-domain>/auth/callback` to Allowed Redirect URLs
- [ ] Copy `Project URL` and `anon key` for env vars
- [ ] Copy `service_role key` for server-only env var (keep secret)
- [ ] Enable email confirmation in Auth > Providers > Email

## 2. Stripe Setup

- [ ] Create Stripe account (or use existing)
- [ ] Create Product: "SessionLedger Pro" with monthly recurring price
- [ ] Copy Price ID → `STRIPE_PRO_MONTHLY_PRICE_ID`
- [ ] Copy Secret Key → `STRIPE_SECRET_KEY` (use `sk_live_` in production)
- [ ] Configure Stripe Billing Portal (Dashboard > Settings > Billing Portal)
- [ ] Create Webhook endpoint:
  - URL: `https://<your-domain>/api/stripe/webhook`
  - Events to listen for:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_failed`
- [ ] Copy Webhook Signing Secret → `STRIPE_WEBHOOK_SECRET`

## 3. Vercel Project Setup

- [ ] Connect GitHub repo to Vercel
- [ ] Set Framework Preset: Next.js
- [ ] Set Root Directory: `/` (or your subfolder)
- [ ] Set Node.js version: 20.x
- [ ] Add ALL environment variables (from `.env.example`):

```
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRO_MONTHLY_PRICE_ID
```

- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` as "Sensitive" (server-only)

## 4. Pre-Deploy Checks

- [ ] `npm run typecheck` — zero TypeScript errors
- [ ] `npm run lint` — zero lint errors
- [ ] `npm run build` — successful production build
- [ ] Test auth flow locally (register → confirm email → login → dashboard)
- [ ] Test Stripe checkout locally with `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Test session create / edit / delete
- [ ] Verify free tier session limit blocks at 10
- [ ] Verify Pro upgrade unlocks limit + CSV export
- [ ] Verify RLS: create two test users, confirm neither can see the other's sessions

## 5. Post-Deploy Checks

- [ ] Confirm webhook events arriving in Stripe Dashboard > Developers > Webhooks
- [ ] Test live Stripe checkout (use test cards before going live)
- [ ] Verify `subscription_status` updates in Supabase after checkout
- [ ] Enable Vercel Analytics (optional but recommended)
- [ ] Configure custom domain + SSL in Vercel
- [ ] Update Supabase `Site URL` to production domain

## 6. Security Final Pass

- [ ] No `SUPABASE_SERVICE_ROLE_KEY` referenced in any `'use client'` file
- [ ] No `STRIPE_SECRET_KEY` referenced in any `'use client'` file
- [ ] All API routes validate auth with `supabase.auth.getUser()` — never trust client-sent `user_id`
- [ ] Stripe webhook validates signature before processing
- [ ] RLS policies applied and tested
- [ ] CSP headers set in `next.config.ts`
- [ ] `.env.local` is in `.gitignore`
