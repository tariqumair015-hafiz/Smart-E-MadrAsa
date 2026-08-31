import axios from 'axios';
import * as cheerio from 'cheerio';

const url = 'https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/';

async function test() {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const content = $('.entry-content');
    
    // Dump all content child by child
    content.children().each((i, el) => {
        const tag = $(el).prop('tagName').toLowerCase();
        const text = $(el).text().trim().substring(0, 50);
        const links = $(el).find('a').length;
        const images = $(el).find('img').length;
        console.log(`${i}: [${tag}] L:${links} I:${images} Text: ${text}`);
    });
}

test();
