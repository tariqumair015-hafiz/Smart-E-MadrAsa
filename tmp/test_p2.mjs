import axios from 'axios';
import * as cheerio from 'cheerio';

const url = 'https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/2/';

async function test() {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const content = $('.entry-content');
    console.log(`P tags count: ${content.find('p').length}`);
    console.log(`Images count: ${content.find('img').length}`);
    console.log(`A tags with archive count: ${content.find('a[href*="archive.org"]').length}`);
}

test();
