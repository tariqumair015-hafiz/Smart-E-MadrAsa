import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('tmp/banat_landing.html', 'utf8');
const $ = cheerio.load(html);

// Find the main content area.
// Usually entry-content
const links = [];
let currentHeading = '';

$('.entry-content').children('.wp-block-group').each((i, group) => {
    // inside group there might be heading and paragraph with links
    const groupHtml = $(group).html();
    const $$ = cheerio.load(groupHtml);
    
    $$('*').each((j, el) => {
        if ($$(el).is('h2, h3, h4, h5, h6') || $$(el).hasClass('has-text-align-center')) {
            const text = $$(el).text().trim();
            if (text) {
                currentHeading = text;
            }
        }
        
        if ($$(el).is('a')) {
            const href = $$(el).attr('href');
            const text = $$(el).text().trim();
            if (href && href.startsWith('https://besturdubooks.net/')) {
                links.push({ heading: currentHeading, text, href });
            }
        }
    });
});

console.log(`Found ${links.length} links in .wp-block-group elements.`);
if (links.length > 0) {
    console.log(links.slice(0, 5));
} else {
    // Fallback if structure is different
    $('*').each((i, el) => {
        if ($(el).is('h2, h3, h4, p>strong, div.su-box-title')) {
            const text = $(el).text().trim();
            if (text && text.length < 100) currentHeading = text;
        }
        if ($(el).is('a')) {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            const parentText = $(el).parent().text().trim();
            
            // Let's filter some obvious junk
            if (href && href.startsWith('https://besturdubooks.net/') && text.length > 2 && !href.includes('/category/') && !href.includes('/tag/')) {
                links.push({ heading: currentHeading, text, href });
            }
        }
    });
    console.log(`Fallback found ${links.length} links.`);
    console.log(links.slice(0, 10));
}
