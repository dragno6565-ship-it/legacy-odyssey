// CLI runs need env loaded before config/supabase is required.
if (require.main === module) require('dotenv').config();
const cron = require('node-cron');
const { Resend } = require('resend');
const { supabaseAdmin } = require('../config/supabase');
const { BUCKET } = require('../utils/imageUrl');

/**
 * Data-retention PURGE (C-005 / TODO #38). Replaces the weekly reminder-only job.
 *
 * Our Privacy Policy (section 8) and Terms (section 13) promise that when a plan
 * ends, a website's content is kept for one year so the customer can reactivate,
 * and is then permanently deleted. familyService.updateSubscriptionStatus sets
 * families.cancelled_at + data_retain_until (= cancel + 365 days) when Stripe
 * reports the subscription canceled; reactivation clears both.
 *
 * SAFETY MODEL
 *   - DRY RUN BY DEFAULT. Nothing is deleted unless the environment variable
 *     RETENTION_PURGE_ENABLED is exactly "true". In dry-run mode the job only
 *     reports what it WOULD delete (that report replaces the old reminder email).
 *   - A family is purged only if ALL of these hold:
 *       data_retain_until is set and in the past (with a 1-day margin),
 *       cancelled_at is set,
 *       subscription_status = 'canceled',
 *       it is not an admin account or a protected account (Apple review demo),
 *       and, if it has a Stripe subscription, Stripe itself confirms that
 *       subscription is canceled (fail closed: any Stripe error = skip).
 *   - At most RETENTION_PURGE_MAX_PER_RUN families per run (default 5).
 *   - Every real purge is written to retention_purge_log (migration 035) and
 *     emailed to Dan.
 *
 * WHAT A PURGE DELETES (per family)
 *   1. Videos at Cloudflare Stream (each videos.stream_uid).
 *   2. Every Supabase Storage object under photos/<family_id>/ (recursive).
 *   3. The off-site R2 photo backup copies under <family_id>/ (photoBackup.js
 *      mirrors keys 1:1), when R2 is configured.
 *   4. Cached machine translations of this website's text (content_translations).
 *   5. The books row (ON DELETE CASCADE removes every content table: months,
 *      letters, galleries, keepsakes, videos, book_contacts, circles, ...).
 *   6. The families row.
 *   7. The Supabase Auth user, ONLY if no other family (site) still uses it.
 *   Best-effort extras: domain auto-renew off at Spaceship, Approximated vhost removed.
 *   Kept on purpose: domain_orders + gift_codes rows (ON DELETE SET NULL; these
 *   are billing records we must retain), and Stripe's own records.
 *
 * HOW TO ENABLE (Dan)
 *   1. Apply supabase/migrations/035_retention_purge.sql in the Supabase SQL editor.
 *   2. Read one or two dry-run report emails (Mondays) and confirm the list is right.
 *   3. On Railway set RETENTION_PURGE_ENABLED=true (optionally
 *      RETENTION_PURGE_MAX_PER_RUN=<n>) and redeploy. Unset it to go back to dry run.
 *   Manual run (from the repo, with production env loaded):
 *     node src/jobs/dataRetentionPurge.js            -> dry run, prints the plan
 *     node src/jobs/dataRetentionPurge.js --execute  -> deletes, but ONLY if
 *                                                      RETENTION_PURGE_ENABLED=true too
 */

const FROM_ADDRESS = 'Legacy Odyssey <hello@legacyodyssey.com>';
const REPORT_RECIPIENTS = ['dan@legacyodyssey.com', 'dragno6565@gmail.com'];
const PROTECTED_EMAILS = new Set(['review@legacyodyssey.com']);
const MARGIN_MS = 24 * 60 * 60 * 1000; // purge only once retain-until is >1 day past

function purgeEnabled() { return process.env.RETENTION_PURGE_ENABLED === 'true'; }
function maxPerRun() {
  const n = parseInt(process.env.RETENTION_PURGE_MAX_PER_RUN || '5', 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 50) : 5;
}

let resend = null;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

// ─── Candidate selection ──────────────────────────────────────────────────────

