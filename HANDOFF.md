# Legacy Odyssey — Handoff Document

> Written April 2026. Based entirely on what is in the code — no guessing.

---

## What This Is

Legacy Odyssey is a subscription SaaS platform with two products:

**Product 1 — Baby Book**
A digital baby book (milestones, photos, birth story, letters, recipes, family members, vault). Built through a React Native mobile app. Viewed by family and friends at a dedicated `.com` domain, password-protected. Every subscriber gets a real domain purchased automatically via the Spaceship API at checkout.

**Product 2 — Family Album**
Same infrastructure, different content model (`book_type = 'family_album'`). Broader scope — family history, adventures, traditions, year-by-year. Same app, same domain purchase flow.

Both products are live and accepting real payments.

---

## Infrastructure

### Hosting
| Service | What it hosts | URL |
|---------|--------------|-----|
| **Railway** | Express API server (the entire backend) | `https://legacy-odyssey-production-a9d1.up.railway.app` |
| **Railway** | Also served at custom domain | `https://legacyodyssey.com` |
| **Spaceship Web Hosting** | `your-childs-name.com` demo site only | LiteSpeed / cPanel at `server5.shared.spaceship.host:2083` |
| **GitHub** | Source of truth, auto-deploys to Railway on push to `main` | `github.com/dragno6565-ship-it/legacy-odyssey` |

Railway auto-deploys from `main`. Push to GitHub → Railway picks it up in ~60 seconds.

### Database
- **Supabase** — PostgreSQL
- Project ref: `vesaydfwwdbbajydbzmq`
- URL: `https://vesaydfwwdbbajydbzmq.supabase.co`
- Two clients in code: `supabaseAdmin` (service role, bypasses RLS, used for all server ops) and `supabaseAnon` (respects RLS, used only for `auth.signInWithPassword` and `auth.refreshSession`)
- Cannot run DDL (`ALTER TABLE`) via the API — use the Supabase SQL Editor dashboard

### Payments
- **Stripe** — Live mode, account `acct_1T3N7kJk2GIrL5uS`
- Webhook endpoint: `POST /stripe/webhook` (raw body, must be registered before `express.json()` — already handled in `server.js`)

### Email
- **Resend** — all transactional email from `hello@legacyodyssey.com`
- Domain `legacyodyssey.com` verified (DKIM, SPF, DMARC)
- Forwarding: all `@legacyodyssey.com` → `legacyodysseyapp@gmail.com`

### Domain Registration
- **Spaceship API** — `https://spaceship.dev/api/v1`
- Domains purchased automatically at checkout, async via operation polling
- `MAX_REGISTRATION_PRICE = $20` (hardcoded in `spaceshipService.js`)
- TLDs checked: `com, family, baby, love, life, me`
- DNS: `www.` CNAME → Railway; root `@` 301 → `www.` (Spaceship URL forwarding)
- Spaceship wallet: $50 funded, auto-renewal on Visa ending 6181

### Error Monitoring
- **Sentry** — initialized in `src/instrument.js`, imported first in `server.js` before everything else

### Meta Ads
- **Facebook Conversions API** — `facebook-nodejs-business-sdk` package. `Purchase` event fired in `GET /stripe/success` route after successful checkout.

---

## Pricing

| Plan | Price | Stripe Price ID | Notes |
|------|-------|----------------|-------|
| Annual Intro (primary offer) | $29 first year → $49.99/yr renewal | `price_1TLojVJk2GIrL5uS0oQORYsr` + coupon `sX2lEPb6` | Coupon is $20.99 off, duration: once |
| Annual standard | $49.99/yr | `STRIPE_PRICE_ANNUAL` env var | Used for renewal |
| Monthly | $4.99/mo + $5.99 setup fee | `STRIPE_PRICE_MONTHLY` + `STRIPE_PRICE_SETUP` | Setup fee is a separate line item |
| Additional domain | $12.99/yr | `price_1TDVIAQzzNThrLYKNnMljEkp` | For adding a second site |
| Gift card | $49.99 one-time | Inline `price_data` in code | No price ID — computed at checkout |

**Founder limit:** 100 spots (`FOUNDER_LIMIT = 100` in `stripeService.js`). `GET /api/stripe/founder-spots` returns remaining count.

**Checkout endpoints:**
- Founder/annual intro: `POST /api/stripe/create-founder-checkout`
- Monthly/annual: `POST /api/stripe/create-checkout`
- Gift: `POST /api/stripe/create-gift-checkout`
- Additional site: `POST /api/stripe/create-additional-site-checkout` (requires auth)

---

## Demo Sites

### Baby Book Demo — `your-childs-name.com`
- **Hosted on:** Spaceship Web Hosting (LiteSpeed, NOT Railway)
- **File location:** `/home/wnuazicufx/your-childs-name.com/index.html` on Spaceship cPanel
- **cPanel URL:** `https://server5.shared.spaceship.host:2083`
- **Password:** `legacy`
- **Bypass:** `?ref=fb` or `?ref=ad` auto-unlocks (via `browseDemo()` with 100ms timeout)
- **"Browse the Demo →" button:** On the password screen, bypasses password entirely

