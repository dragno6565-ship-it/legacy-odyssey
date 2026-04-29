# Legacy Odyssey — Marketing Brief

> **Hand this to your marketing AI partner. It contains everything they need to start working with you.**
> Last updated: April 29, 2026 by the founder

---

## TL;DR

Legacy Odyssey is a premium digital baby-book SaaS. Every customer gets their own custom **.com domain** — automatically purchased and configured at signup — where their family's photos, milestones, letters, and recipes live forever as a private, password-protected website. There's a mobile app (iOS + Android, both live in stores) for content entry, and a web viewer family members can visit from anywhere. **Live and accepting real payments since March 29, 2026. ~9 paying customers. Goal: 100, then 1,000.**

The single most novel thing about us: **no competitor gives parents a real .com.** That's the moat and the marketing wedge.

---

## 1. What It Is (in plain English)

Imagine a beautifully designed website at `yourchildsname.com` — built like a luxury coffee-table book but native to the web. Sections for the birth story, monthly milestones, family tree with photos, first words and steps, holidays and birthdays, letters from parents, family recipes, and a sealed "vault" of letters that opens on the child's 18th birthday.

Parents fill it in from their phone in spare moments. Grandparents, aunts, uncles, godparents — wherever they are in the world — visit the website with a shared password and watch the family story unfold.

**It's not a social network.** Not Instagram. Not a backup. Not a print product. It's a private, owned-by-you, permanent piece of internet real estate dedicated to one child's story.

### The "Magic Moment" in the Customer Journey

When a new parent realizes "wait — my baby has their own .com domain. Like a celebrity. Like a brand. That's *real*." That moment is unique to us. Every marketing asset should drive toward it.

### Target Customers (in order of priority)

1. **First-time parents, mid-pregnancy through baby's first year** — peak nesting + memory-keeping urgency. The pitch: capture this *now* because it's already going by too fast.
2. **Grandparents-as-buyers** — gifting a year of Legacy Odyssey to expecting children/grandchildren. Baby shower gift, "welcome baby" gift. We have a dedicated `/gift` flow + `/redeem` page.
3. **Second/third-time parents** — the "I never finished the baby book for my first" demographic. Selling the *additional-domain* upsell ($12.99/yr) to existing customers with new babies.
4. **Parents of older kids** — retroactively building the book. Smaller segment but real (especially around milestone birthdays).

---

## 2. Brand Identity

### Tagline (current hero on the landing page)
**"They're not your parents' baby books."**

This is sharp. It positions against the dusty physical baby books that sit on shelves half-empty. Lean into it hard.

### Design Philosophy: "Heirloom Modern"
The brand lives in the tension between **timeless elegance** and **modern minimalism** — luxury letterpress invitation meets clean SaaS product. Warm, editorial, intimate.

**Personality:** Premium, warm, intimate, trusted, elegant. **Never** cutesy, pastel, generic, or "fun startup."

### Color System (cream/gold palette — ALL marketing should use these)

```
Background (cream):   #faf7f2   — warm off-white, feels like aged paper
Dark (near-black):    #1a1510   — ink, not harsh black
Gold (primary):       #c8a96e   — aged gold, never bright yellow
Gold Light:           #d4bb8a
Gold Dark:            #b08e4a
Text Primary:         #2c2416
Text Secondary:       #8a7e6b   — muted warm gray
Card BG:              #f0e8dc   — slightly darker cream
Border:               #e0d5c4
Error:                #c0392b
```

### Typography
- **Headlines / display:** Cormorant Garamond (serif, editorial)
- **Body / UI:** Jost (geometric sans-serif, modern)
- Both via Google Fonts: `Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600`

---

## 3. Pricing & Offers (as of Apr 29, 2026)

The pricing page on `legacyodyssey.com/#pricing` was just redesigned. Three cards, all roughly equal value-per-dollar, but the **middle card is the recommended one**:

| Card | Price | Position | Notes |
|---|---|---|---|
| **Monthly** | $4.99/mo + $5.99 one-time setup | Left on desktop | Simplified — no annual toggle |
| **⭐ Introductory Offer (recommended)** | **$29 first year**, then $49.99/yr | **Center on desktop / FIRST on mobile** | Loud "INTRODUCTORY OFFER" badge, clear winner |
| **Gift** | $29 one-time | Right | Recipient redeems and picks domain |

Everything else is identical between cards: custom .com domain, full book, mobile apps, family sharing, password-protected site, all features included. Pricing differentiation is purely about commitment + payment cadence.

