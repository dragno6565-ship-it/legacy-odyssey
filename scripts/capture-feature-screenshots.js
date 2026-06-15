/**
 * Capture marketing screenshots for the NEW feature blog posts (Circles,
 * Custom Galleries, Reposition) from the live review@ demo account, which has
 * safe placeholder data (no real family names). Uploads repo stock photos to
 * seed a gallery — something the browser MCP tools can't do.
 *
 * Saves to F:\legacy-odyssey\marketing\screenshots\features\
 *
 * Usage (password NOT hardcoded — pass it at runtime):
 *   $env:LO_DEMO_PASSWORD="..."; node scripts/capture-feature-screenshots.js
 *
 * Each section is isolated in try/catch so one failure doesn't sink the rest.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE = 'https://legacyodyssey.com';
const EMAIL = 'review@legacyodyssey.com';
const PASSWORD = process.env.LO_DEMO_PASSWORD || '';
const OUTPUT_DIR = 'F:\\legacy-odyssey\\marketing\\screenshots\\features';
const PHOTO_DIR = 'F:\\legacy-odyssey\\marketing\\facebook\\fb-posts';
const STOCK = ['baby1.jpg', 'baby2.jpg', 'baby3.jpg', 'baby4.jpg', 'baby5.jpg']
  .map(f => path.join(PHOTO_DIR, f))
  .filter(p => fs.existsSync(p));

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function shot(page, name) {
  const p = path.join(OUTPUT_DIR, name + '.jpg');
  await page.screenshot({ path: p, type: 'jpeg', quality: 90 });
  console.log(`  ✓ ${name}.jpg (${(fs.statSync(p).size / 1024).toFixed(0)} KB)`);
}

// Click the first element matching `selector` whose text includes `text`.
async function clickByText(page, selector, text) {
  const els = await page.$$(selector);
  for (const el of els) {
    const t = (await page.evaluate(e => (e.textContent || '').trim(), el)).toLowerCase();
    if (t.includes(text.toLowerCase())) { await el.click(); return true; }
  }
  return false;
}

async function main() {
  if (!PASSWORD) { console.error('Set LO_DEMO_PASSWORD env var first.'); process.exit(1); }
  if (!STOCK.length) { console.error('No stock photos found in ' + PHOTO_DIR); process.exit(1); }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();

  try {
    // --- Login ---
    console.log('Logging in as', EMAIL, '...');
    await page.goto(BASE + '/account', { waitUntil: 'networkidle2', timeout: 30000 });
    const emailEl = await page.$('input[type="email"], input[name="email"]');
    const passEl = await page.$('input[type="password"], input[name="password"]');
    if (emailEl && passEl) {
      await emailEl.click({ clickCount: 3 }); await emailEl.type(EMAIL);
      await passEl.click({ clickCount: 3 }); await passEl.type(PASSWORD);
      await (await page.$('button[type="submit"], input[type="submit"]')).click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
    }
    await sleep(1500);
    if (!page.url().includes('/account')) throw new Error('login did not land on /account: ' + page.url());
    console.log('  logged in ->', page.url());

    // --- Circles (already populated earlier) ---
    try {
      await page.goto(BASE + '/account/book/circles', { waitUntil: 'networkidle2', timeout: 20000 });
      await sleep(1000);
      await shot(page, '08-circles-page');
    } catch (e) { console.log('  ! circles shot failed:', e.message); }

    // --- Custom Galleries: create + upload stock photos + capture grid ---
    try {
      await page.goto(BASE + '/account/book/galleries', { waitUntil: 'networkidle2', timeout: 20000 });
      await sleep(800);
      // Create only if none exists yet.
      const hasGallery = await page.evaluate(() => /gallery/i.test(document.body.innerText) && !/no galleries yet/i.test(document.body.innerText));
      if (!hasGallery) {
        await clickByText(page, 'button, a', 'Create Gallery');
        await sleep(1500);
        // Name it
        const nameEl = await page.$('input[name="name"], input[placeholder*="name" i], input[type="text"]');
        if (nameEl) { await nameEl.click({ clickCount: 3 }); await nameEl.type('Our Trip to the Lake'); }
        await clickByText(page, 'button', 'Save name');
        await sleep(1000);
      }
      // Upload photos
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.uploadFile(...STOCK);
        console.log('  uploading', STOCK.length, 'photos...');
        await sleep(8000); // allow uploads
        await page.reload({ waitUntil: 'networkidle2' }).catch(() => {});
        await sleep(1500);
      } else {
        console.log('  ! no file input found on gallery page');
      }
      await shot(page, '09-gallery-grid');
      // Gallery list view
      await page.goto(BASE + '/account/book/galleries', { waitUntil: 'networkidle2', timeout: 20000 });
      await sleep(1000);
      await shot(page, '09-gallery-list');
    } catch (e) { console.log('  ! galleries shot failed:', e.message); }

    // --- Reposition: upload a hero photo on Child Info, open the widget ---
    try {
      await page.goto(BASE + '/account/book/child-info', { waitUntil: 'networkidle2', timeout: 20000 });
      await sleep(1000);
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.uploadFile(STOCK[0]);
        await sleep(6000);
        await page.reload({ waitUntil: 'networkidle2' }).catch(() => {});
        await sleep(1500);
      }
      const opened = await clickByText(page, 'button, a', 'Reposition');
      if (opened) {
        await sleep(1500);
        await shot(page, '10-reposition-modal');
      } else {
        console.log('  ! Reposition control not found on child-info');
      }
    } catch (e) { console.log('  ! reposition shot failed:', e.message); }

  } finally {
    await browser.close();
  }

  console.log('\n=== Done ===');
  fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.jpg')).sort()
    .forEach(f => console.log('  ' + path.join(OUTPUT_DIR, f)));
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
