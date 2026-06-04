const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const galleryService = require('../../services/galleryService');
const bookService = require('../../services/bookService');
const { getPublicUrl } = require('../../utils/imageUrl');

router.use(requireAuth);

async function bid(req) {
  const b = await bookService.getBookByFamilyId(req.family.id);
  return b ? b.id : null;
}
function withUrls(g) {
  return { ...g, photos: (g.photos || []).map((p) => ({ ...p, url: getPublicUrl(p.photo_path) })) };
}

// GET /api/galleries/mine — all galleries with photos
router.get('/mine', async (req, res, next) => {
  try {
    const id = await bid(req);
    const galleries = id ? await galleryService.listGalleries(id) : [];
    res.json({ galleries: galleries.map(withUrls), maxPhotos: galleryService.MAX_PHOTOS });
  } catch (err) { next(err); }
});

router.get('/mine/:id', async (req, res, next) => {
  try {
    const g = await galleryService.getGallery(await bid(req), req.params.id);
    if (!g) return res.status(404).json({ error: 'Not found.' });
    res.json({ gallery: withUrls(g), maxPhotos: galleryService.MAX_PHOTOS });
  } catch (err) { next(err); }
});

router.post('/mine', async (req, res, next) => {
  try {
    const id = await bid(req);
    if (!id) return res.status(400).json({ error: 'No book found.' });
    res.json(await galleryService.createGallery(id, req.body.title));
  } catch (err) { next(err); }
});

router.put('/mine/:id', async (req, res, next) => {
  try { res.json(await galleryService.renameGallery(await bid(req), req.params.id, req.body.title)); } catch (err) { next(err); }
});

router.delete('/mine/:id', async (req, res, next) => {
  try { await galleryService.deleteGallery(await bid(req), req.params.id); res.json({ success: true }); } catch (err) { next(err); }
});

// POST /api/galleries/mine/:id/photos  { paths: [] } (client uploaded each via /api/upload). Caps at 21.
router.post('/mine/:id/photos', async (req, res, next) => {
  try {
    const added = await galleryService.addPhotos(await bid(req), req.params.id, Array.isArray(req.body.paths) ? req.body.paths : []);
    res.json({ added: added.map((p) => ({ ...p, url: getPublicUrl(p.photo_path) })) });
  } catch (err) { next(err); }
});

router.put('/mine/photo/:pid', async (req, res, next) => {
  try { res.json(await galleryService.setCaption(await bid(req), req.params.pid, req.body.caption)); } catch (err) { next(err); }
});

router.delete('/mine/photo/:pid', async (req, res, next) => {
  try { await galleryService.deletePhoto(await bid(req), req.params.pid); res.json({ success: true }); } catch (err) { next(err); }
});

module.exports = router;
