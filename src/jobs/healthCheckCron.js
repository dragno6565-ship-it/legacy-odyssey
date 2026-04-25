const cron = require('node-cron');
const { Resend } = require('resend');
const { runAll } = require('../services/healthChecks');

const FROM_ADDRESS = 'Legacy Odyssey <hello@legacyodyssey.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'legacyodysseyapp@gmail.com';

let resend = null;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

/**
 * Daily health check at 2:30 AM UTC. Runs every check across every block.
 * Emails ADMIN_EMAIL only if there is at least one FAIL — passes + warns
 * are logged to the Railway console only (you can always see them in the
 * /admin/health page).
 */
function buildEmail(report) {
  const failingRows = report.results.filter((r) => r.status === 'fail').map((r) => `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;color:#8a7e6b;">${r.blockLabel}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;font-weight:600;">${r.name}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;color:#c0392b;">${(r.detail || '').slice(0, 200)}</td>
    </tr>
  `).join('');

  const warnRows = report.results.filter((r) => r.status === 'warn').map((r) => `
    <tr>
      <td style="padding:5px 10px;border-bottom:1px solid #eee;font-size:11px;color:#8a7e6b;">${r.blockLabel}</td>
      <td style="padding:5px 10px;border-bottom:1px solid #eee;font-size:12px;">${r.name}</td>
      <td style="padding:5px 10px;border-bottom:1px solid #eee;font-size:11px;color:#b08e4a;">${(r.detail || '').slice(0, 200)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#faf7f2;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#fff;border-radius:8px;border:1px solid #e0d5c4;">
        <tr><td style="padding:24px 28px;background:#1a1a2e;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;color:#c8a96e;font-family:Georgia,serif;font-size:20px;">⚠ Health Check — ${report.summary.fail} fail / ${report.summary.warn} warn / ${report.summary.pass} pass</h1>
        </td></tr>
        <tr><td style="padding:24px 28px;color:#2c2416;">
          <p style="margin:0 0 16px;font-size:14px;">${report.summary.fail} check(s) FAILED. Investigate the table below.</p>
          <h3 style="margin:24px 0 8px;font-size:14px;color:#c0392b;">FAILURES (${failingRows ? report.summary.fail : 0})</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${failingRows || '<tr><td>None</td></tr>'}</table>
          ${warnRows ? `<h3 style="margin:24px 0 8px;font-size:13px;color:#b08e4a;">Warnings (${report.summary.warn})</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${warnRows}</table>` : ''}
          <p style="margin:24px 0 0;font-size:12px;color:#8a7e6b;">View full report at <a href="https://legacyodyssey.com/admin/health" style="color:#c8a96e;">legacyodyssey.com/admin/health</a> · Ran in ${(report.totalMs / 1000).toFixed(1)}s</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function runHealthCheckJob() {
  console.log('[health] starting daily check sweep');
  try {
    const report = await runAll();
    console.log(`[health] done: ${report.summary.pass} pass · ${report.summary.warn} warn · ${report.summary.fail} fail (${(report.totalMs / 1000).toFixed(1)}s)`);

    if (report.summary.fail === 0) {
      // No failures — silent success
      return { sent: false, summary: report.summary };
    }

    const client = getResend();
    if (!client) {
      console.warn('[health] Resend not configured — would have alerted on:', report.results.filter(r => r.status === 'fail').map(r => r.name).join(', '));
      return { sent: false, summary: report.summary };
    }

    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to: [ADMIN_EMAIL],
      subject: `⚠ Legacy Odyssey health check — ${report.summary.fail} failure(s)`,
      html: buildEmail(report),
    });
    if (error) {
      console.error('[health] alert email failed:', error);
      return { sent: false, summary: report.summary };
    }
    console.log(`[health] alert email sent to ${ADMIN_EMAIL}`);
    return { sent: true, summary: report.summary };
  } catch (err) {
    console.error('[health] fatal error in cron:', err.message);
    return { error: err.message };
  }
}

function startHealthCheckScheduler() {
  const { withTracking } = require('../services/cronTracker');
  const tracked = withTracking('health-check', runHealthCheckJob);
  // Daily at 2:30 AM UTC — quietly between photo-backup (3:30) and onboarding (9:07)
  cron.schedule('30 2 * * *', tracked);
  console.log('[health] Scheduler started — runs daily at 2:30 AM UTC');
}

module.exports = { startHealthCheckScheduler, runHealthCheckJob };
