const cron = require('node-cron');
const { Resend } = require('resend');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Daily check for stuck/failed domain orders.
 * Sends an email alert to ADMIN_EMAIL listing any orders that need attention.
 *
 * What counts as "needs attention":
 *  - status = 'failed'  (registration or DNS setup failed outright)
 *  - status != 'active' AND older than 1 hour (likely stuck mid-flow)
 *
 * Idempotency: we mark an order with `last_alerted_at` after each alert and
 * suppress repeats unless it's been 24h or the status changed since the
 * last alert. So you'll get one email per problem, not 30.
 */

const FROM_ADDRESS = 'Legacy Odyssey <hello@legacyodyssey.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'dragno65@hotmail.com';

let resend = null;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

async function findProblemOrders() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: failed } = await supabaseAdmin
    .from('domain_orders')
    .select('id, domain, status, error_message, created_at, last_alerted_at, last_alerted_status')
    .eq('status', 'failed')
    .order('created_at', { ascending: false });

  const { data: stuck } = await supabaseAdmin
    .from('domain_orders')
    .select('id, domain, status, error_message, created_at, last_alerted_at, last_alerted_status')
    .neq('status', 'active')
    .neq('status', 'failed')
    .lt('created_at', oneHourAgo)
    .order('created_at', { ascending: false });

  return [...(failed || []), ...(stuck || [])];
}

function shouldAlert(order) {
  // Always alert if we've never alerted on this order
  if (!order.last_alerted_at) return true;
  // Alert again if the status has changed since the last alert
  if (order.last_alerted_status !== order.status) return true;
  // Otherwise, only re-alert once every 24 hours
  const ageMs = Date.now() - new Date(order.last_alerted_at).getTime();
  return ageMs > 24 * 60 * 60 * 1000;
}

function buildEmail(orders) {
  const rows = orders.map((o) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e8e0d0;font-family:'Courier New',monospace;font-size:13px;">${o.domain}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e8e0d0;font-size:13px;color:${o.status === 'failed' ? '#c0392b' : '#b08e4a'};font-weight:600;">${o.status}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e8e0d0;font-size:12px;color:#8a7e6b;">${new Date(o.created_at).toISOString().slice(0, 16).replace('T', ' ')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e8e0d0;font-size:12px;color:#8a7e6b;">${(o.error_message || '').slice(0, 80)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#faf7f2;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fff;border-radius:8px;border:1px solid #e0d5c4;">
        <tr><td style="padding:24px 28px;background:#1a1a2e;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;color:#c8a96e;font-family:Georgia,serif;font-size:20px;">⚠ Domain Order Alert</h1>
        </td></tr>
        <tr><td style="padding:24px 28px;">
          <p style="margin:0 0 16px;color:#2c2416;font-size:14px;line-height:1.6;">
            <strong>${orders.length}</strong> domain order${orders.length === 1 ? '' : 's'} need${orders.length === 1 ? 's' : ''} attention.
            Either registration failed, DNS setup failed, or the order has been stuck in progress for over an hour.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
            <thead><tr style="background:#faf7f0;">
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8a7e6b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e8e0d0;">Domain</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8a7e6b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e8e0d0;">Status</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8a7e6b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e8e0d0;">Created</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8a7e6b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e8e0d0;">Error</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin:24px 0 0;font-size:12px;color:#8a7e6b;line-height:1.6;">
            Inspect via Supabase → <code>domain_orders</code> table. Re-alerts on the same order are suppressed for 24h unless the status changes.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function runDomainOrderAlerts() {
  console.log('[domain-alerts] Checking for problem orders...');
  try {
    const orders = await findProblemOrders();
    if (orders.length === 0) {
      console.log('[domain-alerts] No problem orders.');
      return;
    }

    const toAlert = orders.filter(shouldAlert);
    if (toAlert.length === 0) {
      console.log(`[domain-alerts] ${orders.length} problem orders, but all already alerted within 24h. Skipping.`);
      return;
    }

    const client = getResend();
    if (!client) {
      console.warn('[domain-alerts] Resend not configured — would have alerted on:', toAlert.map((o) => o.domain).join(', '));
      return;
    }

    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to: [ADMIN_EMAIL],
      subject: `⚠ ${toAlert.length} domain order${toAlert.length === 1 ? '' : 's'} need attention`,
      html: buildEmail(toAlert),
    });

    if (error) {
      console.error('[domain-alerts] Resend error:', error);
      return;
    }

    // Mark each as alerted so we don't spam
    const nowIso = new Date().toISOString();
    for (const o of toAlert) {
      await supabaseAdmin
        .from('domain_orders')
        .update({ last_alerted_at: nowIso, last_alerted_status: o.status })
        .eq('id', o.id);
    }

    console.log(`[domain-alerts] Alerted on ${toAlert.length} order(s) → ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error('[domain-alerts] Unexpected error:', err.message);
  }
}

function startDomainOrderAlertsScheduler() {
  // Daily at 9:30 AM (offset from onboarding's 9:07 to spread API load)
  cron.schedule('30 9 * * *', runDomainOrderAlerts);
  console.log(`[domain-alerts] Scheduler started — runs daily at 9:30 AM, alerts → ${ADMIN_EMAIL}`);

  // Also run once on startup (after a 60s delay to let the server warm up)
  setTimeout(runDomainOrderAlerts, 60000);
}

module.exports = { startDomainOrderAlertsScheduler, runDomainOrderAlerts };
