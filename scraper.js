// DOC Hut Scraper - Check Mueller Hut for specific dates (April 23-25, 2026)
const https = require('https');

const WEBHOOK_URL_1 = process.env.WEBHOOK_URL;
const WEBHOOK_URL_2 = process.env.WEBHOOK_URL_2;

// Specific dates to check
const CHECK_DATES = [
  '2026-04-23',
  '2026-04-24',
  '2026-04-25'
];

const HUTS = [
  {
    name: 'Mueller Hut',
    urlPath: '/mueller-hut',
  }
];

async function checkHutAvailabilityForDates(hut, dates) {
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
        // Check for availability indicators on the page
        const hasAvailability = 
          data.toLowerCase().includes('available') ||
          data.toLowerCase().includes('book now') ||
          data.toLowerCase().includes('select date');
        
        const isFullyBooked = 
          data.toLowerCase().includes('fully booked') ||
          data.toLowerCase().includes('no availability');

        const status = isFullyBooked ? 'FULLY_BOOKED' : (hasAvailability ? 'AVAILABLE' : 'CHECKING');

        // For each date, create a separate result
        const results = dates.map(date => ({
          hutName: hut.name,
          checkDate: date,
          status: status,
          Timestamp: new Date().toISOString(),
          url: `https://bookings.doc.govt.nz/web${hut.urlPath}`,
          statusChanged: true
        }));

        resolve(results);
      });
    }).on('error', (error) => {
      const results = dates.map(date => ({
        hutName: hut.name,
        checkDate: date,
        status: 'ERROR',
        Timestamp: new Date().toISOString(),
        url: `https://bookings.doc.govt.nz
