# Legacy Odyssey — Google Ads
> Read `F:\legacy-odyssey\marketing\_BRIEF.md` first for full project context.

---

## Goal
Drive paid search traffic from parents actively searching for baby book and memory-keeping solutions. Google Ads is the highest-intent channel — people searching are already looking for something like this.

## Budget Starting Point
$5–10/day to start. Test for 2 weeks, optimize, then scale winners.

## Campaign Structure (Recommended)

### Campaign 1 — Baby Book (High Intent)
**Match type:** Phrase + Exact
**Keywords to test:**
- "digital baby book" / "online baby book"
- "baby book app" / "best baby book app"
- "baby memory book" / "baby milestone app"
- "baby website" / "create baby website"
- "personalized baby book"

### Campaign 2 — Domain Angle (Unique Differentiator)
**Keywords:**
- "baby domain name" / "website for baby"
- "buy domain for baby" / "baby .com domain"
- "custom baby website"

### Campaign 3 — Gift / Baby Shower
**Keywords:**
- "baby shower gift ideas" / "unique baby shower gift"
- "baby gift subscription" / "gift for new parents"
- "baby book gift"

### Negative Keywords (Add Immediately)
- free, template, printable, DIY, download, pdf, scrapbook
- pregnancy (too early), toddler (too late for angle)

## Ad Copy Direction

**Headline options:**
- "Your Baby's Own .com Domain"
- "Digital Baby Book + Real .com"
- "Claim your-childs-name.com Today"
- "Baby Books With Their Own Website"
- "$29 for Your Child's First Year"

**Description options:**
- "Every child deserves their own corner of the internet. Get a custom .com domain + beautiful digital baby book. First year just $29."
- "Not just a baby book — a real .com domain for your child. Password-protected, beautifully designed. Gift it or start your own."

## Landing Page
Send all traffic to **https://legacyodyssey.com** — the pricing section / founder offer.

