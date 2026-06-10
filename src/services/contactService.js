/**
 * Contact list + Circles (migration 029). A parent keeps a master contact list
 * per book and organizes people into named Circles (many-to-many). Phase 1 is
 * management only (no notifications yet — that's Phase 2 / notify()).
 *
 * Shared by the web editor (/account/book/circles) and the app (CirclesScreen)
 * so both behave identically (parity rule). Service-role only.
 */
const { supabaseAdmin } = require('../config/supabase');

const MAX_NAME = 120;

// ---- Contacts -------------------------------------------------------------

/** All non-archived contacts for a book, each with its circle_ids[]. */
async function listContacts(bookId) {
  const { data: contacts } = await supabaseAdmin
    .from('book_contacts')
    .select('*')
    .eq('book_id', bookId)
    .is('archived_at', null)
    .order('name');
  const list = contacts || [];
  if (!list.length) return [];
  const ids = list.map((c) => c.id);
  const { data: members } = await supabaseAdmin
    .from('circle_members')
    .select('circle_id, contact_id')
    .in('contact_id', ids);
  const byContact = {};
  for (const m of (members || [])) (byContact[m.contact_id] = byContact[m.contact_id] || []).push(m.circle_id);
  return list.map((c) => ({ ...c, circle_ids: byContact[c.id] || [] }));
}

async function addContact(bookId, { name, email, phone } = {}) {
  const clean = (name || '').trim().slice(0, MAX_NAME);
  if (!clean) throw new Error('A name is required.');
  const { data, error } = await supabaseAdmin
    .from('book_contacts')
    .insert({
      book_id: bookId,
      name: clean,
      email: (email || '').trim() || null,
      phone: (phone || '').trim() || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return { ...data, circle_ids: [] };
}

async function updateContact(bookId, contactId, { name, email, phone } = {}) {
  const patch = {};
  if (name !== undefined) patch.name = (name || '').trim().slice(0, MAX_NAME);
  if (email !== undefined) patch.email = (email || '').trim() || null;
  if (phone !== undefined) patch.phone = (phone || '').trim() || null;
  const { data } = await supabaseAdmin
    .from('book_contacts')
    .update(patch)
    .eq('id', contactId)
    .eq('book_id', bookId)
    .select('*')
    .maybeSingle();
  return data || null;
}

/** Soft-delete a contact — its magic link stops working (archived contacts are ignored). */
async function archiveContact(bookId, contactId) {
  await supabaseAdmin
    .from('book_contacts')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', contactId)
    .eq('book_id', bookId);
  return true;
}

// ---- Circles --------------------------------------------------------------

/** All non-archived circles for a book, each with member contact_ids[]. */
async function listCircles(bookId) {
  const { data: circles } = await supabaseAdmin
    .from('circles')
    .select('*')
    .eq('book_id', bookId)
    .is('archived_at', null)
    .order('sort_order');
  const list = circles || [];
  if (!list.length) return [];
  const ids = list.map((c) => c.id);
  const { data: members } = await supabaseAdmin
    .from('circle_members')
    .select('circle_id, contact_id')
    .in('circle_id', ids);
  const byCircle = {};
  for (const m of (members || [])) (byCircle[m.circle_id] = byCircle[m.circle_id] || []).push(m.contact_id);
  return list.map((c) => ({ ...c, contact_ids: byCircle[c.id] || [], member_count: (byCircle[c.id] || []).length }));
}

async function createCircle(bookId, name) {
  const clean = (name || '').trim().slice(0, MAX_NAME);
  if (!clean) throw new Error('A circle name is required.');
  const { data: last } = await supabaseAdmin
    .from('circles').select('sort_order').eq('book_id', bookId)
    .order('sort_order', { ascending: false }).limit(1);
  const sort = (last && last[0] && last[0].sort_order != null) ? last[0].sort_order + 1 : 0;
  const { data, error } = await supabaseAdmin
    .from('circles')
    .insert({ book_id: bookId, name: clean, sort_order: sort })
    .select('*').single();
  if (error) throw error;
  return { ...data, contact_ids: [], member_count: 0 };
}

async function renameCircle(bookId, circleId, name) {
  const { data } = await supabaseAdmin
    .from('circles')
    .update({ name: (name || '').trim().slice(0, MAX_NAME) || 'Circle' })
    .eq('id', circleId).eq('book_id', bookId)
    .select('*').maybeSingle();
  return data || null;
}

async function archiveCircle(bookId, circleId) {
  await supabaseAdmin
    .from('circles')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', circleId).eq('book_id', bookId);
  // circle_members rows cascade-delete only on hard delete; clean them here too.
  await supabaseAdmin.from('circle_members').delete().eq('circle_id', circleId);
  return true;
}

// ---- Membership -----------------------------------------------------------

/** Verify a contact + circle both belong to this book (prevents cross-book tampering). */
async function _ownsContact(bookId, contactId) {
  const { data } = await supabaseAdmin
    .from('book_contacts').select('id').eq('id', contactId).eq('book_id', bookId).maybeSingle();
  return !!data;
}

/** Replace a contact's circle memberships with the given circleIds (all on this book). */
async function setContactCircles(bookId, contactId, circleIds) {
  if (!(await _ownsContact(bookId, contactId))) return false;
  // Only circles that belong to this book.
  const { data: validCircles } = await supabaseAdmin
    .from('circles').select('id').eq('book_id', bookId).is('archived_at', null)
    .in('id', Array.isArray(circleIds) && circleIds.length ? circleIds : ['00000000-0000-0000-0000-000000000000']);
  const valid = (validCircles || []).map((c) => c.id);
  await supabaseAdmin.from('circle_members').delete().eq('contact_id', contactId);
  if (valid.length) {
    await supabaseAdmin.from('circle_members').insert(valid.map((cid) => ({ circle_id: cid, contact_id: contactId })));
  }
  return true;
}

/** Magic-link lookup (Phase 2): find an active contact by access token. */
async function findContactByToken(token) {
  if (!token) return null;
  const { data } = await supabaseAdmin
    .from('book_contacts').select('*').eq('access_token', token).is('archived_at', null).maybeSingle();
  return data || null;
}

module.exports = {
  listContacts, addContact, updateContact, archiveContact,
  listCircles, createCircle, renameCircle, archiveCircle,
  setContactCircles, findContactByToken,
};
