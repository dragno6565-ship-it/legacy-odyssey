// Central feature flags for Legacy Odyssey.
//
// Each flag reads an environment variable, so a feature can be toggled WITHOUT a
// code change: set the env var on Railway and redeploy/restart.
//
// REFERRALS_ENABLED — the B13 "Refer 3 friends, get a free year" program:
//   referral codes, ?ref= attribution, Stripe customer-balance credit rewards,
//   the landing-page "Share the love" section, and the account-dashboard
//   referral card. Turned OFF 2026-06-26 at Dan's request.
//
//   The code, the referral data, and migration 023_referrals are ALL preserved —
//   nothing is destroyed — so re-enabling is a one-step change:
//       set  REFERRALS_ENABLED=true  in the environment, then redeploy/restart.
//   See TODO.md → "Referral program (B13) — re-enable steps".
//
//   Default OFF: only the exact string "true" enables it.
const REFERRALS_ENABLED = process.env.REFERRALS_ENABLED === 'true';

module.exports = { REFERRALS_ENABLED };
