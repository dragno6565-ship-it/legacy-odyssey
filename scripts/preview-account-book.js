/**
 * Preview-only: render the regrouped My Book hub (account-book.ejs) with sample
 * locals and screenshot it (desktop + mobile) so Dan can review the D-012 step-2
 * editor regroup BEFORE any deploy. No server, no auth, no data writes.
 *
 * Out: Desktop\contact-preview\ + F:\legacy-odyssey\.tmp\editor-regroup\
 *   Usage: node scripts/preview-account-book.js
 */
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const VIEW = path.join(__dirname, '..', 'src', 'views', 'marketing', 'account-book.ejs');
const OUT_DIRS = [
  path.join(os.homedir(), 'Desktop', 'contact-preview'),
  path.join(__dirname, '..', '.tmp', 'editor-regroup'),
];
OUT_DIRS.forEach(d => fs.mkdirSync(d, { recursive: true }));

// Sample locals — a partly-filled book so both "has content" + "empty" dots show.
const locals = {
  book: { child_first_name: 'Your Child' },
  family: { subdomain: 'your-childs-name', custom_domain: null },
  visibleSections: {
    birth: true, birthday: true, moments: false, galleries: true, journey: false,
    before: true, home: true, months: true, family: true, firsts: true,
    holidays: false, letters: true, recipes: false, keepsakes: false, vault: false,
  },
};

(async () => {
  const html = await ejs.renderFile(VIEW, locals, { async: false });
  const tmpHtml = path.join(OUT_DIRS[1], '_render.html');
  fs.writeFileSync(tmpHtml, html);

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file://' + tmpHtml.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600)); // let lucide icons draw

  const shots = [
    { name: 'editor-regroup-desktop', w: 1100, h: 1400 },
    { name: 'editor-regroup-mobile', w: 414, h: 1600 },
  ];
  for (const s of shots) {
    await page.setViewport({ width: s.w, height: s.h, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 300));
    for (const dir of OUT_DIRS) {
      const p = path.join(dir, s.name + '.png');
      await page.screenshot({ path: p, fullPage: true });
      console.log('  ✓ ' + p);
    }
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
