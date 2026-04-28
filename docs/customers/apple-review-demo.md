# Apple Review Demo

**Status:** active (test account for Apple App Store reviewers)
**Subscription:** ACTIVE (kept active so reviewers can test the app)
**Last touched:** 2026-04-19 (password reset)

## What it is
A demo customer account for Apple's App Store reviewers. When Apple reviews a new iOS build, they need a working test account to navigate the app. This is that account. Has its own subdomain on `legacyodyssey.com`, no separate custom domain.

## Account
- **Email:** `review@legacyodyssey.com`
- **Password:** `TestPass-2026!` (last reset Apr 19 via service-role `supabase.auth.admin.updateUserById`)
- **Subdomain:** `applereview.legacyodyssey.com` (covered by the `*.legacyodyssey.com` Railway wildcard)
- **Status:** ACTIVE

## Used for
- Every iOS App Store review submission requires this account
- Currently with v1.0.6 in review (submitted Apr 25 2026)

## History
- (Earlier) — created when first iOS submissions started
- 2026-04-19 — Password reset to `TestPass-2026!`

## Related
- `infrastructure/apple-app-store.md` — the reviews this account supports
- `domains/legacyodyssey.com.md` — wildcard subdomain `applereview.legacyodyssey.com`

## Open issues / quirks
- **Don't change the email or password** without updating it in App Store Connect
- **Don't delete this account** even if it looks like a test artifact — Apple needs it
- **The user needs the password handy** every time they submit — keep it documented
