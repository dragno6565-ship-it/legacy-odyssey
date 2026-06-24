/**
 * On-the-fly content translation for the public book sites (Phase 2 of i18n).
 *
 * The book's CHROME is translated from static dictionaries (src/i18n). This
 * service handles the part the dictionaries can't: the FAMILY'S OWN WRITING
 * (birth story, letters, captions, month notes, recipes…). When a visitor views
 * a book in Spanish, we machine-translate those text fields via DeepL and cache
 * each result, so it's instant on later views and costs nothing to re-show.
 *
 * Non-destructive: this runs at render time on a COPY of the data. The parent's
 * original English is never modified — toggling back to English shows it exactly
 * as written. If DeepL is unconfigured or errors, we fall back to the original.
 */
const crypto = require('crypto');
const { supabaseAdmin } = require('../config/supabase');

const KEY = process.env.DEEPL_API_KEY;
const ENABLED = !!KEY;
const BASE = KEY && KEY.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';

const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

// Field names whose values are NEVER human prose — ids, paths, tokens, slugs,
// proper names, colors, dates. We skip these so we don't translate (or mangle)
// the child's name, an image path, an access token, etc.
const SKIP_KEY = /(^id$|_id$|_at$|slug|token|url|path|photo|image|avatar|emoji|colou?r|position|_pos$|^pos$|_key$|^key$|hash|email|domain|subdomain|password|uid|stream|^lang$|order|sort|_num$|count|width|height|^type$|status|first_name|middle_name|last_name|^name$|member_key)/i;

function translatable(v) {
  if (typeof v !== 'string') return false;
  const s = v.trim();
  if (s.length < 2 || s.length > 4500) return false;
  if (!/[A-Za-zÀ-ÿ]/.test(s)) return false;             // must contain letters
  if (/^https?:\/\//i.test(s)) return false;            // url
  if (/^[\w.+-]+@[\w.-]+\.\w+$/.test(s)) return false;  // email
  if (/^[0-9a-f-]{16,}$/i.test(s)) return false;        // uuid / hash
  if (/^#?[0-9a-f]{3,8}$/i.test(s)) return false;       // hex color
  if (/\.(jpe?g|png|webp|gif|mp4|mov|svg)$/i.test(s)) return false; // filename
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return false;       // ISO date
  if (/^[a-z0-9]+([_-][a-z0-9]+)+$/i.test(s)) return false; // multi-part identifier/slug (first_christmas, year-2)
  return true;
}

function collect(node, set) {
  if (Array.isArray(node)) { node.forEach((n) => collect(n, set)); return; }
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) { if (!SKIP_KEY.test(k)) collect(node[k], set); }
    return;
  }
  if (translatable(node)) set.add(node);
}

function apply(node, map) {
  if (Array.isArray(node)) return node.map((n) => apply(n, map));
  if (node && typeof node === 'object') {
    const out = {};
    for (const k of Object.keys(node)) out[k] = SKIP_KEY.test(k) ? node[k] : apply(node[k], map);
    return out;
  }
  if (translatable(node) && map.has(node)) return map.get(node);
  return node;
}

async function cacheLookup(hashes, lang) {
  const map = new Map();
  for (let i = 0; i < hashes.length; i += 200) {
    const chunk = hashes.slice(i, i + 200);
    const { data, error } = await supabaseAdmin
      .from('content_translations')
      .select('source_hash, translated_text')
      .eq('target_lang', lang)
      .in('source_hash', chunk);
    if (!error && data) for (const r of data) map.set(r.source_hash, r.translated_text);
  }
  return map;
}

async function deeplTranslate(texts, lang) {
  const out = [];
  for (let i = 0; i < texts.length; i += 50) {
    const chunk = texts.slice(i, i + 50);
    const body = new URLSearchParams();
    chunk.forEach((t) => body.append('text', t));
    body.append('source_lang', 'EN');
    body.append('target_lang', lang.toUpperCase());
    const r = await fetch(`${BASE}/v2/translate`, {
      method: 'POST',
      headers: { Authorization: `DeepL-Auth-Key ${KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!r.ok) throw new Error(`DeepL HTTP ${r.status}`);
    const j = await r.json();
    (j.translations || []).forEach((tr, idx) => out.push({ src: chunk[idx], text: tr.text }));
  }
  return out;
}

/**
 * Translate the whole book-data object into `lang`. Returns the original object
 * unchanged for English, when disabled, or on any error.
 */
async function translateBook(data, lang) {
  if (!ENABLED || !data || lang !== 'es') return data;
  try {
    const set = new Set();
    collect(data, set);
    if (!set.size) return data;

    const texts = [...set];
    const hashes = texts.map(sha1);
    const cached = await cacheLookup(hashes, lang);

    const map = new Map();
    const miss = [];
    texts.forEach((t, i) => { const c = cached.get(hashes[i]); if (c != null) map.set(t, c); else miss.push(t); });

    if (miss.length) {
      const fresh = await deeplTranslate(miss, lang);
      const rows = fresh.map(({ src, text }) => { map.set(src, text); return { source_hash: sha1(src), target_lang: lang, source_text: src.slice(0, 8000), translated_text: text }; });
      if (rows.length) {
        const { error } = await supabaseAdmin.from('content_translations').upsert(rows, { onConflict: 'source_hash,target_lang' });
        if (error) console.warn('[translate] cache write failed:', error.message);
      }
    }
    return apply(data, map);
  } catch (e) {
    console.warn('[translate] falling back to original:', e.message);
    return data;
  }
}

module.exports = { translateBook, ENABLED };
