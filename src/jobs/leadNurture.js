const cron = require('node-cron');
const { supabaseAdmin } = require('../config/supabase');
const { sendEmail } = require('../utils/sendEmail');

/**
 * Lead nurture drip (B16).
 * Runs daily and emails waitlist leads (lead-magnet / exit-intent / newsletter
 * signups) based on how long ago they signed up:
 *   Day 2 — educational (privacy quick-wins)
 *   Day 5 — value / what families do with their child's .com
 *   Day 9 — soft offer (claim the name, intro pricing)
 * Progress is tracked in waitlist.nurture_sent (jsonb). Unsubscribed leads
 * (unsubscribed_at set) are skipped. Every email carries an unsubscribe link.
 */

const NURTURE_SOURCES = ['lead_magnet', 'exit_intent', 'newsletter'];
const APP = () => process.env.APP_DOMAIN || 'legacyodyssey.com';

function unsubUrl(email) {
  return `https://${APP()}/api/waitlist/unsubscribe?e=${encodeURIComponent(email)}`;
}

// Branded email shell. `body` is the inner HTML; adds header + unsubscribe footer.
function shell(body, email) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;background:#F8F2E6;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F2E6;padding:40px 20px;"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFCF5;border:1px solid #E8DCC8;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
      <tr><td style="background:#1E1812;padding:26px 40px;text-align:center;"><p style="margin:0;font-size:20px;color:#B8935A;letter-spacing:0.1em;">LEGACY ODYSSEY</p></td></tr>
      <tr><td style="padding:36px 40px;">${body}</td></tr>
      <tr><td style="padding:18px 40px;border-top:1px solid #E8DCC8;text-align:center;">
        <p style="margin:0;font-size:12px;color:#B8A090;line-height:1.6;">Legacy Odyssey &middot; Mesa, AZ &middot; <a href="https://${APP()}" style="color:#B8935A;">legacyodyssey.com</a><br>
        You're receiving this because you downloaded our guide or subscribed at legacyodyssey.com.<br>
        <a href="${unsubUrl(email)}" style="color:#B8A090;">Unsubscribe</a></p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function btn(label) {
  return `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 22px;"><a href="https://${APP()}/#pricing" style="display:inline-block;background:#B8935A;color:#1E1812;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:bold;">${label}</a></td></tr></table>`;
}

const SCHEDULE = [
  {
    day: 2,
    key: 'n1_day2',
    subject: '3 quick wins for your child’s privacy',
    body: (email) => shell(
      `<p style="margin:0 0 16px;font-size:22px;color:#1E1812;">A few minutes today goes a long way</p>
       <p style="margin:0 0 16px;font-size:16px;color:#4A3F32;line-height:1.7;">Thanks again for grabbing our guide. If you only do three things this week:</p>
       <p style="margin:0 0 10px;font-size:16px;color:#4A3F32;line-height:1.7;">&#10003; Set your social accounts to <strong>private</strong>.</p>
       <p style="margin:0 0 10px;font-size:16px;color:#4A3F32;line-height:1.7;">&#10003; Turn off <strong>photo location tagging</strong>.</p>
       <p style="margin:0 0 20px;font-size:16px;color:#4A3F32;line-height:1.7;">&#10003; <strong>Check if your child’s name is still available</strong> as a .com — before someone else takes it.</p>
       <p style="margin:0 0 8px;font-size:16px;color:#4A3F32;line-height:1.7;">That last one is the one most parents miss.</p>
       ${btn('Check your child’s name →')}`,
      email
    ),
  },
  {
    day: 5,
    key: 'n2_day5',
    subject: 'Their own private corner of the internet',
    body: (email) => shell(
      `<p style="margin:0 0 16px;font-size:22px;color:#1E1812;">Not a social profile. Theirs.</p>
       <p style="margin:0 0 16px;font-size:16px;color:#4A3F32;line-height:1.7;">Legacy Odyssey gives your child a private, password-protected website at their own .com — a beautiful place to keep their story that you control, and that’s theirs when they grow up.</p>
       <p style="margin:0 0 20px;font-size:16px;color:#4A3F32;line-height:1.7;">Birth story, month-by-month milestones, letters, a sealed Time Vault — built from your phone, shared only with the people you choose.</p>
       ${btn('See how it works →')}`,
      email
    ),
  },
  {
    day: 9,
    key: 'n3_day9',
    subject: 'Is your child’s name still available?',
    body: (email) => shell(
      `<p style="margin:0 0 16px;font-size:22px;color:#1E1812;">There will only ever be one</p>
       <p style="margin:0 0 16px;font-size:16px;color:#4A3F32;line-height:1.7;">Domain names are unique — once someone registers your child’s name, it may be gone for their whole life. The good news: most parents haven’t thought of this yet.</p>
       <p style="margin:0 0 20px;font-size:16px;color:#4A3F32;line-height:1.7;">You can claim it today for <strong>$29 your first year</strong>. Cancel anytime.</p>
       ${btn('Claim your child’s name →')}`,
      email
    ),
  },
];

async function runLeadNurture() {
  console.log('[lead-nurture] Checking for nurture emails to send...');
  try {
    const { data: leads, error } = await supabaseAdmin
      .from('waitlist')
      .select('id, email, source, created_at, nurture_sent, unsubscribed_at')
      .in('source', NURTURE_SOURCES)
      .is('unsubscribed_at', null);

    if (error) { console.error('[lead-nurture] Query failed:', error.message); return; }
    if (!leads || leads.length === 0) { console.log('[lead-nurture] No leads to nurture.'); return; }

    let sent = 0;
    for (const lead of leads) {
      const ageInDays = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000);
      const already = lead.nurture_sent || {};
      for (const step of SCHEDULE) {
        if (ageInDays >= step.day && !already[step.key]) {
          try {
            await sendEmail({ to: lead.email, subject: step.subject, html: step.body(lead.email) });
            const updated = { ...already, [step.key]: new Date().toISOString() };
            await supabaseAdmin.from('waitlist').update({ nurture_sent: updated }).eq('id', lead.id);
            already[step.key] = updated[step.key];
            sent++;
            console.log(`[lead-nurture] Sent ${step.key} to ${lead.email}`);
          } catch (err) {
            console.error(`[lead-nurture] Failed ${step.key} for ${lead.email}:`, err.message);
          }
        }
      }
    }
    console.log(`[lead-nurture] Done. Sent ${sent} email(s).`);
  } catch (err) {
    console.error('[lead-nurture] Unexpected error:', err.message);
  }
}

function startLeadNurtureScheduler() {
  const { withTracking } = require('../services/cronTracker');
  const tracked = withTracking('lead-nurture', runLeadNurture);
  // Daily at 9:37 AM (offset from the onboarding drip at 9:07).
  cron.schedule('37 9 * * *', tracked);
  console.log('[lead-nurture] Scheduler started — runs daily at 9:37 AM');
  setTimeout(tracked, 45000); // also run ~45s after startup
}

module.exports = { startLeadNurtureScheduler, runLeadNurture };
