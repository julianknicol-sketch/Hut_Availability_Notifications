const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://bookings.doc.govt.nz/web/mueller-hut');
    const text = await page.evaluate(() => document.body.innerText);
    console.log('✅ Success! Found hut page');
    console.log(text.substring(0, 200));
    await browser.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
