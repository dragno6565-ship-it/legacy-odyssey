# Legacy Odyssey - Claude Session Context

> **Read this file at the start of every new session.** It contains everything needed to pick up where we left off.

## What Is This Project?

Legacy Odyssey is a **subscription SaaS baby book platform**. Parents use a **React Native mobile app** to fill in their baby's story (milestones, photos, recipes, letters, etc.), and family/friends view the finished book through a **web book viewer** at a custom domain (e.g., `eowynhoperagno.com`).

**Key differentiator:** Users get a **real custom domain** (e.g., `www.janedoe.com`) purchased automatically via Spaceship API during checkout. The domain cost is bundled into the subscription price.

### Architecture

```
React Native Mobile App (Expo)
        │
        ▼
Express API Server (Railway)
        │
        ▼
Supabase (PostgreSQL DB + Storage)
        │
        ▼
EJS Web Book Viewer (served by Express)
        │
        ▼
Spaceship API (domain purchase + DNS)
Railway API (custom domain hookup)
Stripe (subscription payments)
```

---

## Repository Structure

```
legacy-odyssey/
├── src/                        # Express API server
│   ├── server.js               # Entry point (Express app setup)
│   ├── config/                 # DB client, Supabase, Stripe, Spaceship configs
│   │   ├── spaceship.js        # Spaceship API axios instance (NEW)
│   │   └── env.js              # Env var validation with optional warnings
│   ├── middleware/              # Auth, error handling, family resolution
│   │   ├── requireAuth.js      # JWT Bearer token auth
│   │   ├── requireAdmin.js     # Admin-only middleware
│   │   ├── requireBookPassword.js  # HMAC-SHA256 password gate for web viewer
│   │   ├── resolveFamily.js    # Resolves family by domain/subdomain/slug
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── api/
│   │   │   ├── auth.js         # Sign up, login, JWT issuance
│   │   │   ├── books.js        # CRUD for all book content (sections, photos, etc.)
│   │   │   ├── upload.js       # Photo upload to Supabase Storage
│   │   │   ├── stripe.js       # Subscription management + domain in checkout
│   │   │   └── domains.js      # GET /api/domains/search?name=janedoe (NEW)
│   │   ├── book.js             # Web book viewer routes (password gate, book pages)
│   │   ├── admin.js            # Admin panel routes
│   │   └── webhooks.js         # Stripe webhook handler
│   ├── services/               # Business logic layer
│   │   ├── spaceshipService.js # Spaceship API: availability, registration, DNS (NEW)
│   │   ├── domainService.js    # Domain search orchestration + alternatives (NEW)
│   │   ├── railwayService.js   # Railway GraphQL: add custom domains (NEW)
│   │   ├── stripeService.js    # Stripe checkout + domain purchase on success (MODIFIED)
│   │   ├── familyService.js    # Family CRUD
│   │   └── bookService.js      # Book content CRUD
│   ├── utils/                  # Helpers
│   ├── views/                  # EJS templates
│   │   ├── book/               # Web book viewer pages (welcome, birth, months, etc.)
│   │   ├── layouts/            # Shared EJS layouts
│   │   ├── admin/              # Admin panel pages
│   │   └── marketing/          # Landing + success pages (domain search widget)
│   └── public/                 # Static assets (CSS, JS, images)
│       ├── css/marketing.css   # Includes domain search styles (MODIFIED)
│       └── js/domain-search.js # Client-side domain search UI (NEW)
│
├── mobile/                     # React Native app (Expo)
│   ├── App.js                  # Root: AuthProvider + NavigationContainer
│   └── src/                    # (see Mobile App Screens section below)
│
├── supabase/
│   └── migrations/
│       ├── 001_core_tables.sql # Core tables (families, content, etc.)
│       └── 002_domain_orders.sql # Domain purchase tracking (NEW - NEEDS MIGRATION)
│
├── package.json                # Server dependencies (includes axios)
├── .env                        # Server env vars (not committed)
├── .env.example                # Template for env vars
├── app-screen-reference.html   # Visual annotated screenshots of all app pages
└── CLAUDE_CONTEXT.md           # This file
```

---

## Domain Purchase Flow (NEW)

The core user flow for domain acquisition:

