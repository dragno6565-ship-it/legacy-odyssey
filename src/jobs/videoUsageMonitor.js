const cron = require('node-cron');
const { Resend } = require('resend');
const { supabaseAdmin } = require('../config/supabase');
const stream = require('../services/cloudflareStreamService');

/**
 * Video usage monitor (cost visibility for the Cloudflare Stream feature).
 *
 * Runs weekly and emails a short summary:
 *   - total videos + total stored minutes (storage cost driver)
 *   - sites approaching the 1,000-min/site cap
 *   - minutes DELIVERED in the last 7 days (the bandwidth cost driver) + est. $
 * Flags an ⚠️ ALERT when a site nears its cap or weekly delivery is high, so an
 * outlier surfaces before it's a billing surprise. Read-only; emails only when
 * there are videos (no inbox spam pre-launch).
 *
 * Inert until the `videos` table exists (migration 026) AND Cloudflare Stream
 * env vars are set — both guarded defensively.
 */

const FROM_ADDRESS = 'Legacy Odyssey <hello@legacyodyssey.com>';
const RECIPIENTS = ['dan@legacyodyssey.com', 'dragno6565@gmail.com'];

const SITE_CAP_MIN = 1000;                 // per-site cap (decision)
const SITE_ALERT_MIN = 800;                // warn at 80% of cap
const WEEKLY_DELIVERY_ALERT_MIN = 20000;   // ~$20/week delivered → worth knowing
const COST_PER_1000_DELIVERED = 1;         // Cloudflare Stream $/1,000 delivered min
const COST_PER_1000_STORED = 5;            // Cloudflare Stream $/1,000 stored min

let resend = null;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

async function collectStorage() {
  // Defensive: table may not exist yet (pre-migration-026).
  try {
    const { data, error } = await supabaseAdmin
      .from('videos')
      .select('duration_sec, book_id, books(custom_domain, subdomain)')
      .eq('status', 'ready');
    if (error) { console.warn('[video-monitor] videos query failed (table may not exist yet):', error.message); return null; }
    const bySite = {};
    let totalSec = 0;
    for (const v of data || []) {
      totalSec += v.duration_sec || 0;
      const key = v.book_id;
      const label = (v.books && (v.books.custom_domain || v.books.subdomain)) || v.book_id;
      bySite[key] = bySite[key] || { label, sec: 0, count: 0 };
      bySite[key].sec += v.duration_sec || 0;
      bySite[key].count += 1;
    }
    return { count: (data || []).length, totalMin: Math.round(totalSec / 60), bySite };
  } catch (err) {
    console.warn('[video-monitor] storage collect error:', err.message);
    return null;
  }
}

function buildEmail({ storage, deliveredMin, atRiskSites, alert }) {
  const storedCost = (storage.totalMin / 1000) * COST_PER_1000_STORED;
  const delivLine = deliveredMin === null
    ? `<p style="font-size:13px;color:#8a7e6b;">Delivered minutes unavailable (Cloudflare Analytics not readable with the current token — add Account Analytics → Read to enable).</p>`
    : `<p style="font-size:14px;">Delivered (last 7 days): <strong>${deliveredMin.toLocaleString()} min</strong> · est. <strong>$${((deliveredMin / 1000) * COST_PER_1000_DELIVERED).toFixed(2)}</strong>/week</p>`;
  const riskRows = atRiskSites.map((s) =>
    `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;font-family:monospace;font-size:12px;">${s.label}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;">${Math.round(s.sec / 60)} / ${SITE_CAP_MIN} min · ${s.count} videos</td></tr>`
  ).join('');
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#faf7f2;padding:24px;">
    <h2 style="font-size:18px;color:#2c2416;">${alert ? '⚠️ ' : '🎬 '}Weekly video usage${alert ? ' — ATTENTION' : ''}</h2>
    <p style="font-size:14px;">Stored: <strong>${storage.count}</strong> videos · <strong>${storage.totalMin.toLocaleString()} min</strong> · est. <strong>$${storedCost.toFixed(2)}</strong>/year storage</p>
    ${delivLine}
    ${atRiskSites.length ? `<h3 style="font-size:14px;color:#c0392b;">Sites near the ${SITE_CAP_MIN}-min cap</h3><table cellspacing="0" style="border-collapse:collapse;">${riskRows}</table>` : ''}
    <p style="font-size:12px;color:#8a7e6b;margin-top:18px;">Caps: ${SITE_CAP_MIN} min/site · 2 min/clip. This is read-only visibility — no action taken.</p>
  </body></html>`;
}

async function runVideoUsageMonitor() {
  console.log('[video-monitor] Collecting weekly video usage…');
  try {
    const storage = await collectStorage();
    if (!storage || storage.count === 0) { console.log('[video-monitor] No videos yet — no email.'); return; }

    // Last 7 days delivered minutes (best-effort).
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const deliveredMin = await stream.getDeliveredMinutes(since);

    const atRiskSites = Object.values(storage.bySite).filter((s) => s.sec / 60 >= SITE_ALERT_MIN);
    const alert = atRiskSites.length > 0 || (deliveredMin !== null && deliveredMin >= WEEKLY_DELIVERY_ALERT_MIN);

    const client = getResend();
    if (!client) { console.warn('[video-monitor] Resend not configured — usage:', JSON.stringify({ count: storage.count, totalMin: storage.totalMin, deliveredMin })); return; }

    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to: RECIPIENTS,
      subject: `${alert ? '⚠️ ' : '🎬 '}Weekly video usage — ${storage.count} videos, ${storage.totalMin} min stored`,
      html: buildEmail({ storage, deliveredMin, atRiskSites, alert }),
    });
    if (error) { console.error('[video-monitor] Resend error:', error); return; }
    console.log(`[video-monitor] Sent weekly usage → ${RECIPIENTS.join(', ')}`);
  } catch (err) {
    console.error('[video-monitor] Unexpected error:', err.message);
  }
}

function startVideoUsageMonitorScheduler() {
  const { withTracking } = require('../services/cronTracker');
  const tracked = withTracking('video-usage-monitor', runVideoUsageMonitor);
  // Weekly, Monday 9:20 AM (offset from the other morning jobs).
  cron.schedule('20 9 * * 1', tracked);
  console.log(`[video-monitor] Scheduler started — runs weekly (Mon 9:20 AM) → ${RECIPIENTS.join(', ')}`);
}

module.exports = { startVideoUsageMonitorScheduler, runVideoUsageMonitor };
