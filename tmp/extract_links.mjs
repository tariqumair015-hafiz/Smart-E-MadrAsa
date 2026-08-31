import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('tmp/banat_landing.html', 'utf8');
const $ = cheerio.load(html);

const links = [];
$('.entry-content a').each((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    if (href && href.startsWith('https://besturdubooks.net/') && 
        !href.includes('/category/') && !href.includes('/tag/') && 
        !href.includes('/author/') && href.length > 30) {
        
        let subCat = "درسی کتب";
        const titleLower = text.toLowerCase();
        
        if (text.includes("شرح") || text.includes("شروحات") || text.includes("حل") || text.includes("حاشیہ") || text.includes("اردو") || text.includes("دروس") || text.includes("توضیح") || titleLower.includes("sharah")) {
            subCat = "شروحات";
        }
        
        // Also check if the parent text has clues
        const pText = $(el).parent().text();
        if (pText.includes("شروحات") || pText.includes("شرح")) {
            subCat = "شروحات";
        }

        // Make sure it hasn't been added yet
        if (!links.some(l => l.href === href)) {
            links.push({ text, href, subCat });
        }
    }
});

fs.writeFileSync('tmp/khasa_1_links.json', JSON.stringify(links, null, 2));
console.log(`Found ${links.length} unique book links and saved to tmp/khasa_1_links.json`);
