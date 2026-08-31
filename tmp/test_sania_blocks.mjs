import axios from 'axios';
import * as cheerio from 'cheerio';

const url = 'https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/';

async function test() {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const content = $('.entry-content');
    
    // Test finding all book blocks
    const blocks = content.find('.kt-inside-inner-col');
    console.log(`Blocks found: ${blocks.length}`);
    
    if (blocks.length === 0) {
        // Try another way: looking for items that have an image and a link
        content.find('img').each((i, imgEl) => {
            const img = $(imgEl);
            if (img.attr('src').includes('logo')) return;
            console.log(`Image ${i}: ${img.attr('alt') || 'no alt'}`);
        });
    } else {
        blocks.each((i, blockEl) => {
            const block = $(blockEl);
            const title = block.find('p, h1, h2, h3').first().text().trim();
            const hasImg = block.find('img').length > 0;
            const hasLink = block.find('a').length > 0;
            console.log(`Block ${i}: [Title: ${title.substring(0, 30)}] [Img: ${hasImg}] [Link: ${hasLink}]`);
        });
    }
}

test();
