/**
 * Preview-only: render the /demo walkthrough (marketing/demo.ejs) and drive the
 * tour JS in headless Chrome, screenshotting each step so Dan can review BEFORE
 * any deploy. Rewrites /demo-assets/ to local file paths (no server needed).
 *   Usage: node scripts/preview-demo.js
 */
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const VIEW = path.join(__dirname, '..', 'src', 'views', 'marketing', 'demo.ejs');
const ASSETS = 'file:///' + path.join(__dirname, '..', 'src', 'public', 'demo-assets').replace(/\\/g, '/') + '/';
const OUT_DIRS = [
  path.join(os.homedir(), 'Desktop', 'contact-preview', 'demo'),
  path.join(__dirname, '..', '.tmp', 'demo'),
];
OUT_DIRS.forEach(d => fs.mkdirSync(d, { recursive: true }));
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  let html = await ejs.renderFile(VIEW, {}, { async: false });
  html = html.replace(/\/demo-assets\//g, ASSETS);
  const tmp = path.join(OUT_DIRS[1], '_render.html');
  fs.writeFileSync(tmp, html);

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setViewport({ width: 430, height: 860, deviceScaleFactor: 2 });
  await page.goto('file://' + tmp.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await sleep(400);

  async function shot(name) {
    for (const dir of OUT_DIRS) {
      await page.screenshot({ path: path.join(dir, name + '.png') });
    }
    console.log('  ✓ ' + name);
  }

  await shot('0-intro');
  // type a sample name on step 1
  await page.click('#next'); await sleep(450);          // -> step1
  await page.type('#babyName', 'Emma', { delay: 40 });
  await sleep(300); await shot('1-name');
  await page.click('#next'); await sleep(450); await shot('2-signup');
  await page.click('#next'); await sleep(450); await shot('3-editor');
  await page.click('#next'); await sleep(450);          // -> step4 (photos)
  await page.click('#uploadTile'); await sleep(900); await shot('4-photos');
  await page.click('#next'); await sleep(800); await shot('5-publish');
  await page.click('#next'); await sleep(500); await shot('6-finished-site');
  await page.click('#next'); await sleep(450); await shot('7-outro');

  await browser.close();
  if (errors.length) { console.log('\n  ⚠ JS errors:\n   ' + errors.join('\n   ')); }
  else { console.log('\n  ✓ no JS errors'); }
})().catch(e => { console.error(e); process.exit(1); });
