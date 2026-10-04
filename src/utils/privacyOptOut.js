/**
 * CCPA/CPRA "Do Not Sell or Share" + Global Privacy Control (GPC) handling.
 *
 * A visitor is treated as opted out of advertising "sale/sharing" when EITHER:
 *   - their browser sends the GPC signal (`Sec-GPC: 1` header), or
 *   - they submitted the /do-not-sell-or-share form (sets the lo_optout=1 cookie).
 *
 * Effect (see partials/tracking.ejs + utils/metaCapi.js):
 *   - Meta Pixel, Pinterest Tag and the Google Ads tag are not loaded; Google
 *     Consent Mode keeps ad_storage/ad_user_data/ad_personalization DENIED and
 *     restricted_data_processing is set. First-party analytics may still run.
 *   - Server-side Meta Conversions API events are skipped for that request, and
 *     for any email address recorded in the privacy_optouts table.
 *
 * The private book viewer (customer domains) never loads ad trackers at all.
 */
const OPTOUT_COOKIE = 'lo_optout';
const OPTOUT_COOKIE_MAX_AGE_MS = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years

function hasGpc(req) {
  const v = req && req.headers ? req.headers['sec-gpc'] : null;
  return v === '1' || v === 1;
}

function isAdOptOut(req) {
  if (!req) return false;
  if (hasGpc(req)) return true;
  const c = req.cookies || {};
  return c[OPTOUT_COOKIE] === '1';
}

// Email-level opt-outs (people who gave their email on the opt-out form). Small
// in-memory cache so a burst of events doesn't hit the DB repeatedly.
const cache = new Map(); // email -> { optedOut, at }
const CACHE_MS = 10 * 60 * 1000;
let tableMissingLogged = false;

async function isEmailOptedOut(email) {
  if (!email) return false;
  const key = String(email).trim().toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.optedOut;
  try {
    const { supabaseAdmin } = require('../config/supabase');
    const { data, error } = await supabaseAdmin
      .from('privacy_optouts')
      .select('id')
      .eq('email', key)
      .limit(1);
    if (error) throw error;
    const optedOut = !!(data && data.length);
    cache.set(key, { optedOut, at: Date.now() });
    return optedOut;
  } catch (err) {
    // Table not created yet (migration 034 pending) or transient error: fail
    // OPEN for the email check only; cookie/GPC checks above still apply.
    if (!tableMissingLogged) {
      console.warn('[privacy-optout] email opt-out lookup failed (is migration 034 applied?):', err.message);
      tableMissingLogged = true;
    }
    return false;
  }
}

function rememberEmailOptOut(email) {
  if (email) cache.set(String(email).trim().toLowerCase(), { optedOut: true, at: Date.now() });
}

module.exports = {
  OPTOUT_COOKIE,
  OPTOUT_COOKIE_MAX_AGE_MS,
  hasGpc,
  isAdOptOut,
  isEmailOptedOut,
  rememberEmailOptOut,
};
