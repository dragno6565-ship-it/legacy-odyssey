# Test & Dormant Domains

**Status:** dormant / lapsing / cancelled
**Last touched:** 2026-04-28

This file consolidates short notes on test/dormant Legacy Odyssey domains that don't merit individual files.

## legacyodysseytest5.com
- **What it is:** Failed gift-test domain from the Apr 25–27 E2E session. Spaceship registered ($12.99) but Railway addCustomDomain failed at the per-service cap.
- **Status:** Auto-renew DISABLED. Will lapse Apr 25 2027. ~$25.98 split between this and legacyodysseytest6 was lost.
- **Action:** None. Let it lapse.

## legacyodysseytest6.com
- **What it is:** Same situation as legacyodysseytest5.com.
- **Status:** Auto-renew DISABLED. Will lapse Apr 25 2027.
- **Action:** None. Let it lapse.

## lotest1.com
- **What it is:** Annual subscription test, was a paying-customer domain briefly during the E2E test.
- **Status:** Subscription cancelled, family archived. Auto-renew DISABLED. Will lapse Apr 25 2027.
- **Action:** None. Could be re-used for v3 migration testing (it's already cancelled, no real customer to disrupt).
- **In Railway:** No custom domain entries (was removed when family was archived)

## legacyodysseytest8.com and legacyodysseytest9.com (added 2026-10-04)
- **What they are:** Dan's own paid test sites from the 2026-06-29/30 checkout and multi-site tests (test8 bought 2026-06-29 and re-provisioned; test9 bought about 2026-06-30). Real families under Dan's auth user, each with its own Stripe customer, a $29 charge, a live subscription that renews at $49.99, and a registered .com.
- **Status:** Dan refunded the first failed charge himself; whether the sites, subscriptions and domain auto-renew were cancelled is NOT recorded. Excluded from the hourly pulse. Not in ops/SUBSCRIPTIONS.md.
- **Action:** Dan to decide keep or cancel (subscriptions plus domain renewals). Open item in TODO.md.

## Other test data in prod (added 2026-10-04)
- Two canceled test families under the legacyotest1 Gmail test account remain (sweep offered 2026-06-11, no answer).
- The failed April `domain_orders` rows for legacyodysseytest5/6 were deleted 2026-06-11 so the "domain orders need attention" alert stopped.

## Notes
These domains exist but should NOT be re-activated. The auto-disable-renewal-on-failure code (commit `e38d4a7`) was added Apr 26 2026 specifically because of legacyodysseytest5/6.com losing money before the fix.

## Related
- `infrastructure/spaceship-registrar.md`
- `infrastructure/stripe.md` — gift flow that failed; lotest1 was annual flow
- `projects/v3-workers-rewrite.md` — lotest1 may be useful as test domain for v3 migration validation
