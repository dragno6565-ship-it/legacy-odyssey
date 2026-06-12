# ClickBank Evaluation for Legacy Odyssey

**Date:** 2026-06-11
**Author:** affiliates session (research-only pass per Dan's brief)
**Decision:** D-011 in `ops/DECISIONS.md`

## TL;DR — REJECT

ClickBank is the wrong channel for Legacy Odyssey. Three structural blockers
make it not just sub-optimal but actively incompatible with the product we
have today:

1. ClickBank operates as **merchant of record** — it collects payment first
   and pays us after settlement. Legacy Odyssey's checkout fires a Spaceship
   .com domain purchase **at the moment the customer pays**. The flows can't
   atomically reconcile.
2. ClickBank's **standard refund window is 30–90 days** (60 by default, set
   per product within that band; 364 only by special request). This directly
   conflicts with CLAUDE.md hard rule #11 — **no refunds, ever** — and would
   force partial-refund accounting on a transaction where the domain is
   already a sunk cost to us.
3. The **ClickBank Parenting & Families category is tiny and brand-toxic**:
   top gravity ~17 (vs. 200+ in health/supplements), bestsellers are
   "Pregnancy Miracle", "Baby Sleep Miracle", surveillance software, and
   marriage-rescue ebooks. There is no audience of parenting/baby creators
   we'd want to recruit from this marketplace.

Per-sale unit economics are roughly the **same as our live Rewardful
program**, so there's no margin upside that would justify accepting the
above. There's also nothing ClickBank adds that our 35% recurring forever
Rewardful program + 232 verified targets don't already cover.

The full reasoning follows.

---

## 1. Fit — does ClickBank's marketplace + affiliate base match a $29-first-year subscription baby-book SaaS for new parents?

**Answer: No.**

The ClickBank marketplace has a "Parenting & Families" category. The top 10 by
popularity rank (cbtrends.com, current 2026 data):

| Rank | Product | Type | Gravity |
|---|---|---|---|
| 1 | Children Learning Reading | Digital course, ~$24 + upsells | 16.97 |
| 2 | Pregnancy Miracle | Info-product ebook | 10.80 |
| 3 | Reading Head Start | Subscription course, $49 + $49.09/mo rebill | 11.87 |
| 4 | Baby Sleep Miracle | Info-product with video + upsells | 9.25 |
| 5 | Save My Marriage Today | Info-product + subscription | 7.00 |
| 6 | Potty Training Book | Ebook, ~$6 | 3.92 |
| 7 | Milagro Para El Embarazo (Spanish "Pregnancy Miracle") | Info-product | 4.05 |
| 8 | Talking To Toddlers | Audio + ebook combo | 1.72 |
| 9 | PCTattletale (child surveillance software) | SaaS-ish, $47 + rebill | 1.50 |
| 10 | Gravidanza Miracolosa (Italian "Pregnancy Miracle") | Info-product | 1.41 |

Reading this list directly:

- **No subscription SaaS competitor** to Legacy Odyssey appears in the top 10.
  PCTattletale (child monitoring) is the only software product, with a gravity
  of 1.5 — barely on the chart.
- **Bestseller economics are info-product-marketing era**: "Miracle", "Secret",
  "Magic formula" titles, multiple foreign-language reskins of the same
  "Pregnancy Miracle" funnel, heavy upsell flows.
- **Top gravity in this category is 16.97.** For context, ClickBank's
  bestsellers across all categories (mainly weight-loss / nutra / biz-opp) sit
  in the 200–500+ gravity range. Parenting is a marginal corner of the
  marketplace, not a real cohort.
- **Brand adjacency is bad**: "Pregnancy Miracle" and "Baby Sleep Miracle"
  have long-running public criticism as low-quality information products with
  aggressive marketing. Legacy Odyssey — a sentimental, photos-of-real-children
  product — does not want to share marketplace shelf-space or affiliate
  audience with them.
- **The ClickBank affiliate base** is concentrated in info-product / nutra /
  biz-opp creators. They run paid traffic, banner farms, email blasts, and
  bait-headline funnels. That's a wrong-niche fit even before the brand-safety
  issue.