async function findCandidates() {
  const cutoff = new Date(Date.now() - MARGIN_MS).toISOString();
  const { data, error } = await supabaseAdmin
    .from('families')
    .select('id, email, auth_user_id, subdomain, custom_domain, subscription_status, plan, cancelled_at, data_retain_until, archived_at, stripe_subscription_id')
    .lt('data_retain_until', cutoff)
    .eq('subscription_status', 'canceled')
    .not('cancelled_at', 'is', null)
    .order('data_retain_until', { ascending: true });
  if (error) throw new Error(`candidate query failed: ${error.message}`);

  const { data: admins } = await supabaseAdmin.from('admin_users').select('email');
  const adminEmails = new Set((admins || []).map((a) => (a.email || '').toLowerCase()).filter(Boolean));

  const eligible = [];
  const skipped = [];
  for (const f of data || []) {
    const email = (f.email || '').toLowerCase();
    if (PROTECTED_EMAILS.has(email)) { skipped.push({ family: f, reason: 'protected account' }); continue; }
    if (adminEmails.has(email)) { skipped.push({ family: f, reason: 'admin account' }); continue; }
    const stripeCheck = await stripeConfirmsCanceled(f);
    if (stripeCheck !== true) { skipped.push({ family: f, reason: stripeCheck }); continue; }
    eligible.push(f);
  }
  return { eligible, skipped };
}

/**
 * Cancelled websites with NO retention date. Before the October 2026 fix,
 * soft-cancelled (archived) families never got data_retain_until, so they are
 * never purged automatically. Listed in the report for Dan to date or delete by
 * hand; the job never guesses a date for them.
 */
async function findUndated() {
  const { data, error } = await supabaseAdmin
    .from('families')
    .select('id, email, subdomain, custom_domain, archived_at, cancelled_at')
    .eq('subscription_status', 'canceled')
    .is('data_retain_until', null)
    .order('archived_at', { ascending: true });
  if (error) { console.warn('[retention-purge] undated query failed:', error.message); return []; }
  return data || [];
}

/** true if safe; otherwise a string reason to skip (fail closed). */
async function stripeConfirmsCanceled(family) {
  if (!family.stripe_subscription_id) return true;
  try {
    const { stripe } = require('../config/stripe');
    if (!stripe) return 'Stripe not configured, cannot confirm subscription is canceled';
    const sub = await stripe.subscriptions.retrieve(family.stripe_subscription_id);
    if (sub && sub.status === 'canceled') return true;
    return `Stripe subscription is "${sub && sub.status}", not canceled`;
  } catch (err) {
    if (err && (err.statusCode === 404 || err.code === 'resource_missing')) return true; // sub gone
    return `Stripe check failed: ${err.message}`;
  }
}

// ─── Inventory (used by both dry run and real purge) ──────────────────────────

async function listStorageRecursive(prefix) {
  const out = [];
  async function walk(p) {
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabaseAdmin.storage.from(BUCKET).list(p, { limit: 1000, offset });
      if (error) throw new Error(`storage list "${p}": ${error.message}`);
      for (const e of data || []) {
        const full = `${p}/${e.name}`;
        if (!e.id) await walk(full); else out.push(full);
      }
      if (!data || data.length < 1000) break;
    }
  }
  await walk(prefix);
  return out;
}

let r2Client = null;
function getR2() {
  if (r2Client) return r2Client;
  if (!process.env.CLOUDFLARE_R2_ENDPOINT || !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) return null;
  const { S3Client } = require('@aws-sdk/client-s3');
  r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  });
  return r2Client;
}
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET || 'legacy-odyssey-photo-backups';

async function listR2(prefix) {
  const r2 = getR2();
  if (!r2) return null; // not configured
  const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
  const keys = [];
  let token;
  do {
    const resp = await r2.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, Prefix: prefix, ContinuationToken: token }));
    for (const o of resp.Contents || []) keys.push(o.Key);
    token = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function inventory(family) {
  const prefix = family.id; // photoService: `${familyId}/${section}/${file}`
  const { data: books } = await supabaseAdmin.from('books').select('id').eq('family_id', family.id);
  const bookIds = (books || []).map((b) => b.id);
  let videos = [];
  if (bookIds.length) {
    const { data } = await supabaseAdmin.from('videos').select('id, stream_uid').in('book_id', bookIds);
    videos = data || [];
  }
  const storagePaths = await listStorageRecursive(prefix);
  const r2Keys = await listR2(`${prefix}/`);

  let translationHashes = [];
  try {
    const bookService = require('../services/bookService');
    const { translatableHashes } = require('../services/translateService');
    const full = await bookService.getFullBook(family.id);
    if (full) translationHashes = translatableHashes(full);
  } catch (err) {
    console.warn(`[retention-purge] translation inventory failed for ${family.id}: ${err.message}`);
  }

  let otherSitesOnAuthUser = 0;
  if (family.auth_user_id) {
    const { count } = await supabaseAdmin.from('families').select('id', { count: 'exact', head: true })
      .eq('auth_user_id', family.auth_user_id).neq('id', family.id);
    otherSitesOnAuthUser = count || 0;
  }

  return { bookIds, videos, storagePaths, r2Keys, translationHashes, otherSitesOnAuthUser };
}

