import axios from 'axios';
import * as cheerio from 'cheerio';

const urls = [
    'https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/',
    'https://besturdubooks.net/dars-e-nizami/al-sadesa-6th-year/'
];

async function check() {
    for (const url of urls) {
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(res.data);
        console.log(`URL: ${url}`);
        console.log(`  .kt-inside-inner-col count: ${$('.kt-inside-inner-col').length}`);
        // If 0, check for other patterns like horizontal lines or p-based entries
        console.log(`  img count: ${$('.entry-content img').length}`);
        console.log(`  a[href*="archive.org"] count: ${$('.entry-content a[href*="archive.org"]').length}`);
    }
}

check();
