const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const contactService = require('../../services/contactService');
const bookService = require('../../services/bookService');

router.use(requireAuth);

async function bid(req) {
  const b = await bookService.getBookByFamilyId(req.family.id);
  return b ? b.id : null;
}

// GET /api/contacts/mine — contacts + circles for this book
router.get('/mine', async (req, res, next) => {
  try {
    const id = await bid(req);
    if (!id) return res.json({ contacts: [], circles: [] });
    const [contacts, circles] = await Promise.all([
      contactService.listContacts(id),
      contactService.listCircles(id),
    ]);
    res.json({ contacts, circles });
  } catch (err) { next(err); }
});

// Contacts
router.post('/mine/contacts', async (req, res, next) => {
  try { res.json(await contactService.addContact(await bid(req), req.body)); } catch (err) { next(err); }
});
// Bulk import from the phone's address book (app-only). Body: { people: [{name,email,phone}] }.
// De-dupes against existing contacts + within the batch. Returns { imported, skipped, contacts }.
router.post('/mine/contacts/import', async (req, res, next) => {
  try {
    const id = await bid(req);
    if (!id) return res.status(404).json({ error: 'No book found' });
    const people = Array.isArray(req.body && req.body.people) ? req.body.people : [];
    res.json(await contactService.importContacts(id, people));
  } catch (err) { next(err); }
});

// App-only: build the pre-filled text for the device's native Messages app.
// Returns { phone, message } with the contact's private magic link. The app
// opens the phone's own SMS composer with this and the user sends it from their
// own number — NO server-sent SMS (no provider / 10DLC needed).
router.get('/mine/contacts/:id/sms', async (req, res, next) => {
  try {
    const id = await bid(req);
    if (!id) return res.status(404).json({ error: 'No book found' });
    const contacts = await contactService.listContacts(id);
    const c = contacts.find((x) => x.id === req.params.id);
    if (!c) return res.status(404).json({ error: 'Contact not found' });
    if (!c.phone) return res.status(400).json({ error: 'That contact has no phone number.' });
    const f = req.family;
    const bookUrl = f.custom_domain ? `https://www.${f.custom_domain}` : `https://${f.subdomain}.legacyodyssey.com`;
    const { computeSiteLabel } = require('../../middleware/requireBookPassword');
    const siteLabel = await computeSiteLabel(f);
    const section = (req.query.section || '').trim();
    const anchor = /^[a-z0-9-]{1,64}$/i.test(section) ? `#${section}` : '';
    const link = `${bookUrl}/?circle=${c.access_token}${anchor}`;
    const message = `There's something new on ${siteLabel} — take a look (no password needed): ${link}`;
    res.json({ phone: c.phone, name: c.name, message });
  } catch (err) { next(err); }
});
// Share targets for the app's scope picker: which sections (have content) +
// which photo galleries this book has, so the app can offer "whole website /
// a section / a specific gallery". Mirrors the web section picker.
router.get('/mine/share-targets', async (req, res, next) => {
  try {
    const f = req.family;
    const bookService = require('../../services/bookService');
    const fb = await bookService.getFullBook(f.id);
    const vs = (fb && fb.visibleSections) || {};
    const LABELS = { welcome: 'Welcome', before: 'Before You Arrived', birth: 'Birth Story', birthday: 'Your Birth Day', journey: 'Your Journey to Us', home: 'Coming Home', months: 'Month by Month', family: 'Our Family', firsts: 'Your Firsts', holidays: 'Celebrations', moments: 'Video Moments', letters: 'Letters', recipes: 'Recipes', keepsakes: 'Keepsakes', vault: 'The Vault' };
    const ORDER = ['welcome', 'before', 'birth', 'birthday', 'journey', 'home', 'months', 'family', 'firsts', 'holidays', 'moments', 'letters', 'recipes', 'keepsakes', 'vault'];
    const sections = ORDER.filter((k) => k === 'welcome' || vs[k]).map((k) => ({ value: k, label: LABELS[k] }));
    const galleries = ((fb && fb.customGalleries) || [])
      .filter((g) => g.photos && g.photos.length)
      .map((g) => ({ id: g.id, title: g.title || 'Untitled gallery' }));
    res.json({ sections, galleries });
  } catch (err) { next(err); }
});

