// Sets res.locals.consentRequired = true for visitors in regions that require
// prior opt-in consent for non-essential cookies (EU/EEA + UK under GDPR/UK GDPR).
// Detection uses Cloudflare's CF-IPCountry header (present in production behind
// Cloudflare). For everyone else (incl. US), consent is not required and the
// analytics/ad scripts load normally.
//
// Manual testing override (works locally where there's no CF header):
//   ?consent=eu   → force banner / consent required
//   ?consent=us   → force consent NOT required (load trackers)

// EU/EEA member states + the United Kingdom (ISO 3166-1 alpha-2).
const CONSENT_COUNTRIES = new Set([
  // EU 27
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE',
  // EEA (non-EU)
  'IS', 'LI', 'NO',
  // United Kingdom
  'GB',
]);

module.exports = function consentRegion(req, res, next) {
  const override = ((req.query && req.query.consent) || '').toLowerCase();
  let required;
  if (override === 'eu') {
    required = true;
  } else if (override === 'us' || override === 'off') {
    required = false;
  } else {
    const country = (req.headers['cf-ipcountry'] || '').toUpperCase();
    required = CONSENT_COUNTRIES.has(country);
  }
  res.locals.consentRequired = required;
  next();
};
