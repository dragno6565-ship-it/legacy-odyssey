const express = require('express');
const router = express.Router();
const stream = require('../../services/cloudflareStreamService');

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

module.exports = router;