// ─── Real purge ───────────────────────────────────────────────────────────────

async function purgeFamily(family, inv) {
  const summary = { videos: 0, storage_objects: 0, r2_objects: 0, translations: 0, books: inv.bookIds.length, auth_user_deleted: false, errors: [] };

  // Re-check right before deleting (the customer may have reactivated since selection).
  const { data: fresh } = await supabaseAdmin.from('families')
    .select('id, subscription_status, data_retain_until, cancelled_at').eq('id', family.id).maybeSingle();
  if (!fresh || fresh.subscription_status !== 'canceled' || !fresh.cancelled_at || !fresh.data_retain_until
      || new Date(fresh.data_retain_until).getTime() > Date.now() - MARGIN_MS) {
    summary.errors.push('aborted: family changed since selection (reactivated?)');
    summary.aborted = true;
    return summary;
  }

  // 1. Cloudflare Stream videos
  const stream = require('../services/cloudflareStreamService');
  for (const v of inv.videos) {
    try { if (v.stream_uid) { await stream.deleteVideo(v.stream_uid); summary.videos++; } }
    catch (err) { summary.errors.push(`stream ${v.stream_uid}: ${err.message}`); }
  }
  // Stop here if any external delete failed: rows stay so the next run retries.
  if (summary.errors.length) { summary.aborted = true; return summary; }

  // 2. Supabase Storage
  for (let i = 0; i < inv.storagePaths.length; i += 100) {
    const chunk = inv.storagePaths.slice(i, i + 100);
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove(chunk);
    if (error) { summary.errors.push(`storage remove: ${error.message}`); summary.aborted = true; return summary; }
    summary.storage_objects += chunk.length;
  }

  // 3. R2 backup copies
  if (inv.r2Keys && inv.r2Keys.length) {
    const { DeleteObjectsCommand } = require('@aws-sdk/client-s3');
    for (let i = 0; i < inv.r2Keys.length; i += 1000) {
      const chunk = inv.r2Keys.slice(i, i + 1000);
      try {
        const resp = await getR2().send(new DeleteObjectsCommand({ Bucket: R2_BUCKET, Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true } }));
        if (resp.Errors && resp.Errors.length) throw new Error(`${resp.Errors.length} object(s) failed`);
        summary.r2_objects += chunk.length;
      } catch (err) { summary.errors.push(`r2 delete: ${err.message}`); summary.aborted = true; return summary; }
    }
  }

  // 4. Cached translations (shared cache keyed by text hash; deleting a hash
  //    another site also uses just means it is re-translated on next view).
  for (let i = 0; i < inv.translationHashes.length; i += 200) {
    const chunk = inv.translationHashes.slice(i, i + 200);
    const { error, count } = await supabaseAdmin.from('content_translations').delete({ count: 'exact' }).in('source_hash', chunk);
    if (error) summary.errors.push(`translations: ${error.message}`); else summary.translations += count || 0;
  }

  // 5 + 6. Rows: books (cascades all content tables) then the family.
  const { error: bErr } = await supabaseAdmin.from('books').delete().eq('family_id', family.id);
  if (bErr) { summary.errors.push(`books delete: ${bErr.message}`); summary.aborted = true; return summary; }
  const { error: fErr } = await supabaseAdmin.from('families').delete().eq('id', family.id);
  if (fErr) { summary.errors.push(`family delete: ${fErr.message}`); summary.aborted = true; return summary; }

  // 7. Auth user, only when no other site uses it (multi-site accounts).
  if (family.auth_user_id) {
    const { count } = await supabaseAdmin.from('families').select('id', { count: 'exact', head: true }).eq('auth_user_id', family.auth_user_id);
    if (!count) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(family.auth_user_id);
      if (error) summary.errors.push(`auth user: ${error.message}`); else summary.auth_user_deleted = true;
    }
  }

  // Best-effort domain cleanup (normally already done at cancellation).
  if (family.custom_domain) {
    try { await require('../services/spaceshipService').setAutoRenew(family.custom_domain, false); }
    catch (err) { summary.errors.push(`spaceship auto-renew: ${err.message}`); }
    try { await require('../services/approximatedService').deleteVirtualHostByHostname(family.custom_domain); }
    catch (err) { summary.errors.push(`approximated vhost: ${err.message}`); }
  }

  // Audit log (no email/name/domain stored).
  const { error: logErr } = await supabaseAdmin.from('retention_purge_log').insert({
    family_id: family.id,
    cancelled_at: family.cancelled_at,
    data_retain_until: family.data_retain_until,
    summary,
  });
  if (logErr) summary.errors.push(`audit log: ${logErr.message} (is migration 035 applied?)`);

  summary.purged = true;
  return summary;
}

