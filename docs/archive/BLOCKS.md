# Legacy Odyssey — Operational Blocks

> The product organized into operational blocks. Each block is a self-contained
> piece of how the business runs. The `/admin/health` page runs automated
> checks against every block; this doc explains what each one *is*.

Last updated: April 27, 2026 (evening — Approximated migration)

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

## Block 2 — Customer Domains (post Apr 27 2026 evening Approximated migration)

**What it is:** every paying customer has their own .com domain (e.g. `kateragno.com`) serving their book at both www and apex. The domain is registered via Spaceship at checkout, then registered as a virtual host on **Approximated.app**'s proxy cluster. Customer DNS (apex + www) points at Approximated's cluster IP `137.66.1.199`. Approximated terminates TLS per hostname (Caddy On-Demand TLS, Let's Encrypt) and Host-header-preserves the request to Railway directly.

**Traffic flow:**
```
Visitor → kateragno.com (Spaceship DNS — A record at customer's zone)
       → 137.66.1.199 — Approximated proxy cluster ("Legacy Odyssey")
       → Caddy On-Demand TLS terminates per-hostname cert
       → legacy-odyssey-production.up.railway.app:443 (Railway directly, NOT through Cloudflare)
       → Railway service (Express reads Host header, routes to family/book)
```

| Component | Owner | Notes |
|---|---|---|
| Domain registration | Spaceship API | $12.99/yr or whatever's in budget |
| Domain DNS authority | Spaceship nameservers (default) | Roy is the one exception — still on Cloudflare nameservers from earlier experiment |
| Customer DNS records | Spaceship Advanced DNS | A `@` and A `www`, both → `137.66.1.199` |
| TLS certificates | Approximated (Caddy On-Demand TLS, Let's Encrypt) | Issued automatically on first hit to a DNS-pointing domain |
| Virtual host registration | Approximated cluster "Legacy Odyssey" | apex + www added via `POST /api/vhosts` with `keep_host=true`, `target_address=legacy-odyssey-production.up.railway.app`, `target_ports=443` |
| Proxy target | `legacy-odyssey-production.up.railway.app:443` | Direct Railway hostname — NOT `legacyodyssey.com` (which is CF-fronted and 403s unknown Hosts) |
| Cost | Approximated $20/mo plan | 250 hostnames included. We use 16 (8 customers × apex+www). Headroom for ~120 more before plan upgrade. |
| Domain auto-renewal | Spaceship | Auto-renew=true for active customers, false for archived/cancelled |
| `domain_orders` table | Supabase | Every purchase tracked: pending → registering → registered → dns_setup → active (or failed) |

**Critical Approximated config** (set on every vhost — never rely on cluster defaults):
- `keep_host: true` — preserves the original `Host` header so Express can route by customer hostname. Default is `false`, which would make Express see `legacy-odyssey-production.up.railway.app` and serve the marketing site.
- `target_address: legacy-odyssey-production.up.railway.app` — direct Railway hostname (NOT `legacyodyssey.com`). Going through CF returns 403 for unknown Hosts.
- `target_ports: 443` — HTTPS to upstream.

**Why we ditched Cloudflare for SaaS** (the previous architecture, abandoned the same day): To programmatically create per-customer Cloudflare zones, the API token needs Account-level Zone:Edit. That permission **is not exposed in Cloudflare's custom-token UI**. The only paths were: Global API Key (full account, unsafe) or Tenants API (Enterprise sales call). Approximated solved the same problem with one API key.

**What can break it:**
- Approximated cluster outage (single point of failure for ALL customers — Approximated runs Caddy on multiple nodes, but it's their infra). No SLA at $20/mo tier.
- Approximated API key revoked or account suspended (payment lapse, billing failure)
- Railway's custom-domain cap (20) — not directly in this block's traffic flow, BUT Railway routes by Host header, and apex hostnames must be in Railway's custom-domain list for Railway's edge to forward them to our service. (Currently this blocks `kateragno.com` and `your-family-photo-album.com` apex — known issue.)
- Spaceship URL Redirect connection injecting locked `group:product` apex A records pointing at parking IPs — must remove via Domain Manager → URL redirect → Remove connection (no API).
- `legacy-odyssey-production.up.railway.app` hostname change (unlikely; Railway-assigned)

**Recovery runbooks:**
- **Migrate a new customer (or repair an existing one):** `node scripts/migrate-customer-to-approximated.js <domain>` — idempotent. Script creates apex + www vhosts on Approximated, deletes stale records on Spaceship (old A, CNAME, Railway TXTs, Cloudflare TXTs), writes clean A records to cluster IP. If apex still has `group:product` records after script runs, manually remove the URL Redirect connection in Spaceship Domain Manager.
- **Approximated API key compromised:** rotate at `cloud.approximated.app` → Proxy Clusters → API Keys → Rotate. Update `APPROXIMATED_API_KEY` env on Railway.
- **Approximated outage:** point customer DNS A records back at `151.101.2.15` (legacy Fastly/Railway path) as emergency rollback. Will lose TLS until customer is re-added to Railway custom domains. Better long-term: add a second cluster with Approximated, or self-host Caddy.
- **Railway custom-domain cap blocks apex:** delete unused Railway entries (after Approximated migration, the per-customer www/apex Railway entries are dead weight). Free up slots, then add the missing apex. Railway support can also bump the cap to 30 temporarily.
- **Spaceship URL Redirect pollution:** Domain Manager → click domain → URL redirect → Remove connection (sometimes appears as "X" on the connection card; sometimes as a trash icon on the redirect entry itself).

**What the health check verifies:** Every active customer's domain returns 200 over HTTPS at **both** apex and www (`isFullyServing` — strict; both URLs in parallel, fails if either is broken), no domain orders failed in the last 24 hours, no domain orders stuck in transitional state >1 hour. The site-live-detect cron uses the looser `isSiteLive` (either side OK) so the welcome email fires as soon as www is up.

**TODO add to health check:** verify each Approximated vhost has `has_ssl=true` and `apx_hit=true` (catches state where DNS reverts but cached cert keeps serving briefly). Use `approximatedService.getStatus()` per active customer.

**Related crons:** `siteLiveDetect` (every 5 min) — emails customer when their site first responds 200. `domainOrderAlerts` (daily 9:30 AM UTC) — emails admin if any orders in `failed` or stuck-mid-flow state.

**Migration script:**
- `scripts/migrate-customer-to-approximated.js` — idempotent migration for any existing customer. Creates Approximated vhosts (apex + www), deletes stale Spaceship records, writes clean A records to cluster IP, prints status.
- `cloudflareService.js` and `scripts/cloudflare-test.js` / `scripts/migrate-customer-to-cf.js` / `scripts/migrate-customer-zone-to-cf.js` — DEAD CODE from the abandoned Cloudflare for SaaS path. Safe to delete.

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

## Block 7 — Cron Jobs

**What it is:** every scheduled background job + the freshness invariants that prove they're still running.

| Cron | Schedule | Expected max gap | What it does |
|---|---|---|---|
| `onboarding-emails` | Daily 9:07 AM UTC | 25 h | Day 1 / 3 / 7 / 13 drip emails to new customers |
| `domain-order-alerts` | Daily 9:30 AM UTC | 25 h | Emails admin if any domain order is failed or stuck |
| `photo-backup` | Daily 3:30 AM UTC | 26 h | Mirrors Supabase Storage → Cloudflare R2 |
| `site-live-detect` | Every 5 min | 15 min | Polls each new customer's domain; emails them when reachable |
| `health-check` | Daily 2:30 AM UTC | 25 h | This very check — self-monitoring |

**How tracking works:** every cron's `start` and `end` are recorded in the `cron_runs` table via the `withTracking()` wrapper in `src/services/cronTracker.js`. Each row holds `last_started_at`, `last_finished_at`, `last_success_at`, `last_error`, `consecutive_failures`.

**What can break it:** the cron module crashes on import, the scheduler is never started (server boot bug), the cron throws an unhandled exception every time, the tracker fails to record runs.

**What the health check verifies:** for each of the 5 crons — last finish within the expected max interval, AND `consecutive_failures` is 0 (warn at 1, fail at 2+).

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