Compare to Rewardful's affiliate landscape: parenting creators sign up
program-by-program. There's no analogous "marketplace" to mine — but we don't
need one, because the recruitment problem on a sentimental-keepsake product
isn't "find more affiliates," it's "reach the *right* parenting creators,"
which we're already solving with the 232 verified targets.

---

## 2. Economics — full fee stack vs. Rewardful

ClickBank fees (verified June 2026):

- **One-time activation fee:** $49.95 (first product). $29.95 per additional
  ClickBank seller account.
- **Per-sale fee:** $1.00 fixed + 7.5% of customer purchase price. ClickBank
  "purchases" the product from the seller at 92.5% × price minus $1.
- **Per-rebill fee (recurring):** 92.5% × price minus $1 on rebills $40 and
  above (same as initial). 90.1% on rebills under $40.
- **Affiliate commission:** vendor-set percentage of net sale price (after
  ClickBank takes their cut), not gross.
- **Payout processing:** $5.00 per check, $45.00 per wire (raised October
  2024 from $2.50 and $35.00).
- **Monthly fees:** none.

### Per-sale modeling

**First-year $29 sale via ClickBank, 35% affiliate:**
- Customer pays: $29.00
- ClickBank takes: $1.00 + 7.5% × $29 = **$3.175**
- ClickBank pays us (net sale price): $25.825
- Affiliate commission (35% × $25.825): $9.04
- Net to LO before product costs: **$16.79**
- Spaceship .com cost: −~$11
- **True LO net: ~$5.79**

**First-year $29 sale via Rewardful + Stripe, 35% affiliate:**
- Customer pays: $29.00
- Stripe fee: 2.9% + $0.30 = $1.14
- Stripe net to LO: $27.86
- Affiliate commission (35% × $29): $10.15
- Rewardful Starter 9% fee on commission: $0.91
- Net to LO before product costs: **$16.80**
- Spaceship .com cost: −~$11
- **True LO net: ~$5.80**

→ **Per-sale net to LO is identical to within a penny.** ClickBank does not
beat Rewardful on unit economics.

**Renewal-year $49.99 sale, 35% affiliate:**
- ClickBank: $49.99 − ($1 + 7.5% × $49.99 = $4.75) = $45.24 net sale; 35%
  affiliate = $15.83; LO net **$29.41**.
- Rewardful: $49.99 − $1.75 Stripe − $17.50 (35%) − $1.575 (Rewardful 9% of
  commission) = LO net **$29.16**.

→ Renewals are again within 1% of each other. Both paths net ~$29 per active
customer per renewal year before the ~$11 Spaceship cost.

### Fixed-cost comparison

| Cost | ClickBank | Rewardful Starter |
|---|---|---|
| One-time setup | $49.95 | $0 |
| Recurring platform fee | $0 | $49/mo = $588/yr |
| Per-payout fee | $5/check, $45/wire | $0 |
| Per-commission fee | 0 (affiliate-percentage is the commission) | 9% of commission paid |

At low volume (under ~100 sales/yr), ClickBank's fixed-cost profile is
**cheaper** than Rewardful. At any meaningful volume, Rewardful's flat $49/mo
is cheaper than ClickBank's per-payout overhead.

But the fixed-cost delta is **not the decisive factor** — it's the structural
issues in §3.

---

## 3. Structural conflicts — each checked against our setup

### 3.1 Merchant of record vs. our checkout

**Blocker.**

ClickBank's model: ClickBank is the merchant of record. The customer card is
charged by ClickBank, the funds settle into ClickBank's account, then
ClickBank pays the vendor on a periodic payout schedule (weekly/biweekly via
check or direct deposit, after a clearing period).

Legacy Odyssey's checkout: customer's Stripe payment triggers a
**synchronous Spaceship API call to register `theirchildsname.com`**. The
domain registration costs us ~$11 in real money, immediately, at the moment of
the payment.

The two flows cannot atomically reconcile:
- If we wait for ClickBank to pay us before buying the domain, the customer
  has paid for a baby book they can't see (their child's URL isn't claimed
  yet) — UX death.
