const puppeteer = require('puppeteer');

(async () => {
    try {
          const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
          const page = await browser.newPage();
          
          // Navigate to Mueller Hut booking page
          await page.goto('https://bookings.doc.govt.nz/web/mueller-hut');
          await page.waitForNavigation({ waitUntil: 'networkidle2' });
          await new Promise(r => setTimeout(r, 2000));
          
          // Extract availability data
          const availability = await page.evaluate(() => {
                  const text = document.body.innerText;
                  return text;
          });
          
          // Check for availability on April 23, 24, 25
          const targetDates = ['23', '24', '25'];
          const hasAprilAvailability = targetDates.some(date => {
                  const aprilDate = `April ${date}`;
                  return availability.includes(aprilDate) && !availability.toLowerCase().includes('fully booked');
          });
          
          // Only send email if Mueller Hut has availability on target dates
          if (hasAprilAvailability) {
                  console.log('✅ Mueller Hut has availability! Sending alert...');
                  
                  // Send email alert via Zapier
                  const emailWebhook = process.env.WEBHOOK_URL_EMAIL;
                  await fetch(emailWebhook, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                        hut: 'Mueller Hut',
                                        status: 'AVAILABLE',
                                        dates: '23-25 April 2026',
                                        message: 'Mueller Hut has availability for your target dates!',
                                        timestamp: new Date().toISOString()
                            })
                  });
                  
                  console.log('📧 Email alert sent!');
          } else {
                  console.log('❌ Mueller Hut fully booked for April 23-25. No alert sent.');
          }
          
          await browser.close();
          
    } catch (err) {
          console.error('❌ Error:', err.message);
          process.exit(1);
    }
})();const puppeteer = require('puppeteer');

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
