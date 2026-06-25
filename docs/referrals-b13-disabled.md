# Referral program (B13) — disabled & how to re-enable

**Status:** DISABLED on 2026-06-26 at Dan's request. Removed from all public surfaces
**reversibly** — no data destroyed, no migration dropped.

The whole program (the "Refer 3 friends, get a free year" offer: referral codes, `?ref=`
attribution, Stripe customer-balance credit rewards, the landing "Share the love" section,
and the account-dashboard referral card) is gated behind a single feature flag.

## Re-enable (one step)

Set the environment variable in Railway and let the service redeploy/restart:

```
REFERRALS_ENABLED=true
```

That restores everything exactly as it was — no code change required.

To disable again, remove the var or set it to anything other than `true` (default is OFF).

## How the flag is wired

| Layer | File | Behaviour when OFF |
|---|---|---|
| Flag source | `src/config/features.js` | `REFERRALS_ENABLED = process.env.REFERRALS_ENABLED === 'true'` (default false) |
| Templates | `src/server.js` middleware | sets `res.locals.referralsEnabled` for every view |
| Backend logic | `src/services/referralService.js` | every public fn no-ops: no code generation, `attributeSignup`/`recordQualifiedReferral`/`grantEarnedCredits` return early, `getReferralStats` → `null` |
| Live landing | `src/views/marketing/landing-v2-cro.ejs` | "Share the love" section + `?ref=`→`lo_ref` cookie capture wrapped in `<% if (referralsEnabled) %>` |
| Preview landing | `src/views/marketing/landing-option6.ejs` | same two wraps |
| Account dashboard | `src/views/marketing/account-dashboard.ejs` | referral card wrapped in the flag (also hidden because `getReferralStats` returns null) |

Call sites that invoke the service (`src/routes/account.js`, `src/services/stripeService.js` ×2)
need no change — they call the now-inert functions and get null/no-op results.

## Data is preserved — do NOT destroy

- Migration `supabase/migrations/023_referrals.sql` stays in place.
- The `families` columns `referral_code`, `referred_by`, `referral_qualified_count`,
  `referral_credits_granted`, `referral_counted_at` are untouched — existing codes and
  earned-referral counts survive, so re-enabling resumes where it left off.

## Out of scope (separate programs — left untouched)

- **Rewardful affiliate program** — `window.Rewardful.referral`, `src/views/marketing/affiliates.ejs`,
  `src/services/rewardfulService.js`. This is a different program and remains active.
- **Gift program** — `gift-*.ejs`.
- **Mobile app** — has no referral surface; nothing to change.