1. **Landing page** (`landing.ejs`) — User types desired domain name (e.g., "janedoe")
2. **Domain search** (`/api/domains/search`) — Checks availability across .com, .family, .baby, .love, .life, .me via Spaceship bulk API
3. **Smart alternatives** — If taken, suggests variations (prefixes: the/little/baby/our, suffixes: family/book/story, middle names, different TLDs)
4. **$20/yr price cap** — Domains over $20/year are filtered out server-side
5. **Stripe checkout** — Domain selection passed as metadata in checkout session
6. **Async purchase** — After Stripe success, fire-and-forget: register domain → poll status → setup DNS → add to Railway → update family record
7. **Immediate access** — User gets book at slug URL immediately; custom domain activates in 5-30 minutes

### Key Services:
- **spaceshipService.js** — Spaceship REST API wrapper (check availability, bulk check, register domain, poll async ops, setup DNS)
- **domainService.js** — Orchestration layer (search, suggest alternatives, purchase & setup flow)
- **railwayService.js** — Railway GraphQL API (add custom domain to service)
- **stripeService.js** — Modified to accept domain in checkout, create domain_orders row, trigger async purchase

### Database:
- **domain_orders** table tracks lifecycle: pending → registering → registered → dns_setup → active → failed

---

## Mobile App Screens (Navigation)

The app uses React Navigation with two stacks:

**Auth Stack** (unauthenticated):
- `Login` → LoginScreen.js
- `Signup` → SignupScreen.js

**App Stack** (authenticated or demo mode):
| Route Name | Screen File | Description |
|------------|-------------|-------------|
| `Dashboard` | DashboardScreen.js | Main hub with cards for each section |
| `ChildInfo` | ChildInfoScreen.js | Baby's name, DOB, weight, length, city, hospital, photo |
| `BeforeArrived` | BeforeScreen.js | Name origin, pregnancy story, cravings, wishes |
| `BirthStory` | BirthStoryScreen.js | Birth narrative, mom/dad photos |
| `ComingHome` | ComingHomeScreen.js | Coming home story, first visitors |
| `Months` | MonthsScreen.js | Grid of Month 1-12 cards |
| `MonthDetail` | MonthDetailScreen.js | Individual month: milestones, favorites, photo |
| `OurFamily` | FamilyScreen.js | List of family members |
| `FamilyMember` | FamilyMemberScreen.js | Add/edit individual family member |
| `YourFirsts` | FirstsScreen.js | First smile, first word, etc. |
| `Celebrations` | CelebrationsScreen.js | Birthday parties, holidays |
| `Letters` | LettersScreen.js | Letters to the child |
| `FamilyRecipes` | RecipesScreen.js | Family recipe collection |
| `TheVault` | VaultScreen.js | File uploads/document storage |
| `Settings` | SettingsScreen.js | Book password, preview, log out |
| `Preview` | PreviewScreen.js | WebView of the book viewer |

---

## Visual Screen Reference System

We created a **visual reference file** (`app-screen-reference.html`) with annotated screenshots of every screen. Each page is numbered and each UI element has a sub-label:

| Page | Screen | Labels |
|------|--------|--------|
| 1 | Login | 1-a (Status Bar) through 1-j (Bottom Tab Bar) |
| 2 | Sign Up | 2-a through 2-j |
| 3 (top) | Dashboard | 3-a through 3-i |
| 3 (bottom) | Dashboard (scrolled) | 3-j through 3-o |
| 4 (top) | Child Info | 4-a through 4-i |
| 4 (bottom) | Child Info (scrolled) | 4-j, 4-k |
| 5 | Before You Arrived | 5-a through 5-i |
| 6 | Birth Story | 6-a through 6-f |
| 7 | Coming Home | 7-a through 7-g |
| 8 | Month by Month | 8-a through 8-g |
| 9 | Month Detail (Month One) | 9-a through 9-g |
| 10 | Our Family | 10-a through 10-e |
| 11 | Your Firsts | 11-a through 11-e |
| 12 | Celebrations | 12-a through 12-f |
| 13 | Letters to You | 13-a through 13-e |
| 14 | Family Recipes | 14-a through 14-f |
| 15 | The Vault | 15-a through 15-h |
| 16 | Settings | 16-a through 16-i |

**Usage:** When the user says something like "change 3-d", that means the Child Info card on the Dashboard. Open `app-screen-reference.html` to see the full visual reference.

---

## Theme / Design System

```javascript
colors: {
  background: '#faf7f2',   // Warm cream
  dark: '#1a1510',          // Near-black (header bars)
  gold: '#c8a96e',          // Primary accent
  goldLight: '#d4bb8a',
  goldDark: '#b08e4a',
  textPrimary: '#2c2416',
  textSecondary: '#8a7e6b',
  card: '#f0e8dc',          // Card background
  white: '#ffffff',
  error: '#c0392b',
  errorLight: '#f8d7da',
  success: '#27ae60',
  border: '#e0d5c4',
  inputBg: '#ffffff',
  placeholder: '#b8ad9e',
}
```

