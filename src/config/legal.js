// Legal document versions (Terms of Service + Privacy Policy).
//
// One place to change the "Last updated" date that /terms and /privacy show,
// and the version string recorded when a customer ticks "I agree" at signup or
// checkout (stored in Stripe metadata as terms_version).
//
// DAN: these were set to 2026-10-04 when the October 2026 legal refresh was
// written (branch legal-fixes-2026-10). Before merging, change BOTH dates to the
// actual deploy date so the published "Last updated" line is accurate.
const TERMS_EFFECTIVE_DATE = '2026-10-04';
const PRIVACY_EFFECTIVE_DATE = '2026-10-04';

function pretty(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

// Accepts the shapes our clients send: JSON true, form checkbox "on", "true", "1".
function hasAcceptedTerms(body) {
  if (!body) return false;
  const v = body.acceptTerms !== undefined ? body.acceptTerms : body.accept_terms;
  return v === true || v === 'true' || v === 'on' || v === '1' || v === 1;
}

module.exports = {
  TERMS_EFFECTIVE_DATE,
  PRIVACY_EFFECTIVE_DATE,
  TERMS_EFFECTIVE_PRETTY: pretty(TERMS_EFFECTIVE_DATE),
  PRIVACY_EFFECTIVE_PRETTY: pretty(PRIVACY_EFFECTIVE_DATE),
  TERMS_VERSION: TERMS_EFFECTIVE_DATE,
  hasAcceptedTerms,
  TERMS_REQUIRED_MESSAGE: 'Please agree to the Terms of Service and Privacy Policy to continue.',
};
