const { supabaseAdmin } = require('../config/supabase');
const { BUCKET } = require('../utils/imageUrl');

/**
 * HEIC/HEIF detection by magic bytes (ISO-BMFF "ftyp" box at offset 4).
 * iPhones shoot HEIC, and iOS multi-select image picking returns the ORIGINAL
 * file (the picker's `quality` re-encode is ignored for multi-select), so HEIC
 * buffers reach the server labeled image/jpeg. Only Safari can render HEIC —
 * on Chrome/Android every such photo shows as broken (customer bug 2026-07-15,
 * "photos not loading throughout the site"). Convert to real JPEG here so the
 * fix covers every client and every past app version.
 */
const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'];
function isHeic(buf) {
  if (!buf || buf.length < 12) return false;
  if (buf.toString('ascii', 4, 8) !== 'ftyp') return false;
  return HEIC_BRANDS.includes(buf.toString('ascii', 8, 12));
}

async function toJpegIfHeic(fileBuffer, mimeType) {
  if (!isHeic(fileBuffer)) return { buffer: fileBuffer, mimeType };
  const convert = require('heic-convert');
  const out = await convert({ buffer: fileBuffer, format: 'JPEG', quality: 0.85 });
  return { buffer: Buffer.from(out), mimeType: 'image/jpeg' };
}

async function upload(familyId, section, identifier, fileBuffer, mimeType) {
  const converted = await toJpegIfHeic(fileBuffer, mimeType);
  fileBuffer = converted.buffer;
  mimeType = converted.mimeType;

  const ext = mimeType === 'image/png' ? '.png' : '.jpg';
  const storagePath = `${familyId}/${section}/${identifier}${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return { path: storagePath, url: urlData.publicUrl };
}

async function remove(storagePath) {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([storagePath]);
  if (error) throw error;
}

async function list(familyId, section) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(`${familyId}/${section}`);
  if (error) throw error;
  return data || [];
}

module.exports = { upload, remove, list, isHeic, toJpegIfHeic };
