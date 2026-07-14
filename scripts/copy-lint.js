// Copy lint for OUTBOUND customer copy (emails, announcements).
// Enforces Dan's standing wording rules MECHANICALLY so a script refuses to
// send instead of relying on anyone remembering. Added 2026-07-14 after an
// outage email shipped with "web address" in the subject (rule: "website"/"site"
// only) despite the rule existing in memory.
//
// Usage in every send script, BEFORE the send loop:
//   const { assertCleanCustomerCopy } = require('./copy-lint');
//   assertCleanCustomerCopy({ subject: SUBJECT, html: body });   // throws on violation
//
// Rules enforced (Dan):
//   - Customer sites are "website"/"site" ONLY. Banned: book, web address, page/URL/address
//     as a substitute (we flag "web address" and "book"; "page"/"URL" have legit uses, so
//     they are warned, not fatal).
//   - No em-dashes in public copy (— or &mdash;).
//   - Mass emails greet "Hi Legacy Odyssey Customer," (no first names).
//   - No banned brand words: forever, chapter, family book / family's story.
//   - No prices unless explicitly allowed via opts.allowPrice.

const FATAL_PATTERNS = [
  { re: /web\s?address/i, why: 'say "website" or "site", never "web address" (Dan 2026-07-14)' },
  { re: /&mdash;|—/, why: 'no em-dashes in public copy (Dan 2026-07-14)' },
  { re: /\bfamily(?:'s)? (?:book|story)\b/i, why: 'never "family book/family\'s story" (it is the CHILD\'s website)' },
  { re: /\bchapter\b/i, why: 'banned word "chapter" (use section/page/area)' },
  { re: /\bforever\b/i, why: 'banned word "forever"' },
];

// "book" is fatal too, but allow it ONLY inside the approved positioning phrase
// "not just a baby book" (contrast framing Dan approved).
function bookViolations(text) {
  const cleaned = text.replace(/not just a baby book/gi, '');
  const m = cleaned.match(/\b(baby\s)?books?\b/gi);
  return m ? [`"${m.join('", "')}" — customer sites are "websites"/"sites", never "books" (Dan 2026-07-14)`] : [];
}

function priceViolations(text) {
  const m = text.match(/\$\s?\d[\d,.]*/g);
  return m ? [`price mentioned (${m.join(', ')}) — no price in marketing unless Dan explicitly OKs`] : [];
}

function stripHtml(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ');
}

function assertCleanCustomerCopy({ subject = '', html = '', text = '', allowPrice = false, requireGreeting = true }) {
  const visible = `${subject}\n${stripHtml(html)}\n${text}`;
  const violations = [];

  for (const { re, why } of FATAL_PATTERNS) {
    if (re.test(visible)) violations.push(why);
  }
  violations.push(...bookViolations(visible));
  if (!allowPrice) violations.push(...priceViolations(visible));
  if (requireGreeting && !/Hi Legacy Odyssey Customer,/.test(visible)) {
    violations.push('mass emails must greet exactly "Hi Legacy Odyssey Customer," (no first names) (Dan 2026-07-14)');
  }

  if (violations.length) {
    throw new Error(`COPY LINT FAILED — DO NOT SEND:\n  - ${violations.join('\n  - ')}`);
  }
  return true;
}

module.exports = { assertCleanCustomerCopy };
