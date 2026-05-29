// Adds an `X-Robots-Tag: noindex` HTTP header on CUSTOMER book domains
// (each customer's custom .com and any *.legacyodyssey.com subdomain) as
// defense-in-depth alongside the per-domain robots.txt (Disallow: /) and the
// per-page <meta name="robots"> tag. The HTTP header is stronger than the meta
// tag — it's honored even for non-HTML responses and can't be missed by a
// crawler that doesn't parse the body.
//
// CRITICAL SAFETY RULE: this must NEVER fire on the marketing site
// (legacyodyssey.com / www.legacyodyssey.com) or in local dev — those pages
// MUST stay indexable by Google. The marketing-host test below is intentionally
// identical to the one in the /robots.txt route (src/routes/book.js) so the two
// can never disagree about what counts as "the marketing site".
module.exports = function customerNoindex(req, res, next) {
  const host = (req.hostname || '').toLowerCase();
  const appDomain = (process.env.APP_DOMAIN || 'legacyodyssey.com').toLowerCase();
  const isMarketing =
    host === appDomain ||
    host === `www.${appDomain}` ||
    host === 'localhost' ||
    host === '127.0.0.1';

  // Only add the header for non-marketing hosts (customer domains / subdomains /
  // the internal Railway URL). Marketing pages are left completely untouched.
  if (!isMarketing) {
    res.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  }
  next();
};
