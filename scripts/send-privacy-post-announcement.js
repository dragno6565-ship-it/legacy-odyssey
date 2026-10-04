// Privacy blog-post announcement to active paying customers.
// Recipients pulled LIVE from the families table at run time (never a stale hardcoded list).
// Dan sees the final + gives explicit go before this runs with --force.
//   node scripts/send-privacy-post-announcement.js            -> dry run: prints recipients, sends nothing
//   node scripts/send-privacy-post-announcement.js --force    -> actually sends
const { Resend } = require('resend');

// Dan gets a copy of every campaign (standing rule 2026-06-24).
const STANDING_RECIPIENTS = ['dragno6565@gmail.com'];

const SUBJECT = 'Is it safe to put your baby online?';
const BLOG_URL = 'https://legacyodyssey.com/blog/is-it-safe-to-put-your-baby-online';
// Marketing email: real one-click unsubscribe (signed link + List-Unsubscribe headers)
// and unsubscribed customers skipped. See src/services/marketingEmail.js.
const { fetchMarketingRecipients, unsubscribeUrl, unsubscribeHeaders, UNSUB_MAILTO, assertUnsubscribeSecretMatchesProduction } = require('../src/services/marketingEmail');

const html = (url, unsub) => `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#faf7f2;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;">
<tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e0d5c4;border-radius:10px;">
<tr><td style="padding:36px 36px 8px 36px;font-family:Georgia,'Cormorant Garamond',serif;color:#2c2416;">
<h1 style="margin:0 0 18px 0;font-size:26px;line-height:1.28;color:#1a1510;font-weight:600;">Is it safe to put your baby online?</h1>
</td></tr>
<tr><td style="padding:0 36px 8px 36px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#2c2416;font-size:16px;line-height:1.6;">
<p style="margin:0 0 16px 0;">Hi there,</p>
<p style="margin:0 0 16px 0;">If you&rsquo;ve ever paused before posting a photo of your child, you&rsquo;re not alone. You want the people who love them to watch them grow &mdash; without your child being public or searchable online.</p>
<p style="margin:0 0 16px 0;">That&rsquo;s exactly how a Legacy Odyssey Website is built. It&rsquo;s private by default, password-protected, and invite-only &mdash; you choose who gets in, and you can take access back anytime. And it&rsquo;s deliberately kept out of search engines, so no stranger stumbles onto your child in a Google search.</p>
<p style="margin:0 0 24px 0;">We wrote up exactly how it works, in plain language &mdash; no jargon:</p>
</td></tr>
<tr><td align="center" style="padding:0 36px 24px 36px;">
<a href="${url}" style="display:inline-block;background:#c8a96e;color:#1a1510;text-decoration:none;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;padding:13px 28px;border-radius:6px;">Read the post &rarr;</a>
</td></tr>
<tr><td style="padding:0 36px 28px 36px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#2c2416;font-size:16px;line-height:1.6;">
<p style="margin:0 0 20px 0;">Not just a baby book &mdash; a private place for your child&rsquo;s whole life journey, on a website that&rsquo;s truly theirs.</p>
<p style="margin:0;">&mdash; The Legacy Odyssey team</p>
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
  assertCleanCustomerCopy({ subject: SUBJECT, html: html(BLOG_URL, 'https://legacyodyssey.com/unsubscribe?token=LINT') });

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
        to, replyTo: 'info@legacyodyssey.com', subject: SUBJECT, html: html(BLOG_URL, unsub),
        headers: unsub.startsWith('https://') ? unsubscribeHeaders(unsub) : { 'List-Unsubscribe': `<${unsub}>` },
      });
      if (r.error) { fail++; console.log('FAIL', to, JSON.stringify(r.error)); }
      else { ok++; console.log('OK  ', to, r.data && r.data.id); }
    } catch (e) { fail++; console.log('FAIL', to, e.message); }
    await new Promise((r) => setTimeout(r, 300)); // stay under Resend 5/sec
  }
  console.log(`\nDONE, sent ${ok}/${batch.length}, failed ${fail}`);
})();
