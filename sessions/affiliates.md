# Session: Affiliates (Rewardful)

> The "Friends of Legacy Odyssey" affiliate program — Rewardful admin, recruitment
> strategy + assets, target-list sourcing/verification. 35% recurring forever
> commission. Code integration is DONE, live, and verified end-to-end.

**Last session:** 2026-06-10 (PM — Collabstr 100 + end-of-day wrap)

## Scope
- Owns `affiliate-assets/` (the program plan, swipe copy, banners, target lists,
  build script) and the program itself.
- Owns `docs/infrastructure/rewardful.md` (vendor doc).
- Code changes to tracking/attribution route to the CODING session. **Update
  2026-06-10 (from coding's STATUS entry):** the gift + branded-signup PaymentIntent
  flows ARE now Rewardful-attributed (Option B: referral in Stripe metadata →
  `rewardfulService.recordConversion()` from the webhook). **BUT this is
  UNVERIFIED until `REWARDFUL_API_SECRET` is confirmed in Railway env + one real
  referred gift purchase records a conversion in the Rewardful dashboard.** Run
  that verification with coding once Dan confirms the env var.

## Read first (beyond CLAUDE.md + STATUS.md)
- `docs/infrastructure/rewardful.md` — source of truth for the program admin state.
- `TODO.md` §Affiliate — current engineering state + open items.
- `affiliate-assets/affiliate-program-plan.docx` — the full 50-page strategic plan
  (Phases 1–4, playbooks, operations, target list, templates, sources). **Printable.**
- `affiliate-assets/affiliate-targets-printable.docx` — focused, ~20–30 page
  printable contact list (Top 30 + every verified target by category + dropped
  entries + discovery channels + per-profile verification checklist + **Section F:
  Collabstr 100 sub-10K US mom creators added 2026-06-10**). Built from
  `build-targets-printable.js`.
- `affiliate-assets/collabstr-mom-under10k.md` — the 100 Collabstr-sourced
  sub-10K US mom creators (raw markdown table). Compiled by scrolling
  collabstr.com/influencers logged-in browser session, captured 100 creator
  cards across 3 pages of the filtered search (Platform=Instagram, Category=Mom,
  Location=US, Followers 0–10K, Price $50–$250). Includes 19 ⭐ Tier A bullseye
  picks (faith, first-time mom, homeschool, special-needs, photographer,
  pediatric PT, sentimental storytelling, twin/multiples).
- `affiliate-assets/verified-affiliate-targets.md` — 108 web-verified targets across
  birth pros, life-event communities, sentimental writers.
- `affiliate-assets/verified-ig-500.md` — 24 Chrome-verified Instagram accounts +
  the continuation playbook for getting to 500 (~470 IG verifications remaining;
  per-profile checklist + VA hand-off ready).

## Current state (2026-06-10)

**Program is LIVE end-to-end:**
- Rewardful campaign "Friends of Legacy Odyssey" configured: 35% recurring forever,
  90-day cookie, 60-day hold, $50 min payout, last-touch attribution. Fraud controls
  maxed (self-referral auto-deactivate, search-engine traffic blocked, 13-section
  ToS with 12 prohibited tactics + Arizona governing law).
- Code integration MERGED + DEPLOYED (merge `6e6cbd6`) + verified with a real test
  affiliate. `?via=` tracking confirmed working. `/affiliates` landing page live at
  `https://legacyodyssey.com/affiliates`.
- Public signup URL: `https://legacyodyssey.getrewardful.com/signup`.

**Strategic plan is written + printable:**
- `affiliate-assets/affiliate-program-plan.docx` (77.9 KB, ~50 pages) — full plan
  to scale to 1,000 affiliates by Dec 31 2026. Phased rollout (Test Run → Founding
  100 → Recruitment Engine → Crescendo), playbooks (outreach, activation,
  in-product lever, fraud), ops (tools/budget ~$37,740, VA hiring, cadence, KPIs,
  risks), and the verified target list in Appendix A.
- Honest framing in plan: public goal 1,500 signed-up community / 250–300 active
  driving ~10% of MRR by year-end (matches Beehiiv-style operator reporting).
- Built from research synthesis (ConvertKit, Beehiiv, Notion, Teachable, Thinkific,
  Webflow, Shopify case studies) + Rewardful + Matt McWilliams operator playbooks
  + Modash, Aspire, SARAL creator-marketing benchmarks.

**Target list is verified and substantial:**
- **108 web-verified** in `verified-affiliate-targets.md` across:
  - Birth & baby professionals (31): 14 birth photographers (2025 IAPBP winners),
    5 doulas, 3 midwives, 3 IBCLCs, 3 newborn portrait, 3 maternity.
  - Life-event communities (66): NICU/preemie advocates (10), IVF/donor egg (12),
    adoption (8), surrogacy (6), twin/multiples (10–11), loss & rainbow baby (8),
    Christian motherhood (12).
  - Sentimental writers (21): literary publications (7), Substacks (10), reflective
    podcasts (4).
- **24 Chrome-verified Instagram accounts** (live follower count + niche fit +
  contact captured): @mommy.labornurse 655K, @thebabychick 428K, @badassmotherbirther 1M,
  @pedsdoctalk 1.7M, @thelabormama 231K, @midwifemarley 172K, @lactationlink 114K,
  @ourlittlepreemie 102K (⚠️ adjacent competitor — makes own NICU baby books),
  @dearnicumama 67.3K, @giulibusetto 38.3K, @projectnicu 23.3K (has Ambassadors program),
  @handtohold 6.7K (has SPONSORS highlight), @glowmaven 130K, @ebbirth 122K,
  @the.ivf.warrior 127K, @twiniversity 99.5K, @anabrandt 262K, @karrie_locher 842K,
  @expectinganything 28.5K, @laurawifler 102K, @emilyajensen 36.1K, @coffeeandcrumbs 63.4K,
  @ashleegadd 32K (⚠️ off IG till Sept — reach via ashlee.gadd@gmail.com), @ihadamiscarriage 406K.
- **Honestly dropped during verification** (don't waste outreach time on these):
  @themotherchapter (DEAD — 8 followers, 1 post), @babybookymora (private, wrong niche),
  @nesliquik (only 2.5K + fitness niche), plus the entire prior listicle-sourced
  mom-lifestyle micro tier (@livviejane, @mama.shocks, @alexiskristiana, etc.) —
  none were verified to fit a sentimental baby book.

**Top 30 prioritized DM/email list** (Appendix A.18 in the docx) — Gather Birth
Cooperative, The Nurturing Company, Anna Garvey, Dear NICU Mama, Hand to Hold,
Project NICU, @expectinganything, @ustheremingtons, @littlebitlikeheaven, @thebiggestask,
@taylorashleybates, Twiniversity, Coffee + Crumbs, Emily Jensen, Laura Wifler,
Two Truths, Motherwell, MUTHA, Mater Mea, Big Fat Positive, etc.

**Pacing reality on the 500-IG-verified goal:** Chrome verification is genuinely
90 seconds/profile. To reach 500: ~12–20 hours of focused work. Realistic path is
either (a) more sessions of personal Chrome verification (~50–80 per session) for
high-conviction targets, (b) VA assignment at $7/hr using the per-profile
checklist in `verified-ig-500.md` (full 500 ≈ $140), or (c) hybrid — founder
personally vets the categories that matter most, VA bulk-mines the rest.

**Backup:** As of 2026-06-09 evening, full snapshot of `affiliate-assets/` +
`docs/infrastructure/rewardful.md` at
`F:\legacy-odyssey\.backups\affiliate-program-2026-06-09\` (13 files).

## Open items

**🔥 Top priority for the next session — start here:**
- [ ] **DM the 19 ⭐ Tier A targets** from `affiliate-targets-printable.docx`
      Section F.1 (the Collabstr 100's bullseye picks: Karly Yonker, Mama Yulya,
      Keila Lorbes, Laura Feneley, Andersen Johnson, Tatiana Torres, Emily
      Meachen, Trinity Patterson, Claudia Herrera, Kayla Bucknell, Wendy Perez,
      Cynthia Cano, Shantel Au-Johnson, Renae Brummer, Michaela Hockenberger,
      Anne Paddock (pregnant!), Tiffany Thomas, Heather Lancaster, Michaela Kuhns,
      Ariana Raley, Mik Laughlin, Faviola Herrera, Jenni Barber). Per the
      recommendation: founder-personal DM, affiliate-first pitch (free LO
      lifetime account via `/admin/gift-codes` + 35% recurring Rewardful link),
      zero cash spend.
- [ ] **Verify gift/PaymentIntent attribution end-to-end** with coding session
      once Dan confirms `REWARDFUL_API_SECRET` is in Railway env. Coding has
      shipped Option B (referral in Stripe metadata → `recordConversion()`
      from webhook); ONE real referred gift purchase needs to flow through
      and land in the Rewardful dashboard to prove it.

**Carry-forward:**
- [ ] **Upload asset pack to Rewardful Asset Library** (needs the Rewardful UI;
      export SVG banners → PNG if required). Files in `affiliate-assets/`.
- [ ] **Add `REWARDFUL_API_SECRET` to Railway env** (Dan — from
      app.getrewardful.com/company/edit "show" link). NOW REQUIRED for the
      gift/PaymentIntent attribution that coding shipped earlier today.
- [ ] **Continue Collabstr sourcing**. Five filter variations to keep extending
      (Section F.4 of the printable docx): Category=Family & Children,
      Category=Parent, Followers 10K–30K, TikTok+Mom, raise Price max to $500
      selectively. Each variation surfaces 30–80 more candidates per run.
- [ ] **Continue Instagram non-Collabstr verification toward 500**. Best path is
      VA at ~$140 total using the checklist in `verified-ig-500.md` (Following-
      list mining of verified anchors, niche hashtag, comment-mining). Decide
      whether to fund the VA pass.
- [ ] **Decide on follow-on program features** flagged in the plan: in-product
      "Refer a parent" tile on `/account/dashboard` (Beehiiv-style; per their
      case study, biggest single MRR-from-affiliates lever), private Founding
      100 Discord, Founders Wall on `/affiliates`.

## Log

- **2026-06-10 (EOD wrap)** — Updated brief to reflect coding's correction:
  gift + branded-signup PaymentIntent flows ARE now Rewardful-attributed
  (Option B shipped today, unverified until `REWARDFUL_API_SECRET` is in
  Railway env + a real test purchase confirms). Refreshed Open items so next
  session knows to (a) start DMing the 19 Tier A Collabstr targets, (b) run
  the gift-attribution verification with coding once the secret is in. Built
  `collabstr-mom-under10k.md` (the 100 Collabstr-sourced US sub-10K mom
  creators) and rebuilt `affiliate-targets-printable.docx` to include them as
  Section F. Total verified-target count is **232**.
- **2026-06-10 (later)** — Built Collabstr 100: visited collabstr.com logged-in,
  filtered to Instagram / Mom / US / 0–10K followers / $50–$250 price, captured
  every visible creator card across 3 pages (40+40+20 = 100 entries). All
  pre-filtered, none listicle-sourced. 19 flagged as Tier-A bullseye targets for
  the affiliate program. Saved to `affiliate-assets/collabstr-mom-under10k.md`
  and rebuilt `affiliate-targets-printable.docx` to include them as Section F.
  Total verified-target count is now **232** (108 web + 24 Chrome IG + 100
  Collabstr).
- **2026-06-10** — Took the program from "infrastructure live" to "ready to recruit."
  Built `affiliate-assets/affiliate-program-plan.docx` (77.9 KB, ~50 pages,
  printable via `affiliate-assets/build-plan.js` + docx-js). Compiled
  `verified-affiliate-targets.md` (108 web-verified entries) +
  `verified-ig-500.md` (24 Chrome-verified Instagram accounts + continuation
  playbook). Dropped the previous listicle-sourced unverified mom-lifestyle micros
  after Dan called out @livviejane as a fit failure. Replaced docx Appendix A with
  the verified list. Backed everything up to
  `.backups/affiliate-program-2026-06-09/`.
- **2026-06-10** — (dispatcher) File created during the cross-session reorg.
