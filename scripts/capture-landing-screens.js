/**
 * Capture REAL product screenshots for the show-first landing page (Dan
 * greenlit 2026-07-16) from the public demo site (your-childs-name.com) —
 * the richest placeholder-named instance, and the same site the hero's
 * "tour a live demo" CTA opens, so hero imagery matches what visitors tap into.
 *
 * Phone-sized captures (390x844 @2x) because 83% of landing traffic is mobile
 * (Unbounce CBR) and the shots sit inside a CSS phone frame.
 *
 * Saves to src/public/images/landing/  (served by the app).
 *   node scripts/capture-landing-screens.js
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE = 'https://www.your-childs-name.com';
const OUT = path.join(__dirname, '..', 'src', 'public', 'images', 'landing');
const SECTIONS = [
  { id: 'page-welcome', name: 'welcome', scroll: 0 },
  { id: 'page-birth', name: 'birth-story', scroll: 0 },
  { id: 'page-months', name: 'month-by-month', scroll: 0 },
  { id: 'page-letters', name: 'letter', scroll: 520 },
  { id: 'page-galleries', name: 'gallery', scroll: 470 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
  });
  const page = await browser.newPage();
  console.log('Loading demo site...');
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(2500); // JS builds month cards etc.

  // Enter past the demo gate ("Open the Book" screen) so shots show the inside.
  const entered = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('button, a'));
    const open = candidates.find((el) => /open the (book|website)/i.test(el.textContent || ''));
    if (open) { open.click(); return true; }
    return false;
  });
  console.log('Gate entered:', entered);
  await sleep(2000);

  for (const s of SECTIONS) {
    try {
      await page.evaluate((id, scroll) => {
        // Hide the demo banner + any password gate remnants for clean shots.
        const banner = document.getElementById('demo-banner');
        if (banner) banner.style.display = 'none';
        // Activate exactly this section the way the site's own nav does:
        document.querySelectorAll('.page-section').forEach((el) => {
          el.style.display = el.id === id ? 'block' : 'none';
        });
        // On scrolled shots, hide fixed top chrome (it floats mid-image otherwise).
        if (scroll > 0) {
          Array.from(document.querySelectorAll('*')).forEach((el) => {
            const cs = getComputedStyle(el);
            if (cs.position === 'fixed' && el.getBoundingClientRect().top < 120 && el.offsetHeight < 220) {
              el.style.display = 'none';
            }
          });
        }
        window.scrollTo(0, scroll);
      }, s.id, s.scroll);
      await sleep(1200); // images lazy-load
      const file = path.join(OUT, `${s.name}.jpg`);
      await page.screenshot({ path: file, type: 'jpeg', quality: 78 });
      console.log(`  ✓ ${s.name}.jpg (${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.log(`  ✗ ${s.name}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('Done ->', OUT);
})();
