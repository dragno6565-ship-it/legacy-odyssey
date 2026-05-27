const cron = require('node-cron');
const { Resend } = require('resend');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Data-retention deletion REMINDER (interim stand-in for task #38).
 *
 * Our privacy policy says cancelled accounts are kept for up to 1 year (so the
 * customer can reactivate) and then permanently deleted. We do NOT yet have an
 * automated purge job (that's task #38 — irreversible deletion, needs a
 * supervised build). Until then, this job runs weekly and EMAILS a reminder
 * listing every account whose 1-year retention window has now lapsed, so the
 * data can be deleted by hand.
 *
 * This job is strictly read-only: it queries + emails. It never deletes
 * anything. If nothing is due, it sends no email (no inbox spam).
 */

const FROM_ADDRESS = 'Legacy Odyssey <hello@legacyodyssey.com>';
const REMINDER_RECIPIENTS = ['dan@legacyodyssey.com', 'dragno6565@gmail.com'];

let resend = null;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

/**
 * Accounts whose retention window has passed: data_retain_until is set and in
 * the past. (A null data_retain_until — i.e. active customers — is excluded by
 * the .lt filter.)
 */
async function findExpiredAccounts() {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('families')
    .select('id, email, subdomain, custom_domain, display_name, cancelled_at, data_retain_until, archived_at, subscription_status')
    .lt('data_retain_until', nowIso)
    .order('data_retain_until', { ascending: true });
  if (error) { console.error('[retention-reminder] query failed:', error.message); return []; }
  return data || [];
}

function buildEmail(accounts) {
  const rows = accounts.map((f) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e8e0d0;font-family:'Courier New',monospace;font-size:13px;">${f.custom_domain || f.subdomain || '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e8e0d0;font-size:13px;">${f.email || '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e8e0d0;font-size:12px;color:#8a7e6b;">${f.cancelled_at ? new Date(f.cancelled_at).toISOString().slice(0, 10) : '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e8e0d0;font-size:12px;color:#c0392b;">${f.data_retain_until ? new Date(f.data_retain_until).toISOString().slice(0, 10) : '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e8e0d0;font-family:'Courier New',monospace;font-size:11px;color:#8a7e6b;">${f.id}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#faf7f2;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#fff;border-radius:8px;border:1px solid #e0d5c4;">
        <tr><td style="padding:24px 28px;background:#1a1a2e;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;color:#c8a96e;font-family:Georgia,serif;font-size:20px;">🗑 Data-retention: manual deletion due</h1>
        </td></tr>
        <tr><td style="padding:24px 28px;">
          <p style="margin:0 0 16px;color:#2c2416;font-size:14px;line-height:1.6;">
            <strong>${accounts.length}</strong> cancelled account${accounts.length === 1 ? '' : 's'} ${accounts.length === 1 ? 'has' : 'have'} passed the 1-year retention window promised in our privacy policy and should be <strong>permanently deleted by hand</strong> (website content, photos in Supabase Storage, and the domain released).
          </p>
          <p style="margin:0 0 16px;color:#8a7e6b;font-size:13px;line-height:1.6;">
            Reminder: deleting is irreversible. Double-check each account hasn't reactivated before removing it. (An automated purge job is task #38 — not yet built.)
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
            <thead><tr style="background:#faf7f0;">
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8a7e6b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e8e0d0;">Domain / Subdomain</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8a7e6b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e8e0d0;">Email</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8a7e6b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e8e0d0;">Cancelled</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8a7e6b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e8e0d0;">Retain-until</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8a7e6b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e8e0d0;">Family ID</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin:24px 0 0;font-size:12px;color:#8a7e6b;line-height:1.6;">
            Delete via Supabase → <code>families</code> (and related book/photo rows) + release the domain. This reminder repeats weekly until the listed accounts are gone.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function runDataRetentionReminder() {
  console.log('[retention-reminder] Checking for accounts past their retention window...');
  try {
    const accounts = await findExpiredAccounts();
    if (accounts.length === 0) {
      console.log('[retention-reminder] None due. No email sent.');
      return;
    }

    const client = getResend();
    if (!client) {
      console.warn('[retention-reminder] Resend not configured — would have reminded about:', accounts.map((a) => a.custom_domain || a.subdomain || a.id).join(', '));
      return;
    }

    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to: REMINDER_RECIPIENTS,
      subject: `🗑 ${accounts.length} account${accounts.length === 1 ? '' : 's'} past retention — delete manually`,
      html: buildEmail(accounts),
    });
    if (error) { console.error('[retention-reminder] Resend error:', error); return; }

    console.log(`[retention-reminder] Reminded about ${accounts.length} account(s) → ${REMINDER_RECIPIENTS.join(', ')}`);
  } catch (err) {
    console.error('[retention-reminder] Unexpected error:', err.message);
  }
}

function startDataRetentionReminderScheduler() {
  const { withTracking } = require('../services/cronTracker');
  const tracked = withTracking('data-retention-reminder', runDataRetentionReminder);
  // Weekly, Monday 9:50 AM (offset from the other morning jobs).
  cron.schedule('50 9 * * 1', tracked);
  console.log(`[retention-reminder] Scheduler started — runs weekly (Mon 9:50 AM), reminds → ${REMINDER_RECIPIENTS.join(', ')}`);
}

module.exports = { startDataRetentionReminderScheduler, runDataRetentionReminder };
