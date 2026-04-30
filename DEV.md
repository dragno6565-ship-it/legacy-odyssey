# Legacy Odyssey — Developer Context

> **Read this file in full at the start of every dev session. It is the single source of truth.**
> Last updated: April 19, 2026

---

## What Is This Product?

Legacy Odyssey is a **subscription SaaS baby book / family memory platform**.

- Parents use a **React Native mobile app** (iOS + Android) to fill in their baby's story: milestones, photos, recipes, letters to their child, family members, vault docs, etc.
- Family and friends view the finished book at a **custom .com domain** (e.g., `kateragno.com`), served as a beautiful SSR web app.
- Every customer gets their own real `.com` domain purchased automatically via the Spaceship API at checkout.
- The backend is a Node/Express API deployed on Railway. Database + storage is Supabase. Payments are Stripe.

**Status: LIVE, accepting real payments since March 29, 2026.**

---

## Critical Dev Rules (Non-Negotiable)

1. **NEVER submit to Apple App Store or Google Play without explicit user confirmation.** Ask. Wait for "yes."
2. **NEVER click "Submit for Review", "Add for Review", or "Resubmit to App Review" in ASC without explicit confirmation.**
3. **Always push to `origin` (dragno6565-ship-it/legacy-odyssey) — Railway auto-deploys from this remote on push to `main`.**
4. **The canonical backend URL is `https://legacyodyssey.com` — never hardcode or use the `*.up.railway.app` hostname in any code.**
5. **Cannot run DDL (ALTER TABLE, etc.) via the API — use the Supabase SQL Editor dashboard for schema changes.**
6. **Windows curl always needs `--ssl-no-revoke` flag.**
7. **The user prefers direct action — don't ask unnecessary questions, make decisions and drive work forward.**

---

## Repository

| Item | Value |
|------|-------|
| GitHub repo | `github.com/dragno6565-ship-it/legacy-odyssey` |
| Local path | `E:\Claude\legacy-odyssey` |
| Branch | `main` |
| Deploy trigger | Push to `origin` → Railway auto-deploys |

---

## Infrastructure

### Railway (Backend Hosting)

| Item | Value |
|------|-------|
| Canonical URL | `https://legacyodyssey.com` ← **always use this** |
| Also live at | `https://www.legacyodyssey.com` |
| Project ID | `27622203-293e-4720-b019-9efe8eadfdf4` ("bountiful-expression") |
| Service ID | `59190e65-b239-4cf1-842a-3913fabb1838` |
| Environment ID | `a9643517-8aad-441a-81c7-55c462f2fea0` |
| Dashboard | `https://railway.com/project/27622203-293e-4720-b019-9efe8eadfdf4` |

**⚠️ RAILWAY API TOKEN MISMATCH:** The `.env` vars `RAILWAY_API_TOKEN` / `RAILWAY_SERVICE_ID` / `RAILWAY_ENVIRONMENT_ID` point to a SECONDARY project (`25a7cbc7` "romantic-creation"). `railwayService.js` cannot add custom domains via the API — do it manually in the Railway dashboard, or generate a new token scoped to project `27622203`.

**⚠️ ZOMBIE SERVICE — DELETE AFTER v1.0.5 PROPAGATES:**
A second Railway service at `https://legacy-odyssey-production-a9d1.up.railway.app` is still live. It shares the same Supabase DB (logins work) but runs version 2.1.0 — stale code. This was the root cause of weeks of broken photos. Do NOT delete it until v1.0.5 is live on both stores — older installed apps still point there.

Quick detector:
```bash
curl -s --ssl-no-revoke https://legacyodyssey.com/health | python -m json.tool
curl -s --ssl-no-revoke https://legacy-odyssey-production-a9d1.up.railway.app/health | python -m json.tool
# If "version" fields differ → zombie is still running stale code
```

Admin panel: `https://legacyodyssey.com/admin/login` — login: `dragno65@hotmail.com`
*(Note: old admin URL `legacy-odyssey-production-a9d1.up.railway.app/admin/login` still works but hits stale backend)*

---

### Supabase (Database + Storage)

