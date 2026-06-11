/**
 * Custom galleries — customer-created photo galleries with a custom title and
 * up to 50 captioned photos each. Backed by custom_galleries +
 * custom_gallery_photos (migration 028). Shared by web + app routes.
 */
const { supabaseAdmin } = require('../config/supabase');

const MAX_PHOTOS = 50;

// All galleries for a book, each with its photos (ordered).
async function listGalleries(bookId) {
  const { data: galleries } = await supabaseAdmin
    .from('custom_galleries').select('*').eq('book_id', bookId).order('sort_order');
  const list = galleries || [];
  if (!list.length) return [];
  const ids = list.map((g) => g.id);
  const { data: photos } = await supabaseAdmin
    .from('custom_gallery_photos').select('*').in('gallery_id', ids).order('sort_order');
  const byGallery = {};
  for (const p of (photos || [])) (byGallery[p.gallery_id] = byGallery[p.gallery_id] || []).push(p);
  return list.map((g) => ({ ...g, photos: byGallery[g.id] || [] }));
}

async function getGallery(bookId, galleryId) {
  const { data: g } = await supabaseAdmin
    .from('custom_galleries').select('*').eq('id', galleryId).eq('book_id', bookId).maybeSingle();
  if (!g) return null;
  const { data: photos } = await supabaseAdmin
    .from('custom_gallery_photos').select('*').eq('gallery_id', g.id).order('sort_order');
  return { ...g, photos: photos || [] };
}

async function createGallery(bookId, title) {
  const { data: last } = await supabaseAdmin
    .from('custom_galleries').select('sort_order').eq('book_id', bookId)
    .order('sort_order', { ascending: false }).limit(1);
  const sort = (last && last[0] && last[0].sort_order != null) ? last[0].sort_order + 1 : 0;
  const { data } = await supabaseAdmin
    .from('custom_galleries').insert({ book_id: bookId, title: title || 'Untitled Gallery', sort_order: sort })
    .select('*').single();
  return data;
}

async function renameGallery(bookId, galleryId, title) {
  const { data } = await supabaseAdmin
    .from('custom_galleries').update({ title: title || 'Untitled Gallery', updated_at: new Date().toISOString() })
    .eq('id', galleryId).eq('book_id', bookId).select('*').single();
  return data;
}

async function deleteGallery(bookId, galleryId) {
  await supabaseAdmin.from('custom_galleries').delete().eq('id', galleryId).eq('book_id', bookId);
  return true;
}

// Verify a photo belongs to a gallery owned by this book.
async function ownsPhoto(bookId, photoId) {
  const { data } = await supabaseAdmin
    .from('custom_gallery_photos').select('id, gallery_id, custom_galleries!inner(book_id)')
    .eq('id', photoId).maybeSingle();
  return data && data.custom_galleries && data.custom_galleries.book_id === bookId ? data : null;
}

/** Add photos (paths) to a gallery, capped at MAX_PHOTOS total. Returns the inserted rows. */
async function addPhotos(bookId, galleryId, paths) {
  const g = await getGallery(bookId, galleryId);
  if (!g) return [];
  const room = Math.max(0, MAX_PHOTOS - g.photos.length);
  const toAdd = (paths || []).slice(0, room);
  if (!toAdd.length) return [];
  let sort = g.photos.length;
  const rows = toAdd.map((p) => ({ gallery_id: galleryId, photo_path: p, sort_order: sort++ }));
  const { data } = await supabaseAdmin.from('custom_gallery_photos').insert(rows).select('*');
  return data || [];
}

async function setCaption(bookId, photoId, caption) {
  if (!(await ownsPhoto(bookId, photoId))) return null;
  const { data } = await supabaseAdmin
    .from('custom_gallery_photos').update({ caption: caption || null }).eq('id', photoId).select('*').single();
  return data;
}

async function deletePhoto(bookId, photoId) {
  if (!(await ownsPhoto(bookId, photoId))) return false;
  await supabaseAdmin.from('custom_gallery_photos').delete().eq('id', photoId);
  return true;
}

// Persist a new gallery order (array of gallery ids, first = top).
// UPDATE per row, scoped by book_id so foreign ids are ignored.
async function reorderGalleries(bookId, orderedIds) {
  if (!Array.isArray(orderedIds)) return false;
  await Promise.all(orderedIds.map((id, i) =>
    supabaseAdmin.from('custom_galleries')
      .update({ sort_order: i })
      .eq('id', id)
      .eq('book_id', bookId)
  ));
  return true;
}

module.exports = {
  MAX_PHOTOS,
  listGalleries, getGallery, createGallery, renameGallery, deleteGallery,
  addPhotos, setCaption, deletePhoto, reorderGalleries,
};
