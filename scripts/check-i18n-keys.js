/**
 * Cross-check: every t('key') used in the book templates must exist in en.json
 * (a missing key would render as the raw key string to visitors). Also lists
 * markup keys that must use <%- (unescaped) and flags any used with <%=.
 *   node scripts/check-i18n-keys.js
 */
const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en.json'), 'utf8'));
const dictKeys = new Set(Object.keys(en));
const markupKeys = new Set(Object.keys(en).filter((k) => /<em>|&amp;|&mdash;|<\/|<br/.test(en[k])));

const dirs = [path.join(__dirname, '..', 'src', 'views', 'book'), path.join(__dirname, '..', 'src', 'views', 'layouts')];
const files = [];
for (const d of dirs) for (const f of fs.readdirSync(d)) if (f.endsWith('.ejs')) files.push(path.join(d, f));

const used = new Set();
let missing = 0, badEscape = 0;
const keyRe = /(?<![A-Za-z0-9_$.])t\(\s*['"]([^'"]+)['"]/g;
const escRe = /<%([-=])\s*t\(\s*['"]([^'"]+)['"]/g;
for (const fp of files) {
  const src = fs.readFileSync(fp, 'utf8');
  let m;
  while ((m = keyRe.exec(src))) {
    used.add(m[1]);
    if (!dictKeys.has(m[1])) { missing++; console.log(`  ✗ MISSING KEY  ${path.basename(fp)} → t('${m[1]}')`); }
  }
  while ((m = escRe.exec(src))) {
    const [, esc, key] = m;
    if (markupKeys.has(key) && esc === '=') { badEscape++; console.log(`  ✗ MARKUP via <%=  ${path.basename(fp)} → '${key}' (needs <%-)`); }
  }
}

const unused = [...dictKeys].filter((k) => !used.has(k) && !/^(nav|footer|demo|book)\./.test(k));
console.log(`\nused keys: ${used.size} | dict keys: ${dictKeys.size} | markup keys: ${markupKeys.size}`);
console.log('unused dict keys (non-nav/footer, informational):', unused.length ? unused.join(', ') : 'none');
console.log(missing || badEscape ? `\n✗ ${missing} missing, ${badEscape} bad-escape` : '\n✓ every used key exists; markup keys escaped correctly');
process.exit(missing || badEscape ? 1 : 0);
