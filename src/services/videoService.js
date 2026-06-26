/**
 * Video feature core logic (shared by web + app routes).
 *
 * Backed by the `videos` table (migration 026) + Cloudflare Stream. Enforces the
 * caps:  per-clip 2 min (Cloudflare maxDurationSeconds), per-site 1,000 min total,
 * one video per family member. Bytes upload directly to Cloudflare; we store only
 * metadata.
 */

const { supabaseAdmin } = require('../config/supabase');
const stream = require('./cloudflareStreamService');

const SITE_CAP_SECONDS = 1000 * 60; // 1,000 minutes per book

const VALID_CONTEXTS = ['moments', 'celebration', 'family_member'];

function err(message, status) {
  const e = new Error(message);
  e.status = status || 400;
  return e;
}

/** Total seconds of video already on this book (counts ready + still-uploading). */
async function totalSeconds(bookId) {
  const { data } = await supabaseAdmin
    .from('videos')
    .select('duration_sec')
    .eq('book_id', bookId);
  return (data || []).reduce((n, v) => n + (v.duration_sec || 0), 0);
}

/**
 * Mint a Cloudflare direct-upload URL and create the pending video row.
 * @returns {Promise<{ uploadURL: string, video: object }>}
 */
async function createUpload(bookId, { context, celebrationId = null, familyMemberId = null }) {
  if (!stream.isConfigured()) throw err('Video uploads are not available right now.', 503);
  if (!VALID_CONTEXTS.includes(context)) throw err('Invalid video context.', 400);
  if (context === 'celebration' && !celebrationId) throw err('A celebration is required.', 400);
  if (context === 'family_member' && !familyMemberId) throw err('A family member is required.', 400);

  // Per-site cap (storage). Each clip is <= 2 min, so checking "already at cap"
  // before minting keeps the total within ~one clip of the limit.
  if ((await totalSeconds(bookId)) >= SITE_CAP_SECONDS) {
    throw err('This site has reached its 1,000-minute video limit. Remove a video to add another.', 400);
  }

  // One video per family member (also DB-guarded by a partial unique index).
  if (context === 'family_member') {
    const { data: existing } = await supabaseAdmin
      .from('videos')
      .select('id')
      .eq('book_id', bookId)
      .eq('family_member_id', familyMemberId)
      .limit(1);
    if (existing && existing.length) throw err('This family member already has a video. Remove it to add a new one.', 400);
  }

  const upload = await stream.createDirectUpload({ bookId, context });
  const { data, error } = await supabaseAdmin
    .from('videos')
    .insert({
      book_id: bookId,
      context,
      celebration_id: context === 'celebration' ? celebrationId : null,
      family_member_id: context === 'family_member' ? familyMemberId : null,
      stream_uid: upload.uid,
      status: 'uploading',
    })
    .select('*')
    .single();
  if (error) {
    // Roll back the Cloudflare upload slot if the row couldn't be created.
    await stream.deleteVideo(upload.uid).catch(() => {});
    throw error;
  }
  return { uploadURL: upload.uploadURL, video: data };
}

/**
 * Refresh a video's status from Cloudflare (called after the client finishes
 * uploading, and lazily when listing). Flips uploading → ready and records
 * duration + poster once Cloudflare has transcoded it.
 */
async function refresh(bookId, video) {
  if (!video || video.status === 'ready') return video;
  try {
    const cf = await stream.getVideo(video.stream_uid);
    const ready = cf.readyToStream === true || (cf.status && cf.status.state === 'ready');
    const patch = {
      status: ready ? 'ready' : (cf.status && cf.status.state === 'error' ? 'error' : 'uploading'),
      duration_sec: Math.round(cf.duration || video.duration_sec || 0),
      poster_url: cf.thumbnail || video.poster_url || null,
      updated_at: new Date().toISOString(),
    };
    const { data } = await supabaseAdmin
      .from('videos').update(patch).eq('id', video.id).eq('book_id', bookId).select('*').single();
    return data || video;
  } catch (_) {
    return video;
  }
}

async function listByContext(bookId, { context, celebrationId = null, familyMemberId = null }) {
  let q = supabaseAdmin.from('videos').select('*').eq('book_id', bookId).eq('context', context).order('sort_order');
  if (context === 'celebration' && celebrationId) q = q.eq('celebration_id', celebrationId);
  if (context === 'family_member' && familyMemberId) q = q.eq('family_member_id', familyMemberId);
  const { data } = await q;
  const rows = data || [];
  // Lazily finalize any still-processing rows so the UI reflects "ready".
  const out = [];
  for (const v of rows) out.push(v.status === 'ready' ? v : await refresh(bookId, v));
  return out;
}

async function getOne(bookId, videoId) {
  const { data } = await supabaseAdmin.from('videos').select('*').eq('id', videoId).eq('book_id', bookId).single();
  return data || null;
}

async function setCaption(bookId, videoId, caption) {
  const { data } = await supabaseAdmin
    .from('videos').update({ caption: caption || null, updated_at: new Date().toISOString() })
    .eq('id', videoId).eq('book_id', bookId).select('*').single();
  return data;
}

async function remove(bookId, videoId) {
  const v = await getOne(bookId, videoId);
  if (!v) return false;
  await stream.deleteVideo(v.stream_uid).catch(() => {});
  await supabaseAdmin.from('videos').delete().eq('id', videoId).eq('book_id', bookId);
  return true;
}

// Reassign sort_order to match the given id order (scoped to this book).
async function reorder(bookId, ids) {
  if (!Array.isArray(ids) || !ids.length) return { success: true };
  for (let i = 0; i < ids.length; i++) {
    await supabaseAdmin.from('videos')
      .update({ sort_order: i, updated_at: new Date().toISOString() })
      .eq('id', ids[i]).eq('book_id', bookId);
  }
  return { success: true };
}

module.exports = {
  SITE_CAP_SECONDS,
  totalSeconds,
  createUpload,
  refresh,
  listByContext,
  getOne,
  setCaption,
  remove,
  reorder,
};
