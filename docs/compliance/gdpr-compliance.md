# GDPR / Privacy Compliance Record

**Status:** Draft — pending legal review (task G6). Not legal advice.
**Last updated:** 2026-10-04 (legal-fixes-2026-10 branch, pending deploy)
**Owner:** DOR Industries (Legacy Odyssey)

This is the internal record backing the public Privacy Policy (`/privacy`). It documents
lawful bases, retention, data-subject-rights handling, the breach process, and processor
status, so we (and our lawyer) can show how we comply.

---

## 1. Controller & contact
- **Data controller:** DOR Industries, operating as Legacy Odyssey, Mesa, Arizona, USA.
- **Privacy contact:** help@legacyodyssey.com.
- **EU/UK representative (Art. 27):** ⬜ OPEN — not appointed. Decide whether required (we
  have no EU establishment but may "offer services to" EU residents). Defer-able for a small
  US business; revisit if EU traffic/customers grow. Flag for lawyer (G6).

## 2. What we process
- **Account:** email, login password (hashed by Supabase auth), display name.
- **Website viewing password:** stored retrievable (NOT hashed) so the owner can see/share it;
  disclosed in Privacy Policy 2.2 (C-004).
- **Your Contacts:** names/emails/phones of people the owner adds (only picked phone contacts).
- **Gifts:** buyer + recipient names/emails, note.
- **Book content:** photos, text (stories, letters, recipes, milestones), child info
  (name, birth details), family member info. *Includes children's data — see §7.*
- **Payment:** handled by Stripe; we store only limited billing records (no card numbers).
- **Domain:** chosen domain + registrant details (via Spaceship/ICANN).
- **Technical/usage:** IP, browser, device, pages/actions, timestamps, cookies (§6).

## 3. Lawful bases (GDPR Art. 6)
| Purpose | Basis |
|---|---|
| Provide the service (host book, store content, manage account) | Contract |
| Payments, subscriptions, domains | Contract |
| Service emails (welcome, reset, billing, notices) | Contract / legitimate interests |
| Tax, accounting, legal recordkeeping | Legal obligation |
| Analytics & advertising cookies/pixels | **Consent** (EU/UK; withdrawable) |
| Security / abuse prevention | Legitimate interests |

## 4. Data retention
- Account + book content: kept while the subscription is active.
- **On cancellation/non-renewal:** access continues to end of paid term; then the website goes
  offline and the domain is released. Photos and stories are retained for **up to one year** so
  the customer can reactivate and resume; if they do not reactivate within that window the
  content is permanently deleted. Customers may request **immediate deletion** at any time
  instead of waiting out the grace period (cancel + email support).
  - ✅ **Reconciled (task #37, May 25 2026):** the public policy wording (privacy policy §8,
    landing FAQ "What happens if I cancel?") now matches the live product behavior (1-year grace
    + reactivation, with an immediate-deletion opt-out). Account dashboard copy already reflected
    this. **Remaining follow-up:** there is currently NO automated purge job that deletes content
    once the one-year retention window lapses — expiry-based deletion is presently manual. A
    guarded `data_retain_until`-driven purge job should be built (and reviewed) so retention is
    enforced automatically; until then, periodically purge expired archived families by hand.
  - 🟡 **Built 2026-10-04 (C-005):** `src/jobs/dataRetentionPurge.js`, weekly, dry run unless
    `RETENTION_PURGE_ENABLED=true`; needs migration 035. `softCancelFamily` now sets
    `data_retain_until`. 9 older cancelled sites have no date and are listed for manual handling.
- Billing/transaction records: retained as required by tax/accounting law.
- Earlier deletion available on request (§5).

## 5. Data-subject rights & how we honor them
- **Access / portability:** self-serve **"Download My Data"** in the account dashboard →
  `GET /account/export` returns a JSON copy of account + full book. (Built — task G4.)
- **Rectification:** users edit most data in the app/web editor; else via support.
- **Erasure:** account deletion in the mobile app; cancellation; or email request to
  help@legacyodyssey.com. ⬜ Consider adding a self-serve web "Delete my account."