### The Pricing Story (for ad copy)

- **"Less than $2.50 a month"** — frames the recurring cost emotionally
- **"Your baby gets their own .com — for $29"** — anchors against the perceived cost of a domain ($12-20) + a website builder ($30-50/mo) + the design effort
- **Cancel anytime, no contract**
- **The Introductory price is the offer** — every ad CTA goes there. The Monthly card exists as an option for the commitment-shy, not as a primary funnel.

### Refund Policy
- **Subscription:** customer cancels in their account, access continues to period_end, no refunds
- **Custom domain:** non-refundable (registration is permanent — we make this clear at checkout)
- **Gift:** refundable until redeemed; once redeemed, the recipient owns the year

---

## 4. Customer Experience (the funnel, end to end)

### Public flow (what customers see)
1. **Landing page** at legacyodyssey.com — hero, pricing, demo, blog, FAQ
2. **Pricing CTA** opens "Founder Modal" — picks a domain (.com search live against Spaceship), enters email, redirects to Stripe Checkout
3. **Stripe Checkout** — $29 charge, card details
4. **Success page** at `/stripe/success` — shows temp password, book URL, next steps
5. **Welcome email** with a magic link to set password + app store links
6. **They open the mobile app**, sign in, start filling in content
7. **Family members visit `theirdomain.com`**, enter the shared password, watch the book grow over time
8. **At month 12 or so**, they get nudged about the upcoming renewal at $49.99/yr

### Gift flow
1. Buyer goes to `/gift`, fills out buyer info + recipient name + optional message
2. $29 Stripe Checkout
3. Buyer gets email with a redemption code (`GIFT-XXXX-XXXX-XXXX`)
4. Buyer forwards to recipient OR Legacy Odyssey emails the recipient directly (if buyer provides email)
5. Recipient visits `/redeem`, enters code + their email + picks their domain
6. Their account is provisioned with 1 year prepaid; renews at $49.99/yr after that unless they cancel

### Onboarding email drip (existing, automated)

| Day | Subject | Goal |
|---|---|---|
| 1 | "[Name], your book is waiting for its first photo" | First photo upload |
| 3 | "Your family's story is waiting to be told" | Drive section completion |
| 7 | "Share your book with the people who matter" | Drive sharing (virality) |
| 13 | "[Name], your trial ends tomorrow" | Trial → paid conversion |

---

## 5. Tech Capabilities (for ad copy hooks)

What the product can actually do — useful when writing benefit-driven copy:

### The Book (web view, what family members see)
- Custom .com domain (e.g., `firstmiddlelast.com`)
- Password-protected — only people with the password can view
- Beautiful layout: full-screen welcome with hero photo, sidebar nav, scrollable chapters
- Sections: Welcome / Before They Arrived / Birth Story / Coming Home / 12 monthly milestones / Family tree / Firsts / Holidays & Celebrations / Letters / Recipes / The Vault (sealed until 18th birthday)
- Photo focal-point control (parents can frame each photo via tap-to-set)

### The App (iOS + Android — both shipping in stores)
- Real-time sync (changes show up on the website immediately)
- Photo upload directly from phone
- Reorderable cards within sections
- Multi-site support — one parent can manage several family books (e.g., one per child) under a single login
- Subscription management (cancel from inside the app)

### Privacy
- Each book is private by default
- One shared password for family/friends
- No public discovery, no algorithm, no ads on the customer's site
- Photos stored in Supabase; no third-party data brokers

### Permanence Story
- Domain renews automatically (customer pays $49.99/yr after first year)
- If customer cancels: 1-year data retention, then archived
- Unlike Instagram/Facebook: no algorithm change can hide the content; no platform shutdown can make it disappear

---

## 6. Current Business State (be honest in your strategy)

- **~9 paying customers**, mostly friends and family of the founder, plus a few real strangers
- Live since March 29, 2026 — about a month of real-money operations
- Mobile apps in both stores (iOS v1.0.6, Android v1.0.6)
- Marketing has been **mostly word-of-mouth so far** — almost no paid spend
- Stripe taking real money cleanly; no significant churn
- The founder (me) is solo
- Site copy and design are polished
- Funnel works end-to-end (validated with real $29 charges + refunds)

### What's been tried already

- Some Facebook/Pinterest organic posting (low effort)
- Two SEO blog posts published at `/blog/getting-started-with-legacy-odyssey` and `/blog/what-to-write-in-baby-book`
- Pinterest domain verification done (`b146e195f22b09a16cdab391ec6f75c1`)
- Meta Pixel + Pinterest Tag + Google Analytics 4 + Hotjar all wired on every marketing page
- A first batch of Facebook ad creatives **was generated but never activated** in Meta Ads Manager

