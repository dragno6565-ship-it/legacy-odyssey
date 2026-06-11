# Session: Google Ads

> Paid search on Google. Account ID **517-079-2970** (legacyodysseyapp@gmail.com, authuser=1).
> GA4 property **530710619** (Measurement ID G-LMJVX82M3Q).
> Account URL pattern: `ocid=8213694709&__c=9771052941&authuser=1` — always include this.
> Detail file: `marketing/google-ads/google-ads.md`.

**Last session:** 2026-06-10 (prior context was 2026-05-29)

---

## Scope
- Owns `marketing/google-ads/google-ads.md` — campaigns, budgets, keywords, ad copy, results, work log.
- Uses `mcp__claude-in-chrome__*` tools + computer-use to read/manage Google Ads UI (canvas-rendered tables require screenshots, not DOM queries).

---

## Current campaign state (as of 2026-05-29)

**Both campaigns: PAUSED**

| Campaign | Clicks | Spend | CTR | Status |
|---|---|---|---|---|
| Campaign 1 — Baby Book (High Intent) | 181 | $391.18 | ~4.1% | Paused |
| Campaign 3 — Gift / Baby Shower | 368 | $335.57 | ~6.7% | Paused |
| **Lifetime total** | **549** | **$726.75** | — | **Paused** |

- Period: May 3 – May 29, 2026
- Conversions: **0** (verified genuine — tracking code confirmed correct, not a tracking failure)
- Root cause of 0 conversions: cold traffic + no social proof + price/trust friction on landing page. Gift campaign also sent traffic to the wrong URL (homepage instead of /gift) for the first 6 days (May 3–9).
- Decision: do not resume until landing page trust/conversion issues are resolved.

---

## Known issues to fix before re-enabling

1. **Campaign 1 "Bid setting limited"** — $2.50 max CPC cap hits the ceiling regularly. When re-enabling, raise to $3.50 or remove the cap entirely. (Prior history: started at $1.50 → raised to $2.50 on May 10, still limited.)
2. **Landing page conversion problem** — 549 clicks, $726.75, 0 sales. Recommended actions:
   - Install **Microsoft Clarity** (free heatmaps/recordings) on `/gift` — do this first
   - Add social proof / customer count to `/gift`
   - Consider **Wynter** message testing (~$200) to test copy resonance
   - Consider a risk-reducer (money-back window or framing)
3. **$450 "Entire Childhood" gift tier** — needs confirmation it's live in Stripe before advertising it. Don't mention this tier in ads until confirmed.

---

## Landing page
- All paid traffic → **`https://legacyodyssey.com/gift`**
- Gift campaign pointed to homepage for first 6 days (fixed May 9 — both ads updated to `/gift`).

---

## Tracking setup
- GA4 `purchase` event fires on `/stripe/success` and `/gift/success` (commit `1e64f33`, May 6).
- `gtag('event','purchase',{transaction_id, value, currency, items})` confirmed in both success pages.
- Consent mode: US visitors get `ad_storage: 'granted'` before Stripe redirect; GCLID stored in `_gcl_aw` cookie and survives the redirect. EU/UK behind consent banner.
- **Older tag G-KW9QM24HZT** noted in early docs — not in use. Active tag is **G-LMJVX82M3Q** only.

---

## Technical notes (for Chrome-MCP operations)
- Google Ads table = `<canvas class="ess-table-canvas">` — DOM text queries return nothing. Use screenshots + `get_page_text` on non-canvas elements.
- Canvas renders only when tab is frontmost. Use `tabs_create_mcp` to open a new active tab.
- Pause/edit: use `find` tool to locate menu items by ref (e.g., ref for "Pause"), then click by ref — dropdown closes faster than screenshots.
- Always include `ocid=8213694709&__c=9771052941&authuser=1` in navigation URLs or wrong account loads.

---

## Open items
- [ ] Fix Campaign 1 "Bid setting limited" (raise max CPC to $3.50 or remove cap) — do when re-enabling
- [ ] Install Microsoft Clarity on `/gift` before re-enabling campaigns
- [ ] Improve `/gift` landing page conversion before re-enabling (social proof, trust signals)
- [ ] Confirm $450 "Entire Childhood" tier is live in Stripe before advertising it
- [ ] `marketing/_BRIEF.md` — replace all "sophiasmith.com" instances with `your-childs-name.com` (known stale data)
- [ ] Keep `marketing/google-ads/google-ads.md` current at end of every session

---

## Log
- **2026-06-10** — (dispatcher) File created during the cross-session reorg. Session rebuilt from prior conversation history by Google Ads session.
- **2026-05-29** — Both campaigns paused (confirmed via JS). Lifetime: 549 clicks, $726.75, 0 conversions. GA4 tracking verified correct in code. Paused to stop spend while conversion problem diagnosed. Detail file updated.
- **2026-05-27** — Status check: campaigns had NOT paused from May 18 attempt (still Eligible). Stats updated: 488 clicks, $644.63. Reactivated intentionally after /gift landing page improvements (testimonials + copy). Both campaigns re-confirmed running.
- **2026-05-18** — Attempted pause (incomplete — campaigns continued running). Stats at that point: 318 clicks, $420.45, 0 conversions. Decision: price/trust friction.
- **2026-05-10** — Performance check. 160 clicks, $187.29. Campaign 1 "Bid setting limited" — raised max CPC from $1.50 → $2.50. Gift campaign healthy at $1.04 avg CPC.
- **2026-05-09** — Fixed Final URL on both Gift campaign ads: homepage → `/gift`. Root cause of early 0 conversions.
- **2026-05-06** — Ad copy review. All 4 ads enabled (Eligible). Both campaign budgets raised $5 → $15/day. GA4 purchase event confirmed live.
- **2026-05-03** — Account created. Both campaigns built and submitted for review.

---

## Standing morning routine (trigger: Dan opens with just "good morning" or no specific task)
1. Re-read CLAUDE.md, this brief, and the top of STATUS.md - start with the latest dispatcher NIGHTLY CLOSE / agenda entry.
2. Cross-check the board against your planned first task: if another session's entry conflicts with it, blocks it, gates it on a Dan decision, or already did it, surface that instead of proceeding.
3. Reply with: (a) your first task and why it's first, (b) what you're blocked on, (c) anything on the board that affects you. Then WAIT for Dan's go before starting any work.