## Tracking Setup Needed
- [x] Google Analytics 4 connected — GA4 property 530710619 (legacyodyssey.com) linked to Ads account 517-079-2970, May 3, 2026. Auto-tagging enabled. `purchase` event is a GA4 key event → flows automatically as conversion in Google Ads.
- [x] GA4 `purchase` event added to `/stripe/success` and `/gift/success` pages (commit `1e64f33`, May 6, 2026). `gtag('event','purchase',{transaction_id, value, currency, items})` now fires on both success pages.
- [ ] Remarketing audience (visitors who didn't convert) — will populate once traffic arrives

## Status
- [x] Account created — May 3, 2026 (account 517-079-2970, legacyodysseyapp@gmail.com)
- [x] Campaign 1 built — Baby Book (High Intent), Search only, $15/day (raised from $5 May 6), Max Clicks, $1.50 max CPC
- [x] Campaign 1 RSA live — 15 headlines / 4 descriptions, ~93.5% optimization score. In Google review May 3, 2026
- [x] Campaign 3 built — Gift / Baby Shower (Search-3), Search only, $15/day (raised from $5 May 6), Max Clicks, $1.50 max CPC. Campaign ID: 23809382073
- [x] Campaign 3 RSA live — 15 headlines / 4 descriptions, 90.1% "Good". In Google review May 3, 2026
- [x] All 4 ads enabled and Eligible — May 6, 2026 (Ad 3 and Ad 4 unpaused; Ad 4 headlines corrected)
- [ ] First conversion tracked

## Keyword Research — May 3, 2026

Ran Google Keyword Planner against all 20 planned keywords. Key findings:

### Keywords with reportable search volume
| Keyword | Avg monthly searches | Competition | CPC (low–high) |
|---|---|---|---|
| baby shower gift ideas | 10K–100K | — | $0.10–$0.67 |
| gift for new parents | 1K–10K | High | $0.30–$2.17 |
| newborn gift ideas | 1K–10K | High | $0.17–$1.04 |

From "Discover new keywords" (broader seed terms):
| Keyword | Avg monthly searches | Competition | CPC (low–high) |
|---|---|---|---|
| baby books | 10K–100K | High | $0.21–$2.26 |
| book app | 10K–100K | Low | $1.39–$7.24 |
| digital books | 10K–100K | Low | $1.00–$3.39 |
| first books | 10K–100K | Low | $1.48–$20.00 |
| book website | 1K–10K | Medium | $1.34–$16.03 |
| book baby | 1K–10K | Medium | $1.93–$8.34 |

### Keywords with no reportable volume (below threshold)
All specific long-tail terms: digital baby book, online baby book, baby book app, best baby book app, baby memory book, baby milestone app, baby milestone tracker, personalized baby book, baby domain name, website for baby, buy domain for baby, custom baby website, baby book gift, baby gift subscription, unique baby shower gift.

### What this means
1. **The "digital baby book" niche has almost no search demand yet** — nobody is searching these terms. This is a new product category without established search intent. Don't build campaigns around exact-match niche terms.
2. **The gift angle has real volume and dirt-cheap CPCs** — "baby shower gift ideas" is 10K–100K/month at $0.10–$0.67. This is the easiest entry point.
3. **The domain angle belongs in the ad, not the keyword** — "baby domain name" has no search volume. Lead with the gift/baby book angle; the .com domain is the differentiator in the headline.
4. **Broad "baby books" is high-volume but high-competition** — $0.21–$2.26 CPC, High competition. Better to bid broad on "baby books" + "baby milestones" and use specific ad copy to differentiate.

### Revised campaign priority order
1. **Campaign 3 (Gift/Baby Shower)** — Start here. Cheapest CPCs, clearest buying intent, highest volume. "baby shower gift ideas", "gift for new parents", "newborn gift ideas", "baby shower gift".
2. **Campaign 1 (Baby Book, broad)** — Bid on "baby books", "baby book", "baby milestone tracker", "baby milestone app" in broad/phrase. Let Google's matching find the intent.
3. **Campaign 2 (Domain Angle)** — De-prioritize as standalone campaign. Domain angle should appear in ad copy for Campaigns 1 & 3, not as keyword targeting.

## Work Log
<!-- Add dated notes here as work progresses -->
- **May 3, 2026** — Account set up, first Search campaign built (Baby Book), RSA ad submitted for review. Keyword Planner research completed (see above). Google Tag already installed on site (G-KW9QM24HZT, GT-M3SS3GMH) — permission issue linking via Ads UI (tag owned by different Google account); link manually via Google Tag Manager later.
- **May 3, 2026** — Campaign 3 (Gift / Baby Shower) built and submitted for review. Campaign ID 23809382073. 10 keywords (5 phrase + 5 exact: baby shower gift ideas, gift for new parents, newborn gift ideas, baby shower gift, baby book gift). RSA: 15 headlines / 4 descriptions, 90.1% "Good". $5/day, Max Clicks, $1.50 max CPC, Search only, US + Canada.
- **May 3, 2026** — Conversion tracking wired up. GA4 property (legacyodyssey.com, ID 530710619, owned by dragno6565@gmail.com) linked to Google Ads account 517-079-2970 via GA4 Admin → Google Ads Links. Link request sent from GA4 side (bypasses tag ownership issue); approved in Google Ads Data Manager. Auto-tagging ON. `purchase` confirmed as GA4 key event — will auto-import to Google Ads when it fires. Note: no stream data yet; need to confirm the Stripe post-checkout page actually fires the GA4 `purchase` event.
- **May 6, 2026** — Ad copy review session. User reviewed all 4 ads; removed disliked headlines (family-site angles, gift cards, shipping references). Ad 4 had 6 new replacement headlines added via JS DOM injection (corrective script required after wrong-index first pass). Ad 3 and Ad 4 unpaused — all 4 ads now Eligible. Both campaign budgets raised from $5/day → $15/day via inline edit (bulk panel Apply button was broken/disabled due to Angular form state bug; inline pencil edit on each campaign row worked fine). Account total budget: $30/day. GA4 `purchase` event confirmed live on `/stripe/success` and `/gift/success` (commit `1e64f33`).
- **May 9, 2026** — Landing page fix: both Gift / Baby Shower ads (Ad 1 "The Perfect Baby Shower Gift…" and Ad 2 "$29 Your Baby's First Year…") had Final URL pointing to `https://legacyodyssey.com` (homepage), which opened with a domain-search hero aimed at parents — wrong audience for gift buyers. Changed Final URL to `https://legacyodyssey.com/gift` on both ads. Both now "Pending" review. Root cause of 87 clicks / 0 conversions to date.
- **May 10, 2026** — Performance check (May 3–12 window): 160 total clicks, 2,706 impr, $187.29 spent, 0 conversions. Gift/Baby Shower campaign: 114 clicks, 7.22% CTR, $1.04 avg CPC, Eligible. Campaign #1 (Baby Book): 46 clicks, 4.08% CTR, $1.49 avg CPC, status "Bid setting limited" — $1.50 max CPC cap was ceiling-out every auction. Raised Campaign #1 max CPC cap from $1.50 → $2.50 via Campaign Settings → Bidding. Gift campaign unaffected (avg CPC $1.04, not hitting cap). Google banner flagged: "165 clicks since inception, 0 conversions."
- **May 18, 2026** — Attempted to pause both campaigns. Final stats at that point: 318 clicks, $420.45 spent, 0 conversions. Decision: price/trust friction on landing page. Note: pause action may not have fully taken effect — campaigns continued running.
- **May 27, 2026** — Status check: both campaigns showing Eligible (not paused). Updated lifetime stats: 488 clicks, $644.63 spent, May 3–26. Gift / Baby Shower: 320 clicks, 6.66% CTR, $335.57. Campaign #1: 168 clicks, 4.11% CTR, $309.05. Campaigns confirmed running, sending traffic to https://legacyodyssey.com/gift (landing page updated with testimonials + improved copy). Reactivated intentionally after /gift page improvements.
- **May 29, 2026** — Both campaigns paused (confirmed). Final lifetime stats: 549 clicks, $726.75 spent, 0 conversions, May 3–29. GA4 purchase event tracking verified correct in code — 0 conversions is genuine, not a tracking failure. Paused to stop spend while conversion problem is diagnosed. Decision: do not resume until landing page trust/conversion issues are resolved.

### Ad 4 final headlines (8 active, as of May 6 2026)
1. Their Story. Their Own .com.
2. Baby Book + Custom Domain
3. A Baby Book at Their Own .com  ← replaced "Capture Every First"
4. The Modern Digital Baby Book
5. Custom .com for Your Baby
6. Their Story at Their Own .com  ← replaced "Baby's First Year, Beautifully Told"
7. Mobile App + Website Included
8. Digital Baby Book + Real .com
