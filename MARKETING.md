# Legacy Odyssey — Marketing Context

> **Load this file at the start of every marketing-focused conversation.**
> Last updated: April 25, 2026

---

## What Is Legacy Odyssey?

Legacy Odyssey is a **premium digital baby book and family memory platform**. Parents use a React Native mobile app (iOS + Android) to fill in their baby's story — milestones, photos, recipes, letters, family members, and more. The finished book lives at a **real .com domain** (e.g., `kateragno.com`) that family and friends can visit from anywhere in the world.

**The core differentiator:** Every customer gets their own exclusive `.com` domain automatically purchased and configured at checkout. This isn't a link to a page inside our app — it's *their baby's own website on the internet.*

**Status: LIVE — accepting real payments since March 29, 2026.**

---

## Brand Identity

### Name & Tagline
- **Brand name:** Legacy Odyssey
- **Current hero headline:** *"They're not your parents' baby books."*
- **Positioning:** Premium digital keepsake, not a scrapbook app

### Design Philosophy: "Heirloom Modern"
The brand lives in the tension between timeless elegance and modern minimalism. Like a luxury letterpress invitation meets a clean SaaS product — warm, editorial, intimate.

**Brand personality:** Premium, warm, intimate, trusted, elegant. Never cutesy, pastel, or generic.

### Color System
```
Background (cream):   #faf7f2   — warm off-white, feels like aged paper
Dark (near-black):    #1a1510   — ink, not harsh black
Gold (primary):       #c8a96e   — aged gold, not bright yellow
Gold Light:           #d4bb8a
Gold Dark:            #b08e4a
Text Primary:         #2c2416
Text Secondary:       #8a7e6b   — muted warm gray
Card:                 #f0e8dc   — slightly darker cream
White:                #ffffff
Error:                #c0392b
Border:               #e0d5c4
```

### Typography
- **Headlines:** Cormorant Garamond (serif, elegant, editorial)
- **Body / UI:** Jost (geometric sans-serif, modern, clean)
- Both loaded from Google Fonts: `family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600`

---

## Pricing & Offers

### Current Primary Offer
**Annual Introductory — $29 first year** (then $49.99/yr)
- Stripe Price ID: `price_1TLojVJk2GIrL5uS0oQORYsr` (base $49.99/yr)
- Coupon: `sX2lEPb6` ($20.99 off, duration: once — applies to "Legacy Odyssey Annual" product only)
- This is the offer shown in ads and on the landing page CTA
- Checkout endpoint: `POST /api/stripe/create-founder-checkout`

### Other Plans
| Plan | Price | Notes |
|------|-------|-------|
| Annual (standard) | $49.99/yr | No setup fee |
| Monthly | $4.99/mo + $5.99 setup | Higher LTV friction, lower commitment |
| Additional Domain | $12.99/yr | For multi-site families (e.g., second child) |

### Pricing Philosophy
- $29 is psychologically positioned as an impulse buy for a new parent
- The real ask is "less than $2.50/month" — use this framing
- Renewals at $49.99/yr have had zero churn so far
- The `.com` domain is *included* — this is a key value anchor (domains cost $12–$20/yr elsewhere)

---

## The Product Explained (for copywriting)

### What They Get
1. **Their baby's own .com website** — automatically purchased and configured at checkout
2. **A private, beautiful book** — structured into sections (birth story, monthly milestones, family members, letters, recipes, etc.)
3. **A mobile app** — iOS and Android, to add content from anywhere
4. **Family sharing** — share the link with grandparents, aunts, uncles, friends anywhere in the world
5. **Keepsake forever** — not tied to a social platform that can disappear or change algorithms

### Emotional Hooks (What Resonates)
- "They won't be this small forever" — urgency of the moment
- Grandparents can visit from anywhere in the world
- Unlike Instagram, it's *private* and *theirs*
- Unlike a physical baby book, it won't get lost, damaged, or stay half-empty
- The domain makes it feel real — not a folder in an app, but *a place*

### The Sections (Book Content)
- Child Info (name, birthday, birthweight, etc.)
- Before They Arrived (pregnancy story, nursery, hopes & dreams)
- Birth Story
- Coming Home
- Months 1–12 (grid of monthly milestone cards)
- Our Family (family tree with photos)
- Your Firsts (first smile, first word, first steps, etc.)
- Celebrations (birthdays, holidays)
- Letters to Your Child
- Family Recipes
- The Vault (important documents)

---

## Acquisition Channels

