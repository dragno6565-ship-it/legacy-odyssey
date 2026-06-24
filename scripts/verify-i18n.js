/**
 * Verify i18n integrity: en/es JSON validity, key parity, and that every
 * book partial still compiles as EJS after internationalization.
 *   node scripts/verify-i18n.js
 */
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const locDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const en = JSON.parse(fs.readFileSync(path.join(locDir, 'en.json'), 'utf8'));
const es = JSON.parse(fs.readFileSync(path.join(locDir, 'es.json'), 'utf8'));

const enKeys = new Set(Object.keys(en));
const esKeys = new Set(Object.keys(es));
const missingInEs = [...enKeys].filter((k) => !esKeys.has(k));
const missingInEn = [...esKeys].filter((k) => !enKeys.has(k));
console.log(`en keys: ${enKeys.size}  es keys: ${esKeys.size}`);
console.log('missing in es:', missingInEs.length ? missingInEs : 'none');
console.log('missing in en:', missingInEn.length ? missingInEn : 'none');
// flag any es value identical to en (likely untranslated) — informational
const sameVal = [...enKeys].filter((k) => esKeys.has(k) && en[k] === es[k] && !/^(Hospital|Legacy)/.test(en[k]));
console.log('es == en (check if intentional):', sameVal.length, sameVal.slice(0, 40).join(', '));

const bookDir = path.join(__dirname, '..', 'src', 'views', 'book');
let bad = 0;
for (const f of fs.readdirSync(bookDir).filter((x) => x.endsWith('.ejs'))) {
  const src = fs.readFileSync(path.join(bookDir, f), 'utf8');
  try { ejs.compile(src, { filename: path.join(bookDir, f) }); }
  catch (e) { bad++; console.log(`  ✗ EJS COMPILE FAIL ${f}: ${e.message.split('\n')[0]}`); }
}
console.log(bad ? `\n${bad} partial(s) failed to compile` : '\n✓ all book partials compile');
process.exit(bad || missingInEs.length || missingInEn.length ? 1 : 0);
