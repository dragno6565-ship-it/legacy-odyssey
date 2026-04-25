const cron = require('node-cron');
const { S3Client, ListObjectsV2Command, HeadObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Daily off-site backup of customer photos to Cloudflare R2.
 *
 * Why: Supabase Storage has no built-in cross-provider backup. If our
 * Supabase project is ever lost, locked, corrupted, or misconfigured,
 * customers lose every photo. This nightly job mirrors every object in
 * the `photos` Supabase Storage bucket to a Cloudflare R2 bucket we own
 * (legacy-odyssey-photo-backups). R2 has zero egress fees so restoring
 * is cheap, and free-tier covers our scale (10 GB / month free).
 *
 * Runs daily at 3:30 AM UTC (after the onboarding cron, before the
 * domain-order alert cron). Idempotent: only uploads objects that don't
 * already exist in R2 OR whose size differs (cheap HEAD check first).
 *
 * Object key in R2 mirrors the Supabase path exactly:
 *    photos/{family_id}/{section}/{filename}
 *
 * In a recovery scenario, the inverse script (not yet written) would
 * list R2 and re-upload to Supabase Storage.
 */

let r2 = null;
function getR2() {
  if (r2) return r2;
  if (!process.env.CLOUDFLARE_R2_ENDPOINT || !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) {
    return null;
  }
  r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  });
  return r2;
}

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET || 'legacy-odyssey-photo-backups';
const SUPABASE_BUCKET = 'photos';

/**
 * List every object in the Supabase Storage `photos` bucket recursively.
 * Returns array of { name, size, updated_at } where name is the full path
 * (e.g. "photos/<family_id>/hero/...").
 */
async function listAllSupabasePhotos() {
  const out = [];

  async function walk(prefix) {
    const { data, error } = await supabaseAdmin.storage.from(SUPABASE_BUCKET).list(prefix, { limit: 1000 });
    if (error) {
      console.error(`[photo-backup] list error at "${prefix}":`, error.message);
      return;
    }
    for (const entry of (data || [])) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      // A "folder" in Supabase Storage has no id (it's a synthetic listing entry)
      if (!entry.id) {
        await walk(fullPath);
      } else {
        out.push({
          path: fullPath,
          size: entry.metadata?.size ?? 0,
          contentType: entry.metadata?.mimetype || 'application/octet-stream',
          updated_at: entry.updated_at,
        });
      }
    }
  }

  await walk('');
  return out;
}

/**
 * Check whether R2 already has an object with the matching size.
 * Returns true if the object exists at the same size (skip upload).
 */
async function r2HasMatching(key, size) {
  try {
    const head = await getR2().send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return Number(head.ContentLength) === Number(size);
  } catch (err) {
    if (err.$metadata?.httpStatusCode === 404 || err.name === 'NotFound') return false;
    throw err;
  }
}

/**
 * Stream one Supabase Storage object up to R2.
 * Built-in retry on transient errors — R2 PUTs occasionally return empty
 * errors that resolve on the next attempt.
 */
async function backupOne(item, { maxAttempts = 3 } = {}) {
  // Download from Supabase
  const { data: blob, error } = await supabaseAdmin.storage.from(SUPABASE_BUCKET).download(item.path);
  if (error) throw error;
  const arrayBuffer = await blob.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await getR2().send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: item.path,
        Body: body,
        ContentType: item.contentType,
        Metadata: { 'source-updated-at': item.updated_at || '' },
      }));
      return;
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }
  throw lastErr;
}

/**
 * Main entrypoint. Walk every photo in Supabase Storage, skip ones
 * already present in R2 at the same size, upload the rest.
 */
async function runPhotoBackup() {
  if (!getR2()) {
    console.warn('[photo-backup] R2 not configured (set CLOUDFLARE_R2_* env vars) — skipping');
    return { skipped: true };
  }

  const start = Date.now();
  console.log('[photo-backup] starting nightly mirror Supabase → R2');

  let listed = 0, skipped = 0, uploaded = 0, errored = 0;
  try {
    const items = await listAllSupabasePhotos();
    listed = items.length;
    console.log(`[photo-backup] found ${listed} object(s) in Supabase Storage`);

    for (const item of items) {
      try {
        if (await r2HasMatching(item.path, item.size)) {
          skipped++;
          continue;
        }
        await backupOne(item);
        uploaded++;
      } catch (err) {
        errored++;
        console.error(`[photo-backup] failed for "${item.path}":`, err.message);
      }
    }

    const seconds = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[photo-backup] done in ${seconds}s — listed=${listed} uploaded=${uploaded} skipped=${skipped} errored=${errored}`);
    return { listed, uploaded, skipped, errored, durationSeconds: Number(seconds) };
  } catch (err) {
    console.error('[photo-backup] fatal:', err.message);
    return { listed, uploaded, skipped, errored, fatal: err.message };
  }
}

function startPhotoBackupScheduler() {
  const { withTracking } = require('../services/cronTracker');
  const tracked = withTracking('photo-backup', runPhotoBackup);
  // Daily at 3:30 AM UTC — quiet hours, between the other crons
  cron.schedule('30 3 * * *', tracked);
  console.log('[photo-backup] Scheduler started — runs daily at 3:30 AM UTC');

  // First run on startup, after a 90s delay to let the server warm up
  // (ahead of onboarding's 60s and domain-alert's defaults)
  setTimeout(tracked, 90000);
}

module.exports = { startPhotoBackupScheduler, runPhotoBackup };
