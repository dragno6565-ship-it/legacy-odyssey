# Legacy Odyssey — Operational Blocks

> The product organized into operational blocks. Each block is a self-contained
> piece of how the business runs. The `/admin/health` page runs automated
> checks against every block; this doc explains what each one *is*.

Last updated: April 25, 2026

---

## Block 1 — Web Infrastructure

**What it is:** the always-on plumbing that keeps everything else alive.

| Component | Owner | Notes |
|---|---|---|
| Express server | Railway (project `27622203`, service `59190e65`) | Handles every customer + admin + API request |
| Postgres database | Supabase (`vesaydfwwdbbajydbzmq`) | Source of truth for customers, books, orders |
| Object storage | Supabase Storage `photos` bucket | Customer photos before they're backed up to R2 |
| DNS for legacyodyssey.com | Spaceship | Points www + apex to Railway/Fastly anycast (151.101.2.15) |
| Health endpoint | `/health` returns version + status | Used by external monitors |

**What can break it:** Railway service down, Supabase outage, DNS misconfiguration, the legacy zombie Railway service (`legacy-odyssey-production-a9d1.up.railway.app`) accidentally serving stale code to old app installs.

**What the health check verifies:** Production /health responds with current version, zombie service is offline (or warns if still alive), Supabase Postgres + Storage both reachable.

---

## Block 2 — Customer Domains

**What it is:** every paying customer has their own .com domain (e.g. `kateragno.com`) that serves their book at both www and apex. We register the domain via Spaceship at checkout, register the domain with Railway as a custom domain (one for www, one for apex), and write 4 DNS records via Spaceship: CNAME www, A apex, and two `_railway-verify` TXT records for TLS.