- If we buy the domain at the moment of customer payment, we're floating
  ClickBank's settlement cycle with our own cash, AND we're now buying
  domains for customers whose payments could be refunded any time in the
  next 30–60 days (see §3.2 below).
- Re-architecting checkout to accept ClickBank's flow (asynchronous domain
  provisioning, customer waits hours/days for the URL to go live) would
  destroy our differentiator. The whole pitch is "your baby gets their .com
  domain at signup."

**There is no clean way to integrate ClickBank as MoR with our existing
domain-at-checkout flow.** It would require either a fundamental product
rework (delayed domain provisioning) or operating two parallel checkout
flows (Stripe direct for non-affiliate, ClickBank for affiliate) — the latter
adds complexity for zero gain over Rewardful.

### 3.2 60-day refund vs. our hard NO-REFUNDS policy

**Blocker.**

ClickBank's refund policy (verified June 2026):
- **Default 60-day** money-back guarantee on every product.
- Vendors can adjust within **30–90 days** at product setup. The floor is 30.
- Up to **364 days** is available only on special request to ClickBank
  support.
- For recurring products: customers can request refund within 60 days of
  initial purchase; ClickBank may refund **one or more payments** at their
  discretion.
- ClickBank reserves the right to refund at their discretion regardless of
  vendor preference. This is not negotiable in the standard contract.

Legacy Odyssey (CLAUDE.md hard rule #11):
> NO REFUNDS — ever. Do not advertise, offer, or imply refunds anywhere.
> Cancellation = stop future charges, keep access through the paid period.
> Domains non-refundable.

The shortest ClickBank window (30 days) still violates rule #11. The bigger
problem:

- **Domains are non-refundable.** When a ClickBank customer refunds inside 30
  days, ClickBank claws back the $29. The Spaceship .com is already gone
  — that ~$11 is a write-off to us. At any meaningful refund rate (industry
  baseline for info-products on ClickBank is **5–15%**), we'd be paying
  $0.50–$1.50 in domain write-offs per gross sale, on top of an affiliate
  program we already pay 35% on. Margins go from "tight" to "negative."
- ClickBank also claws back affiliate commission on refunds, so we don't pay
  the affiliate. But the **domain loss is ours alone**.
- We'd have to advertise the refund policy publicly (ClickBank disclosure
  requirement), directly contradicting rule #11's "do not advertise, offer,
  or imply refunds anywhere."

This isn't a misunderstanding to resolve — it's a fundamental incompatibility
between ClickBank's consumer-protection model and our product economics.

### 3.3 Recurring / rebill support for $49.99/yr renewals

**Workable mechanically, but with two real costs.**

ClickBank supports recurring billing across daily, weekly, biweekly,
monthly, quarterly, semi-annual, and annual intervals. Affiliates receive
commission on each rebill (not just the first sale). Good fit for our
$29-first-year → $49.99/yr model in principle.

But:

- **Annual billing is admin-controlled.** It requires special approval from
  ClickBank during product setup, not self-serve.
- **Once approved, recurring products cannot be changed.** Price, frequency,
  rebill window — locked. If we later want to change $49.99 to $44.99, or
  shift from annual to monthly, we have to create a new product and migrate
  customers manually.
- **ClickBank manages customer billing.** We lose the direct billing
  relationship with our customer. Today, Stripe is our system of record for
  who's an active subscriber. Under ClickBank, ClickBank is the system of
  record; we get reports. Cancellations, refunds, payment-method updates all
  happen in ClickBank's system, not ours. Our `/admin` panel loses fidelity.
- **Customer support gets bifurcated.** Refund-related disputes go to
  ClickBank's support team, not ours. Brand-experience risk on a sentimental
  product.

Not a blocker on its own. Combined with §3.1 and §3.2, it's a third strike.

### 3.4 Brand safety — ClickBank promo tactics vs. our affiliate ToS

**High concern.**