| Item | Value |
|------|-------|
| Project ref | `vesaydfwwdbbajydbzmq` |
| URL | `https://vesaydfwwdbbajydbzmq.supabase.co` |
| Dashboard | `https://supabase.com/dashboard/project/vesaydfwwdbbajydbzmq` |
| SQL Editor | `https://supabase.com/dashboard/project/vesaydfwwdbbajydbzmq/sql` |
| Account | `dragno6565@gmail.com` |
| Region | us-west-2 |
| Pooler | `aws-0-us-west-2.pooler.supabase.com:6543` |

- **DDL changes** (ALTER TABLE, etc.) must be run in the SQL Editor dashboard — cannot be done via API.
- **Service-role admin access:** Use `supabase.auth.admin.updateUserById` + `listUsers` via a short Node script with the service-role key for user management tasks.
- **Storage:** Photos uploaded to Supabase Storage, returned as full Supabase URLs. The `resolvePhoto` helper normalizes relative paths to full URLs.

---

### Stripe (Payments — LIVE MODE)

| Item | Value |
|------|-------|
| Account | `acct_1T3N7kJk2GIrL5uS` |
| Dashboard | `https://dashboard.stripe.com` |

**Pricing / Price IDs:**
| Plan | Price | Stripe ID |
|------|-------|-----------|
| Monthly | $4.99/mo + $5.99 setup fee | `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_SETUP` |
| Annual standard | $49.99/yr | `STRIPE_PRICE_ANNUAL` |
| **Annual intro (PRIMARY OFFER)** | $29 first year → $49.99/yr renewal | `STRIPE_PRICE_ANNUAL_INTRO` = `price_1TLojVJk2GIrL5uS0oQORYsr` |
| Annual intro coupon | $20.99 off (once) | `STRIPE_ANNUAL_INTRO_COUPON` = `sX2lEPb6` |
| Additional domain | $12.99/yr | `STRIPE_PRICE_ADDITIONAL_DOMAIN` = `price_1TDVIAQzzNThrLYKNnMljEkp` |

**Checkout endpoints:**
- Annual intro: `POST /api/stripe/create-founder-checkout`
- Monthly: `POST /api/stripe/create-checkout`
- Additional site (planned): `POST /api/stripe/create-additional-site-checkout` *(not yet built)*

---

### Email (Resend)

- **Domain:** `legacyodyssey.com` — verified (DKIM, SPF, DMARC)
- **Forwarding:** all `@legacyodyssey.com` → `legacyodysseyapp@gmail.com`
- **Onboarding drip:** Day 1, 3, 7, 13 — managed by `src/jobs/onboardingEmails.js`, started in `server.js` on boot

---

### DNS / Domain Registration

- **Registrar:** Spaceship — domains purchased automatically via API at checkout
- **DNS type:** Spaceship Advanced DNS — `www` CNAME only; root `@` does NOT support CNAME (limitation)
- **Spaceship wallet:** $50 funded, auto-renewal enabled (Visa ending 6181)
- **Domain purchase flow:** async — Spaceship returns 202 + operation ID, poll `/async-operations/{id}`
- **Rate limits:** 5 req/domain/300s for availability checks; use bulk endpoint + 5-min cache

---

### Expo / EAS (Mobile Builds)

| Item | Value |
|------|-------|
| Expo account | `dragno65` |
| EAS project ID | `14daf713-2b41-4ac0-b413-1179afa6e6a9` |
| Expo dashboard | `https://expo.dev/accounts/dragno65/projects/legacy-odyssey` |
| All builds | `https://expo.dev/accounts/dragno65/projects/legacy-odyssey/builds` |

- iOS build numbers managed remotely via EAS (`appVersionSource: "remote"` in `app.json`)
- Runtime version policy: `appVersion` (OTA updates only reach matching binary version)

**Common EAS commands:**
```bash
cd E:/Claude/legacy-odyssey/mobile

# Build iOS (production IPA for App Store)
eas build --platform ios --profile production --non-interactive

# Build Android production AAB
eas build --platform android --profile production --non-interactive

# Build Android preview APK (sideload/test)
eas build --platform android --profile preview --non-interactive

# Submit iOS (replace <id> with build ID)
eas submit --platform ios --id <build-id> --profile production --non-interactive

# Submit Android (uses service account key in eas.json)
eas submit --platform android --id <build-id> --profile production --non-interactive
```

