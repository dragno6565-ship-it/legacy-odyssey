const crypto = require('crypto');
const { supabaseAdmin } = require('../config/supabase');

function hashPassword(password, familyId) {
  return crypto
    .createHmac('sha256', process.env.SESSION_SECRET)
    .update(`${familyId}:${password.toLowerCase()}`)
    .digest('hex');
}

/**
 * Compute the public-facing label for a book ("The Smith Family Site").
 *  - Prefer child's first + last name from the books table
 *  - Fall back to the bare custom domain (without TLD) or subdomain
 *  - Always wrapped as "The X Site"
 */
async function computeSiteLabel(family) {
  if (!family) return 'Your Child\'s';

  // 1. Try child's first + last name
  try {
    const { data: book } = await supabaseAdmin
      .from('books')
      .select('child_first_name, child_last_name')
      .eq('family_id', family.id)
      .maybeSingle();
    const first = (book?.child_first_name || '').trim();
    const last = (book?.child_last_name || '').trim();
    const fullName = [first, last].filter(Boolean).join(' ');
    if (fullName) return `The ${fullName} Site`;
  } catch (err) {
    // fall through to fallback
  }

  // 2. Fall back to domain — strip the TLD if it's a custom domain ("reesetatler.com" → "reesetatler")
  if (family.custom_domain) {
    const bare = family.custom_domain.replace(/\.[a-z]{2,}$/i, '');
    return `The ${bare} Site`;
  }
  if (family.subdomain) return `The ${family.subdomain} Site`;
  return 'Your Child\'s Site';
}

async function requireBookPassword(req, res, next) {
  if (!req.family) {
    return res.status(404).render('book/not-found');
  }

  // If no password is set, allow access without password
  if (!req.family.book_password) {
    return next();
  }

  // Allow password bypass for mobile app preview via /book/:slug on Railway URL
  // (The Railway URL is only used by the mobile app; public legacyodyssey.com still enforces passwords)
  const host = req.hostname.toLowerCase();
  const isRailway = host.endsWith('.up.railway.app') ||
    host === (process.env.RAILWAY_PUBLIC_DOMAIN || '').toLowerCase();
  if (isRailway && req.path.startsWith('/book/')) {
    return next();
  }

  // Demo sites — always allow access regardless of password
  const DEMO_DOMAINS = ['your-childs-name.com', 'your-family-photo-album.com'];
  const bareHost = host.startsWith('www.') ? host.slice(4) : host;
  if (DEMO_DOMAINS.includes(bareHost)) {
    return next();
  }

  // Check for valid mobile app preview token in query string
  // (allows authenticated app users to bypass the password page)
  if (req.query.app_token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(req.query.app_token, process.env.JWT_SECRET);
      if (decoded && decoded.familyId === req.family.id) {
        return next(); // Valid app token, bypass password
      }
    } catch (e) {
      // Invalid token, fall through to password check
    }
  }

  const cookieName = `book_${req.family.id}`;
  const cookie = req.cookies?.[cookieName];
  const expected = hashPassword(req.family.book_password, req.family.id);

  if (cookie === expected) {
    return next();
  }

  // No valid cookie — show password screen
  const siteLabel = await computeSiteLabel(req.family);
  res.render('book/password', { family: req.family, siteLabel, error: false });
}

module.exports = { requireBookPassword, hashPassword, computeSiteLabel };