- **Withdraw consent:** "Cookie settings" link re-opens the consent banner (EU/UK).
- **Response time:** within 30 days (or as applicable law requires).
- **Complaints:** EU/UK users may complain to their local supervisory authority.

## 6. Cookies & consent (task G1 — DONE)
- **EU/UK-gated consent** via `middleware/consentRegion.js` (Cloudflare `CF-IPCountry`).
- Non-essential trackers (GA4, Meta Pixel, Pinterest, Hotjar) load **only after consent**
  for EU/UK visitors; loaded normally elsewhere. Google **Consent Mode v2** default = denied.
- Shared implementation: `partials/tracking.ejs` + `/public/js/consent.js`, included on all
  marketing pages. Strictly-necessary cookies (login, book password) are exempt.
- **Private book viewer: ZERO third-party trackers** (task G8) — removed entirely.

## 7. Children's data
- Service is for parents/guardians (adults). Accounts are adult-created; we don't knowingly
  collect data directly from children.
- Books contain children's info/photos provided by the account holder, who has authority.
- Comply with **US COPPA** (likely applies — baby product) and GDPR child-data protections.
  ⬜ Lawyer to confirm COPPA posture specifically (G6).

## 8. Security
- TLS in transit; Supabase encryption at rest + backups; password-protected, non-indexed
  book sites; least-privilege admin access; passwords hashed (Supabase auth).

## 9. Breach notification process
- On suspected breach: contain → assess scope/risk → if it risks individuals' rights,
  notify the relevant supervisory authority **within 72 hours** of becoming aware, and
  notify affected users without undue delay if high risk. Log every incident + response.
- ⬜ Designate who owns this (currently the founder) and keep an incident log.
- ✅ Full procedure + templates: `docs/compliance/breach-response-runbook.md` (C-007, 2026-10-04).

## 10. Processors / sub-processors & DPA status (task G3)
| Processor | Role | DPA |
|---|---|---|
| Stripe | Payments | DPA at stripe.com/legal/dpa (review/keep) |
| Supabase | DB + storage | Request DPA in dashboard → Legal Documents |
| Resend | Email | Auto-executed on signup; copy in Settings → Documents |
| Railway | Hosting | Incorporated via ToS |
| Cloudflare | DNS/CDN/security | Customer DPA auto-incorporated |
| Spaceship | Domains | DPA at spaceship.com/legal/data-processing-addendum |
| Google (Analytics/Ads) | Analytics/ads | Data Processing Terms accepted (Apr 3 2026) |
| Meta | Advertising | Auto via Business Tools Terms |
| Pinterest | Advertising | Auto via advertising terms |
| Hotjar/Contentsquare | Product analytics | Incorporated via Contentsquare GMSA (Hotjar merged) |
| Cloudflare Stream | Video storage/streaming | Cloudflare customer DPA |
| Approximated | Custom-domain proxy/TLS (sees visitor IP + Host) | ⬜ request/confirm DPA |
| Sentry | Server error monitoring | Sentry DPA (self-serve in settings) |
| DeepL | Machine translation (ES/HI) | ⬜ Local key is API **Free** (`:fx`). Confirm the prod key; DeepL Free terms may allow use of submitted text, so move to API Pro (DPA, no retention) before relying on it for children's stories |
| Expo | App update delivery | Expo DPA |
| Microsoft Clarity | Product analytics (when enabled) | Clarity terms / Microsoft DPA |
| Rewardful | Affiliate tracking | ⬜ confirm DPA |

Keep a copy/confirmation of each on file as compliance evidence.

## 11. Open items
- [x] #37 — reconcile cancellation/retention copy (policy now matches the 1-year-grace product). Follow-up: build a guarded auto-purge job to enforce the retention limit (currently manual).
- [ ] EU/UK Art. 27 representative — decide if required.
- [ ] COPPA posture — lawyer confirm (G6).
- [ ] Optional: self-serve web "Delete my account."
- [ ] Designate breach owner + start an incident log. (Runbook written 2026-10-04.)
- [ ] CCPA/CPRA: "Do Not Sell or Share" link + GPC honoring built 2026-10-04 (C-009), pending deploy + migration 034.
- [ ] G6 legal review, then G7 (display a "GDPR compliant" badge only after sign-off).