**Android submission service account key:**
`C:/Users/dragn/Downloads/warm-practice-349716-6414eeb91dbe.json`
Email: `legacy-odyssey-play@warm-practice-349716.iam.gserviceaccount.com`

---

## App Store Status (as of April 19, 2026)

### iOS — Apple App Store

| Item | Value |
|------|-------|
| Apple Team ID | Y3J2B5YA4N |
| App ID | 6760883565 |
| Bundle ID | `com.legacyodyssey.app` |
| ASC URL | `https://appstoreconnect.apple.com/apps/6760883565` |
| TestFlight | `https://appstoreconnect.apple.com/apps/6760883565/testflight/ios` |

**Build history:**
| Version | Build | Status | Date |
|---------|-------|--------|------|
| 1.0.1 | 11 | Complete ✅ | Apr 6, 2026 |
| 1.0.3 | 13 | Complete ✅ | Apr 13, 2026 |
| 1.0.4 | 14 | Ready for Distribution ✅ | Apr 14, 2026 |
| **1.0.5** | **15** | **⏳ Waiting for Review** | Apr 19, 2026 |

**v1.0.5 details:**
- Build ID: `783e2af2-06d4-4902-865c-dc61aa72e283`
- EAS submission ID: `b8a6b1c2-1c6a-4de7-884c-aecc7694ed02`
- Contains: mobile BASE_URL fix → `legacyodyssey.com` (commit `1a495d0`)
- What's New: "Bug fixes and performance improvements."
- App Review credentials: `review@legacyodyssey.com` / `TestPass-2026!`

**Agreement status:** Both Free Apps + Paid Apps Agreements signed Apr 19, 2026 (active through Sep 3, 2026) under DOR Industries, LLC entity.

**⚠️ ASC browser automation quirk:** Scrolling or focusing fields can blank the page. Use JS `.click()` and native value setter: `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set` — never `.focus()` or `.scrollIntoView()`.

**Screenshot files:** `E:\Claude\legacy-odyssey\screenshots\` — `screenshot1.png`, `screenshot2.png`, `screenshot3.png` (6.5" iPhone)

---

### Android — Google Play

| Item | Value |
|------|-------|
| Developer | DOR Industries |
| Login | `albumerapp2@gmail.com` (Chrome u/2) |
| Developer ID | `7255543911428830238` |
| App ID | `4975186349665269659` |
| Console | `https://play.google.com/console/u/2/developers/7255543911428830238/app/4975186349665269659/app-dashboard` |

**Build history:**
| Version | versionCode | Status | Date |
|---------|------------|--------|------|
| 1.0.2 | 9 | In Production ✅ | — |
| 1.0.3 | 10 | In Production ✅ | Apr 13, 2026 |
| **1.0.5** | **13** | **⏳ In Review** | Apr 19, 2026 |

**v1.0.5 details:**
- Build ID: `5d377bbe-56b6-4bd8-a624-7254fcc2d5fb` (AAB, commit `39fca98`)
- Submission ID: `4597024b-a352-4549-a602-2d11ad127771`
- Preview APK (sideloaded for testing): `E:\Claude\apk-serve\legacy-odyssey-1.0.5.apk`

---

## Code Structure

