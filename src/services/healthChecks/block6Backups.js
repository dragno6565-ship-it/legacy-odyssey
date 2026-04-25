const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { supabaseAdmin } = require('../../config/supabase');
const { pass, warn, fail } = require('./helpers');

let r2Client = null;
function getR2() {
  if (r2Client) return r2Client;
  if (!process.env.CLOUDFLARE_R2_ENDPOINT) return null;
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

async function r2List() {
  const r2 = getR2();
  if (!r2) throw new Error('R2 not configured');
  const all = [];
  let token;
  do {
    const r = await r2.send(new ListObjectsV2Command({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET, ContinuationToken: token,
    }));
    for (const o of (r.Contents || [])) all.push(o);
    token = r.NextContinuationToken;
  } while (token);
  return all;
}

async function supabaseStorageCount() {
  let total = 0;
  async function walk(prefix) {
    const { data } = await supabaseAdmin.storage.from('photos').list(prefix, { limit: 1000 });
    for (const e of (data || [])) {
      const fullPath = prefix ? `${prefix}/${e.name}` : e.name;
      if (!e.id) await walk(fullPath);
      else total++;
    }
  }
  await walk('');
  return total;
}

module.exports = {
  blockName: 'backups',
  blockLabel: 'Backups',
  checks: [
    {
      id: 'r2-credentials',
      name: 'R2 credentials present',
      fn: async () => {
        const required = ['CLOUDFLARE_R2_ENDPOINT', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_BUCKET'];
        const missing = required.filter((k) => !process.env[k]);
        if (missing.length) return fail(`Env missing: ${missing.join(', ')}`);
        return pass('All R2 env vars set');
      },
    },
    {
      id: 'r2-reachable',
      name: 'R2 bucket listable',
      fn: async () => {
        try {
          const objects = await r2List();
          return pass(`${objects.length} object(s)`);
        } catch (err) {
          return fail(err.message);
        }
      },
    },
    {
      id: 'backup-keeping-up',
      name: 'R2 object count >= Supabase Storage count',
      fn: async () => {
        try {
          const [r2Objects, sbCount] = await Promise.all([r2List(), supabaseStorageCount()]);
          const r2Count = r2Objects.length;
          if (sbCount === 0 && r2Count === 0) return pass('Both empty');
          if (r2Count >= sbCount) return pass(`R2 has ${r2Count} ≥ Supabase ${sbCount}`);
          // Tolerance: photos uploaded since last 3 AM cron won't be in R2 yet — fine
          if ((sbCount - r2Count) <= 5) return pass(`R2 ${r2Count} vs Supabase ${sbCount} (within tolerance)`);
          return warn(`R2 ${r2Count} < Supabase ${sbCount} (gap of ${sbCount - r2Count})`);
        } catch (err) {
          return fail(err.message);
        }
      },
    },
    {
      id: 'recent-backup-activity',
      name: 'Most recent R2 object < 26 hours old',
      fn: async () => {
        try {
          const objects = await r2List();
          if (!objects.length) return warn('No backup objects yet');
          const latest = objects.reduce((max, o) => {
            const t = new Date(o.LastModified).getTime();
            return t > max ? t : max;
          }, 0);
          const ageHours = (Date.now() - latest) / 1000 / 60 / 60;
          if (ageHours <= 26) return pass(`Last upload ${ageHours.toFixed(1)}h ago`);
          // Could be just because no NEW photos were added recently — warn rather than fail
          return warn(`Last upload ${ageHours.toFixed(1)}h ago (no recent customer activity OR cron stalled)`);
        } catch (err) {
          return fail(err.message);
        }
      },
    },
  ],
};
