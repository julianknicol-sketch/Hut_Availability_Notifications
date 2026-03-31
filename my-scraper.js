const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Starting...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  console.log('📄 Loading page...');
  await page.goto('https://bookings.doc.govt.nz/web/mueller-hut');
  await new Promise(resolve => setTimeout(resolve, 2000));
  const text = await page.evaluate(() => document.body.innerText);
  console.log('✅ Found text:');
  console.log(text.substring(0, 200));
  await browser.close();
})();