### Family Album Demo — `your-family-photo-album.com`
- **Hosted on:** Railway (Express serves `src/public/family-album-demo.html`)
- **File location:** `src/public/family-album-demo.html` in this repo
- **Password:** `family`
- **Bypass:** `?ref=fb` or `?ref=ad` auto-unlocks
- **"Browse the Demo →" button:** On the password screen, bypasses password entirely
- **Images:** `src/public/images/` — 9 Unsplash photos (family-hero.jpg, family-home.jpg, adventure-*.jpg, etc.)

---

## Environment Variables

**Required (server crashes without these):**
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SESSION_SECRET
```

**Stripe (all required for payments to work):**
```
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_MONTHLY
STRIPE_PRICE_ANNUAL
STRIPE_PRICE_ANNUAL_INTRO     # price_1TLojVJk2GIrL5uS0oQORYsr
STRIPE_PRICE_SETUP
STRIPE_PRICE_FOUNDER
STRIPE_PRICE_ADDITIONAL_DOMAIN  # price_1TDVIAQzzNThrLYKNnMljEkp
STRIPE_ANNUAL_INTRO_COUPON    # sX2lEPb6
```

**Spaceship (domain registration degrades gracefully if missing):**
```
SPACESHIP_API_KEY
SPACESHIP_API_SECRET
SPACESHIP_CONTACT_ID
```

**Railway API (custom domain setup via API — currently non-functional, see below):**
```
RAILWAY_API_TOKEN
RAILWAY_SERVICE_ID
RAILWAY_ENVIRONMENT_ID
RAILWAY_CNAME_TARGET          # Fallback CNAME if Railway API fails
```

**Other:**
```
RESEND_API_KEY                # Email; silent no-op if missing
JWT_SECRET                    # Signs app_token for mobile book preview bypass
APP_DOMAIN                    # Defaults to legacyodyssey.com
NODE_ENV
PORT                          # Defaults to 3000
```

---

## Database Tables

From migrations (core):
- `families` — one row per customer. Owns: `auth_user_id`, `email`, `subdomain`, `custom_domain`, `book_password` (default: `'legacy'`), `stripe_customer_id`, `subscription_status`, `book_type`, `onboarding_emails_sent` (JSONB)
- `books` — one per family. Child info, hero image, all content foreign keys
- `before_arrived_cards`, `before_arrived_checklist`
- `birth_stories`
- `coming_home_cards`
- `months` — 12 rows per book, unique on `(book_id, month_number)`
- `family_members` — keyed by `member_key`, unique on `(book_id, member_key)`
- `firsts`, `celebrations`, `letters`, `recipes`, `vault_items`
- `admin_users`
- `domain_orders` — tracks async domain purchase lifecycle (`pending → registering → registered → dns_setup → active → failed`)
- `waitlist`
- `gift_codes`

**Columns added outside migrations** (exist in live DB only, not in migration files):
`families`: `plan`, `billing_period`, `book_type`, `customer_name`, `onboarding_emails_sent`, `cancelled_at`, `data_retain_until`
`books`: `visible_sections`, `photo_positions`, `celebration_years`, `name_quote`, `family_album_data`

---

## Key Code Paths

### Checkout → Account Creation
`POST /api/stripe/create-founder-checkout` → Stripe → webhook `checkout.session.completed` → `stripeService.handleCheckoutComplete()` → create Supabase auth user + family + book + domain order → `emailService.sendWelcomeEmail()` → async `domainService.purchaseAndSetupDomain()`

### Domain Purchase (async, takes minutes)
`spaceshipService.registerDomain()` → get `operationId` → poll every 10s (max 30 polls / 5 min) → `railwayService.addCustomDomain()` → `spaceshipService.setupDns()` + `setupUrlRedirect()` → update family `custom_domain`

### Book Password Flow
Browser hits family domain → `resolveFamily` middleware → `requireBookPassword` middleware → if no cookie, serve password form → `POST /verify-password` → set HMAC-SHA256 cookie → redirect

### Mobile Auth
JWT Bearer token stored in `expo-secure-store` under key `legacy_odyssey_token`. Auto-refreshed on 401 via response interceptor in `mobile/src/api/client.js`. Multi-book: `X-Family-Id` header selects active family.

### Onboarding Emails
Cron runs daily at 9:07 AM (`'7 9 * * *'`). Checks `families.onboarding_emails_sent` JSONB for which emails have been sent. Fires day 1 / day 3 / day 7 / day 13 emails.

---

## Recently Changed

- **Landing page** (`src/views/marketing/landing.ejs`): New headline ("Is your baby's name still available as a .com?"), simplified CTA ("Start for $29 →"), demo links styled as prominent gold buttons, fade-up scroll animations removed
- **Family album demo** (`src/public/family-album-demo.html`): Real Unsplash photos (hero, home, adventure cards), password screen redesigned to match baby book (dark background, full-screen photo, gold typography), CTAs updated to `/product=family_album#pricing`, placeholder data genericized, popup removed
- **Baby book demo** (Spaceship cPanel): Popup removed, password screen is first thing visitors see
- **Both demo sites**: Password screens now identical in design — dark background, background photo at 18% opacity, film grain overlay, gold serif title, transparent gold-border input and button, "Browse the Demo →" bypass button