// App-only: build the text for a GROUP share. One message to many recipients
// can't carry each person's private magic link, so a group text uses the public
// site link + the book password (which the owner is choosing to share). Optional
// ?section=section-key deep-links to the page/section that changed.
router.get('/mine/share-text', async (req, res, next) => {
  try {
    const id = await bid(req);
    if (!id) return res.status(404).json({ error: 'No book found' });
    const f = req.family;
    const bookUrl = f.custom_domain ? `https://www.${f.custom_domain}` : `https://${f.subdomain}.legacyodyssey.com`;
    const section = (req.query.section || '').trim();
    const anchor = /^[a-z0-9-]{1,64}$/i.test(section) ? `#${section}` : '';
    const link = `${bookUrl}/${anchor}`;
    const { computeSiteLabel } = require('../../middleware/requireBookPassword');
    const siteLabel = await computeSiteLabel(f);
    const pw = f.book_password;
    const message = pw
      ? `There's something new on ${siteLabel} — take a look: ${link} (password: ${pw})`
      : `There's something new on ${siteLabel} — take a look: ${link}`;
    res.json({ message, siteUrl: link, hasPassword: !!pw });
  } catch (err) { next(err); }
});
router.put('/mine/contacts/:id', async (req, res, next) => {
  try { res.json(await contactService.updateContact(await bid(req), req.params.id, req.body)); } catch (err) { next(err); }
});
router.delete('/mine/contacts/:id', async (req, res, next) => {
  try { await contactService.archiveContact(await bid(req), req.params.id); res.json({ success: true }); } catch (err) { next(err); }
});
router.put('/mine/contacts/:id/circles', async (req, res, next) => {
  try {
    const ok = await contactService.setContactCircles(await bid(req), req.params.id, req.body.circleIds || []);
    res.json({ success: ok });
  } catch (err) { next(err); }
});

// Notify (Phase 2) — email a circle (or everyone) their magic links.
// Body: { circleId?: uuid|null, note?: string }. 429 on the per-book cooldown.
router.post('/mine/notify', async (req, res) => {
  try {
    const id = await bid(req);
    if (!id) return res.status(404).json({ error: 'No book found' });
    const f = req.family;
    const bookUrl = f.custom_domain
      ? `https://www.${f.custom_domain}`
      : `https://${f.subdomain}.legacyodyssey.com`;
    const { computeSiteLabel } = require('../../middleware/requireBookPassword');
    const siteLabel = await computeSiteLabel(f);
    const result = await contactService.notifyCircle({
      bookId: id,
      circleId: (req.body.circleId || '').trim() || null,
      contactId: (req.body.contactId || '').trim() || null,
      contactIds: Array.isArray(req.body.contactIds) ? req.body.contactIds : null,
      section: (req.body.section || '').trim() || null,
      note: req.body.note,
      bookUrl,
      siteLabel,
      senderName: f.display_name || null,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    const cooldown = /just sent an update/i.test(err.message || '');
    res.status(cooldown ? 429 : 400).json({ error: err.message || 'Could not send the update.' });
  }
});

// Circles
router.post('/mine/circles', async (req, res, next) => {
  try { res.json(await contactService.createCircle(await bid(req), req.body.name)); } catch (err) { next(err); }
});
router.put('/mine/circles/:id', async (req, res, next) => {
  try { res.json(await contactService.renameCircle(await bid(req), req.params.id, req.body.name)); } catch (err) { next(err); }
});
router.delete('/mine/circles/:id', async (req, res, next) => {
  try { await contactService.archiveCircle(await bid(req), req.params.id); res.json({ success: true }); } catch (err) { next(err); }
});

module.exports = router;
