/**
 * Cloudflare Stream wrapper — video upload/transcode/delivery for the video
 * feature (Video Moments + Celebration + Family videos).
 *
 * Bytes never touch Railway: the client uploads directly to a one-time URL we
 * mint here, Cloudflare transcodes to HLS and serves off its own CDN (so video
 * egress stays OFF Supabase/Railway). We only persist metadata in `videos`.
 *
 * Requires Railway env vars (add via the Cloudflare dashboard, never in chat):
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_STREAM_API_TOKEN   (scoped: Account → Stream → Edit)
 */

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_STREAM_API_TOKEN;
const BASE = ACCOUNT_ID
  ? `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream`
  : null;

// Per-clip cap (seconds). Dan 2026-06-03: up to 2 minutes.
const MAX_DURATION_SECONDS = 120;

function isConfigured() {
  return Boolean(ACCOUNT_ID && API_TOKEN);
}

function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${API_TOKEN}`, ...extra };
}

async function cf(path, options = {}) {
  if (!isConfigured()) {
    const err = new Error('Cloudflare Stream is not configured (missing CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_STREAM_API_TOKEN).');
    err.code = 'STREAM_NOT_CONFIGURED';
    throw err;
  }
  const res = await fetch(`${BASE}${path}`, options);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const msg = (json.errors && json.errors[0] && json.errors[0].message) || `Cloudflare Stream error (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return json.result;
}

/**
 * Mint a one-time direct-creator-upload URL. The client PUTs the file to
 * `uploadURL`; we store `uid`. maxDurationSeconds makes Cloudflare reject
 * anything longer than the per-clip cap at ingest.
 * @returns {Promise<{ uid: string, uploadURL: string }>}
 */
async function createDirectUpload(meta = {}) {
  return cf('/direct_upload', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      maxDurationSeconds: MAX_DURATION_SECONDS,
      requireSignedURLs: false,
      meta,
    }),
  });
}

/**
 * Fetch a video's processing state. Used by the webhook fallback / polling.
 * @returns {Promise<{ uid, status, duration, thumbnail, readyToStream, ... }>}
 */
async function getVideo(uid) {
  return cf(`/${encodeURIComponent(uid)}`, { headers: authHeaders() });
}

async function deleteVideo(uid) {
  if (!uid) return;
  try {
    await cf(`/${encodeURIComponent(uid)}`, { method: 'DELETE', headers: authHeaders() });
  } catch (err) {
    // Non-fatal: if the remote video is already gone, the DB row still gets removed.
    if (err.status !== 404) throw err;
  }
}

/**
 * Best-effort: total Stream minutes DELIVERED (viewed) since `sinceDate`
 * (YYYY-MM-DD), via Cloudflare's GraphQL Analytics API. Used by the usage
 * monitor to watch bandwidth cost. Returns a number, or null if it can't be
 * read (e.g. the token lacks Analytics:Read — non-fatal, the monitor still
 * reports storage). Note: GraphQL analytics may require the token to also have
 * Account Analytics → Read in addition to Stream → Edit.
 * @returns {Promise<number|null>}
 */
async function getDeliveredMinutes(sinceDate) {
  if (!isConfigured()) return null;
  const query = `query($tag:string!,$since:string!){viewer{accounts(filter:{accountTag:$tag}){streamMinutesViewedAdaptiveGroups(filter:{date_geq:$since},limit:1){sum{minutesViewed}}}}}`;
  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ query, variables: { tag: ACCOUNT_ID, since: sinceDate } }),
    });
    const json = await res.json().catch(() => ({}));
    const groups = json?.data?.viewer?.accounts?.[0]?.streamMinutesViewedAdaptiveGroups;
    if (!Array.isArray(groups) || !groups[0]) return 0;
    return Number(groups[0].sum?.minutesViewed || 0);
  } catch (_) {
    return null;
  }
}

/**
 * Lightweight connectivity check: confirms the env vars exist AND the token can
 * actually authenticate against the Stream API (lists 1 video). Returns booleans
 * + an error summary only — never leaks the token or any data.
 */
async function verify() {
  if (!isConfigured()) return { configured: false, reachable: false, error: 'CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_STREAM_API_TOKEN not set' };
  try {
    await cf('?limit=1', { headers: authHeaders() });
    return { configured: true, reachable: true, error: null };
  } catch (err) {
    return { configured: true, reachable: false, error: err.message };
  }
}

module.exports = {
  isConfigured,
  createDirectUpload,
  getVideo,
  deleteVideo,
  getDeliveredMinutes,
  verify,
  MAX_DURATION_SECONDS,
};