---

## Things NOT To Do

### App Store
- **Never submit to Apple App Store without explicit permission.** Do not click "Submit for Review", "Add for Review", or "Resubmit to App Review" in App Store Connect under any circumstances without the user saying "yes" or "go ahead."
- **Never submit to Google Play without explicit permission.** Same rule.

### Payments
- The `STRIPE_ANNUAL_INTRO_COUPON` (`sX2lEPb6`) applies only once and only to the `annualIntro` price. Do not apply it to monthly or renewal checkouts.
- Do not change Stripe price IDs in code without verifying the IDs exist in the live Stripe account first.

### Railway API
- The `.env` `RAILWAY_API_TOKEN` / `RAILWAY_SERVICE_ID` / `RAILWAY_ENVIRONMENT_ID` point to a **secondary/old Railway project** (`25a7cbc7 "romantic-creation"`), not the live project (`27622203 "bountiful-expression"`). `railwayService.js` cannot successfully add custom domains via API. Use the Railway dashboard manually for domain setup, or generate a new token scoped to the correct project.

### Supabase
- Cannot run DDL (`ALTER TABLE`, `CREATE INDEX`, etc.) via the API or service role client — use the Supabase SQL Editor at `https://supabase.com/dashboard/project/vesaydfwwdbbajydbzmq/sql`
- RLS is not configured (service role bypasses it). All access control is in application middleware (`requireAuth`, `requireAdmin`, `requireBookPassword`).

### Demo Sites
- `your-childs-name.com` is **not on Railway**. It is on Spaceship Web Hosting (LiteSpeed). Pushing to GitHub does nothing to that site. Edit via cPanel File Manager at `server5.shared.spaceship.host:2083`.
- `your-family-photo-album.com` **is on Railway** — served from `src/public/family-album-demo.html`. Push to GitHub to update.
- Do not confuse the two.

### Webhook
- The Stripe webhook route (`POST /stripe/webhook`) requires the raw request body. It must be registered **before** `express.json()` middleware. Do not reorder middleware in `server.js`.
- Always return `{ received: true }` from the webhook handler, even on errors. Stripe retries on non-2xx responses.

### cPanel File Saving
- cPanel's "Save Changes" button checks whether `window.savedContent === editor.getValue()`. If you call `editor.setValue()` in the console, `savedContent` is updated to match and the button does nothing. The fix: use `editor.session.replace(range, newContent)` (keeps `isClean: false`) instead of `editor.setValue()`, or reset `window.savedContent` to the original before clicking Save.

### Windows / Dev
- Always use `--ssl-no-revoke` with `curl` on Windows
- Git remote push uses token auth: `https://dragno6565-ship-it:{TOKEN}@github.com/dragno6565-ship-it/legacy-odyssey.git`

---

## Active Customers (as of April 2026)

| Name | Email | Domain | Status |
|------|-------|--------|--------|
| kateragno Family | dragno65@gmail.com | kateragno.com | ACTIVE |
| Eowyn Ragno (owner) | dragno65@hotmail.com | eowynhoperagno.com | ACTIVE |
| Lindsey Cherry | lindsey.e.cherry@gmail.com | emmacherry.com | ACTIVE |
| Roy Patrick Thompson | eowynkiller@gmail.com | roypatrickthompson.com | ACTIVE |
| Apple Review Demo | review@legacyodyssey.com | — | ACTIVE (password: "password") |

---

## Admin Panel

URL: `https://legacy-odyssey-production-a9d1.up.railway.app/admin/login`
Login: `dragno65@hotmail.com`

Capabilities: view all customers, edit family fields, create customers manually, send welcome email, reset password, toggle active status, delete account, view gift codes.

---

## App Store Status (as of April 2026)

| Platform | Version | Status |
|----------|---------|--------|
| iOS (App Store) | v1.0.3 (Build 13) | Waiting for Review |
| Android (Google Play) | v1.0.3 (versionCode 10) | Submitted to production track |

- iOS App ID: `6760883565` — `https://appstoreconnect.apple.com/apps/6760883565`
- Android: Developer `DOR Industries`, login `albumerapp2@gmail.com`
- EAS Project: `https://expo.dev/accounts/dragno65/projects/legacy-odyssey`
- iOS bundle: `com.legacyodyssey.app` | Android package: `com.legacyodyssey.app`
