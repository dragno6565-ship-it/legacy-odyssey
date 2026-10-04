# Session: Meta Ads (paid FB/IG)

> Paid advertising on Meta platforms. Organic Facebook posting is a SEPARATE session
> (`facebook.md`).

**Last session:** 2026-06-10

## Scope
- Owns `marketing/meta-ads/meta-ads.md` — Business Manager, ad account, pixel,
  campaigns, audiences, results, work log.

## Read first (beyond CLAUDE.md + STATUS.md)
- `marketing/meta-ads/meta-ads.md` — the detail file (fully rewritten 2026-06-10, now current).
- `marketing/_BRIEF.md` — shared marketing brief (pricing, target customer, brand voice).
- Memory hard rules: no real family names, canonical product description verbatim,
  no "forever"/"chapter"/"family book".

## Current state (as of 2026-06-10)

**ALL campaigns Off or Completed. Do NOT restart without Dan's explicit go.**

| Campaign | Status | Spend | Notes |
|---|---|---|---|
| Sales — New Parents | **OFF** | $1,102.41 | Best ad: Domain Hook (exclusivity angle). Real CPA >> $275. |
| Sales — Gift | **Completed** | $322.80 | Ran May 10–17. 3 Meta "conversions" likely view-through inflation. /gift page doesn't convert. |
| Sales — Website Privacy Test | **Active/Completed?** | $64.31 | Unknown origin — not created by this session. Ends June 5. 0 conversions. |
| Leads — Phoenix/Mesa | **OFF permanently** | $237.81 | Wrong objective. Never reactivate. |

**Total lifetime spend: $1,489.52**

## Conditions to restart paid (ALL required before any spend)
1. **GA4 `purchase` marked as Key Event** — coding session dependency
2. **`/gift` landing page CRO fix** — coding session dependency  
3. **Dan's explicit go**

When restarting: Name Check ad ($20/day) is the right first move — domain exclusivity angle, untested to completion, proven creative direction.

## Open items

### Blocked on Dan
- [ ] What is the "Website Privacy Test" campaign? Who created it?
- [ ] Explicit go to restart paid spend (after coding unblocks items below)

### Blocked on coding session
- [ ] GA4 `purchase` → Key Event (required before any campaign restart)
- [ ] Clarity heatmap install on landing pages
- [ ] `/gift` landing page conversion fix (currently 0 conversions from ~500+ sessions)

### Ready when unblocked
- [ ] Restart Name Check ad at $20/day (domain exclusivity — best creative direction)
- [ ] Gift campaign rerun once /gift page converts (creative is solid, page is the problem)
- [ ] Connect Instagram account to Business Manager
- [ ] Build remarketing audience (needs traffic volume first)
- [ ] Post in 5 Facebook parent groups — organic (Dan writes, not paid)
- [ ] Grandparent/gift-giver ad set targeting 45–54 when budget resumes

## Log
- **2026-06-10** — (dispatcher) File created during cross-session reorg.
- **2026-06-10** — Adopted new sessions/STATUS protocol. Read CLAUDE.md + STATUS.md.
  Checked Meta Ads Manager live (all 4 campaigns). Fully rewrote stale `meta-ads.md`
  (was May 6) with current campaign history, Gift campaign results, restart conditions.
  Surfaced unknown "Website Privacy Test" campaign to Dan. No code changes this session.

---

## Standing morning routine (trigger: Dan opens with just "good morning" or no specific task)
1. Re-read CLAUDE.md, this brief, and the top of STATUS.md - start with the latest dispatcher NIGHTLY CLOSE / agenda entry.
2. Cross-check the board against your planned first task: if another session's entry conflicts with it, blocks it, gates it on a Dan decision, or already did it, surface that instead of proceeding.
3. Reply with: (a) your first task and why it's first, (b) what you're blocked on, (c) anything on the board that affects you. Then WAIT for Dan's go before starting any work.

## Standing shutdown routine (trigger: Dan says "goodnight", "end of session", "wrap up", or similar)
1. Update this brief: bump "Last session" to today, add a log bullet for today's work, rewrite Open items so the next session knows exactly what's next (mark anything waiting on Dan as "Blocked on Dan").
2. Update your detail file(s) (marketing/<platform>/<platform>.md, TODO.md, ops/, docs/ - whatever you touched) with anything from today's conversation not yet written down.
3. Add ONE entry to the top of STATUS.md in the documented format (Did / Others should know / Blocked on Dan).
4. If you have uncommitted changes that are complete work, commit ONLY your own files with a clear message. Never commit other sessions' files. Never push a deploy unless Dan agreed to it this session.
5. End with a 3-line goodnight summary for Dan to carry to the Dispatcher: what shipped today / what's first tomorrow / what you need from Dan.
6. Do not start anything new after the trigger.


