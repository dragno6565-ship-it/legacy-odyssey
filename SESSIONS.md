# Legacy Odyssey — Session History

A scrollable, dated log of long working sessions. Newest first. Append a new section at the top whenever a session is substantial enough to remember.

---

## April 25–26, 2026 — Health checks, multi-site cancel, gift E2E, Railway cap

**Outcome:** Annual + Gift purchase flows tested with real money end-to-end and confirmed working. Customer reactivation flow built. Major hardening of the domain pipeline. Hit Railway's per-service custom-domain cap (20 on Pro), confirmed with Railway support — must move custom-domain handling to Cloudflare for SaaS to scale past ~10 customers. Monthly E2E test still TODO.

### Day 1 — Apr 25 morning/afternoon (infrastructure overhaul)

| Commit | Subject |
|---|---|
| `672743b` | Fix hardcoded book_password security issue across the codebase |
| `3e4cec9` | Overhaul email UX: self-serve password, real app links, remove trial emails |
| `8e3a218` | Fix domain DNS setup: Spaceship API endpoint moved (`/dns-records` → `/dns/records/{domain}`) |
| `cb98428` | Set Railway verification TXT record alongside www CNAME |
| `514eff8` | Add daily domain-order alert cron |
| `7ee9375` | Default admin notifications to legacyodysseyapp@gmail.com |
| `c392d14` | Admin: split account deletion into **Cancel & Archive** vs **Permanently Delete** |
| `e857d63` | Stripe webhook: don't overwrite admin-archived families |
| `806ee0b` | Admin dashboard: archived tab + sortable columns |
| `6cdb5f4` | Send cancellation confirmation email on Archive and Permanent Delete |
| `33ce1d9` | Customer-initiated soft cancel + multi-site Primary rules |
| `42b1467` | Retire Family Album product — Baby Book only |
| `cb04629` | mobile v1.0.6: Cancel Subscription flow + Family Album removal |
| `e5cdf9b` | Bare-domain support: configure apex + www on every customer domain (Fastly anycast 151.101.2.15 for apex, restored 4 broken customer sites) |
| `cc7faef` | Password page label: child name from book, not domain; "Site" not "Family" |
| `7ec137c` | Add unsubscribe support to drip-campaign emails (HMAC token) |
| `b19c568` | Add Getting Started blog post + link from welcome email |
| `8bdb307` | Block search engine indexing of customer books + fix /download 404 + blog edits |
| `632eab2` | Daily off-site photo backup to Cloudflare R2 |
| `6d59952` | Fix contact form delivery + add nav/footer to /download page |
| `3fda094` | Set `replyTo: legacyodysseyapp@gmail.com` on all customer emails (Spacemail forwarding unreliable) |
| `fadcb7f` | Site-live notification — detect when customer's site is reachable + email |
| `b644dd2` | **Health check system** + `/admin/health` page + BLOCKS.md doc (8 blocks, 40+ checks) |
| `3e2866c` | Health check Phase 2 — Block 7 cron tracking + freshness |

**Apple/Google submissions:** v1.0.6 mobile (build 16 / versionCode 14) submitted to both stores Apr 25 ~6 PM PDT.

### Day 2 — Apr 25 evening / Apr 26 (E2E testing on phone with real money)

#### Annual purchase flow (test → cancelled → refunded)
| Commit | Subject |
|---|---|
| `eab5a23` | Founder modal: Check button hidden on mobile in domain step |
| `5837950` | Show/hide toggle on set-password page; welcome email mentions Settings → Book Password |
| `131b5ec` | Make birth-story perspective headlines editable (mom_title / dad_title columns; migration 011) |

User completed annual purchase for `lotest1.com`. Found bug: apex DNS not serving (only www). Diagnosed root cause = Railway plan cap blocking apex add silently in `processDomainOrder`. User cancelled + refunded. Repair script written + ran for existing broken customer apexes (Eowyn, Roy, Lindsey/Emma).

| Commit | Subject |
|---|---|
| `36f2538` | Domain pipeline hardening: separate try/catch for www vs apex; setupDns detects Spaceship URL Redirect product-group records; Block 2 health check uses stricter `isFullyServing` (apex AND www both required) |

**Discovered:** Spaceship's "URL Redirect" connection auto-injects `group: product` apex A records pointing at parking IPs. Cannot be removed via API — only via Domain Manager → URL redirect → Remove connection. Documented in BLOCKS.md.

**Discovered:** Spaceship's PUT `/dns/records` is non-destructive (appends, doesn't replace). Need DELETE-then-PUT. Repair scripts at `scripts/repair-apex-dns.js` + `scripts/delete-stale-a-records.js` + `scripts/check-spaceship-dns.js` handle this.

#### Gift purchase flow (test → cancelled → refunded → re-test → success)