Fonts: System serif for headings, System sans-serif for body. Web viewer uses Cormorant Garamond + Jost (Google Fonts).

---

## API Configuration

**Base URL logic** (`mobile/src/api/client.js`):
```
EXPO_PUBLIC_API_URL || API_URL || 'https://legacy-odyssey-production-a9d1.up.railway.app'
```

**Auth flow:** JWT Bearer tokens stored in expo-secure-store. Axios interceptor auto-attaches tokens.

**Demo mode:** "Browse Demo" button on login screen sets `isAuthenticated = true` with `isDemo = true` — allows browsing all screens without a real API connection. Data doesn't save in demo mode.

---

## Deployment Info

| Service | URL / ID |
|---------|----------|
| **Railway** (API server) | `legacy-odyssey-production-a9d1.up.railway.app` |
| **Railway Project ID** | `25a7cbc7-64da-4012-bf24-5b20a0bc4839` |
| **Railway Service ID** | `a759cd1b-34ae-4171-8e4b-9259e0e95dda` |
| **Railway Environment ID** | `067fb530-0dcf-4289-9a48-ee0438fa56b2` |
| **Supabase project** | `vesaydfwwdbbajydbzmq` |
| **GitHub repo** | `github.com/dragno6565-ship-it/legacy-odyssey` |
| **GitHub (alt remote)** | `github.com/dragno65/legacy-odyssey` (push permission issue) |
| **Domain** | `eowynhoperagno.com` / `legacyodyssey.com` |
| **Book URL** | `legacyodyssey.com/book/eowynragno` |
| **Book password** | `legacy` |
| **Latest APK** | `expo.dev/accounts/dragno65/projects/legacy-odyssey/builds/d9bc9bb2-1f33-47e5-8de1-ede6c21c0d66` |

### Third-Party API Credentials (configured in Railway env vars + local .env):
| Service | Env Var | Status |
|---------|---------|--------|
| Spaceship API Key | `SPACESHIP_API_KEY` | ✅ Configured |
| Spaceship API Secret | `SPACESHIP_API_SECRET` | ✅ Configured |
| Spaceship Contact ID | `SPACESHIP_CONTACT_ID` | ✅ Created (Daniel Ragno, dragno6565@gmail.com) |
| Railway API Token | `RAILWAY_API_TOKEN` | ✅ Configured |
| Railway Service ID | `RAILWAY_SERVICE_ID` | ✅ Configured |
| Railway Environment ID | `RAILWAY_ENVIRONMENT_ID` | ✅ Configured |
| Railway CNAME Target | `RAILWAY_CNAME_TARGET` | ✅ Configured |
| Stripe Keys | `STRIPE_SECRET_KEY` etc. | ❌ Not yet set up |

---

## Current Status (Updated 2026-02-25)

### What's Done:
- Full mobile app built and functional (all 16 screens)
- Express API server built with all routes
- EJS web book viewer built
- Supabase DB core tables created (001_core_tables.sql)
- Railway deployment active and auto-deploying from GitHub
- DNS configured (eowynhoperagno.com + legacyodyssey.com → Railway)
- Visual screen reference system created (app-screen-reference.html)
- APK built and available on Expo
- **Server bugs fixed** (success.ejs rendering, all 5 bugs from deployment plan)
- **Domain search & purchase feature built** (7 new files, 8 modified files)
  - Interactive domain search on landing page
  - Spaceship API integration (availability check, bulk check, registration, DNS)
  - Smart alternative suggestions (prefixes, suffixes, middle names, extra TLDs)
  - $20/year price cap enforcement
  - Stripe checkout integration with domain metadata
  - Async domain purchase orchestration (fire-and-forget after payment)
  - Railway custom domain API integration
- **Spaceship API credentials created** (API key, secret, contact ID)
- **Railway API token created** and all env vars deployed
- **spaceshipService.js fixed** to match real API response format (result field, bulk endpoint)
- **Supabase migration 002_domain_orders.sql COMPLETED** — domain_orders table, 3 indexes, and update trigger created. Verified via REST API (HTTP 200).
- **Spaceship wallet funded** — $50.00 balance (last top-up 2/25/2026). Visa ending 6181 on file. Auto-renewal enabled.
- **Domain search works locally** — tested `npm run dev` locally, GET /api/domains/search?name=testbabybook123 returns all 6 TLDs as available (HTTP 200, ~1s response)

