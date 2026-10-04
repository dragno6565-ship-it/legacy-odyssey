# Breach Response Runbook (C-007)

**Owner:** Dan (founder, DOR Industries). **Backup:** none yet; any Claude session may run the
technical steps, but Dan makes every notification decision and sends every notice.
**Written:** 2026-10-04 (branch `legal-fixes-2026-10`). **Status:** internal procedure, not legal
advice. Laws change; confirm the notification rules with a lawyer (or the cyber insurer's breach
coach, once a policy is bound, see `ops/FILINGS.md` section 5) before sending regulator notices.

Use this the moment anyone suspects personal data was exposed, lost, altered, or accessed by
someone who should not have it. Start the incident log (section 7) immediately; the clocks below
run from when we **became aware**, not from when we finished investigating.

---

## 0. The clocks (read first)

| Who | Deadline | Trigger |
|---|---|---|
| EU/EEA supervisory authority (GDPR Art. 33) | **72 hours** from awareness | Any personal-data breach unless unlikely to risk people's rights. If we cannot finish in 72h, file what we know and update later. |
| UK ICO (UK GDPR) | **72 hours** | Same test as GDPR. |
| Affected EU/UK individuals (Art. 34) | Without undue delay | Likely **high** risk to them (children's photos almost always qualify). |
| Arizona (our home state, A.R.S. 18-552) | **45 days** after determining a breach | Notify affected AZ residents. If over 1,000 AZ residents: also the AZ Attorney General and the 3 national credit bureaus. |
| California (Civ. Code 1798.82) | "Most expedient time possible, without unreasonable delay" | Notify CA residents; if over 500 CA residents, send a sample notice to the CA Attorney General. Notice must be titled "Notice of Data Breach" with the required headings (template in 6.1 follows them). |
| Most other US states | 30 to 60 days (e.g. CO, FL, WA: 30 days; TX: 60 days) | Many also require an Attorney General notice above a resident count (CO/FL/WA: 500; TX: 250, within 30 days). |
| Stripe | Immediately | Any suspected compromise of Stripe keys or payment flows. |
| Apple / Google | If app credentials or signing keys are involved | Per developer agreements. |
| FTC (COPPA) | If data **collected from a child** is involved | Rare for us (adults create accounts) but check. |

US state laws mostly trigger on specific data (name plus SSN, financial account, driver's license,
**or a username/email plus password or security answer**, plus in some states biometric, health,
or online credentials). Our account login passwords are hashed by Supabase Auth; **website
viewing passwords are stored retrievable** (see Privacy Policy 2.2), so a database exposure means
viewing passwords leaked too. Even where a state law does not strictly require notice, we
**notify affected customers anyway** when their children's photos, videos, or details were exposed.

---

## 1. Detect

Signals that should start this runbook:

- Sentry alerts showing unusual errors on auth, export, admin, or storage routes.
- `/admin/health` failures, the hourly public-pulse email, or the daily health-check email
  showing content on a domain that is not that customer's website.
- Supabase: security advisors, unexpected spikes in the API/storage logs, new service-role usage,
  or RLS disabled on a table (`get_advisors`).
- Railway: unexpected deploys, env-var changes, or new members.
- Stripe: dashboard security notices, unknown API keys, unexpected refunds or payouts.
- Vendor breach notices (Supabase, Railway, Cloudflare, Approximated, Resend, Stripe, Spaceship,
  Sentry, DeepL, Rewardful). Check the subprocessor list in the Privacy Policy section 6.
- A customer or visitor report (help@legacyodyssey.com) that they can see someone else's
  website, photos, or data.
- A photo URL from the public `photos` bucket found somewhere it should not be.

## 2. Triage (first hour)

1. Open an incident log entry (section 7). Record the time we became aware.
2. Classify severity:
   - **SEV-1:** confirmed access to customer content or account data (photos, videos, children's
     details, emails, viewing passwords), or any leaked secret key (Supabase service role, Stripe
     secret, Railway token, Resend, Cloudflare, Spaceship, Approximated).
   - **SEV-2:** suspected but unconfirmed exposure; exposure of a single customer's data to another
     customer; misdirected email with personal data.
   - **SEV-3:** vulnerability found with no evidence of use.
3. SEV-1 or SEV-2: go straight to Contain. Do not delete logs or evidence.

## 3. Contain (same day)

Pick what applies. Each step is safe to run on its own.

- **Leaked keys:** rotate them at the vendor, update Railway env vars, redeploy.
  - Supabase service-role key (Supabase dashboard, API settings) and `SUPABASE_SERVICE_ROLE_KEY`.
  - Stripe secret + webhook secret (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`).
  - Resend, Cloudflare (API token, R2 keys, Stream token), Spaceship, Approximated, Railway token,
    Sentry DSN (low risk), DeepL, Meta CAPI token.
  - `SESSION_SECRET`: rotating it signs everyone out and invalidates old unsubscribe links (people
    can still unsubscribe by replying); do it if it may have leaked.
- **Admin access:** remove unknown rows from `admin_users`; reset Dan's admin password; review
  Supabase Auth users for unexpected admins.
- **Exposed websites:** suspend the affected families (admin panel, Cancel & Archive, or set
  `subscription_status` back after the fix) and reset their viewing passwords.
- **Photo bucket exposure:** photos are in a public bucket with hard-to-guess paths. If paths
  leaked, move affected files to new paths (re-upload) or switch the bucket to private with signed
  URLs (bigger change; TODO security item).
- **Bad deploy:** roll back on Railway to the last good deployment.
- **Vendor-side breach:** follow the vendor's guidance, rotate any keys shared with them.
- Preserve evidence: export relevant Railway logs, Supabase logs, Sentry events, and Stripe
  events before they age out. Save under `F:\legacy-odyssey\ops\incidents\<date>\` (not in git).

## 4. Assess (within 48 hours, in time for the 72-hour GDPR clock)

Answer and record:

1. What data? (account emails, names, viewing passwords, children's names/birth details, photos,
   videos, contact lists of other people, gift recipient details, billing records.)
2. Whose? Count affected customers, and by country/US state (use the domain order and Stripe
   billing country, or ask). Count third parties too (people in Your Contacts).
3. How, and from when to when?
4. Is the access ongoing? Was the data actually viewed or copied (logs), or only exposed?
5. Risk to people: children's photos plus names plus birth dates = **high risk**; act as if
   notification is required unless clearly not.
6. Which notifications are required (section 0), and by what date. Write the deadlines in the log.

## 5. Notify

Dan approves and sends every notice. Order:

1. **EU/UK authority (if any EU/UK person affected):** within 72 hours. Use the authority of the
   country where the affected people live (we have no EU establishment). File online; include
   nature of breach, categories and approximate numbers of people and records, likely
   consequences, measures taken, and a contact (help@legacyodyssey.com).
2. **Affected customers:** email from help@legacyodyssey.com using template 6.1, one email per
   customer (not a mass BCC), via Resend. This is a transactional/legal notice: send it even to
   customers who unsubscribed from marketing. Dan gets a copy.
3. **State Attorneys General / credit bureaus** where thresholds are met (section 0). Most AGs
   have an online form; attach the customer notice.
4. **Third parties in Your Contacts** if their details were exposed: short notice (6.3).
5. **Vendors / Stripe / app stores** if their systems or keys were involved.
6. **Cyber insurer** (once bound): most policies require notice within a short window and
   provide a breach coach; call them before regulators if a policy exists.
7. **Law enforcement** if criminal (FBI IC3, ic3.gov). A law-enforcement request to delay notice
   pauses some state clocks; record it in writing.

## 6. Templates

Keep copy plain. No em dashes. Call the product "Legacy Odyssey Website" / "your child's website".

### 6.1 Customer notice (meets California's "Notice of Data Breach" format)

```
Subject: Notice of Data Breach

Hi Legacy Odyssey Customer,

We are writing to tell you about a security incident that involved some of your information.

What happened
On [DATE], we discovered that [PLAIN DESCRIPTION]. It happened between [START] and [END].

What information was involved
[LIST: e.g. your email address, your child's website viewing password, photos on your child's website.]

What we are doing
We [CONTAINMENT STEPS, e.g. closed the access, changed our security keys, reset the viewing password for your child's website]. We are [ONGOING STEPS] and have notified [REGULATORS, IF ANY].

What you can do
- Set a new viewing password for your child's website in the app or at legacyodyssey.com/account, and share it only with people you trust.
- If you used the same password anywhere else, change it there too.
- [OTHER STEPS]

For more information
Reply to this email or write to help@legacyodyssey.com. A real person will answer.

The Legacy Odyssey team
DOR Industries, Mesa, Arizona
```

### 6.2 Regulator notice (fill in; most authorities use a web form with these fields)

```
Organization: DOR Industries (Legacy Odyssey), Mesa, Arizona, USA. Contact: Dan, help@legacyodyssey.com.
Date discovered: [DATE/TIME, timezone]. Date(s) of breach: [RANGE].
Nature of breach: [confidentiality / integrity / availability]; [how it happened].
Data categories: [list]. Includes children's data: [yes/no].
Number of people affected: [N] ([N] in your jurisdiction). Number of records: [N].
Likely consequences: [e.g. exposure of family photos and children's names].
Measures taken: [containment + remediation]. Individuals notified on: [DATE] (copy attached).
Further information to follow: [yes/no].
```

### 6.3 Notice to people in a customer's contact list

```
Subject: A security notice from Legacy Odyssey

Hello,

You are receiving this because [CUSTOMER FIRST NAME OR "a family"] added you to the contact list for their child's Legacy Odyssey Website. On [DATE] we discovered [PLAIN DESCRIPTION]. Your [name / email address / phone number] may have been included. No passwords or payment details of yours were involved.

We have [STEPS TAKEN]. You do not need to do anything, but please be careful with unexpected emails that mention Legacy Odyssey.

Questions: help@legacyodyssey.com.

The Legacy Odyssey team
```

### 6.4 Internal log entry

```
Incident ID: INC-YYYYMMDD-N
Became aware: [date/time/timezone], by: [who/how]
Severity: SEV-[1/2/3]
Summary:
Systems/vendors involved:
Data involved / people affected (count, countries, US states):
Containment actions (with times):
Evidence saved at:
Notifications required + deadlines:
Notifications sent (who, when, how):
Root cause:
Fixes + follow-ups (TODO.md items):
Closed on:
```

## 7. Incident log

Keep every incident (even "no breach after all") in `ops/incidents/INCIDENT-LOG.md` (create on the
first incident) with the 6.4 fields. GDPR Art. 33(5) requires a record of every breach, including
ones we did not have to report.

## 8. After the incident

- Root-cause review within 2 weeks; add fixes to `TODO.md`.
- Update this runbook with anything that was missing.
- Update `docs/compliance/gdpr-compliance.md` section 9 and `ops/FILINGS.md`.
- Consider the parked hardening items: private photo bucket with signed URLs, hashed viewing
  passwords, and binding cyber insurance (F-006).