### 1. Facebook / Instagram Ads (Primary)
- **Status:** Creatives ready, not yet actively running paid campaigns
- **Ad account:** DOR Industries (Facebook Business Manager)
- **Ad creative files:** `E:\Claude\legacy-odyssey\ads\`
- **Design system:** All ads use Cormorant Garamond + Jost, cream/gold palette, real baby photos

**Campaign Sets:**
- `ads/ad1_the_website.png` through `ads/ad5_modern_family.png` — first campaign set (1080×1080)
- `ads/fb_ad_1_website.png` through `ads/fb_ad_5_modern_family.png` — refined Facebook set
- `ads/01_cyber_real_estate.png` through `ads/09_the_gift.png` — second concept batch
- `ads/adA_editorial.png`, `ads/adB_split.png`, `ads/adC_panel.png` — editorial-style variants

**5 Primary Facebook Ad Concepts (Campaign: "They're not your parents' baby books")**

| # | Concept | Hero Photo | CTA |
|---|---------|------------|-----|
| 1 | The Website | Close-up baby hands | "Start for $29 →" |
| 2 | The App | Mom on phone, baby in lap | "Start for $29 →" |
| 3 | Exclusive | Beautiful baby portrait, soft focus | "Start for $29 →" |
| 4 | The Domain | Baby on soft blanket, overhead | "Claim Their Domain →" |
| 5 | Modern Family | Parents laughing with newborn | "Start for $29 →" |

**Ad Copy Patterns:**
- Headline always: *"They're not your parents' baby books."*
- Body emphasizes: real .com domain, private, elegant, shareable with family
- CTA: "Start for $29 →" or "Claim Their Domain →"

**Targeting Strategy (to be refined):**
- Primary: New parents / expectant mothers, ages 25–38, US
- Interest stacking: Baby products + Photography + Scrapbooking + New parents
- Lookalike audiences from existing subscriber emails (once list is larger)

### 2. App Store (Organic Discovery)
- **iOS:** Apple App Store — "Legacy Odyssey" — category: Lifestyle
- **Android:** Google Play Store — category: Lifestyle
- **ASO keywords:** digital baby book, baby journal app, baby milestone tracker, family memory app
- **App Store title:** "Legacy Odyssey"
- **App Store subtitle/short desc:** "Beautiful Digital Baby Books & Family Photo Albums"
- **App Store description:** Emphasizes real .com domain, elegant design, private sharing, mobile-first
- **Screenshots:** `E:\Claude\legacy-odyssey\screenshots\` — screenshot1.png, screenshot2.png, screenshot3.png (6.5" iPhone format)

### 3. Landing Page (`legacyodyssey.com`)
- **Technology:** EJS template served from Express (`src/views/marketing/landing.ejs`)
- **Structure:** Hero → "See It Live" demo links → Features → Pricing → FAQ → CTA
- **CTAs:** Annual intro $29 button (primary) + "Browse Demo" secondary
- **Demo links:** Live example books (kateragno.com, eowynhoperagno.com, emmacherry.com)
- **SEO title:** "Legacy Odyssey — Beautiful Digital Baby Books & Family Photo Albums"
- **Pinterest verification:** Meta tag present (`b146e195f22b09a16cdab391ec6f75c1`)
- **Schema.org:** SoftwareApplication markup for rich results

### 4. Gift Flow
- Gift purchase page: `/gift`
- Gift redemption: `/redeem`
- Email templates exist for both sender and recipient notification
- Use case: Baby shower gift, grandparent giving to new parents

### 5. Blog (SEO Content)
- Blog index: `/blog`
- Published articles:
  - "What to Write in a Baby Book" — `/blog/what-to-write-in-a-baby-book`
- Format: EJS templates (`src/views/marketing/blog-*.ejs`)
- SEO strategy: Long-tail keyword capture ("what to write in baby book", "digital baby book ideas", etc.)

---

## Email Marketing

### Email Infrastructure

#### Outbound Transactional (Resend)
- **Provider:** Resend (Amazon SES under the hood)
- **Sending domain:** `legacyodyssey.com` (VERIFIED — DKIM, SPF, DMARC all configured)
- **From address:** `hello@legacyodyssey.com`
- **SPF for Resend:** on `send` subdomain → `v=spf1 include:amazonses.com ~all` (separate from root SPF, no conflict)
- **DKIM:** `resend._domainkey.legacyodyssey.com` TXT record in Spaceship DNS

#### Real Inboxes (Spacemail — set up Apr 24, 2026)
- **Provider:** Spacemail Advanced (Spaceship's email product)
- **Plan:** Advanced — $20.80/yr first year, renews $28.88/yr — 5 mailboxes, 15 GB each
- **Trial ends:** May 23, 2026 (then auto-charges Visa on file)
- **Login:** [mail.spacemail.com](https://mail.spacemail.com) — password: `Hunter6565!` for all
- **MX records:** `mx1.spacemail.com` + `mx2.spacemail.com` (replaced old catch-all forwarding)
- **SPF for Spacemail:** `@ v=spf1 include:spf.spacemail.com ~all` (auto-set by Spaceship)

| Mailbox | Purpose |
|---------|---------|
| `hello@legacyodyssey.com` | Primary outbound sender (Resend), general customer comms |
| `help@legacyodyssey.com` | Customer support (referenced in email footers) |
| `dan@legacyodyssey.com` | Founder / personal |
| `info@legacyodyssey.com` | General inquiries |

- **Catch-all mailbox:** Not configured yet (pending decision on which inbox to use)
- **Old forwarding:** Removed — the old Spaceship "Email Forwarding" plan that sent all @legacyodyssey.com → `legacyodysseyapp@gmail.com` was disconnected when Spacemail was set up

### Onboarding Drip Sequence
Automated via `src/jobs/onboardingEmails.js` — runs daily at 9:07 AM, tracks send status per family in Supabase `onboarding_emails_sent` JSON field.

| Day | Email | Subject Line | Goal |
|-----|-------|-------------|------|
| 1 | Welcome / First Photo | `[Name], your book is waiting for its first photo` | Get them to upload first photo |
| 3 | Explore Sections | `Your family's story is waiting to be told` | Drive section completion |
| 7 | Share Your Book | `Share your book with the people who matter` | Drive sharing behavior (virality) |
| 13 | Trial Ending | `[Name], your free trial ends tomorrow` | Convert trial → paid |