## Archive review 2026-10-04 (retired meta-ads and facebook transcripts, May 2026)
Meta paid is OFF (all campaigns paused 2026-08-05). Facts and decisions worth keeping if paid ever restarts:

**Rules (memory has the full text):** never publish or turn on an ad without Dan's explicit go; build the complete ad (creative + caption) outside the platform, show it, wait for "yes". After turning a campaign on, check ad-level toggles (old ads still ON reactivate). Paid restarts only as deliberate bursts (Sales objective, 100+ click readable sample, show-first pages, logged entry, Dan's GO). Dan likes ads with a real baby photo (feet, hands); he rejected the dark text-graphic gift ad (the one photo ad tested worst, so this is taste, not data).

**Decisions not recorded elsewhere:**
- "Domain Hook (Founder Pricing)" ad with "locked forever" copy: Dan said do NOT delete it but NEVER turn it on (2026-05-01). On 05-18 its image was rewritten and republished (ad_founder_rewrite.png: FOR NEW PARENTS, "Introductory rate: $29 your first year, then $49.99/year"; primary text "Is your baby's name still available as a .com?..."). The Name Check, Gift and "Demo Hook - See Your Family's Book" ads were never audited for the same wording.
- 05-03: Photo Hook paused ($181.68, 0 purchases); active ad set narrowed to Women 24-38 with Parents (up to 12 months), Baby shower, Pregnancy, Pampers interests; Domain Hook back on. 05-18: New Parents budget cut $50 to $20/day (Dan); the facebook session paused that campaign 05-27 for a clean Website Privacy test.
- Website Privacy Test (05-27 to 06-05, $20/day x 10 days, Dan approved after 4 rounds): image AD-new-website-privacy.png (baby gripping a parent's thumb), headline "A guided digital baby book on their own .com", CTA "Get offer", destination legacyodyssey.com/#pricing, US broad, built by DUPLICATING Domain Hook (inherits Sales objective, pixel, purchase event). Meta's $27/day upsell declined.
- 2026-05-06: Claude deployed a new landing page without the final go (commit 8ace395); Dan: "Undo every single thing you did" (reverted b7d1411). The v1 landing backup is at F:\legacy-odyssey-backups\landing-v1-backup-2026-05-05\.

**Facts:**
- BabyCenter is NOT targetable (publisher interests removed). Advantage+ Sales campaigns lock placements to automatic; manual placements need a non-Advantage+ setup.
- Funnel at about $729 spend (05-05): 19,065 impressions, 539 link clicks (2.83% CTR), 322 landing page views (40% of clickers never loaded the page; never diagnosed), about 1 Stripe purchase. Meta over-attributes about 4x; Stripe is truth.
- Meta "Start verification" / business verification banner (05-03) was never actioned: check Business Settings > Security Center before any restart.
- Whether the Meta Purchase pixel fires on /stripe/success is not verified end-to-end; META_CAPI_ACCESS_TOKEN status in Railway unverified.
- Ten photo ads adF to adO (off-repo, C:\Users\dragn\Desktop\Legacy Odyssey\Marketing Ideas\) were never picked; several use price or "most valuable asset" (now banned). Name collision: old adJ_fomo vs the live adJ_features.
- Other tags on the landing page (05-06): Pinterest tag 2613467907928, Hotjar/Contentsquare 38cdf4e1f1a56, AdSense. GA4 event-scoped custom dimension "Landing Variant" (param landing_variant) registered about 2026-05-07; the landing_variant tracking was diagnosed broken (93% "(not set)") and the fix (pass it in gtag config) looks unapplied in src/views/partials/tracking.ejs. A/B testing is premature at current traffic.

**Ads Manager how-tos:**
- Image upload cannot be automated (file_upload, JS drops, clipboard, GraphQL all failed): click Upload, Dan picks the file in the native dialog (it may open on the second monitor), Claude finishes the wizard.
- Edited live ads stay "Unpublished edits" until Publish, then "Processing". In the media picker DESELECT old images ("2 of 10 selected" trap).
- Turn OFF: Advantage+ text variations (uncheck "Apply all" AND "Tailor variations to personas"; they generated banned copy), AI image generation, AI video, Generate CTA, Enhance media text, Add overlays, Add music, Text improvements, Visual touch-ups (crops designed text; needs two clicks to stick). Translation defaults to auto-translate into 11 languages: set 0. Remove auto-added "Related media" cards. The start date silently stays in the past: reset to today; set an end date; verify the destination URL; decline the budget upsell.
- Toggles are input[role=switch]; click via JS (a direct click opens a preview pane). Fields are contenteditable.
- Reading numbers: the table is virtualized; use the "Performance and clicks" preset plus custom columns, drag the horizontal scrollbar; the default range excludes today ("Maximum" for all-time).
- Comments on boosted ads live on the ad object (Business Suite > Inbox > Instagram comments), not the organic post. Reply policy: memory feedback_negative_ad_comments.
