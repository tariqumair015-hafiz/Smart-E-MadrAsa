import * as fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('tmp/7th_urdu_full.html', 'utf-8');
const $ = cheerio.load(html);

const content = $('.entry-content, .post-content').first();
const images = content.find('img');

console.log(`Diagnostic: Found ${images.length} images in total within .entry-content`);

let books = [];
images.each((i, el) => {
    const img = $(el);
    let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('src');
    if (coverUrl && coverUrl.includes('logo')) return;

    let title = img.attr('alt') || img.attr('title') || '';
    
    // Find links following this image block
    let currentLinks = [];
    let scan = img.closest('.entry-content > *');
    if (scan.length === 0) scan = img.parent();
    
    let limit = 0;
    while (scan.length && limit < 15) {
        scan.find('a').each((j, a) => {
            let href = $(a).attr('href');
            if (href && (href.toLowerCase().includes('.pdf') || href.includes('archive.org') || href.includes('mediafire.com'))) {
                currentLinks.push(href);
            }
        });
        scan = scan.next();
        if(!scan.length || scan.find('img').length > 0) break;
        limit++;
    }
    
    books.push({ title: title.substring(0, 40), links: currentLinks.length });
});

books.forEach((b, i) => console.log(`${i+1}. ${b.title} [${b.links} links]`));
console.log(`Total books identified: ${books.length}`);
