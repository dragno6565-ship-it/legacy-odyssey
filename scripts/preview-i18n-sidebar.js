/**
 * Preview-only: render the public-book sidebar in EN and ES (styled with
 * book.css) to verify the i18n mechanism + EN|ES toggle. No server needed.
 *   node scripts/preview-i18n-sidebar.js
 */
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const i18n = require('../src/i18n');

const OUT = [path.join(os.homedir(), 'Desktop', 'contact-preview', 'i18n'), path.join(__dirname, '..', '.tmp', 'i18n')];
OUT.forEach((d) => fs.mkdirSync(d, { recursive: true }));

const book = { child_first_name: 'Your Baby', child_middle_name: '', child_last_name: '', birth_date: '2025-04-10', city: 'Austin' };
const visibleSections = { before: true, birth: true, birthday: true, journey: true, home: true, months: true, family: true, moments: true, galleries: true, firsts: true, holidays: true, letters: true, recipes: true, keepsakes: true, vault: true };
const sidebarData = (t, lang) => ({ book, family: {}, visibleSections, isFree: false, isDemoDomain: false, customGalleries: [], celebrationsByYear: [], recipes: [], keepsakes: [], activeCelebration: null, activeRecipe: null, activeKeepsake: null, t, lang });

const cssPath = 'file:///' + path.join(__dirname, '..', 'src', 'public', 'css', 'book.css').replace(/\\/g, '/');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  for (const lang of ['en', 'es']) {
    const t = (key, vars) => i18n.translate(lang, key, vars);
    const sidebarHtml = await ejs.renderFile(path.join(__dirname, '..', 'src', 'views', 'book', 'sidebar.ejs'), sidebarData(t, lang), { async: false });
    // sanity: a couple of expected strings present
    const expect = lang === 'es' ? ['Historia del Nacimiento', 'Mes a Mes', 'La Bóveda'] : ['Birth Story', 'Month by Month', 'The Vault'];
    console.log(`[${lang}] rendered ${sidebarHtml.length}b — ` + expect.map((s) => `${s}:${sidebarHtml.includes(s)}`).join(' '));
    const doc = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${cssPath}">
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<style>body{margin:0;background:#faf7f2}</style></head>
<body><div id="app">${sidebarHtml}</div>
<script>window.addEventListener('load',function(){window.lucide&&lucide.createIcons();});function showPage(){}function toggleNav(){}</script></body></html>`;
    const tmp = path.join(OUT[1], `_sidebar-${lang}.html`);
    fs.writeFileSync(tmp, doc);
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1300, deviceScaleFactor: 2 });
    await page.goto('file://' + tmp.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 700));
    const el = await page.$('#sidebar');
    for (const dir of OUT) await (el || page).screenshot({ path: path.join(dir, `sidebar-${lang}.png`) });
    await page.close();
  }
  await browser.close();
  console.log('✓ screenshots written');
})().catch((e) => { console.error(e); process.exit(1); });