| Commit | Subject |
|---|---|
| `e2bf14e` → `d5b658e` | Gift price corrected to $29 (display + Stripe `unit_amount`) |
| `726c49c` | Disclose post-gift-year auto-renewal on /gift; fixed bug where post-trial sub used $4.99/mo instead of $49.99/yr |
| `a636b3b` | `/redeem` got founder-modal-style domain search (Check button + alternatives + auto `.com` append). Added Gift tier as third side-by-side card on pricing section |
| `00a7e40` | Gift redeem reuses existing Supabase auth user when email already exists; always returns JSON errors |
| `e2902ed` | DB migration 012: drop strict UNIQUE on `families.auth_user_id` and `families.email`; replace with partial unique indexes WHERE `archived_at IS NULL`. **Already applied to Supabase.** |
| `80d4c91` | Redeem success points "Sign in" to `/account` (was `/login` → 404), prompts to set password first |
| `bbfc46e` | Surface actual Supabase error instead of generic "Failed to update password" |
| `a816441` | Set-password success page offers web sign-in alongside app store buttons |
| `82330d4` | Set-password: Legacy Odyssey header now links to home |
| `58661e8` | **Webhook race fix:** cancellation triggered Stripe `customer.subscription.updated` with status='trialing' + cancel_at_period_end=true; old code treated archived+trialing as a reactivation and fired welcome-back email. Now skips reactivation if `cancel_at_period_end=true` OR family was archived <60s ago |
| `681d4da` | `findByAuthUserId` / `findByEmail` prefer non-archived families. Was returning OLDEST family (often cancelled) for re-signed customers, so they saw their dead account on dashboard |
| `1a65934` | **Customer-initiated reactivation flow.** Cancelled families see "Reactivate — $49.99/year" card on /account/dashboard. Stripe Checkout → webhook un-archives + restores Spaceship auto-renew + welcome-back email. Book content preserved. Added show-password toggle on /account login |
| `9ad0150` | **Removed real family names** from all placeholders (admin add-customer, family-detail, account-book-child-info, account-book-family-member, gift recipient name). Memory note `feedback_no_real_names.md` enforces |
| `e38d4a7` | Auto-disable Spaceship auto-renew when domain order fails post-registration. Stops orphan domains auto-billing |

#### Health check report (delivered ~7 PM PDT Apr 26)
- **2 fail:** Customer Domains — `roypatrickthompson.com` apex `ERR_TLS_CERT_ALTNAME_INVALID` (Let's Encrypt mid-issuance), `jeffpresutti.com` same. Plus 2 failed domain orders for `legacyodysseytest5/6.com` (Spaceship registered, Railway cap blocked www add → orchestrator threw).
- **1 warn:** Zombie Railway service still alive (expected).

#### Railway support response (Apr 26 evening)
> "The Pro plan default is 20 custom domains per service, not 100. That matches the cap you're hitting… we would not be able to accommodate 100 domains, you would need to manage your domains via Cloudflare or similar going forward."

Railway will not raise the cap. Public Central Station thread mentioned a temporary bump to 30 from another employee, which we can still ask for as a stopgap.

**Conclusion:** Cloudflare for SaaS migration is required to scale past ~10 customers. Railway stays as the Express server host. Only custom-domain registration moves to Cloudflare.

### Customer state at session end

| Family | Apex | www | Notes |
|---|---|---|---|
| Eowyn (owner) | ✅ | ✅ | Repaired (was on stale GitHub Pages IPs) |
| Kate | ✅ | ✅ | Working; Railway UI shows misleading "Waiting for DNS update" |
| Roy | ⏳ | ✅ | URL Redirect removed; apex in CA challenge |
| Lindsey/Emma | ✅ | ✅ | Apex added + serving |
| Jeff | ⏳ | ✅ | Same Railway UI lag as Kate |
| Reese | ✅ | ✅ | (Welcome email pending — held for blog post, blog now live) |
| Lachlan | ✅ | ✅ | (Same — welcome email pending) |
| family-photo-album | ⏳ | ✅ | Demo site, apex skipped per user |
| `lotest1.com` | — | — | Annual test, cancelled + auto-renew off |
| `legacyodysseytest5/6.com` | — | — | Failed gift tests; $25.98 lost to Spaceship; auto-renew DISABLED |

### Where we left off (Apr 26 ~9:45 PM PDT)

1. **Railway responded** confirming 20 cap and saying we must move to Cloudflare. **DECISION POINT for tomorrow:** ask Railway for the 30-domain temp bump as stopgap, then plan Cloudflare for SaaS migration.
2. **Cloudflare migration scope** (architectural sketch):
   - Cloudflare Business plan (~$200/mo) for Custom Hostnames / SSL for SaaS
   - Customer domains keep using Spaceship for registration
   - DNS: customer apex → Cloudflare edge (instead of Fastly 151.101.2.15)
   - Cloudflare terminates TLS per customer, Host-header proxies to ONE Railway endpoint (e.g. `edge.legacyodyssey.com`)
   - Replace `railwayService.addCustomDomain()` with Cloudflare Custom Hostnames API call
   - Migrate existing 8 paying customers one at a time
3. **Monthly E2E test** still pending — blocked by the cap (every monthly signup would also fail at apex add).
4. **Apple/Google v1.0.6 review** still in flight.
5. **Roy + Jeff apex** will self-resolve as Let's Encrypt finishes the challenge — re-curl in the morning.

---

<!-- Next session goes above this line -->