### CRITICAL DEPLOYMENT ISSUE — Railway deploying old code:
- **Root cause:** Railway is configured to deploy from `dragno65/legacy-odyssey` (GitHub), but all new code was pushed to `dragno6565-ship-it/legacy-odyssey` (the `origin` remote).
- **The active Railway deployment is from commit `c7d712d`** ("Add lightbox JS for full-size image viewing on click") — this is BEFORE the domain search feature commits.
- **Missing commits on dragno65 remote:** `385da5b` (Stripe success fix), `d38e66d` (domain feature), `375273c` (Spaceship API fix), `ae248ea` (context update)
- **Cannot push to dragno65 remote** because git credentials on this machine are for `dragno6565-ship-it` (Permission denied error 403).
- **Railway GitHub App only has access to `dragno65` repos**, not `dragno6565-ship-it`.
- **FIX NEEDED:** Push code to `dragno65/legacy-odyssey` via one of:
  - Option A: Run `git push dragno65 main` from a terminal authenticated as `dragno65`
  - Option B: Use a Personal Access Token for `dragno65`: `git push https://<TOKEN>@github.com/dragno65/legacy-odyssey.git main`
  - Option C: Add `dragno6565-ship-it` as a collaborator on `dragno65/legacy-odyssey` in GitHub Settings
  - Option D: Install Railway GitHub App on the `dragno6565-ship-it` account (Railway Settings > Configure GitHub App)
- **Railway source is reconnected:** After investigating, we disconnected and reconnected `dragno65/legacy-odyssey` as the source. Branch: main. Service is Online with old code.

### What's Remaining:
1. **⚠️ Push new code to `dragno65/legacy-odyssey`** — See deployment issue above. This is the BLOCKING issue.
2. **Set up Stripe** — create account, get live keys, configure webhook
3. **End-to-end domain test** — test full flow with a real domain once Railway has new code
4. **Continue page-by-page UI/UX review** of the mobile app
5. **Build final production APK**

---

## How to Run Locally

**Server:**
```bash
cd E:/Claude/legacy-odyssey
npm run dev
# Runs on http://localhost:3000
```

**Mobile app (Expo Web for testing):**
```bash
cd E:/Claude/legacy-odyssey/mobile
npx expo start --web --port 8082
# Runs on http://localhost:8082
# Use "Browse Demo" button to skip auth
```

**Serve reference files:**
```bash
cd E:/Claude/legacy-odyssey
python -m http.server 9876
# Access at http://localhost:9876/app-screen-reference.html
```

---

## Important Notes for Future Sessions

1. **The user's daughter is named Eowyn Hope Ragno** — this is the first real baby book being built
2. **The user prefers direct action** — don't ask unnecessary questions, just do the work
3. **Use the label system** — when discussing UI changes, reference elements by their page-label codes (e.g., "1-e" = email input on login)
4. **Expo Web for screenshots** — use `npx expo start --web --port 8082` with Chrome to view/screenshot the app. Set viewport to 430x932 for mobile simulation
5. **Demo mode** — click "Browse Demo" on the login screen to bypass auth for local testing
6. **The web book viewer is separate** from the mobile app — it's EJS templates served by Express at the book URL
7. **Spaceship API rate limits** — 5 req/domain/300s for availability, 300 req/user/300s for contacts. We use bulk endpoint + in-memory caching (5-min TTL) to mitigate
8. **Domain registration is async** — Spaceship returns 202 + operation ID, poll with /async-operations/{id}
9. **The .env file has all credentials** — never commit it. Use .env.example as template
10. **Railway auto-deploys** from `dragno65/legacy-odyssey` (NOT `dragno6565-ship-it`!). The `origin` remote is `dragno6565-ship-it`, the `dragno65` remote is `dragno65`. Must push to `dragno65` remote for Railway to pick it up.
11. **Spaceship wallet balance:** $50.00 as of 2/25/2026
12. **Supabase migration 002 is done** — domain_orders table exists and is verified
13. **Chrome extension disconnects frequently** — especially between different domains. Reconnect by logging in to same account in Claude Desktop and Chrome extension
14. **Windows curl SSL fix** — Always use `--ssl-no-revoke` flag with curl on this Windows machine
15. **Supabase project region:** us-west-2 (pooler: `aws-0-us-west-2.pooler.supabase.com:6543`)
