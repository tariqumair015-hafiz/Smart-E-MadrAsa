import https from 'https';

// Test a sample of the cover URLs to see if they actually exist
const TEST_URLS = [
  'https://besturdubooks.net/wp-content/uploads/2022/04/NOOR-UL-AIZAH-O-NAJAT-UL-ARWAH-200x300.jpg',
  'https://besturdubooks.net/wp-content/uploads/2022/04/NOOR-UL-EZAH-RAHMANIA-200x300.jpg',
  'https://besturdubooks.net/wp-content/uploads/2022/04/NoorUlEzahAlBushraColor-200x300.jpg',
  'https://besturdubooks.net/wp-content/uploads/2022/04/Hashia-Al-Tahtawi-200x300.jpg',
  'https://besturdubooks.net/wp-content/uploads/2022/04/Maraqil-Falah-200x300.jpg',
  'https://besturdubooks.net/wp-content/uploads/2022/04/Shifa-Ul-Arwaah-Urdu-Sharah-Noor-Ezah-200x300.jpg',
  'https://besturdubooks.net/wp-content/uploads/2022/04/AlFiqhUlMuyassar-200x300.jpg',
  'https://besturdubooks.net/wp-content/uploads/2022/04/KaremaSadeeAlBushraColor-200x300.jpg',
  'https://besturdubooks.net/wp-content/uploads/2023/07/NAHWMEER_URDU-200x300.jpg',
  'https://besturdubooks.net/wp-content/uploads/2023/05/QANOONCHA_E_USMANI-200x300.jpg',
];

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 10000 }, (res) => {
      resolve({ url: url.split('/').pop(), status: res.statusCode });
    });
    req.on('error', (e) => resolve({ url: url.split('/').pop(), status: 'ERROR: ' + e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ url: url.split('/').pop(), status: 'TIMEOUT' }); });
    req.end();
  });
}

async function main() {
  console.log('Testing cover URLs...');
  for (const url of TEST_URLS) {
    const result = await checkUrl(url);
    console.log(`${result.status} -> ${result.url}`);
  }
}

main();