```
E:\Claude\legacy-odyssey\
├── src/                            # Express API + web server
│   ├── server.js                   # Entry point — middleware, routes, scheduler
│   ├── instrument.js               # Sentry init (must load before everything)
│   ├── config/
│   │   ├── env.js                  # validateEnv() — checks all required env vars
│   │   ├── db.js                   # Supabase client
│   │   └── stripe.js               # Stripe client
│   ├── middleware/
│   │   ├── requireAuth.js          # JWT verification + family resolution
│   │   ├── requireAdmin.js         # Admin-only guard
│   │   └── errorHandler.js         # Global error handler + Sentry
│   ├── routes/
│   │   ├── api/
│   │   │   ├── auth.js             # POST /api/auth/login, /signup, /refresh, DELETE /account (lines 167-211)
│   │   │   ├── books.js            # CRUD for all book sections + photo upload/position
│   │   │   ├── album.js            # Photo album
│   │   │   ├── upload.js           # File upload to Supabase Storage
│   │   │   ├── stripe.js           # Checkout, billing portal, subscription mgmt
│   │   │   ├── domains.js          # Domain search (rate-limited)
│   │   │   ├── families.js         # Multi-family: list, create, switch
│   │   │   ├── contact.js          # Contact form
│   │   │   └── waitlist.js         # Waitlist signup
│   │   ├── book.js                 # SSR web book viewer routes
│   │   ├── account.js              # Web account mgmt (login + subscription portal)
│   │   ├── admin.js                # Admin panel routes
│   │   └── webhooks.js             # Stripe webhook handler (checkout.session.completed, etc.)
│   ├── services/
│   │   ├── spaceshipService.js     # Spaceship API wrapper (domain registration)
│   │   ├── domainService.js        # searchDomains() + purchaseAndSetupDomain() orchestration
│   │   ├── railwayService.js       # Railway GraphQL API (custom domain setup — currently broken, see note)
│   │   ├── stripeService.js        # createCheckout(), createFounderCheckout(), etc.
│   │   └── emailService.js         # Resend email sending
│   ├── views/
│   │   ├── book/                   # EJS pages for web book viewer
│   │   ├── layouts/                # Shared EJS layouts
│   │   ├── admin/                  # Admin panel EJS pages
│   │   ├── marketing/              # Landing page, success pages
│   │   └── dorindustries.html      # DOR Industries corporate site (served on dorindustries.com)
│   ├── public/                     # Static assets (CSS, JS, images)
│   └── jobs/
│       └── onboardingEmails.js     # Drip email scheduler
│
├── mobile/                         # React Native (Expo SDK 54)
│   ├── App.js                      # Root: AuthProvider + NavigationContainer
│   ├── app.json                    # EAS config, bundle IDs, permissions
│   ├── eas.json                    # EAS build profiles (production, preview)
│   └── src/
│       ├── auth/
│       │   └── AuthContext.js      # Auth state, login/logout, family switching
│       ├── api/
│       │   └── client.js           # Axios client, token management, BASE_URL
│       └── screens/
│           ├── DashboardScreen.js  # Main hub, family switcher modal
│           ├── SettingsScreen.js   # Account deletion (L225-238), Manage Subscription (L199-212)
│           ├── NewWebsiteScreen.js # Add new site flow (currently bypasses payment)
│           └── [all other screens — see navigation table below]
│
├── supabase/migrations/            # SQL migration files
├── screenshots/                    # App Store screenshots (6.5" iPhone)
│   ├── screenshot1.png
│   ├── screenshot2.png
│   └── screenshot3.png
├── ads/                            # Marketing ad assets
│   └── design_philosophy.md        # "Heirloom Modern" visual design philosophy
├── app-screen-reference.html       # Visual map of all mobile screens with labels
├── DEV.md                          # This file
├── MARKETING.md                    # Marketing context file
└── CLAUDE.md                       # Master context (kept in sync, auto-loaded by Claude)
```

---

## Mobile App Screens

**Auth Stack:** Login → Signup

**App Stack (authenticated):**
| Route Name | Screen File | Description |
|-----------|-------------|-------------|
| Dashboard | DashboardScreen.js | Main hub with section cards + family switcher |
| ChildInfo | ChildInfoScreen.js | Baby name, DOB, birth info |
| BeforeArrived | BeforeScreen.js | Pregnancy / before birth story |
| BirthStory | BirthStoryScreen.js | Birth narrative |
| ComingHome | ComingHomeScreen.js | Coming home story |
| Months | MonthsScreen.js | Month 1-12 grid |
| MonthDetail | MonthDetailScreen.js | Individual month editor |
| OurFamily | FamilyScreen.js | Family members list |
| FamilyMember | FamilyMemberScreen.js | Add/edit individual family member |
| YourFirsts | FirstsScreen.js | Milestones: first smile, word, steps, etc. |
| Celebrations | CelebrationsScreen.js | Birthday parties, holidays, events |
| Letters | LettersScreen.js | Letters to child |
| FamilyRecipes | RecipesScreen.js | Recipe collection |
| TheVault | VaultScreen.js | Document storage (birth certificates, etc.) |
| Settings | SettingsScreen.js | Account, subscription management, account deletion |
| Preview | PreviewScreen.js | WebView of the live book web viewer |
| NewWebsite | NewWebsiteScreen.js | Add another site flow |

