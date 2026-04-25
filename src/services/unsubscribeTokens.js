/**
 * Signed unsubscribe tokens for the drip-campaign emails.
 *
 * Token format:  base64url(`${familyId}.${exp}.${hmac}`)
 * where hmac = HMAC-SHA256(SESSION_SECRET, `${familyId}.${exp}`).
 *
 * Tokens don't expire by default (exp=0) so a customer can click an
 * old email link a year later. If you want expiring tokens, pass a
 * Date for ttlMs.
 */
const crypto = require('crypto');

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET required for unsubscribe tokens');
  return s;
}

function generateUnsubscribeToken(familyId, { ttlMs = 0 } = {}) {
  const exp = ttlMs > 0 ? Date.now() + ttlMs : 0;
  const payload = `${familyId}.${exp}`;
  const hmac = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex').slice(0, 24);
  return Buffer.from(`${payload}.${hmac}`).toString('base64url');
}

function verifyUnsubscribeToken(token) {
  if (!token) return null;
  let decoded;
  try { decoded = Buffer.from(token, 'base64url').toString(); }
  catch { return null; }
  const parts = decoded.split('.');
  if (parts.length !== 3) return null;
  const [familyId, expStr, hmac] = parts;
  const payload = `${familyId}.${expStr}`;
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex').slice(0, 24);
  // constant-time compare
  if (hmac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) return null;
  const exp = parseInt(expStr, 10) || 0;
  if (exp > 0 && Date.now() > exp) return null;
  // Basic UUID sanity check
  if (!/^[0-9a-f-]{36}$/.test(familyId)) return null;
  return familyId;
}

function buildUnsubscribeUrl(familyId, baseUrl = 'https://legacyodyssey.com') {
  return `${baseUrl}/unsubscribe?token=${generateUnsubscribeToken(familyId)}`;
}

module.exports = {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  buildUnsubscribeUrl,
};
