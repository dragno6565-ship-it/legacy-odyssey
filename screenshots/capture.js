const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewport({ width: 1242, height: 2688, deviceScaleFactor: 1 });

  const files = ['screenshot1.html', 'screenshot2.html', 'screenshot3.html'];

  for (const file of files) {
    const filePath = path.resolve(__dirname, file);
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });
    const outputName = file.replace('.html', '.png');
    await page.screenshot({
      path: path.resolve(__dirname, outputName),
      fullPage: false,
      clip: { x: 0, y: 0, width: 1242, height: 2688 }
    });
    console.log(`Captured ${outputName}`);
  }

  await browser.close();
  console.log('Done! Screenshots saved to screenshots/ directory');
})();