**Visual screen reference:** `E:\Claude\legacy-odyssey\app-screen-reference.html`
Label system: `"3-d"` = Child Info card on Dashboard. Open the HTML file in a browser to see all labels.

---

## API Base URL Logic (mobile)

File: `mobile/src/api/client.js`

```javascript
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||   // set in .env.local for dev
  process.env.API_URL ||
  'https://legacyodyssey.com';         // production fallback — ALWAYS this hostname
```

**Auth:** JWT Bearer tokens stored in `expo-secure-store`. Axios interceptor auto-attaches on every request. Auto-refresh on 401 via `/api/auth/refresh`.

**Family ID:** Active family sent as `X-Family-Id` header on every request. Middleware on server resolves which book to use.

**In-memory cache:** Tokens and family ID are cached in module-level vars (`_token`, `_familyId`) to avoid Hardware Keystore reads on every call (Samsung devices can hang on SecureStore).

---

## Multi-Family Architecture

- Each user has a primary family (created at signup) plus optional additional families (`linked_family_ids` in Supabase user metadata).
- The `X-Family-Id` header tells the server which family/book context to use.
- `AuthContext.js` holds `families` array + `activeFamilyId` + `setActiveFamilyId()`.
- Family switcher is the top-left modal in `DashboardScreen.js`.
- **Additional site purchase flow is NOT fully implemented** — `NewWebsiteScreen.js` currently creates a site without payment. See plan at `C:\Users\dragn\.claude\plans\peaceful-tinkering-lerdorf.md`.

---

## Local Development

```bash
# Backend server
cd E:/Claude/legacy-odyssey
npm run dev
# → http://localhost:3000

# Mobile (Expo web, for quick UI testing)
cd E:/Claude/legacy-odyssey/mobile
npx expo start --web --port 8082
# → http://localhost:8082 — click "Browse Demo" to skip auth

# Visual screen reference
cd E:/Claude/legacy-odyssey
python -m http.server 9876
# → http://localhost:9876/app-screen-reference.html

# Serve APK for sideloading
cd E:/Claude/apk-serve
python -m http.server 8765 --bind 0.0.0.0
# → http://192.168.1.4:8765/legacy-odyssey-1.0.5.apk
```

---

## Key Database Records

### Owner's Family (Eowyn's Book)
| Field | Value |
|-------|-------|
| Family ID | `fb16691d-7ea4-4c93-9827-ffe8904ced6b` |
| Book ID | `501e0807-d950-4004-8b4c-9b0f0ce0c910` |
| Subdomain | `eowynragno` |
| Custom domain | `eowynhoperagno.com` |
| Email | `dragno65@hotmail.com` |

### Apple Review Demo Account
| Field | Value |
|-------|-------|
| Email | `review@legacyodyssey.com` |
| Password | `TestPass-2026!` |
| Purpose | App Store reviewer login — must always work |

### Active Customers (as of Apr 19, 2026)
| Name | Email | Domain | Status |
|------|-------|--------|--------|
| kateragno Family | dragno65@gmail.com | kateragno.com | ACTIVE |
| Eowyn Ragno (owner) | dragno65@hotmail.com | eowynhoperagno.com | ACTIVE |
| Lindsey Cherry | lindsey.e.cherry@gmail.com | emmacherry.com | ACTIVE |
| Roy Patrick Thompson | eowynkiller@gmail.com | roypatrickthompson.com | ACTIVE |
| Apple Review Demo | review@legacyodyssey.com | — | ACTIVE |
| Demo site | — | your-family-photo-album.com | ACTIVE |

