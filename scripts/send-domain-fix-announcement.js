// Custom-domain outage: plain-language notice + fixed announcement, to active paying customers.
// Recipients pulled LIVE from the families table at run time (never a stale hardcoded list).
// Dan ordered this sent 2026-07-14 ("Get the email re-written and sent out").
// Copy rules (Dan): greeting "Hi Legacy Odyssey Customer," (no first names), NO em-dashes,
// customer sites are "websites" not "books", no price.
//   node scripts/send-domain-fix-announcement.js            -> dry run: prints recipients, sends nothing
//   node scripts/send-domain-fix-announcement.js --force    -> actually sends
const { Resend } = require('resend');

// Dan gets a copy of every campaign (standing rule 2026-06-24).
const STANDING_RECIPIENTS = ['dragno6565@gmail.com'];

const SUBJECT = "Fixed: an issue with your child's web address";
// Marketing email: real one-click unsubscribe (signed link + List-Unsubscribe headers)
// and unsubscribed customers skipped. See src/services/marketingEmail.js.
const { fetchMarketingRecipients, unsubscribeUrl, unsubscribeHeaders, UNSUB_MAILTO, assertUnsubscribeSecretMatchesProduction } = require('../src/services/marketingEmail');

const html = (unsub) => `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#faf7f2;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;">
<tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e0d5c4;border-radius:10px;">
<tr><td style="padding:36px 36px 8px 36px;font-family:Georgia,'Cormorant Garamond',serif;color:#2c2416;">
<h1 style="margin:0 0 18px 0;font-size:26px;line-height:1.28;color:#1a1510;font-weight:600;">We found a problem, and we fixed it</h1>
</td></tr>
<tr><td style="padding:0 36px 28px 36px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#2c2416;font-size:16px;line-height:1.6;">
<p style="margin:0 0 16px 0;">Hi Legacy Odyssey Customer,</p>
<p style="margin:0 0 16px 0;">We recently found and fixed a problem on our side, and we want you to know about it because it may have affected you.</p>
<p style="margin:0 0 16px 0;"><strong>What happened:</strong> for a while, typing your child's custom .com address into a web browser showed our company homepage instead of your child's website. If you or a family member saw that and thought something was wrong, that was our mistake, not yours.</p>
<p style="margin:0 0 16px 0;"><strong>What was never affected:</strong> your child's website itself. All photos, milestones, and content stayed safe and untouched the entire time, and nothing was ever visible to anyone who should not see it. Your password protection kept working normally.</p>
<p style="margin:0 0 16px 0;"><strong>Where things stand now:</strong> everything is fixed. Your child's .com address goes straight to their website again, and we have checked every customer's address one by one to confirm it. We have also put automatic checks in place that verify every customer's address loads the right website every single day, so a problem like this cannot slip past us again.</p>
<p style="margin:0 0 16px 0;">If anything still looks off to you, just reply to this email. A real person will look into it right away.</p>
<p style="margin:0 0 16px 0;">We are sorry for any confusion this caused. Thank you for trusting us with your child's moments.</p>
<p style="margin:0;">The Legacy Odyssey team</p>
</td></tr>
<tr><td style="padding:20px 36px 28px 36px;border-top:1px solid #e0d5c4;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#8a7e6b;font-size:12px;line-height:1.6;">
<p style="margin:0;"><a href="https://legacyodyssey.com" style="color:#8a7e6b;">legacyodyssey.com</a> &middot; <a href="mailto:info@legacyodyssey.com" style="color:#8a7e6b;">info@legacyodyssey.com</a> &middot; <a href="${unsub}" style="color:#8a7e6b;">Unsubscribe</a></p>
</td></tr>
</table></td></tr></table></body></html>`;

(async () => {
  // Recipients: active paid customers, one per email, minus anyone unsubscribed
  // (families.unsubscribed_at on ANY of their sites). Dan always gets a copy.
  const { recipients: customers, skippedUnsubscribed } = await fetchMarketingRecipients();
  const send = process.argv.includes('--force');
  console.log(`Customers: ${customers.length} (unsubscribed emails skipped: ${skippedUnsubscribed}) + standing ${STANDING_RECIPIENTS.length}`);
  console.log(customers.map((c) => c.email).concat(STANDING_RECIPIENTS).join('\n'));

  // Copy lint: every send script MUST run this before sending; it throws and
  // blocks the send on banned wording or a missing unsubscribe link.
  const { assertCleanCustomerCopy } = require('./copy-lint');
  assertCleanCustomerCopy({ subject: SUBJECT, html: html('https://legacyodyssey.com/unsubscribe?token=LINT') });

  if (!send) { console.log('\n[DRY RUN] nothing sent. Re-run with --force to send.'); return; }

  // Unsubscribe links are signed with SESSION_SECRET: prove it matches production
  // before sending, or every link in the batch would be dead.
  if (customers.length) await assertUnsubscribeSecretMatchesProduction(customers[0].familyId);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const batch = customers.map((c) => ({ to: c.email, unsub: unsubscribeUrl(c.familyId) }))
    .concat(STANDING_RECIPIENTS.map((to) => ({ to, unsub: UNSUB_MAILTO })));
  let ok = 0, fail = 0;
  for (const { to, unsub } of batch) {
    try {
      const r = await resend.emails.send({
        from: 'Legacy Odyssey <hello@legacyodyssey.com>',
        to, replyTo: 'info@legacyodyssey.com', subject: SUBJECT, html: html(unsub),
        headers: unsub.startsWith('https://') ? unsubscribeHeaders(unsub) : { 'List-Unsubscribe': `<${unsub}>` },
      });
      if (r.error) { fail++; console.log('FAIL', to, JSON.stringify(r.error)); }
      else { ok++; console.log('OK  ', to, r.data && r.data.id); }
    } catch (e) { fail++; console.log('FAIL', to, e.message); }
    await new Promise((r) => setTimeout(r, 300)); // stay under Resend 5/sec
  }
  console.log(`\nDONE, sent ${ok}/${batch.length}, failed ${fail}`);
})();
