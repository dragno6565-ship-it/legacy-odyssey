# Unit Economics — LTV basis (supersedes $29-based CAC math)

> Per Dan's 2026-06-27 correction (CLAUDE.md Unit Economics note): it's a RECURRING annual
> subscription, judge CAC vs LTV not the $29 intro price. Readable report:
> `Desktop\LO-reports\unit-economics-LTV-2026-06-27.html`. **Retention is UNPROVEN — these are
> models, not facts; plan conservative until first-renewal data exists.**

## LTV model
- Year 1 = $29 intro; each renewal = $49.99; goal = retain to age 18 (~17 renewals max).
- COGS ≈ $13/active year (domain ~$10 + payment fees ~$1.75 + infra/email). Contribution LTV =
  gross LTV − COGS = the money actually available for acquisition.

| Scenario | Annual churn | Gross LTV | Contribution LTV |
|---|---|---|---|
| Conservative | 40% | ~$104 | ~$72 |
| Moderate | 25% | ~$178 | ~$126 |
| Optimistic (hypothesis) | 12% | ~$354 | ~$257 |
| Theoretical max (~0% churn to 18) | ~0% | ~$880 | ~$645 |

**The "$880 to age 18" is a zero-churn ceiling, not the expectation** — even optimistic (12% churn)
lands ~$354 gross because churn compounds over 17 years. Honest planning range ≈ $100–$350 gross.

## Affordable CAC
| Scenario | Year-1 cash bar | Healthy (3:1) | Lifetime break-even |
|---|---|---|---|
| Conservative | ~$17 | ~$24 | ~$72 |
| Moderate | ~$17 | ~$42 | ~$126 |
| Optimistic | ~$17 | ~$86 | ~$257 |

**Policy until retention is proven: target CAC ≤ ~$40; hard ceiling ~$125/customer. Year-1 you only
collect ~$17 of margin — anything above that is financed by unproven renewals.**

## Channels re-scored vs LTV (what changed / held)
- **Affiliate 35% recurring — GO, lead with it.** Pay-as-earned (keep 65%); safe at ANY churn.
- **Sponsored content (high-fit, ~$100–200 CAC) — now worth a SMALL TEST** (≈break-even at moderate;
  builds content). Changed from "skip" under the $29 framing.
- **Meta (~$213 actual CAC) — keep OFF for now, but reframed:** it's a CAC problem, not a structural
  impossibility. Viable if CAC driven to ~$40–80 and/or retention proves moderate+. Not "never."
- **Cold direct mail (~$165 CAC) — NO-GO holds** (D-015): clears only in unproven-optimistic case +
  6yr payback on cash fronted today.

## What we need to validate (priority)
1. **First-renewal rate** (intro $29 → $49.99) — THE number; first real read is the Mar–Apr 2026 cohort, due now.
2. 2nd/3rd-year renewal rates. 3. Cohort retention curves by signup month. 4. Voluntary vs failed-card churn.
Re-run this model the moment a first-renewal number exists — it collapses the scenario spread into reality.