### What I haven't tried (your menu of options)

- Paid Meta ads (creative is ready)
- Paid Pinterest ads (very natural fit for this audience)
- Paid Google Ads (search + Performance Max)
- Influencer partnerships (mom influencers / parenting podcasts)
- Email-list-building lead magnet
- Referral / affiliate program
- TikTok organic
- Retargeting funnels
- Local hospital / OB/GYN / doula partnerships
- App Store Optimization (ASO)
- Product Hunt launch
- Press / earned media

---

## 7. Existing Assets (paths + URLs you can use)

### Live URLs

| URL | Purpose |
|---|---|
| `https://legacyodyssey.com` | Marketing home + pricing |
| `https://legacyodyssey.com/gift` | Gift purchase page |
| `https://legacyodyssey.com/redeem` | Gift redemption |
| `https://legacyodyssey.com/blog` | Blog index |
| `https://legacyodyssey.com/blog/what-to-write-in-baby-book` | SEO post |
| `https://legacyodyssey.com/blog/getting-started-with-legacy-odyssey` | SEO post |
| `https://your-childs-name.com` | Public demo of an empty fresh book |
| `https://your-family-photo-album.com` | Public demo of a populated book |
| `https://apps.apple.com/app/id6760883565` | iOS App Store listing |
| `https://play.google.com/store/apps/details?id=com.legacyodyssey.app` | Android Play Store listing |

### File paths in the repo (for the developer-AI to attach or reference)