### Welcome Email
- Triggered at signup (via Stripe webhook) and manually from the admin panel
- Includes: app login password (unique per customer), book viewing password (unique per customer), book URL, app download links
- Built in `sendWelcomeEmail()` in `src/services/emailService.js`
- **Book password** is auto-generated (4 random hex chars, e.g. `a3f8`) at account creation — every customer gets a unique one, shown on the post-checkout success page so they know what to share with family immediately
- Admin "Send Welcome Email" now auto-generates a fresh temp password and resets the customer's Supabase login to it in one step — no manual password entry needed

### Transactional Emails
- Password reset
- Gift purchase confirmation (to buyer)
- Gift notification (to recipient)

---

## Current Customers (April 2026)

| Name | Domain | Email | Plan | Notes |
|------|--------|-------|------|-------|
| Kate Ragno | kateragno.com | dragno65@gmail.com | Active | Owner's wife's book |
| Eowyn Ragno | eowynhoperagno.com | dragno65@hotmail.com | Active | Owner's book |
| Lindsey Cherry | emmacherry.com | lindsey.e.cherry@gmail.com | Active | Real paying customer |
| Roy Patrick Thompson | roypatrickthompson.com | eowynkiller@gmail.com | Active | Real paying customer |
| Apple Review Demo | — | review@legacyodyssey.com | Active | App Store reviewer account |
| John (test) | — | test@test.com | — | Internal test |
| Preet Rana | — | preetrana2355@gmail.com | — | Test/prospect |

**Revenue snapshot:** ~3–4 paying customers at $29–$49.99/yr = ~$90–$200 ARR. Very early stage.

---

## App Store Presence

### iOS — Apple App Store
- **Bundle ID:** `com.legacyodyssey.app`
- **App ID:** 6760883565
- **ASC URL:** `https://appstoreconnect.apple.com/apps/6760883565`
- **Category:** Lifestyle
- **Content Rating:** 4+ (appropriate for all ages)
- **Current Live Version:** v1.0.3 (Build 13) — ✅ in production
- **In Review:** v1.0.5 (Build 15) — ⏳ Waiting for Review as of Apr 19, 2026
- **Key version history:** 1.0.1 → 1.0.3 → 1.0.4 (ready) → 1.0.5 (in review)
- **Screenshots:** 3 screenshots, 6.5" iPhone format

### Android — Google Play
- **Package:** `com.legacyodyssey.app`
- **Developer:** DOR Industries (login: `albumerapp2@gmail.com`)
- **Current Live Version:** v1.0.3 (versionCode 10) — ✅ in production
- **In Review:** v1.0.5 (versionCode 13) — ⏳ Submitted Apr 19, 2026

### App Store Listing Copy Principles
- Lead with the `.com domain` differentiator — this is the unique hook
- "Beautiful" and "elegant" appear repeatedly — position against ugly generic apps
- Emphasize privacy (not social media — *theirs*)
- Emphasize permanence (unlike a camera roll or Instagram)
- Grandparents angle: shareable worldwide

---

## Competitive Landscape

