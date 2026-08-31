import axios from 'axios';
import * as cheerio from 'cheerio';

const url = 'https://besturdubooks.net/dars-e-nizami/al-sadesa-6th-year/';

async function test() {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const content = $('.entry-content');
    const images = content.find('img');
    console.log(`Images found: ${images.length}`);
    
    images.each((i, imgEl) => {
        const img = $(imgEl);
        if (img.attr('src') && img.attr('src').includes('logo')) return;

        // Cover
        let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('data-orig-src') || img.attr('src');
        
        // Title
        let title = '';
        let search = img.parent();
        let limit = 0;
        while (search.length && limit < 10 && !title) {
            const prev = search.prev();
            const text = prev.text().trim();
            if (text && text.length > 10 && !text.includes('Download') && !text.includes('Click here') && !text.includes('آن لائن')) {
                title = text;
            }
            search = prev;
            limit++;
        }

        // Links
        let volumes = [];
        let scan = img.parent();
        limit = 0;
        while (scan.length && limit < 15) {
            const next = scan.next();
            if (next.find('img').length > 0) break;
            const links = next.find('a');
            links.each((j, el) => {
                const href = $(el).attr('href');
                if (href && (href.includes('archive.org') || href.includes('mediafire.com') || $(el).text().includes('ڈاؤنلوڈ'))) {
                    volumes.push(href);
                }
            });
            scan = next;
            limit++;
        }
        
        console.log(`${i}: Title: ${title || 'MISSING'} | Cover: ${coverUrl ? 'YES' : 'NO'} | Links: ${volumes.length}`);
    });
}

test();
