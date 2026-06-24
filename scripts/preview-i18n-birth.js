/** Render the Birth Story page EN/ES (mock data) to verify in-page i18n. */
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const i18n = require('../src/i18n');

const OUT = [path.join(os.homedir(), 'Desktop', 'contact-preview', 'i18n'), path.join(__dirname, '..', '.tmp', 'i18n')];
OUT.forEach((d) => fs.mkdirSync(d, { recursive: true }));

const book = { birth_date: '2025-04-10', birth_time: '3:42 PM', birth_weight_lbs: 7, birth_weight_oz: 5, birth_length_inches: 20 };
const birthStory = {
  first_held_by: 'Mom',
  mom_narrative: 'The hours felt like minutes and the minutes felt like hours. And then, all at once, you were here.',
  dad_narrative: 'Nothing could have prepared me for that first cry, or for how small your hand felt wrapped around my finger.',
  mom_title: '', dad_title: '', person1_label: '', person2_label: '',
};
const data = (t, lang) => ({ book, birthStory, imageUrl: () => '', photoPos: () => '', t, lang });
const cssPath = 'file:///' + path.join(__dirname, '..', 'src', 'public', 'css', 'book.css').replace(/\\/g, '/');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  for (const lang of ['en', 'es']) {
    const t = (k, v) => i18n.translate(lang, k, v);
    const html = await ejs.renderFile(path.join(__dirname, '..', 'src', 'views', 'book', 'birth.ejs'), data(t, lang), { async: false });
    const doc = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${cssPath}">
<style>body{margin:0;background:#faf7f2}#main-content{max-width:1000px;margin:0 auto}.page-section{display:block!important}</style></head>
<body><div id="app"><div id="main-content">${html}</div></div></body></html>`;
    const tmp = path.join(OUT[1], `_birth-${lang}.html`);
    fs.writeFileSync(tmp, doc);
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 2 });
    await page.goto('file://' + tmp.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 500));
    for (const dir of OUT) await page.screenshot({ path: path.join(dir, `birth-${lang}.png`), fullPage: true });
    await page.close();
  }
  await browser.close();
  console.log('✓ birth EN/ES screenshots written');
})().catch((e) => { console.error(e); process.exit(1); });
