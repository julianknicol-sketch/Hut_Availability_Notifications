// DOC Hut Scraper - Updated to send to BOTH webhooks
const https = require('https');

const WEBHOOK_URL_1 = process.env.WEBHOOK_URL;
const WEBHOOK_URL_2 = process.env.WEBHOOK_URL_2;

const HUTS = [
  {
    name: 'Muir Hut',
    urlPath: '/muir-hut',
  },
  {
    name: 'Mueller Hut',
    urlPath: '/mueller-hut',
  }
];

async function checkHutAvailability(hut) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'bookings.doc.govt.nz',
      path: `/web${hut.urlPath}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    };

    https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const hasAvailability = 
          data.toLowerCase().includes('available') ||
          data.toLowerCase().includes('book now');
        
        const isFullyBooked = 
          data.toLowerCase().includes('fully booked') ||
          data.toLowerCase().includes('no availability');

        const status = isFullyBooked ? 'FULLY_BOOKED' : (hasAvailability ? 'AVAILABLE' : 'CHECKING');

        resolve({
          hutName: hut.name,
          status: status,
          Timestamp: new Date().toISOString(),
          url: `https://bookings.doc.govt.nz/web${hut.urlPath}`,
          statusChanged: true
        });
      });
    }).on('error', (error) => {
      resolve({
        hutName: hut.name,
        status: 'ERROR',
        Timestamp: new Date().toISOString(),
        url: `https://bookings.doc.govt.nz/web${hut.urlPath}`,
        statusChanged: false
      });
    }).end();
  });
}

async function sendToZapier(data, webhookUrl, zapNumber) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const url = new URL(webhookUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Sent to Zapier #${zapNumber}:`, data.hutName);
          resolve();
        } else {
          console.error(`❌ Zapier #${zapNumber} error:`, res.statusCode);
          reject(new Error(`Zapier #${zapNumber} returned ${res.statusCode}`));
        }
      });
    }).on('error', reject).end(postData);
  });
}

async function main() {
  console.log('🕐 Starting DOC hut check');

  if (!WEBHOOK_URL_1 || !WEBHOOK_URL_2) {
    console.error('❌ WEBHOOK_URL or WEBHOOK_URL_2 not set!');
    process.exit(1);
  }

  try {
    for (const hut of HUTS) {
      console.log(`\n🏔️ Checking ${hut.name}...`);
      const result = await checkHutAvailability(hut);
      console.log(`Status: ${result.status}`);

      // Send to BOTH webhooks
      await sendToZapier(result, WEBHOOK_URL_1, 1);
      await sendToZapier(result, WEBHOOK_URL_2, 2);

      // Small delay between huts
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.log('\n✅ All checks complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
