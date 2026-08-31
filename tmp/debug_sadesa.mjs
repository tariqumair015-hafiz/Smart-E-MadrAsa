import axios from 'axios';
import * as cheerio from 'cheerio';

const url = 'https://besturdubooks.net/dars-e-nizami/al-sadesa-6th-year/';

async function test() {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const images = $('.entry-content img');
    console.log(`Images found on Page 1: ${images.length}`);
    
    images.each((i, imgEl) => {
        const img = $(imgEl);
        if (img.attr('src').includes('logo')) return;
        const src = img.attr('data-lazy-src') || img.attr('src');
        console.log(`Image ${i}: ${src}`);
        
        // Check following elements for links
        let scan = img.parent();
        let limit = 0;
        let foundLinks = 0;
        while (scan.length && limit < 15) {
            const next = scan.next();
            if (next.find('img').length > 0 && limit > 1) break;
            const links = next.find('a');
            links.each((j, el) => {
                const href = $(el).attr('href');
                if (href && (href.includes('archive.org') || href.includes('mediafire.com'))) foundLinks++;
                if (href && $(el).text().includes('ڈاؤنلوڈ ')) console.log(`  Detail link found: ${href}`);
            });
            scan = next;
            limit++;
        }
        console.log(`  Links found: ${foundLinks}`);
    });
}

test();
