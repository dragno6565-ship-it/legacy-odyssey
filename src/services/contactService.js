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
  // Alphabetical by name, case-insensitive + locale-aware. The DB `.order('name')`
  // above sorts case-SENSITIVELY (C-collation puts capitals before lowercase, so
  // "Zoe" would precede "adam"); this guarantees a true A→Z order on web + app.
  return list
    .map((c) => ({ ...c, circle_ids: byContact[c.id] || [] }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
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

/**
 * Bulk-import contacts (from the app's phone-address-book picker). De-dupes
 * against existing contacts AND within the incoming batch: a person is a
 * duplicate if their email matches, their phone (digits-only) matches, or —
 * when they have neither email nor phone — their name matches an existing one.
 * Imported rows are tagged source='import' when that column exists (migration
 * 030); if it hasn't been applied yet we transparently insert without it, so the
 * feature never depends on the migration. Returns { imported, skipped, contacts }.
 */
async function importContacts(bookId, people = []) {
  const normName = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normEmail = (s) => (s || '').trim().toLowerCase();
  const normPhone = (s) => (s || '').replace(/[^0-9]/g, '');

  const incoming = (Array.isArray(people) ? people : [])
    .map((p) => ({
      name: (p && p.name ? String(p.name) : '').trim().slice(0, MAX_NAME),
      email: (p && p.email ? String(p.email) : '').trim() || null,
      phone: (p && p.phone ? String(p.phone) : '').trim() || null,
    }))
    .filter((p) => p.name);

  if (!incoming.length) return { imported: 0, skipped: 0, contacts: [] };

  const existing = await listContacts(bookId);
  const emails = new Set(existing.map((c) => normEmail(c.email)).filter(Boolean));
  const phones = new Set(existing.map((c) => normPhone(c.phone)).filter(Boolean));
  const names = new Set(existing.map((c) => normName(c.name)).filter(Boolean));

  const toInsert = [];
  let skipped = 0;
  for (const p of incoming) {
    const e = normEmail(p.email);
    const ph = normPhone(p.phone);
    const n = normName(p.name);
    const dupe = (e && emails.has(e)) || (ph && phones.has(ph)) || (!e && !ph && n && names.has(n));
    if (dupe) { skipped++; continue; }
    toInsert.push(p);
    if (e) emails.add(e);
    if (ph) phones.add(ph);
    if (n) names.add(n);
  }

  if (!toInsert.length) return { imported: 0, skipped, contacts: [] };

  const rows = toInsert.map((p) => ({ book_id: bookId, name: p.name, email: p.email, phone: p.phone }));
  let { data, error } = await supabaseAdmin
    .from('book_contacts')
    .insert(rows.map((r) => ({ ...r, source: 'import' })))
    .select('*');
  if (error && /source/i.test(error.message || '') && /column|schema/i.test(error.message || '')) {
    // `source` column not migrated yet (030) — insert without it.
    ({ data, error } = await supabaseAdmin.from('book_contacts').insert(rows).select('*'));
  }
  if (error) throw error;
  return {
    imported: (data || []).length,
    skipped,
    contacts: (data || []).map((c) => ({ ...c, circle_ids: [] })),
  };
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

// ---- Notifications (Phase 2) ----------------------------------------------

const NOTIFY_COOLDOWN_MIN = 10; // one blast per book per N minutes

/** Stop receiving update emails. Used by /circle/unsubscribe/:token (GET + one-click POST). */
async function unsubscribeByToken(token) {
  const contact = await findContactByToken(token);
  if (!contact) return null;
  await supabaseAdmin
    .from('book_contacts')
    .update({ notify_opt_in: false, unsubscribed_at: new Date().toISOString() })
    .eq('id', contact.id);
  return contact;
}

/**
 * Email every opted-in contact in a circle (or the whole book when circleId is
 * null) their private magic link. Rate-limited to one blast per book per
 * NOTIFY_COOLDOWN_MIN minutes; writes a book_update_notifications audit row.
 * Shared by the web editor and the app API (parity rule).
 */
async function notifyCircle({ bookId, circleId = null, contactId = null, note = '', bookUrl, siteLabel, senderName }) {
  // Rate limit — protects inboxes from accidental double-blasts. Only applies to
  // BROADCASTS (Everyone / a circle); sending to a single chosen contact is a
  // deliberate one-off and skips the cooldown.
  if (!contactId) {
    const { data: lastBlast } = await supabaseAdmin
      .from('book_update_notifications')
      .select('sent_at').eq('book_id', bookId)
      .order('sent_at', { ascending: false }).limit(1);
    if (lastBlast && lastBlast[0]) {
      const ageMin = (Date.now() - new Date(lastBlast[0].sent_at).getTime()) / 60000;
      if (ageMin < NOTIFY_COOLDOWN_MIN) {
        throw new Error(`You just sent an update. To avoid flooding inboxes, you can send the next one in ${Math.ceil(NOTIFY_COOLDOWN_MIN - ageMin)} minute(s).`);
      }
    }
  }

  // Resolve recipients: a single contact, a circle, or everyone.
  let contacts = await listContacts(bookId);
  let circleName = null;
  if (contactId) {
    const one = contacts.find((c) => c.id === contactId);
    if (!one) throw new Error('That contact is no longer on your list.');
    if (!one.email) throw new Error(`${one.name || 'That contact'} has no email address — add one on their contact card to send them an update.`);
    if (one.notify_opt_in === false || one.unsubscribed_at) throw new Error(`${one.name || 'That contact'} has unsubscribed from updates.`);
    contacts = [one];
  } else if (circleId) {
    const circles = await listCircles(bookId);
    const circle = circles.find((c) => c.id === circleId);
    if (!circle) throw new Error('That circle no longer exists.');
    circleName = circle.name;
    const memberIds = new Set(circle.contact_ids);
    contacts = contacts.filter((c) => memberIds.has(c.id));
  }
  const seen = new Set();
  const recipients = contacts.filter((c) => {
    if (!c.email || c.notify_opt_in === false || c.unsubscribed_at) return false;
    const key = c.email.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (!recipients.length) {
    throw new Error(circleId
      ? 'No one in that circle has an email address (or they have unsubscribed).'
      : 'No one to notify yet — add people with email addresses first.');
  }

  const { sendOnboardingEmail } = require('./emailService');
  const safeNote = (note || '').trim().slice(0, 500);
  const results = await Promise.allSettled(recipients.map((c) => sendOnboardingEmail({
    to: c.email,
    subject: `Something new in ${siteLabel}`,
    preheader: 'Your private link is inside — no password needed.',
    heading: senderName ? `${senderName} just added something new` : 'Something new was just added',
    body: `There's something new waiting for you in ${siteLabel}.`
      + (safeNote ? `<br><br><em>&ldquo;${safeNote.replace(/</g, '&lt;').replace(/>/g, '&gt;')}&rdquo;</em>` : '')
      + '<br><br>Use your private link below to take a look — no password needed.',
    ctaText: 'See What’s New',
    ctaUrl: `${bookUrl}/?circle=${c.access_token}`,
    unsubscribeUrl: `${bookUrl}/circle/unsubscribe/${c.access_token}`,
  })));
  const sent = results.filter((r) => r.status === 'fulfilled' && r.value).length;

  await supabaseAdmin.from('book_update_notifications').insert({
    book_id: bookId,
    circle_id: circleId,
    recipient_count: sent,
    note: safeNote || null,
  });

  return { sent, total: recipients.length, circleName };
}

module.exports = {
  listContacts, addContact, importContacts, updateContact, archiveContact,
  listCircles, createCircle, renameCircle, archiveCircle,
  setContactCircles, findContactByToken,
  unsubscribeByToken, notifyCircle,
};