| Component | Owner | Notes |
|---|---|---|
| Domain registration | Spaceship API | $12.99/yr or whatever's in budget |
| Domain DNS records | Spaceship "basic" DNS (`launch1/2.spaceship.net`) | We write the records via the Spaceship admin API |
| TLS certificates | Railway (Let's Encrypt) | Issued automatically once Railway sees the verify TXT |
| Domain auto-renewal | Spaceship | Auto-renew=true for active customers, false for archived/cancelled |
| `domain_orders` table | Supabase | Every purchase tracked here with status pending → registering → registered → dns_setup → active (or failed) |

**What can break it:** Spaceship API endpoint changes (we hit this Apr 2026 when `/dns-records` moved to `/dns/records/{domain}`), Railway's CNAME target changes, missing verify TXT records (TLS validation never completes), apex A records pointing somewhere wrong.

**What the health check verifies:** Every active customer's domain returns 200 over HTTPS at both apex and www, no domain orders failed in the last 24 hours, no domain orders stuck in transitional state >1 hour.

**Related crons:** `siteLiveDetect` (every 5 min) — emails customer when their site first responds 200. `domainOrderAlerts` (daily 9:30 AM UTC) — emails admin if any orders in `failed` or stuck-mid-flow state.

---

## Block 3 — Email Pipeline

**What it is:** every transactional and marketing email customers receive.

| Email | Trigger | Who |
|---|---|---|
| Welcome | Stripe checkout completed | New customer |
| Day 1 / 3 / 7 / 13 drip | Daily cron at 9:07 AM UTC | New customers, until they unsubscribe |
| Site is live | `siteLiveDetect` cron when their domain first responds | New customer |
| Cancellation (archive) | Admin "Cancel & Archive" or customer self-cancel | Customer |
| Cancellation (delete) | Admin "Permanently Delete" | Customer |
| Reactivation | Stripe webhook un-archives a previously cancelled family | Customer |
| Password reset | Customer clicks "Forgot password" on `/account` | Customer |
| Gift purchase confirmation | Gift Stripe checkout completes | Buyer |
| Contact form | Customer submits `/api/contact` (the Need Help form on the landing page) | Admin |

| Component | Owner | Notes |
|---|---|---|
| Sender | Resend (`hello@legacyodyssey.com`) | Domain verified DKIM/SPF/DMARC |
| Reply-To | `legacyodysseyapp@gmail.com` (catch-all) | Bypasses Spacemail forwarding which has been unreliable |
| Inbound MX | Spacemail (`mx1/2.spacemail.com`) | Mailboxes: `dan@`, `hello@`, `help@`, `info@`. Forwarding to gmail not yet set up at Spacemail level — the code's `replyTo: gmail` is the working safety net. |
| Unsubscribe | `/unsubscribe?token=...` | HMAC-signed token; sets `families.unsubscribed_at`; honoured by drip cron |

**What can break it:** Resend API key revoked, domain verification expired, template regression (the kind we hit Apr 24 — empty conditional dropped App Store buttons), unsubscribe token signing key (`SESSION_SECRET`) lost.

**What the health check verifies:** Resend API + key valid, `legacyodyssey.com` still verified at Resend, welcome email template renders with all required content (App Store + Play Store URLs hardcoded, set-password button, book password), App Store + Play Store URLs both resolve, `ADMIN_EMAIL` is set.

---

## Block 4 — Checkout & Domain Purchase

**What it is:** the full purchase flow — Stripe Checkout → webhook → family + book + auth user creation → domain registration → DNS setup → welcome email.

| Component | Owner | Notes |
|---|---|---|
| Stripe Checkout | Stripe | Live mode |
| Stripe Prices | Stripe | Monthly, Annual, Annual Intro (with $20.99 coupon for first year), Additional Domain, Setup Fee |
| Stripe webhook | Our `/stripe/webhook` | Receives `checkout.session.completed`, creates the family + kicks off domain setup |
| Domain availability search | Spaceship `POST /domains/available` | Used during the founder modal flow |
| Domain registration | Spaceship `POST /domains/{domain}` | Async — we poll `/async-operations/{id}` for completion |

**What can break it:** Stripe price IDs deleted/archived, webhook secret mismatch, Spaceship API auth invalid, Stripe account in restricted state.

**What the health check verifies:** Stripe API reachable + account ID returned, every required price ID exists and is active, `STRIPE_WEBHOOK_SECRET` set, Spaceship API reachable + authenticated.

---

## Block 5 — Mobile API

**What it is:** the JSON API that the React Native iOS + Android apps use to authenticate, read books, edit content, manage subscriptions, and cancel.

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/login`, `/refresh`, `/signup` | Authentication |
| `POST /api/auth/cancel` | Customer-initiated soft cancel (with multi-site Primary rules) |
| `DELETE /api/auth/account` | Returns 410 Gone (legacy hard-delete deprecated; admins only) |
| `GET /api/books/mine`, `PUT /api/books/...` | Book content CRUD |
| `GET /api/families/mine` | List linked families (multi-site customers) |
| `POST /api/upload` | Photo upload to Supabase Storage |
| `GET /api/domains/search?name=...` | Domain availability during signup |
| `POST /api/stripe/...` | Checkout session creation |

**What can break it:** auth middleware bug, route throws unhandled exception (returns 5xx), schema regression breaks the mobile app's expectations.

**What the health check verifies:** Each route returns the correct rejection (401 on missing auth, 410 on deprecated delete), no route returns 5xx for known-bad input, domain search responds 200 with the expected `{results: [...]}` shape.

---

## Block 6 — Backups

**What it is:** off-site mirroring of customer photos so we don't lose them if Supabase ever fails.

| Component | Owner | Notes |
|---|---|---|
| Source | Supabase Storage `photos` bucket | Where customers upload to |
| Mirror destination | Cloudflare R2 `legacy-odyssey-photo-backups` | S3-compatible; zero egress; free tier covers 10GB |
| Mirror cron | Daily at 3:30 AM UTC | Idempotent — HEAD check before each upload, skip if size matches |
| DB backups | Supabase free tier | Daily, 7-day retention |

**What can break it:** R2 credentials revoked, R2 bucket deleted, cron crashes silently, Supabase Storage API changes.

**What the health check verifies:** R2 credentials env vars set, R2 bucket listable, R2 object count keeping pace with Supabase Storage object count (within 5-object tolerance), most recent R2 upload timestamp is < 26 hours old.

---

## Block 7 — Cron Jobs (planned)

**Status:** not yet covered by automated checks. Will be added in a follow-up commit that introduces a `cron_runs` tracking table.

The active crons today:
- `onboardingEmails` — daily 9:07 AM UTC
- `domainOrderAlerts` — daily 9:30 AM UTC  
- `photoBackup` — daily 3:30 AM UTC
- `siteLiveDetect` — every 5 minutes
- `healthCheckCron` — daily 2:30 AM UTC

Each has its own internal logging today. Future health check will verify each cron has run within its expected interval.

---

## Block 8 — Customer Records

**What it is:** the integrity invariants that should always be true for every paying customer.

| Invariant | Why |
|---|---|
| Every active customer has a `books` row | Otherwise the app crashes on first load |
| `families.subscription_status` matches Stripe | Otherwise we're billing wrong or showing wrong UI |
| `review@legacyodyssey.com` (Apple Review Demo) is active and not archived | Apple App Store review depends on it |
| No `admin_users.email` is in an archived family | Self-protection — admin accidentally archives themselves |

**What can break it:** webhook race conditions (Stripe says one thing, our DB says another), accidental admin operations, manual SQL meddling.

**What the health check verifies:** All four invariants above. Mismatches surface as warns; missing critical records as fails.

---

## Where it all comes together: `/admin/health`

Visit `legacyodyssey.com/admin/health` (admin auth required) to run every check live. The page shows pass/warn/fail status per check, filterable by block, with a "Re-run" button. The same checks also run automatically every day at 2:30 AM UTC; if any FAIL, an email goes to `ADMIN_EMAIL` (currently `legacyodysseyapp@gmail.com`).

To add a new block: create `src/services/healthChecks/blockNFoo.js`, export `{ blockName, blockLabel, checks }`, then add the require to `src/services/healthChecks/index.js`. Document it here.