| Asset | Location |
|---|---|
| Ad creatives (multiple batches) | `ads/` (PNG files, generated for Facebook 1080x1080) |
| Brand fonts (Cormorant Garamond + Jost TTF) | `ads/fonts/` |
| Stock baby/family photos used in ads | `ads/photos/` |
| App store screenshots (6.5" iPhone) | `screenshots/screenshot1-3.png` + iPad variants |
| App icon (1024x1024) | `screenshots/app-icon-1024.png` |
| Google Play feature graphic (1024x500) | `screenshots/feature-graphic.png` |
| Landing page source (EJS template) | `src/views/marketing/landing.ejs` |
| Gift page source | `src/views/marketing/gift.ejs` |
| Redeem page source | `src/views/marketing/redeem.ejs` |
| Blog templates | `src/views/marketing/blog-*.ejs` |
| Marketing CSS | `src/public/css/marketing.css` |
| Email template source (welcome / cancel / gift / drip) | `src/services/emailService.js` |
| Design philosophy doc | `ads/design_philosophy.md` |

### Specific ready-to-use ad creatives

In `ads/` there are several batches of 1080x1080 PNG images ready for Meta/Pinterest. Filenames suggest the angle:
- `01_cyber_real_estate.png` — domain-as-real-estate angle
- `02_grandma_can_visit.png` — grandparent-anywhere angle
- `03_document_everything.png` — capture-the-moment angle
- `04_falling_in_love.png` — emotional-moment angle
- `05_every_tiny_detail.png` — detail-preservation angle
- `06_their_com_waiting.png` — domain-availability angle
- `07_tiny_feet_to_first_word.png` — milestone angle
- `08_private_corner.png` — privacy-vs-instagram angle
- `09_the_gift.png` — gift-buying angle
- `ad1_the_website.png` through `ad5_modern_family.png` — older batch with different angles
- `adA_editorial.png` / `adB_split.png` / `adC_panel.png` — three-format A/B test set
- `fb_ad_1_website.png` through `fb_ad_5_modern_family.png` — Facebook-optimized batch

The headline used in many of these is **"They're not your parents' baby books."** — that's the current hero copy and ad campaign tagline.

---

## 8. Email Marketing Infrastructure (already wired up)

- **Outbound transactional:** Resend (DKIM/SPF/DMARC verified for `legacyodyssey.com`)
- **From address:** `hello@legacyodyssey.com`
- **Inboxes (5 mailboxes via Spacemail Advanced):** `hello@`, `help@`, `dan@`, `info@`, plus one open
- **Onboarding drip:** automated job sends Day 1 / 3 / 7 / 13 emails after signup, tracked per family
- **No mass-marketing email tool yet** (no Mailchimp, ConvertKit, etc.) — this is a gap

---

## 9. Competitive Landscape

| Product | Price | Custom .com? | Mobile App | Notes |
|---|---|---|---|---|
| **Legacy Odyssey** | **$29 first year** | **Yes** | **Yes (iOS + Android)** | Premium digital + .com is unique |
| Artifact Uprising | Print only ($30-200) | No | No | Beautiful but physical only |
| Chatbooks | Print + digital ($10/mo) | No | Yes | Mostly auto-photo books |
| Baby+ / Baby+ Tracker | Free | No | Yes | Basic milestone tracking |
| 23snaps | Free | No | Yes | Private social, declining |
| Tinybeans | Free / $5/mo | No | Yes | Ad-supported; privacy concerns |
| Qeepsake | $50/yr | No | Yes | Journal app, no domain |
| Storyworth | $99/yr | No | No | For ancestors, not babies |

### Our moat

**The .com domain is the unique-in-market differentiator.** No competitor gives the parent ownership of internet real estate dedicated to their child. Lean on this. Hard. Always.

---

## 10. Hooks That Work (use these in copy)

Phrases that have resonated with early customers / in early ad testing:

- "They're not your parents' baby books." (current tagline)
- "Your baby's own .com."
- "Less than $2.50 a month."
- "Grandma can visit from anywhere in the world."
- "Not a folder in an app — a place on the internet."
- "Sealed until their 18th birthday." (about the Vault feature)
- "The most personal website on the internet."
- "Cyber real estate for the next generation."
- "They won't be this small forever."
- "Capture every milestone. Share with the world. Forever."

Phrases to **avoid**:
- "Cute" / "adorable" / pastel-baby-store language
- "Quick and easy" — undermines the premium positioning
- "Social" — we're explicitly anti-social-media
- "Photo album" — too small a frame; this is a *book/site*, not just photos
- Anything that sounds like a freemium SaaS pitch

---

## 11. Goals & Constraints

### Goals (in order)
1. **Get to 100 paying customers** — current is ~9
2. **Get to 1,000** — that's where the recurring revenue is meaningful
3. **Validate the gift channel** — baby showers / grandparent gifting could be huge
4. **Establish a content moat** — SEO articles ranking for "digital baby book" type terms
5. **Build a referral loop** — current customers inviting family-with-kids

### Constraints
- **Solo founder.** Marketing time is constrained — automate where possible.
- **Budget unknown / TBD** — confirm with founder before assuming spend.
- **Mobile app store reviews are slow** — 24-48h for any change. Plan ahead.
- **Stripe live mode** — every checkout is a real charge. Be careful with test flows.
- **No ad agency, no marketing manager** — you (the AI) are the marketing strategy team.

---

## 12. What I Want From You (the marketing AI)

You are my marketing partner. Concretely:

1. **Strategy first** — before generating creative, help me decide where to focus
2. **Channel-by-channel plans** — for each channel I commit to, give me a 2-week sprint plan
3. **Copy iteration** — short-form (ad headlines, captions) and long-form (email sequences, blog posts)
4. **Audience research** — help me think through targeting (lookalikes, interests, life stages)
5. **Creative briefs** — when I need new ad images, brief me precisely so the developer-AI can generate them
6. **A/B test design** — propose which variables to test and how to measure
7. **Honest pushback** — if my plan is bad, tell me. I prefer "this won't work because…" over "great idea!"
8. **Pacing reminders** — keep me from chasing too many channels at once. 2 channels deep beats 6 channels shallow.

When I need something **built or shipped** (landing page edits, Stripe pricing changes, ad image PNGs, new blog posts), I'll take your spec to my developer-AI in a separate Claude Code session. Don't try to "build" — strategize and brief.

---

## 13. Open Questions — please ask me before assuming

1. **Budget**: what's a realistic monthly ad spend? $0 / $100 / $500 / $1000 / unlimited?
2. **Audience access I already have**: do I have an email list anywhere? Personal social following? Any audience I can borrow?
3. **Time available per week** for marketing work specifically?
4. **Risk tolerance**: am I OK with a "spend $500 to test if Meta ads work for this product" approach, or do I want lowest-risk first?
5. **Channels I'm excited about vs reluctant about**: am I camera-shy (rules out TikTok founder-face content)? Am I comfortable doing live demos? Email-writing energy?
6. **Geographic focus**: US-only, North America, English-speaking, or global from day 1?

---

## 14. First Two Weeks — propose 3 concrete moves

After you've asked the questions in section 13, propose **exactly 3 concrete moves** for the first two weeks. Not a 12-channel master plan. Three things, prioritized, with success metrics. Then we discuss, refine, and execute.

---

**End of brief. Ready when you are.**
