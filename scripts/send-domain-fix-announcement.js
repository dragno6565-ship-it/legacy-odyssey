// Custom-domain outage: plain-language notice + fixed announcement, to active paying customers.
// Recipients pulled LIVE from the families table at run time (never a stale hardcoded list).
// Dan ordered this sent 2026-07-14 ("Get the email re-written and sent out").
// Copy rules (Dan): greeting "Hi Legacy Odyssey Customer," (no first names), NO em-dashes,
// customer sites are "websites" not "books", no price.
//   node scripts/send-domain-fix-announcement.js            -> dry run: prints recipients, sends nothing
//   node scripts/send-domain-fix-announcement.js --force    -> actually sends
const https = require('https');
const { Resend } = require('resend');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Dan gets a copy of every campaign (standing rule 2026-06-24).
const STANDING_RECIPIENTS = ['dragno6565@gmail.com'];

const SUBJECT = "Fixed: an issue with your child's web address";
const UNSUB = 'mailto:info@legacyodyssey.com?subject=unsubscribe';

function getJSON(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

// Active, paid, non-archived, not unsubscribed. Exclude internal/test/demo/owner-dogfood.
async function fetchCustomerEmails() {
  const q = `${SUPABASE_URL}/rest/v1/families?select=email,subscription_status,plan,is_active,archived_at,unsubscribed_at`
    + `&subscription_status=eq.active&plan=eq.paid&archived_at=is.null&unsubscribed_at=is.null`;
  const rows = await getJSON(q, { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` });
  const EXCLUDE = new Set(['dragno65@hotmail.com', 'sample@your-family-photo-album.com']);
  const emails = rows
    .map((r) => r.email)
    .filter((e) => e && !EXCLUDE.has(e) && !/@legacyodyssey\.com$/i.test(e) && !/smoketest/i.test(e));
  return [...new Set(emails.map((e) => e.trim()))];
}

const html = () => `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#faf7f2;">
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
<p style="margin:0;"><a href="https://legacyodyssey.com" style="color:#8a7e6b;">legacyodyssey.com</a> &middot; <a href="mailto:info@legacyodyssey.com" style="color:#8a7e6b;">info@legacyodyssey.com</a> &middot; <a href="${UNSUB}" style="color:#8a7e6b;">Unsubscribe</a></p>
</td></tr>
</table></td></tr></table></body></html>`;

(async () => {
  const customers = await fetchCustomerEmails();
  const recipients = [...customers, ...STANDING_RECIPIENTS];
  const send = process.argv.includes('--force');
  console.log(`Customers: ${customers.length} + standing ${STANDING_RECIPIENTS.length} = ${recipients.length} recipients`);
  console.log(recipients.join('\n'));
  if (!send) { console.log('\n[DRY RUN] nothing sent. Re-run with --force to send.'); return; }

  // Copy lint (added after this email shipped with "web address" in the subject —
  // a wording-rule violation). Every send script MUST run this before sending;
  // it throws and blocks the send on any banned wording.
  const { assertCleanCustomerCopy } = require('./copy-lint');
  assertCleanCustomerCopy({ subject: SUBJECT, html: html() });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const body = html();
  let ok = 0, fail = 0;
  for (const to of recipients) {
    try {
      const r = await resend.emails.send({
        from: 'Legacy Odyssey <hello@legacyodyssey.com>',
        to, replyTo: 'info@legacyodyssey.com', subject: SUBJECT, html: body,
        headers: { 'List-Unsubscribe': `<${UNSUB}>` },
      });
      if (r.error) { fail++; console.log('FAIL', to, JSON.stringify(r.error)); }
      else { ok++; console.log('OK  ', to, r.data && r.data.id); }
    } catch (e) { fail++; console.log('FAIL', to, e.message); }
    await new Promise((r) => setTimeout(r, 300)); // stay under Resend 5/sec
  }
  console.log(`\nDONE, sent ${ok}/${recipients.length}, failed ${fail}`);
})();
