const { Router } = require('express');
const requireAuth = require('../../middleware/requireAuth');
const bookService = require('../../services/bookService');

const router = Router();

// All routes require auth
router.use(requireAuth);

// ── Helpers ──

function requireAlbumType(req, res) {
  if (req.family.book_type !== 'family_album') {
    res.status(400).json({ error: 'This account is not a family album.' });
    return false;
  }
  return true;
}

// GET /api/album — return full album data + family info
router.get('/', async (req, res, next) => {
  try {
    if (!requireAlbumType(req, res)) return;
    const book = await bookService.getFamilyAlbumBook(req.family.id);
    res.json({
      family: {
        id: req.family.id,
        display_name: req.family.display_name,
        book_type: req.family.book_type,
        subdomain: req.family.subdomain,
        custom_domain: req.family.custom_domain,
      },
      album: book?.family_album_data || {},
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/album — replace entire album data blob
router.put('/', async (req, res, next) => {
  try {
    if (!requireAlbumType(req, res)) return;
    const { album } = req.body;
    if (!album || typeof album !== 'object') {
      return res.status(400).json({ error: 'album object required in request body' });
    }
    const book = await bookService.updateFamilyAlbumData(req.family.id, album);
    res.json({ success: true, album: book.family_album_data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/album/welcome — save top-level welcome fields
router.put('/welcome', async (req, res, next) => {
  try {
    if (!requireAlbumType(req, res)) return;
    const current = await bookService.getFamilyAlbumBook(req.family.id);
    const cur = current?.family_album_data || {};
    const { family_name, established_year, hometown, welcome_quote, welcome_quote_attribution, welcome_texts, stats } = req.body;
    const updated = {
      ...cur,
      ...(family_name !== undefined && { family_name }),
      ...(established_year !== undefined && { established_year }),
      ...(hometown !== undefined && { hometown }),
      ...(welcome_quote !== undefined && { welcome_quote }),
      ...(welcome_quote_attribution !== undefined && { welcome_quote_attribution }),
      ...(welcome_texts !== undefined && { welcome_texts }),
      ...(stats !== undefined && { stats }),
    };
    const book = await bookService.updateFamilyAlbumData(req.family.id, updated);
    res.json({ success: true, album: book.family_album_data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/album/our_story
router.put('/our_story', async (req, res, next) => {
  try {
    if (!requireAlbumType(req, res)) return;
    const current = await bookService.getFamilyAlbumBook(req.family.id);
    const cur = current?.family_album_data || {};
    const book = await bookService.updateFamilyAlbumData(req.family.id, { ...cur, our_story: req.body });
    res.json({ success: true, album: book.family_album_data });
  } catch (err) { next(err); }
});

// PUT /api/album/roots
router.put('/roots', async (req, res, next) => {
  try {
    if (!requireAlbumType(req, res)) return;
    const current = await bookService.getFamilyAlbumBook(req.family.id);
    const cur = current?.family_album_data || {};
    const book = await bookService.updateFamilyAlbumData(req.family.id, { ...cur, roots: req.body });
    res.json({ success: true, album: book.family_album_data });
  } catch (err) { next(err); }
});

// PUT /api/album/home
router.put('/home', async (req, res, next) => {
  try {
    if (!requireAlbumType(req, res)) return;
    const current = await bookService.getFamilyAlbumBook(req.family.id);
    const cur = current?.family_album_data || {};
    const book = await bookService.updateFamilyAlbumData(req.family.id, { ...cur, home: req.body });
    res.json({ success: true, album: book.family_album_data });
  } catch (err) { next(err); }
});

// PUT /api/album/years — full array replacement
router.put('/years', async (req, res, next) => {
  try {
    if (!requireAlbumType(req, res)) return;
    const { years } = req.body;
    if (!Array.isArray(years)) return res.status(400).json({ error: 'years must be an array' });
    const current = await bookService.getFamilyAlbumBook(req.family.id);
    const cur = current?.family_album_data || {};
    const book = await bookService.updateFamilyAlbumData(req.family.id, { ...cur, years });
    res.json({ success: true, album: book.family_album_data });
  } catch (err) { next(err); }
});

// PUT /api/album/family_members — full array replacement
router.put('/family_members', async (req, res, next) => {
  try {
    if (!requireAlbumType(req, res)) return;
    const { family_members } = req.body;
    if (!Array.isArray(family_members)) return res.status(400).json({ error: 'family_members must be an array' });
    const current = await bookService.getFamilyAlbumBook(req.family.id);
    const cur = current?.family_album_data || {};
    const book = await bookService.updateFamilyAlbumData(req.family.id, { ...cur, family_members });
    res.json({ success: true, album: book.family_album_data });
  } catch (err) { next(err); }
});

// PUT /api/album/adventures — full array replacement
router.put('/adventures', async (req, res, next) => {
  try {
    if (!requireAlbumType(req, res)) return;
    const { adventures } = req.body;
    if (!Array.isArray(adventures)) return res.status(400).json({ error: 'adventures must be an array' });
    const current = await bookService.getFamilyAlbumBook(req.family.id);
    const cur = current?.family_album_data || {};
    const book = await bookService.updateFamilyAlbumData(req.family.id, { ...cur, adventures });
    res.json({ success: true, album: book.family_album_data });
  } catch (err) { next(err); }
});

// PUT /api/album/traditions
router.put('/traditions', async (req, res, next) => {
  try {
    if (!requireAlbumType(req, res)) return;
    const current = await bookService.getFamilyAlbumBook(req.family.id);
    const cur = current?.family_album_data || {};
    const book = await bookService.updateFamilyAlbumData(req.family.id, { ...cur, traditions: req.body });
    res.json({ success: true, album: book.family_album_data });
  } catch (err) { next(err); }
});

// PUT /api/album/letters — full array replacement
router.put('/letters', async (req, res, next) => {
  try {
    if (!requireAlbumType(req, res)) return;
    const { letters } = req.body;
    if (!Array.isArray(letters)) return res.status(400).json({ error: 'letters must be an array' });
    const current = await bookService.getFamilyAlbumBook(req.family.id);
    const cur = current?.family_album_data || {};
    const book = await bookService.updateFamilyAlbumData(req.family.id, { ...cur, letters });
    res.json({ success: true, album: book.family_album_data });
  } catch (err) { next(err); }
});

// PUT /api/album/recipes — full array replacement
router.put('/recipes', async (req, res, next) => {
  try {
    if (!requireAlbumType(req, res)) return;
    const { recipes } = req.body;
    if (!Array.isArray(recipes)) return res.status(400).json({ error: 'recipes must be an array' });
    const current = await bookService.getFamilyAlbumBook(req.family.id);
    const cur = current?.family_album_data || {};
    const book = await bookService.updateFamilyAlbumData(req.family.id, { ...cur, recipes });
    res.json({ success: true, album: book.family_album_data });
  } catch (err) { next(err); }
});

// PUT /api/album/vault
router.put('/vault', async (req, res, next) => {
  try {
    if (!requireAlbumType(req, res)) return;
    const current = await bookService.getFamilyAlbumBook(req.family.id);
    const cur = current?.family_album_data || {};
    const book = await bookService.updateFamilyAlbumData(req.family.id, { ...cur, vault: req.body });
    res.json({ success: true, album: book.family_album_data });
  } catch (err) { next(err); }
});

module.exports = router;
