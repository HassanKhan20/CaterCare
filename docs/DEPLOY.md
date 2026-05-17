# Deploying Catercare

This is the click-by-click runbook to take Catercare from "runs on my
laptop" to "live on the internet." Everything the code needs is done;
what's left is creating accounts and pasting keys. Budget ~1–2 hours.

You'll create accounts on: **Neon** (database), **Vercel** (hosting),
**Stripe** (payments), **Resend** (email), **Cloudflare R2** (file
storage), **Google Cloud** (sign-in). All have free tiers that cover an
MVP except Stripe (pay-per-transaction, no monthly fee).

---

## 0. Prerequisites

- The repo is on GitHub already: `HassanKhan20/CaterCare`.
- A credit/debit card (Stripe + Cloudflare may ask; you won't be charged
  on free tiers / test mode).

---

## 1. Database — Neon (free)

1. Go to **neon.tech** → sign up (use the GitHub login).
2. **Create project** → name it `catercare`, region closest to Texas
   (e.g. `AWS us-east-2`).
3. On the project dashboard, copy the **connection string**. It looks
   like `postgresql://USER:PASS@ep-xxx.aws.neon.tech/neondb?sslmode=require`.
4. Keep this tab open — you'll paste it as `DATABASE_URL` in step 6.

> Neon free tier is plenty for launch. No card required.

---

## 2. Google sign-in — OAuth (free)

1. **console.cloud.google.com** → create a project `Catercare`.
2. **APIs & Services → OAuth consent screen** → External → fill app
   name `Catercare`, your email, save (you can stay in "Testing" mode
   for now; add your own email as a test user).
3. **APIs & Services → Credentials → Create Credentials → OAuth client
   ID** → type **Web application**.
4. Under **Authorized redirect URIs**, you'll add the Vercel URL after
   step 5. For now add a placeholder; you'll come back.
5. Copy the **Client ID** and **Client secret** → these become
   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

---

## 3. Payments — Stripe (test mode first)

1. **stripe.com** → sign up.
2. Stay in **Test mode** (toggle, top-right) for launch rehearsal.
3. **Developers → API keys**: copy **Secret key** (`sk_test_…`) →
   `STRIPE_SECRET_KEY`, **Publishable key** (`pk_test_…`) →
   `STRIPE_PUBLISHABLE_KEY`.
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR-VERCEL-URL/api/stripe-webhook` (fill after step 5)
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - After creating, copy the **Signing secret** (`whsec_…`) →
     `STRIPE_WEBHOOK_SECRET`.
5. **Connect**: Settings → Connect → enable Express accounts (needed for
   cook/driver payouts). No extra keys — uses the same secret key.

> Go live later by flipping to Live mode and swapping the 3 keys.

---

## 4. Email — Resend (free 3k/mo)

1. **resend.com** → sign up.
2. **API Keys → Create** → copy → `RESEND_API_KEY`.
3. For launch you can send from Resend's shared domain; set
   `RESEND_FROM="Catercare <onboarding@resend.dev>"`. To send from your
   own domain later, verify it under **Domains**.

---

## 5. File storage — Cloudflare R2 (free 10GB)

1. **dash.cloudflare.com** → sign up → **R2** → create a bucket
   `catercare-photos`.
2. **R2 → Manage API Tokens → Create API Token** (Object Read & Write):
   copy **Access Key ID** → `R2_ACCESS_KEY_ID`, **Secret Access Key** →
   `R2_SECRET_ACCESS_KEY`.
3. Your **Account ID** is in the R2 overview URL / sidebar →
   `R2_ACCOUNT_ID`.
4. Bucket → **Settings → Public access**: enable a public dev URL (or
   connect a custom domain). That public base URL → `R2_PUBLIC_URL`
   (e.g. `https://pub-xxxx.r2.dev`).

---

## 6. Hosting — Vercel

1. **vercel.com** → sign up with GitHub → **Add New → Project** →
   import `HassanKhan20/CaterCare`.
