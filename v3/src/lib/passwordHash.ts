/**
 * HMAC-SHA256 hashing for the book-password cookie.
 *
 * Direct port of hashPassword() from src/middleware/requireBookPassword.js,
 * but using the Web Crypto API instead of Node's `crypto` (Web Crypto is
 * native to Workers and bundles smaller).
 *
 * The hash MUST be byte-identical to the Node version so the cookie set by
 * v3 verifies on v2.2.0 (and vice versa) during the parallel-run phase.
 * Verified by setting the same (password, familyId, secret) and comparing.
 */

const encoder = new TextEncoder();

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPassword(
  password: string,
  familyId: string,
  sessionSecret: string
): Promise<string> {
  const key = await hmacKey(sessionSecret);
  const message = `${familyId}:${password.toLowerCase()}`;
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return bytesToHex(sig);
}

/**
 * Constant-time string comparison to thwart timing attacks on cookie verification.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
