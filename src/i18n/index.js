/**
 * Lightweight i18n for server-rendered EJS. Phase 1 (POC): public book sites.
 *
 * - Dictionaries live in ./locales/<lang>.json (flat key -> string).
 * - `t(key, vars)` looks up the active language, falls back to English, then to
 *   the key itself. `{name}`-style placeholders are interpolated from `vars`.
 * - The middleware resolves the language from `?lang=` (persisted to a cookie) →
 *   `lo_lang` cookie → default, and exposes `res.locals.lang` + `res.locals.t`
 *   to every template. Build the mechanism once; add a language = drop in a JSON.
 */
const fs = require('fs');
const path = require('path');

const SUPPORTED = ['en', 'es', 'hi'];
const DEFAULT = 'en';
const COOKIE = 'lo_lang';

const dicts = {};
for (const lang of SUPPORTED) {
  try {
    dicts[lang] = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales', `${lang}.json`), 'utf8'));
  } catch (e) {
    dicts[lang] = {};
    console.warn(`[i18n] could not load locale ${lang}: ${e.message}`);
  }
}

function translate(lang, key, vars) {
  const d = dicts[lang] || dicts[DEFAULT] || {};
  let s = d[key];
  if (s == null) s = (dicts[DEFAULT] || {})[key];
  if (s == null) s = key; // last-resort: show the key so missing strings are visible
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(vars[k]);
  return s;
}

function resolveLang(req) {
  const q = (req.query && String(req.query.lang || '')).toLowerCase();
  if (SUPPORTED.includes(q)) return q;
  const c = req.cookies && req.cookies[COOKIE];
  if (SUPPORTED.includes(c)) return c;
  return DEFAULT;
}

function middleware(req, res, next) {
  const lang = resolveLang(req);
  // Persist an explicit ?lang= choice so it sticks as they navigate the book.
  if (req.query && SUPPORTED.includes(String(req.query.lang || '').toLowerCase())) {
    res.cookie(COOKIE, lang, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
  res.locals.lang = lang;
  res.locals.supportedLangs = SUPPORTED;
  res.locals.t = (key, vars) => translate(lang, key, vars);
  next();
}

module.exports = { translate, middleware, resolveLang, SUPPORTED, DEFAULT, COOKIE };
