// Repair HEIC photos stored as .jpg (2026-07-15 customer bug: "photos not
// loading throughout the site"). iOS multi-select uploads delivered original
// HEIC bytes which only Safari can render; photoService now converts on upload,
// and this script fixes what is ALREADY in the bucket, in place (same path,
// upsert), so existing sites heal with no DB changes.
//
//   node -r dotenv/config scripts/backfill-heic-photos.js                 -> dry run (report only)
//   node -r dotenv/config scripts/backfill-heic-photos.js --fix           -> convert all HEIC objects
//   node -r dotenv/config scripts/backfill-heic-photos.js --fix <prefix>  -> only under prefix (e.g. a family id)
const { supabaseAdmin } = require('../src/config/supabase');
const { isHeic } = require('../src/services/photoService');
const convert = require('heic-convert');

const BUCKET = 'photos';
const FIX = process.argv.includes('--fix');
const PREFIX = process.argv.slice(2).filter((a) => !a.startsWith('--'))[0] || '';

async function listAll(prefix) {
  // storage.list is per-folder; walk folders recursively.
  const out = [];
  const { data: entries, error } = await supabaseAdmin.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw error;
  for (const e of entries || []) {
    const path = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.id === null) out.push(...await listAll(path)); // folder
    else out.push(path);
  }
  return out;
}

(async () => {
  const prefix = (PREFIX || '').replace(/\/+$/, '');
  console.log(`Scanning bucket "${BUCKET}"${prefix ? ` under "${prefix}"` : ' (entire bucket)'} — ${FIX ? 'FIX mode' : 'dry run'}`);
  const paths = await listAll(prefix);
  console.log(`${paths.length} objects to inspect`);

  let heicCount = 0, fixed = 0, failed = 0;
  for (const p of paths) {
    try {
      const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(p);
      if (error) { console.log(`  download failed: ${p}: ${error.message}`); failed++; continue; }
      const buf = Buffer.from(await data.arrayBuffer());
      if (!isHeic(buf)) continue;
      heicCount++;
      if (!FIX) { console.log(`  HEIC: ${p} (${(buf.length / 1024).toFixed(0)} KB)`); continue; }
      const jpeg = Buffer.from(await convert({ buffer: buf, format: 'JPEG', quality: 0.85 }));
      const { error: upErr } = await supabaseAdmin.storage.from(BUCKET)
        .upload(p, jpeg, { contentType: 'image/jpeg', upsert: true });
      if (upErr) { console.log(`  RE-UPLOAD FAILED: ${p}: ${upErr.message}`); failed++; continue; }
      fixed++;
      console.log(`  fixed: ${p} (${(buf.length / 1024).toFixed(0)} KB HEIC -> ${(jpeg.length / 1024).toFixed(0)} KB JPEG)`);
    } catch (err) {
      failed++;
      console.log(`  ERROR: ${p}: ${err.message}`);
    }
  }
  console.log(`\nDone. inspected=${paths.length} heic=${heicCount} fixed=${fixed} failed=${failed}${FIX ? '' : ' (dry run — re-run with --fix to convert)'}`);
})();