2. Framework preset auto-detects **Next.js**. Don't deploy yet — first
   add env vars (**Settings → Environment Variables**). Add every key
   below for the **Production** environment:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Neon string from step 1 |
   | `NEXTAUTH_SECRET` | run `openssl rand -base64 32` (any 32+ random chars) |
   | `NEXTAUTH_URL` | `https://YOUR-VERCEL-URL` (set after first deploy) |
   | `APP_URL` | same as `NEXTAUTH_URL` |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | step 2 |
   | `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` | step 3 |
   | `RESEND_API_KEY` | step 4 |
   | `RESEND_FROM` | `Catercare <onboarding@resend.dev>` |
   | `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | step 5 |
   | `R2_BUCKET` | `catercare-photos` |
   | `R2_PUBLIC_URL` | step 5 public base URL |
   | `MAPBOX_TOKEN` | optional; leave a placeholder if not using maps |
   | `PLATFORM_COMMISSION_PCT` | `11` |
   | `BUYER_SERVICE_FEE_PCT` | `9` |
   | `DRIVER_BASE_PAY_CENTS` | `400` |
   | `DRIVER_PER_MILE_CENTS` | `125` |
   | `COTTAGE_CAP_GMV_CENTS` | `15000000` |
   | `CRON_SECRET` | another `openssl rand -base64 32` |

3. **Deploy.** First build will succeed (verified locally). It will
   fail at *runtime* until the DB schema exists — that's step 7.
4. Copy the assigned URL (e.g. `catercare.vercel.app`). Now go back and:
   - Set `NEXTAUTH_URL` and `APP_URL` to `https://catercare.vercel.app`
     and **redeploy**.
   - Google Cloud (step 2): add
     `https://catercare.vercel.app/api/auth/callback/google` to
     **Authorized redirect URIs**.
   - Stripe (step 3): point the webhook endpoint at
     `https://catercare.vercel.app/api/stripe-webhook`.

---

## 7. Create the database schema + seed

From your laptop, with the **Neon** `DATABASE_URL` exported:

```bash
# one-time: push the schema to the live DB
DATABASE_URL="postgresql://...neon..." pnpm prisma migrate deploy

# optional: seed demo cooks/drivers/buyers so the app isn't empty
DATABASE_URL="postgresql://...neon..." pnpm tsx prisma/seed.ts
```

After this, reload the Vercel URL — the app is live.

---

## 8. Smoke test (do this before telling anyone)

1. Open the Vercel URL → landing renders, olive theme.
2. **Add to Home Screen** on your phone (Safari: Share → Add to Home
   Screen / Chrome: install prompt) — confirms the PWA works.
3. Sign in with Google.
4. Browse cooks → open a cook → add a dish → cart → checkout with
   Stripe **test card `4242 4242 4242 4242`**, any future expiry, any
   CVC.
5. Stripe Dashboard (test) → Payments → confirm the payment intent.
6. Sign in as a cook (seed account or your own promoted to COOK) →
   accept the order. Sign in as a driver → claim → deliver.
7. Check Resend dashboard → confirm the order emails went out.

---

## 9. Going live (later)

- Stripe: flip to **Live mode**, regenerate the 3 keys + webhook secret
  in Vercel, complete Stripe's business activation.
- Google OAuth: move the consent screen from Testing → **Published**.
- Resend: verify your real sending domain.
- The legal/insurance items from the spec (LLC, food-handler cert
  enforcement, ToS) are operational, not code — see
  `docs/superpowers/specs/2026-05-13-catercare-design.md`.

---

## Notes

- **Crons**: `vercel.json` schedules the 3 compliance jobs daily at
  08:00. Vercel calls them with the `CRON_SECRET` bearer automatically
  (the routes verify it).
- **Migrations on future deploys**: re-run `pnpm prisma migrate deploy`
  against Neon whenever `prisma/schema.prisma` changes. (Can be wired
  into the Vercel build command later: `prisma migrate deploy && next build`.)
- **Rollback**: Vercel keeps every deployment — use "Promote to
  Production" on a previous one if a deploy breaks.
