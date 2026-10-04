# Filings, Formation & Compliance

> Legal, regulatory, and compliance to-do/done for Legacy Odyssey + DOR
> Industries, LLC. Dan files/signs/pays; this file is the prioritized
> checklist with deadlines + costs.
>
> Status legend: ✅ done · 🟡 in progress · 🔴 open / unverified · ⚪ deferred

Last updated: 2026-10-04 (C-001..C-009 worked in branch `legal-fixes-2026-10`, pending deploy)

---

## 1. Business entity — DOR Industries, LLC

**What we know:** "DOR Industries, LLC" is named on the Apple Team
(`Y3J2B5YA4N`) and the Google Play developer account. That's it.

**What we DO NOT have documented (all 🔴 VERIFY):**

| Item | Why it matters | Action |
|---|---|---|
| State of formation | Determines annual-report deadline + cost; determines whether registered agent is sufficient | Dan to confirm (likely AZ — owner is in Phoenix area, "phoenixvalleyappraiser.com" in personal domain list) |
| Articles of Organization (filed copy) | Proof the LLC actually exists | Pull from Secretary of State portal; save to `F:\legacy-odyssey\ops\filings\` |
| EIN (IRS letter — CP 575 or 147C) | Required for bank account, 1099s, taxes | Confirm we have it; if not, IRS EIN Assistant online (free, 10 min) |
| Operating Agreement (signed) | Single-member LLC still needs one for veil protection; banks ask for it | Draft + sign (template OK for single-member); store with formation docs |
| Registered Agent | Mandatory in formation state | Confirm who; renewal date + cost |
| State annual report | Most states require; AZ does NOT (annual report not required for LLCs) but Statement of Information equivalents exist elsewhere | Once state confirmed, add to CALENDAR.md |
| Foreign qualification | Only if operating in non-formation states. SaaS w/ remote customers usually fine on home-state alone | N/A unless physical presence elsewhere |
| Personal/Business separation | Dedicated business bank + business card; NO commingled charges. **Required for veil protection.** | 🔴 VERIFY — open business checking + business card if not done |

**Why this is P0:** the LLC label on the app stores does NOT, on its own,
shield Dan personally. Without formation docs + operating agreement +
separated banking, a plaintiff can pierce the veil and reach personal assets.
This matters more once we have real customers (we do) handling children's
data + payments (we are).

---

## 2. Taxes

| Item | Status | Notes |
|---|---|---|
| Federal income tax — pass-through to Dan's 1040 (Schedule C or partnership return) | 🔴 plan for | Single-member LLC = disregarded entity by default → Schedule C. If elected S-corp, different. Confirm filing posture with CPA before year-end. |
| State income tax | 🔴 depends on state | AZ has state income tax. |
| **Sales tax / SaaS taxability** | 🔴 OPEN | SaaS is taxable in ~20 states (varies). With paying customers nationwide, **economic nexus** can be triggered by either revenue OR transaction thresholds (often $100k or 200 transactions/yr). **Recommend: enable Stripe Tax** — it auto-calculates + tracks nexus per state for ~0.5% of taxed transactions. Far cheaper than a multistate audit. |
| 1099-NEC issuance | n/a until first contractor over $600/yr | Note in CALENDAR for January |
| Stripe 1099-K | auto from Stripe in January if thresholds met | No action needed |
| Bookkeeping system | 🔴 OPEN | Recommend Wave (free) or QuickBooks Simple Start ($30/mo). Connect to business bank + Stripe. Required to make tax season survivable. |

---

## 3. Trademark

| Item | Status | Notes |
|---|---|---|
| "Legacy Odyssey" wordmark | 🔴 not filed | USPTO TEAS Plus is **$250/class**. Use class 042 (SaaS) + maybe 009 (downloadable mobile app). ~$500 total. Worth filing **before** ad-spend ramps; once a copycat shows up it's much harder. |
| Logo / brand mark | ⚪ defer | File once visual mark is stable. |
| Domain defense | partial | Owner already owns `legacyodyssy.com` (typo defense) per INDEX.md. Add `legacyodyssey.app`, `legacyodyssey.co` to consider. |

---

## 4. Compliance — Privacy, Terms, Children's Data

**This is the largest exposure on the business right now.** The product is
live, collects payments, stores children's photos + names, and serves them
back on public-internet websites at custom domains. Without a documented,
enforced compliance posture, a single complaint can become an existential
event.

### G1–G8 — verified against live code 2026-06-04

Privacy Policy + ToS + cookie banner are LIVE and substantially complete.
Below is what I verified by reading the actual templates + routes, plus the
specific gaps that need closing.

| # | Item | Status | Where / what |
|---|---|---|---|
| G1 | Privacy Policy | ✅ LIVE | `legacyodyssey.com/privacy` → `src/views/marketing/privacy.ejs` (167 lines). Updated 2026-05-25. Names DOR Industries, Mesa AZ. Covers data collection, legal bases, retention, subject rights, COPPA + CCPA + GDPR. **Linked in marketing footer.** |
| G2 | Terms of Service | ✅ LIVE | `legacyodyssey.com/terms` → `src/views/marketing/terms.ejs` (120 lines). Updated 2026-03-21. Names DOR Industries. **Linked in marketing footer.** |
| G3 | Cookie / tracking notice | ✅ LIVE | `src/public/js/consent.js` — EU/UK consent banner via `window.LO_CONSENT_REQUIRED`; granular Accept / Decline; persisted in `localStorage` under `lo_consent`; re-openable via `window.loOpenConsent()`; gates GA4/Meta/Pinterest/Hotjar/Consent-Mode load. Loaded via `partials/tracking`. |
| G4 | DPA / subprocessor list | ✅ in policy | Inline table in privacy §6: Stripe, Supabase, Resend, Railway, Cloudflare, Spaceship, Google, Meta, Pinterest, Hotjar. **Each links to that processor's privacy policy.** |
| G5 | COPPA posture | ✅ in policy | Privacy §11 explicitly addresses children's privacy, names COPPA, requires accounts be created by adults, has a takedown path. |
| G6 | CCPA / CPRA | ✅ in policy | Privacy §9 names California users + "we do not sell your personal information." |
| G7 | GDPR badge | ⚪ deferred per TODO | Cookie banner already gates EU/UK trackers; the "badge" is decorative. |
| G8 | Account / data deletion right | ✅ documented · 🟡 enforcement gap | Privacy §9 right to erasure + §8 retention policy. App has "Delete Account" flow (SettingsScreen). **Gap:** TODO #38 says the guarded data-retention purge job is NOT YET BUILT — so the §8 promise ("kept up to one year, then permanently deleted" after cancel) is currently honored manually, not automatically. |

**Bottom line on G-series:** much better than expected. **Far less urgent than
the BUSINESS-OPS snapshot claimed.** The compliance text is substantively
real, not boilerplate.

### Verified during this audit (not previously documented in ops/)
- **Formation state CONFIRMED: Arizona (Mesa).** Privacy §1 + §13 both name
  "DOR Industries, based in Mesa, Arizona, USA." Partially resolves D-001 —
  state is no longer "VERIFY," but EIN / op agreement / banking separation
  still are.

### Drift / open gaps found during the audit (NEW work items)

| # | Item | Severity | Action |
|---|---|---|---|
| C-001 | **Subprocessor list missing Cloudflare Stream** | Medium | Video uploads (June 2026) go to Cloudflare Stream — that's a new subprocessor receiving user-uploaded video content. Add a row to privacy §6 table. |
| C-002 | **Subprocessor list missing Approximated** | Medium | Approximated proxies ALL customer-domain traffic since Apr 27 2026 — sees every book visitor's IP + Host. Add a row. |
| C-003 | **Subprocessor list missing Sentry** | Low | Sentry is integrated server-side; receives stack traces that can include PII fragments in errors. Add a row. |
| C-004 | **Book passwords claim vs reality** | Medium | Privacy §2.1 says "Password (stored only as a salted hash)" — TRUE for account passwords (Supabase Auth). TODO security items confirm **book viewing passwords are plaintext at rest** + shown to the owner in 5 places. Doc doesn't distinguish. Either (a) add one clarifying sentence that book viewing passwords (set by the owner to share with guests) are stored differently because the owner needs to retrieve them, or (b) hash book passwords (breaks the show-password UX). |
| C-005 | **Retention promise vs no automated purge** | Medium | Privacy §8 promises automated permanent deletion after 1-year post-cancellation window. TODO #38 says the guarded auto-purge is not yet built. Either build the job or soften §8 to "may be retained up to one year" + commit to honoring deletion requests on demand. |
| C-006 | **Terms last updated March 21 2026** — pre-dates Video Moments, Custom Galleries, gift codes, $29 intro pricing | Low–Medium | Refresh Terms with the current feature set + pricing language. |
| C-007 | **Breach-notification runbook** | Medium | No written internal runbook for "we got popped." Required content: detection → triage → notification timeframes (most US states 30–60 days), template letters, regulator contacts. Cheap to write; expensive to write *during* an incident. |
| C-008 | **Apps + signup: confirm checkbox** | Low | The marketing footer links Privacy + Terms, but verify signup (web + iOS + Android) has an actual "I agree to ToS + Privacy Policy" checkbox/affirmation at account creation. Pure verification task. |
| C-009 | **CCPA/CPRA — explicit "Do Not Sell or Share" link** | Low | §9 mentions California rights but there is no dedicated DNS/Share link in the footer. Required (when applicable) even if we don't sell — to take the position. |

These are the *closeable* compliance gaps. Far smaller than starting from
zero.

### C-series status: 2026-10-04 (branch `legal-fixes-2026-10`, NOT deployed yet)

All code/doc work below is committed on branch `legal-fixes-2026-10` (worktree
`F:\legacy-odyssey-legal`). It is **pending review + merge + deploy** (main auto-deploys).
Review: `git -C F:/legacy-odyssey-legal diff main...legal-fixes-2026-10 --stat`.

| # | Status | What was done | Still needs Dan |
|---|---|---|---|
| C-001 Cloudflare Stream | 🟡 pending deploy | Added to Privacy section 6 table (plus Approximated, Sentry, DeepL, Expo, Microsoft Clarity, Rewardful, Google Ads; AdSense removed: not used). Each verified against code. | Confirm/keep DPAs on file (Cloudflare, Approximated, Sentry, DeepL, Rewardful, Microsoft). |
| C-002 Approximated | 🟡 pending deploy | Same table, with "processes IP + request details of every custom-domain visit". | Check Approximated's privacy/DPA URL is right (`approximated.app/privacy-policy/` assumed). |
| C-003 Sentry | 🟡 pending deploy | Same table + section 2.8 "error reports". | None. |
| C-004 Viewing passwords | 🟡 pending deploy | Privacy new section 2.2: viewing passwords are stored retrievable (not hashed), shown to the owner in dashboard/app, may appear in site-live emails; login passwords are hashed by Supabase Auth. No hashing change made (would break show-password UX). | Optional future: hash viewing passwords + reset flow. |
| C-005 Retention purge | 🟡 pending deploy, **OFF** | New `src/jobs/dataRetentionPurge.js` (replaces the reminder cron): dry-run by default; real deletes only with `RETENTION_PURGE_ENABLED=true`; only `canceled` families with `cancelled_at` set and `data_retain_until` > 1 day past; skips admins/protected; Stripe must confirm the sub is canceled; max 5/run; deletes Stream videos, storage (recursive), R2 backups, cached translations, rows, auth user (only if no other site uses it); audit row + email report. **Bug fixed:** `softCancelFamily` never set `data_retain_until`, so dashboard/admin cancellations were never eligible; it now sets cancel date + (period end + 365 days). Dry run against prod found **9 cancelled sites with no retention date** (listed in the weekly report; job never guesses dates). | (1) Apply migration 035. (2) Read 1-2 Monday dry-run emails. (3) Decide what to do with the 9 undated sites. (4) Set `RETENTION_PURGE_ENABLED=true` on Railway. |
| C-006 Terms refresh | 🟡 pending deploy | Terms rewritten: Video Moments caps, galleries, keepsakes, gifts (codes never expire, gifted time starts at redemption, "give it myself"), comp access, multi-site, Your Contacts (magic links by email; texts from the customer's own phone), Entire Childhood Plan (18 years, one-time; price "shown at checkout", no amount hardcoded), domains (customer picks; non-refundable), 1-year retention, Spanish/Hindi machine translation (DeepL), no refunds. Effective date in `src/config/legal.js`. | **Set `TERMS_EFFECTIVE_DATE`/`PRIVACY_EFFECTIVE_DATE` in `src/config/legal.js` to the deploy date.** Optional lawyer pass. |
| C-007 Breach runbook | ✅ written | `docs/compliance/breach-response-runbook.md` (clocks: GDPR/UK 72h, AZ 45 days, CA, other states; contain steps per vendor; templates). | Read it once. Bind cyber insurance (F-006); its breach coach slots into step 5. |
| C-008 Signup agreement | 🟡 pending deploy (web) / next build (app) | Required "I agree to the Terms + Privacy" checkbox on `/start/checkout`, `/gift/checkout`, `/redeem`, `/account/add-site`, `/signup`, `/preview/founder`. Server rejects redeem / add-site / free signup without it; embedded checkouts stamp `terms_version` + `terms_accepted_at` on the Stripe PaymentIntent; add-site stamps Checkout metadata. App: accounts are created on the website (app has no in-app signup); Login + Signup screens now show Terms/Privacy links (EN/ES/HI), **needs the next app build**. Not gated: legacy hosted-checkout endpoints used only by `/preview/landing-*` pages and the unrouted `gift.ejs`. | Next `eas build --platform all` (permission rules apply). |
| C-009 Do Not Sell/Share | 🟡 pending deploy | Footer link "Do Not Sell or Share My Personal Information" on every marketing footer + checkout pages; page `/do-not-sell-or-share` sets `lo_optout` cookie + records optional email; **GPC honored** (Sec-GPC header + `navigator.globalPrivacyControl`): no Meta/Pinterest/Google Ads tags, Google ad consent stays denied + restricted_data_processing, server-side Meta CAPI skipped. Privacy section 10 (CCPA/CPRA + other states). Book viewer unchanged (still tracker-free). | Apply migration 034 (form works without it, cookie-only). |

**Also found (not fixed, flag for Dan):** customer-initiated cancel (`softCancelFamily`) sets
`subscription_status='canceled'` immediately, which shows the "suspended" page right away. The
Terms (and rule #11) promise access through the end of the paid period. Needs a product decision /
code fix (e.g. suspend at `periodEnd`).

**Email unsubscribe (Dan's item 7):** `/unsubscribe` now does GET (link) + POST (RFC 8058
one-click, which the onboarding drip already advertised but 404'd), applies to every site row
sharing the email, EJS confirmation page with resubscribe button, `/unsubscribe/verify` for
scripts. New `src/services/marketingEmail.js`; `scripts/send-*.js` now skip unsubscribed emails,
use signed per-recipient links + List-Unsubscribe/-Post headers, and refuse `--force` unless
SESSION_SECRET matches production; `copy-lint` now fails any campaign without the link.
Column `families.unsubscribed_at` already exists (migration 008).

### D-001 (LLC paperwork): questions only Dan can answer

1. Is DOR Industries, LLC registered with the **Arizona Corporation Commission**? Exact legal name and ACC entity number?
2. Formation date, and who is listed as **statutory agent** (and their address)?
3. Member-managed or manager-managed? Are you the **only member**?
4. Do you have the **EIN** confirmation letter (CP 575 or 147C)? Where is it stored?
5. Is there a **signed operating agreement**? If not, do you want a single-member template drafted?
6. Is there a **business bank account and card** in the LLC's name, and do Stripe payouts, Railway, Supabase, Apple, Google, and the domain bills all run through it?
7. Is the LLC the **contracting party** on Stripe, Apple, Google Play, and the vendor accounts (vs. you personally)?
8. Mesa/Phoenix city **business license or TPT license**: have you applied? (Feeds F-010.)
9. Federal tax status: default disregarded entity (Schedule C), or an **S-corp election** (Form 2553)? Who is the CPA?
10. Any **DBA / trade name** filing for "Legacy Odyssey" in Arizona?


### Specific risks tied to product design (from a quick scan of TODO.md):
- **Book passwords are plaintext at rest** (TODO security item). Acceptable
  documented risk OR a hashing + lost-password reset flow.
- **Photos are on a public Supabase bucket** with unguessable URLs. Documented
  in TODO as parked. Note: "unguessable" ≠ "private." If a guest leaks a URL,
  it's world-readable forever.
- **X-Robots-Tag: noindex** is shipped on customer domains (TODO ✅). Good.

### Recommendation
Stand up `ops/filings/privacy-policy.md` + `ops/filings/terms.md` as the
canonical drafts, generated against the actual data we collect (not boilerplate
copy-paste). Publish to `/privacy` + `/terms` and link from signup. Iterate
with a lawyer pass (Termly / Iubenda templates are a fine starting point if a
lawyer review is months away — ~$10–40/mo).

---

## 5. Insurance

| Coverage | Priority | Why | Rough cost |
|---|---|---|---|
| **Cyber Liability** | P0 | We hold children's photos + payment data. A breach without cyber coverage is unrecoverable. | $40–100/mo for a $1M policy at our size |
| **Tech E&O (Errors & Omissions)** | P0 | A customer's site goes down, gets defaced, photos vanish → professional liability. Often bundled with cyber. | bundled |
| **General Liability** | P1 | Standard small-biz coverage. Usually required for office leases (n/a) but useful baseline. | $30–60/mo |
| **D&O** | ⚪ defer | Only matters when we have outside investors / board. |
| **Workers Comp** | n/a | Solo, no W-2 employees. Required only if/when hiring. |

**Recommended path:** Get a quote from **Vouch**, **Embroker**, or **Founder
Shield** — all three specialize in SaaS startups and bundle Tech E&O + Cyber +
GL into one policy. 15-minute online application typical.

---

## 6. Per-jurisdiction nice-to-haves

- **AZ TPT (Transaction Privilege Tax)**: AZ taxes some digital services but
  SaaS subscriptions are generally NOT taxable in AZ (as of last guidance —
  VERIFY). Sales-tax issue is *destination*, not origin.
- **City / county business license**: AZ cities (e.g. Phoenix) often require
  a local business license even for home-based LLCs. ~$50–150/yr.

---

## Action list (Dan signs/files; this file tracks what's open)

| # | Action | Cost | Deadline |
|---|---|---|---|
| F-001 | Pull articles + EIN letter + op agreement; confirm formation state | $0 if exist | This week |
| F-002 | If any of the above missing → form properly (LegalZoom $300, or DIY ~$50 filing fee + $0 IRS EIN) | $50–300 | This week |
| F-003 | Open dedicated business checking + business card | $0 | This week |
| F-004 | Draft + publish Privacy Policy + ToS (Termly template OK as v1) | $10/mo Termly | 2 weeks |
| F-005 | Enable Stripe Tax | ~0.5% of taxed tx | 2 weeks |
| F-006 | Bind Cyber + Tech E&O via Vouch/Embroker | $50–150/mo | 4 weeks |
| F-007 | File USPTO TEAS Plus for "Legacy Odyssey" wordmark | ~$500 | 6 weeks |
| F-008 | Stand up bookkeeping (Wave free, or QBO $30/mo) | $0–30/mo | 6 weeks |
| F-009 | Verify G1–G8 status against live product; close gaps | $0 | 4 weeks |
| F-010 | Confirm AZ city/county business license posture | ~$50–150/yr if required | 8 weeks |