Our affiliate ToS (live on Rewardful, 2026-06-08) bans 12 specific tactics
including coupon sites, brand-PPC, cookie stuffing, incentivized signups,
spam, MLM platforms, stolen payment methods, and marketing to minors. We
wrote those bans because they're the dominant promotional patterns of
mass-marketplace affiliate networks.

ClickBank's affiliate community has historically been the **source ecosystem
for several of those patterns**:

- Paid-traffic arbitrage with bait headlines is the dominant promo style for
  ClickBank info-products.
- Email blasts to scraped or rented lists (technically against ClickBank's
  ToS too, but loosely enforced).
- Coupon and review sites that rank for brand terms.
- Banner farms on low-quality content sites.

For a product whose audience is **new parents who upload photos of their
real children**, brand-safety risk from this affiliate community is
disproportionate. One ClickBank affiliate running aggressive paid-traffic
ads with our brand name + AI-generated baby imagery would do real
reputational damage.

We could write strict promo rules into our ClickBank vendor profile, but
enforcement is between us and the affiliate — not ClickBank — and the
marketplace dynamics (affiliates browse, pick offers, run paid traffic
within hours) don't give us the vetting time our current per-application
review affords.

---

## 4. Recommendation

### Verdict: REJECT.

Not park-with-conditions. Not pursue-with-modifications. Reject.

### Why

The structural conflicts in §3 are not negotiable. Even if we could solve
the merchant-of-record / domain-provisioning problem (we can't without
breaking the product pitch), we still have:

- A floor of 30-day refunds vs. our hard no-refund policy.
- A marketplace shelf-space adjacent to "Pregnancy Miracle" and "Baby Sleep
  Miracle."
- A wrong-niche affiliate base (info-product / nutra / biz-opp).
- Per-sale economics that match Rewardful, not beat them.

### What ClickBank would NOT add

Nothing that Rewardful + our 232 verified targets don't already provide.
ClickBank's value-prop is its affiliate marketplace; for parenting/baby
SaaS, that marketplace is empty of the right cohort.

### What might be revisited later

A re-evaluation could be triggered by either:

- ClickBank introducing a **non-MoR / vendor-billed mode** where they only
  handle the affiliate-tracking layer (effectively a Rewardful clone). They
  don't offer this today.
- A future Legacy Odyssey product variant **without the at-signup domain
  purchase** (e.g., a downloadable PDF baby-book template, or an info-product
  spin-off). That product class fits ClickBank's marketplace, and the
  refund issue stops mattering. Not a near-term roadmap item.

Both are hypothetical. Neither changes the current recommendation.

---

## Sources

- ClickBank Support — [What are ClickBank's fees?](https://support.clickbank.com/en/articles/10535137-what-are-clickbank-s-fees)
- ClickBank Support — [Return and Subscription Cancellation Policy](https://support.clickbank.com/en/articles/10535349-clickbank-s-return-and-subscription-cancellation-policy)
- ClickBank Support — [Flexible Refunds (30–90 day vendor band; 364 by request)](https://support.clickbank.com/en/articles/10535251-flexible-refunds)
- ClickBank Support — [Selling Recurring Products](https://support.clickbank.com/en/articles/10535175-selling-recurring-products)
- ClickBank Support — [Product categories and subcategories](https://support.clickbank.com/en/articles/10535276-what-categories-and-subcategories-are-clickbank-products-sorted-into)
- cbtrends.com — [Parenting & Families category, sorted by popularity rank](https://www.cbtrends.com/browse-clickbank-marketplace/-1/133/Parenting+&+Families/1/popularity_rank/)
- ClickBank — [Top Affiliate Marketing Programs (current marketplace trends, 2026)](https://www.clickbank.com/blog/clickbank-top-offers/)
- ClickBank — [We Changed Our Refund Policy](https://www.clickbank.com/blog/clickbank-refund-policy/)

Internal references:
- `docs/infrastructure/rewardful.md` — live program for comparison
- `affiliate-assets/affiliate-program-plan.docx` — full plan + 232 verified targets
- `CLAUDE.md` rule #11 — no refunds
- `ops/DECISIONS.md` D-011 — the question this evaluation answers