### Direct Competitors
| Product | Price | Domain? | Mobile App? | Notes |
|---------|-------|---------|-------------|-------|
| Artifact Uprising | Print only | No | No | Physical products |
| Chatbooks | Print + digital | No | Yes | More photo book |
| Baby + Me | Free | No | Yes | Basic milestone tracking |
| 23snaps | Free | No | Yes | Private social, shutting down/struggling |
| Tinybeans | Free | No | Yes | Ad-supported, privacy concerns |

### Our Differentiation
1. **Real .com domain** — no competitor does this; this is the moat
2. **Premium design** — feels like a luxury product, not a free app
3. **Structured narrative** — chapters/sections that tell a story, not just a photo dump
4. **Family-facing URL** — the book is *shareable* as a website, not locked behind an app

---

## What's Working / Key Insights

- The **$29 price point** removes friction — it's positioned as less than a coffee table book
- The **".com domain"** hook is the most novel thing in the pitch — lean into it hard
- **"They're not your parents' baby books"** positions against the dusty physical baby book that stays half-empty
- Grandparent angle ("share with grandparents anywhere in the world") resonates emotionally
- **Privacy** messaging works for parents wary of Facebook/Instagram

---

## Pending Marketing Tasks

1. **Launch Facebook ad campaigns** — creatives are done, need to activate campaigns in Facebook Ads Manager
2. **Refine ad targeting** — build lookalike audiences once email list grows
3. **App Store screenshot refresh** — current screenshots (screenshot1–3.png) may need update for v1.0.5
4. **Expand blog content** — more SEO articles targeting "digital baby book" keywords
5. **Build Pinterest presence** — domain is verified (`b146e195f22b09a16cdab391ec6f75c1`)
6. **Email list building** — waitlist form on landing page exists; need to promote it pre-launch of major features
7. **Gift campaign** — `/gift` flow exists but hasn't been promoted for baby showers
8. **App Store reviews** — solicit reviews from existing happy customers (Lindsey Cherry, Roy Thompson)
9. **Additional site upsell** — when multi-site purchase flow is built, market to existing customers with new babies/siblings

---

## Brand Assets & File Locations

| Asset | Location |
|-------|----------|
| Ad creatives (all batches) | `E:\Claude\legacy-odyssey\ads\` |
| Ad fonts (Cormorant + Jost TTF) | `E:\Claude\legacy-odyssey\ads\fonts\` |
| Baby stock photos for ads | `E:\Claude\legacy-odyssey\ads\photos\` |
| App screenshots (App Store) | `E:\Claude\legacy-odyssey\screenshots\` |
| Landing page | `E:\Claude\legacy-odyssey\src\views\marketing\landing.ejs` |
| Blog templates | `E:\Claude\legacy-odyssey\src\views\marketing\blog-*.ejs` |
| Marketing CSS | `E:\Claude\legacy-odyssey\src\public\css\marketing.css` |
| Email templates | `E:\Claude\legacy-odyssey\src\services\emailService.js` |
| Design philosophy doc | `E:\Claude\legacy-odyssey\ads\design_philosophy.md` |

---

## Key URLs

| URL | Purpose |
|-----|---------|
| `https://legacyodyssey.com` | Main landing page + web app |
| `https://legacyodyssey.com/blog` | Blog index |
| `https://legacyodyssey.com/gift` | Gift purchase page |
| `https://legacyodyssey.com/redeem` | Gift redemption |
| `https://kateragno.com` | Live demo book (most polished) |
| `https://eowynhoperagno.com` | Live demo book (owner's) |
| `https://emmacherry.com` | Live demo book (real customer) |
| `https://apps.apple.com/...` | iOS App Store listing |
| `https://play.google.com/...` | Android Play Store listing |

---

## Technical Notes for Marketing

- **Stripe Checkout** is the conversion point — all pricing CTAs on the landing page hit `/api/stripe/create-founder-checkout`
- **Domain purchase is automatic** — Spaceship API buys the `.com` at checkout (async, ~30 seconds). No user action required.
- **The book is live immediately** at `[subdomain].legacyodyssey.com` before the custom domain propagates
- **DNS propagation** takes up to 48 hours — customers are warned in the success email
- **The app is needed to fill in content** — the web book is read-only for family/friends
- **No freemium** — paid from day 1 (though there's a 2-week trial period in the Stripe subscription)
- **Book password** — every customer gets a unique 4-character hex password (e.g. `a3f8`) auto-generated at checkout. It's shown prominently on the post-checkout success page and included in the welcome email. Customers can change it anytime from the Settings screen in the app. It's what family and friends type at the `.com` domain to view the book.
- **Post-checkout success page** (`/success`) shows both: the temporary app login password and the book viewing password — so the customer has everything they need in one place immediately after paying