// ─── Report ───────────────────────────────────────────────────────────────────

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function day(iso) { return iso ? new Date(iso).toISOString().slice(0, 10) : '-'; }

function buildReport({ execute, results, skipped, deferred, undated = [] }) {
  const rows = results.map(({ family: f, inv, summary }) => `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid #e8e0d0;font-family:monospace;font-size:12px;">${esc(f.custom_domain || f.subdomain || '-')}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e8e0d0;font-size:12px;">${esc(f.email)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e8e0d0;font-size:12px;">${day(f.cancelled_at)} / ${day(f.data_retain_until)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e8e0d0;font-size:12px;">${inv ? `${inv.storagePaths.length} photos, ${inv.videos.length} videos, ${inv.r2Keys == null ? 'R2 n/a' : inv.r2Keys.length + ' backups'}${inv.otherSitesOnAuthUser ? `, login kept (${inv.otherSitesOnAuthUser} other site)` : ''}` : '-'}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e8e0d0;font-size:12px;color:${summary && summary.errors.length ? '#c0392b' : '#2e7d32'};">${execute ? (summary ? (summary.purged ? 'DELETED' : 'NOT deleted') + (summary.errors.length ? ': ' + esc(summary.errors.join('; ')) : '') : '-') : 'would delete'}</td>
    </tr>`).join('');
  const skippedRows = skipped.map(({ family: f, reason }) => `<li>${esc(f.custom_domain || f.subdomain || f.id)} (${esc(f.email)}): ${esc(reason)}</li>`).join('');
  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#faf7f2;font-family:Arial,sans-serif;color:#2c2416;">
  <div style="max-width:760px;margin:0 auto;background:#fff;border:1px solid #e0d5c4;border-radius:8px;padding:24px 28px;">
    <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:20px;color:#1a1510;">Data-retention purge: ${execute ? 'REAL RUN' : 'dry run (nothing deleted)'}</h1>
    <p style="font-size:14px;line-height:1.6;">${results.length} cancelled website(s) are past the one-year retention window promised in the Privacy Policy.${execute ? '' : ' <strong>Nothing was deleted.</strong> Deletion is switched off until RETENTION_PURGE_ENABLED=true is set on Railway (see src/jobs/dataRetentionPurge.js). Until then, delete these by hand or enable the job.'}</p>
    ${deferred ? `<p style="font-size:13px;color:#8a7e6b;">${deferred} more are due and will be handled in later runs (limit ${maxPerRun()} per run).</p>` : ''}
    ${results.length ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:12px 0;">
      <thead><tr style="background:#faf7f0;font-size:11px;text-transform:uppercase;color:#8a7e6b;">
        <th style="padding:8px 10px;text-align:left;">Site</th><th style="padding:8px 10px;text-align:left;">Email</th><th style="padding:8px 10px;text-align:left;">Cancelled / retain-until</th><th style="padding:8px 10px;text-align:left;">Data</th><th style="padding:8px 10px;text-align:left;">Result</th>
      </tr></thead><tbody>${rows}</tbody></table>` : ''}
    ${skippedRows ? `<p style="font-size:13px;margin-top:16px;"><strong>Skipped (safety checks):</strong></p><ul style="font-size:13px;">${skippedRows}</ul>` : ''}
    ${undated.length ? `<p style="font-size:13px;margin-top:16px;"><strong>Cancelled websites with no retention date (${undated.length}):</strong> these were cancelled before retention dates were recorded, so the job will never delete them on its own. Delete by hand once they are a year past the end of their paid period, or set data_retain_until for them.</p><ul style="font-size:13px;">${undated.map((f) => `<li>${esc(f.custom_domain || f.subdomain || f.id)} (${esc(f.email)}), archived ${day(f.archived_at)}</li>`).join('')}</ul>` : ''}
  </div></body></html>`;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * @param {{ execute?: boolean }} opts  execute=true deletes, but ONLY when
 *   RETENTION_PURGE_ENABLED=true as well. The cron passes execute=purgeEnabled().
 */
async function runDataRetentionPurge({ execute = purgeEnabled(), sendEmail = true } = {}) {
  const really = execute === true && purgeEnabled();
  console.log(`[retention-purge] starting (${really ? 'REAL RUN' : 'dry run'})`);
  const { eligible, skipped } = await findCandidates();
  const undated = await findUndated();
  const batch = eligible.slice(0, maxPerRun());
  const deferred = eligible.length - batch.length;

  const results = [];
  for (const family of batch) {
    let inv = null;
    let summary = null;
    try {
      inv = await inventory(family);
      if (really) summary = await purgeFamily(family, inv);
    } catch (err) {
      summary = { errors: [err.message], aborted: true };
    }
    results.push({ family, inv, summary });
    console.log(`[retention-purge] ${really ? (summary && summary.purged ? 'PURGED' : 'NOT purged') : 'would purge'} family ${family.id}`
      + (inv ? ` (${inv.storagePaths.length} storage objects, ${inv.videos.length} videos, ${inv.r2Keys == null ? 'R2 n/a' : inv.r2Keys.length + ' R2 objects'})` : '')
      + (summary && summary.errors && summary.errors.length ? ` errors: ${summary.errors.join('; ')}` : ''));
  }
  for (const s of skipped) console.log(`[retention-purge] skipped ${s.family.id}: ${s.reason}`);

  if (sendEmail && (results.length || skipped.length || undated.length)) {
    const client = getResend();
    if (client) {
      const { error } = await client.emails.send({
        from: FROM_ADDRESS,
        to: REPORT_RECIPIENTS,
        subject: really
          ? `Data-retention purge: ${results.filter((r) => r.summary && r.summary.purged).length} website(s) deleted`
          : `Data-retention purge (dry run): ${results.length} website(s) past retention`,
        html: buildReport({ execute: really, results, skipped, deferred, undated }),
      });
      if (error) console.error('[retention-purge] report email failed:', error);
    } else {
      console.warn('[retention-purge] Resend not configured, report not emailed');
    }
  }
  if (undated.length) console.log(`[retention-purge] ${undated.length} cancelled website(s) have no retention date (listed in the report)`);
  return { execute: really, due: eligible.length, processed: results.length, deferred, skipped: skipped.length, undated: undated.length, results };
}

function startDataRetentionPurgeScheduler() {
  const { withTracking } = require('../services/cronTracker');
  const tracked = withTracking('data-retention-purge', () => runDataRetentionPurge());
  // Weekly, Monday 9:50 AM (the old reminder's slot).
  cron.schedule('50 9 * * 1', tracked);
  console.log(`[retention-purge] Scheduler started: weekly Mon 9:50, mode=${purgeEnabled() ? 'REAL (RETENTION_PURGE_ENABLED=true)' : 'dry run'}`);
}

module.exports = { startDataRetentionPurgeScheduler, runDataRetentionPurge, findCandidates, findUndated, inventory, purgeEnabled };

// CLI: node src/jobs/dataRetentionPurge.js [--execute] [--no-email]
if (require.main === module) {
  const execute = process.argv.includes('--execute');
  if (execute && !purgeEnabled()) {
    console.log('--execute given but RETENTION_PURGE_ENABLED is not "true": running as a DRY RUN.');
  }
  runDataRetentionPurge({ execute, sendEmail: !process.argv.includes('--no-email') })
    .then((r) => {
      console.log(JSON.stringify({ execute: r.execute, due: r.due, processed: r.processed, deferred: r.deferred, skipped: r.skipped, undated: r.undated }, null, 2));
      process.exit(0);
    })
    .catch((err) => { console.error(err); process.exit(1); });
}
