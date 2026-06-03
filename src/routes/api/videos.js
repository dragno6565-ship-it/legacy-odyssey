const express = require('express');
const router = express.Router();
const stream = require('../../services/cloudflareStreamService');
const videoService = require('../../services/videoService');
const bookService = require('../../services/bookService');
const requireAuth = require('../../middleware/requireAuth');

async function appBookId(req) {
  const b = await bookService.getBookByFamilyId(req.family.id);
  return b ? b.id : null;
}

// GET /api/videos/health — confirms the backend can authenticate with Cloudflare
// Stream. Booleans + error summary only; no secrets or data. Used to verify the
// env-var setup end-to-end. (More endpoints — mint upload, webhook, CRUD — are
// added to this router as the video feature is built.)
router.get('/health', async (req, res, next) => {
  try {
    const result = await stream.verify();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── App (JWT) endpoints — mirror the web /account/book/videos* routes ─────────
// requireAuth is applied per-route so /health stays public.

// List videos for a context. GET /api/videos/mine?context=moments[&celebrationId=&familyMemberId=]
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const bid = await appBookId(req);
    if (!bid) return res.json({ videos: [], totalSec: 0, capSec: videoService.SITE_CAP_SECONDS });
    const videos = await videoService.listByContext(bid, {
      context: req.query.context || 'moments',
      celebrationId: req.query.celebrationId || null,
      familyMemberId: req.query.familyMemberId || null,
    });
    res.json({ videos, totalSec: await videoService.totalSeconds(bid), capSec: videoService.SITE_CAP_SECONDS });
  } catch (err) { next(err); }
});

// Mint a direct-upload URL. POST /api/videos/mine  { context, celebrationId?, familyMemberId? }
router.post('/mine', requireAuth, async (req, res, next) => {
  try {
    const bid = await appBookId(req);
    if (!bid) return res.status(400).json({ error: 'No book found.' });
    const { context, celebrationId, familyMemberId } = req.body;
    const r = await videoService.createUpload(bid, { context, celebrationId, familyMemberId });
    res.json({ uploadURL: r.uploadURL, videoId: r.video.id, maxDurationSeconds: stream.MAX_DURATION_SECONDS });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.post('/mine/:id/finalize', requireAuth, async (req, res, next) => {
  try {
    const bid = await appBookId(req);
    const v = await videoService.getOne(bid, req.params.id);
    if (!v) return res.status(404).json({ error: 'Not found.' });
    res.json(await videoService.refresh(bid, v));
  } catch (err) { next(err); }
});

router.put('/mine/:id/caption', requireAuth, async (req, res, next) => {
  try {
    const bid = await appBookId(req);
    res.json(await videoService.setCaption(bid, req.params.id, req.body.caption));
  } catch (err) { next(err); }
});

router.delete('/mine/:id', requireAuth, async (req, res, next) => {
  try {
    const bid = await appBookId(req);
    await videoService.remove(bid, req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
