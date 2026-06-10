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
