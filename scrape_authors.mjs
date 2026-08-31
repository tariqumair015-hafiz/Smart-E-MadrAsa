import https from 'https';
import * as cheerio from 'cheerio';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  try {
    const html = await fetchPage('https://besturdubooks.net/');
    const $ = cheerio.load(html);
    
    // Debug: print page title and all widget titles
    console.log('Page title:', $('title').text());
    console.log('HTML length:', html.length);
    
    // Find all h4 titles
    $('h4').each((i, el) => {
      console.log('H4:', $(el).text().trim());
    });
    
    // Find all sidebar widget titles
    $('.widget-title').each((i, el) => {
      console.log('Widget:', $(el).text().trim());
    });
    
    // Print first 500 chars to see structure
    console.log('\n--- First 500 chars ---');
    console.log(html.substring(0, 500));
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