---

## Known Bugs & Technical Debt

| Item | Detail | Priority |
|------|--------|----------|
| Zombie Railway service | `legacy-odyssey-production-a9d1.up.railway.app` runs v2.1.0. Delete via Railway dashboard **after v1.0.5 propagates** on both stores | HIGH |
| Railway API token mismatch | `.env` token points to wrong project; `railwayService.js` can't add custom domains via API | MEDIUM |
| Additional site purchase flow | `NewWebsiteScreen.js` creates site without payment. Plan exists at `C:\Users\dragn\.claude\plans\peaceful-tinkering-lerdorf.md` | MEDIUM |
| `API base URL` in technical notes | `CLAUDE.md` Technical Notes section has stale `*.up.railway.app` fallback in the note — update when convenient | LOW |
| `auth.js` DELETE /account route | Lines 167-211 — review to ensure it cleans up Stripe subscription + domain properly | LOW |

---

## Recent Fixes (Apr 19, 2026)

**Problem:** Photos not loading, "Adjust Photo" returning 404. Server fixes deployed for weeks but never reached the app.

**Root cause:** Two Railway services exist. `legacyodyssey.com` = current (v2.2.0). `*.up.railway.app` = stale (v2.1.0). Mobile was hardcoded to stale hostname.

**Fix:** `mobile/src/api/client.js` BASE_URL fallback changed to `legacyodyssey.com`. App version bumped to 1.0.5.

**Diagnosis tool:** Temporary `/diag/tail?key=trace` endpoint (ring buffer of last 200 API requests) added in commit `a4a0a8e`, removed in `39fca98`.

**Commits:**
- `1a495d0` — BASE_URL fix + version bump to 1.0.5
- `a4a0a8e` — Added /diag/tail diagnostic
- `39fca98` — Removed /diag/tail

---

## Pending Dev Tasks (as of April 19, 2026)

1. **Wait for iOS 1.0.5 Apple review** — submitted Apr 19, up to 48 hrs. Email when done.
2. **Wait for Android 1.0.5 Google Play review** — submitted Apr 19. Submission `4597024b`.
3. **Delete zombie Railway service** at `legacy-odyssey-production-a9d1.up.railway.app` — ONLY after v1.0.5 live on both stores.
4. **Build additional site purchase flow** — see plan `C:\Users\dragn\.claude\plans\peaceful-tinkering-lerdorf.md`. Stripe price ID `price_1TDVIAQzzNThrLYKNnMljEkp` ($12.99/yr) already exists.

---

## Technical Gotchas

| Gotcha | Detail |
|--------|--------|
| Windows curl | Always add `--ssl-no-revoke` |
| Chrome extension disconnect | Reconnect via Claude Desktop + Chrome extension, same account |
| Supabase DDL | Must use SQL Editor dashboard — API client is row-level only |
| EAS build numbers | iOS build numbers are managed remotely by EAS, not `app.json` |
| Demo mode | "Browse Demo" on login = `isAuthenticated: true, isDemo: true` — no real API calls made |
| Spaceship domain async | Returns 202 + operation ID. Poll `/async-operations/{id}` to confirm completion |
| Spaceship rate limits | 5 req/domain/300s for availability; use bulk endpoint + 5-min in-memory cache |
| Android sideload | Chrome blocks APK downloads silently. Use Samsung Internet browser instead |
| OkHttp disk cache | Android's OkHttp caches API responses. All axios requests send `Cache-Control: no-cache` header to bypass |
| SecureStore on Samsung | Hardware Keystore reads can hang. Token + familyId cached in module-level vars to avoid repeated reads |
| ASC page blanking | Scroll/focus events can blank the ASC page in browser automation. Use `.click()` + native value setter |
| Railway CNAME | Custom domain setup requires `CNAME_TARGET` env var from Railway — get from dashboard |
| Stripe webhooks | Must use `express.raw()` before `express.json()` for `/stripe/webhook` route |
| CSP disabled | `helmet` CSP is disabled (`contentSecurityPolicy: false`) to allow inline styles from book template |
