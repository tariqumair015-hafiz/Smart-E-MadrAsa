import * as fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('tmp/7th_test.html', 'utf-8');
const $ = cheerio.load(html);

const content = $('.entry-content, .post-content').first();

let books = [];

const images = content.find('img');
images.each((i, el) => {
    const img = $(el);
    let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('data-orig-src') || img.attr('src');
    if (!coverUrl || coverUrl.includes('logo') || coverUrl.includes('placeholder')) return;
    
    let title = img.attr('alt') || img.attr('title') || '';
    title = title.replace(/Download Link \d+/g, '').replace(/Download/g, '').replace(/\[.*?\]/g, '').trim();
    
    if(!title) return; // Skip if no title can be found

    let currentLinks = [];
    
    // Find the top-level block element containing this image
    let scan = img.closest('*').parentsUntil('.entry-content, .post-content').last();
    if (scan.length === 0) scan = img.parent(); // Fallback if parentsUntil is empty

    let limit = 0;
    
    // First, grab links that might be IN the same top-level block as the image
    scan.find('a').each((j, a) => {
        let href = $(a).attr('href');
        let ltext = $(a).text().trim() || `جلد ${currentLinks.length+1}`;
        if (href && (href.toLowerCase().includes('.pdf') || href.includes('archive.org') || href.includes('mediafire.com'))) {
             if (ltext.includes('Read') || ltext.includes('آن لائن')) return;
             currentLinks.push({title: ltext, url: href});
        }
    });

    // Then grab from next siblings
    while (scan.length && limit < 20) {
        scan = scan.next();
        if (!scan.length || scan.find('img').length > 0) break; // Stop at next image

        scan.find('a').each((j, a) => {
            let href = $(a).attr('href');
            let ltext = $(a).text().trim() || `جلد ${currentLinks.length+1}`;
            if (href && (href.toLowerCase().includes('.pdf') || href.includes('archive.org') || href.includes('mediafire.com'))) {
                 if (ltext.includes('Read') || ltext.includes('آن لائن')) return;
                 // Deduplicate
                 let dup = currentLinks.find(c => c.url === href);
                 if (!dup) currentLinks.push({title: ltext, url: href});
            }
        });
        limit++;
    }

    if (currentLinks.length > 0) {
        books.push({ title, vols: currentLinks.length });
    }
});

books.forEach(b => console.log(`${b.title} [${b.vols} vols]`));
console.log(`\nTotal: ${books.length}`);
