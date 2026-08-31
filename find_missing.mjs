import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function listTitles() {
    console.log("Fetching Textbooks...");
    let allFound = [];
    for(let i=1; i<=8; i++) {
        let url = i === 1 ? 'https://besturdubooks.net/dars-e-nizami/dora-e-hadith-books/dora-e-hadith-text-books/' : `https://besturdubooks.net/dars-e-nizami/dora-e-hadith-books/dora-e-hadith-text-books/page/${i}/`;
        try {
            const res = await axios.get(url);
            const $ = cheerio.load(res.data);
            const content = $('.entry-content');
            const images = content.find('img');
            images.each((idx, el) => {
                let img = $(el);
                if (img.attr('src') && img.attr('src').includes('logo')) return;
                let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('data-orig-src') || img.attr('src');
                if (!coverUrl || coverUrl.includes('placeholder')) return;
                
                let title = '';
                let search = img.parent();
                let limit = 0;
                while (search.length && limit < 15 && !title) {
                    const text = search.text().trim();
                    if (text && text.length > 5 && !text.includes('Download') && !text.includes('Click here') && !text.includes('آن لائن')) {
                        title = text;
                    }
                    if (!title) {
                        const prev = search.prev();
                        if (prev.length) {
                             const prevText = prev.text().trim();
                             if (prevText && prevText.length > 5 && !prevText.includes('Download')) title = prevText;
                        }
                        search = prev;
                    }
                    limit++;
                }
                if(title) {
                    title = title.replace(/Download Link \d+/g, '').replace(/Download/g, '').replace(/\[.*?\]/g, '').trim().split('\n')[0].trim();
                    allFound.push(title);
                }
            });
        } catch(e) { console.error("Error page " + i); }
    }
    
    // Check against what we uploaded
    const daura = JSON.parse(fs.readFileSync('C:/Users/ut304/.gemini/antigravity/scratch/hafiz-madarsa-pro-v2/daura_books.json'));
    const dauraExpanded = JSON.parse(fs.readFileSync('C:/Users/ut304/.gemini/antigravity/scratch/hafiz-madarsa-pro-v2/daura_books_expanded.json'));
    
    const ourTitles = daura.map(b => b.title);
    const ourExpanded = dauraExpanded.map(b => b.title);
    
    console.log("--- Found " + allFound.length + " on Website (Textbooks) ---");
    const missed = allFound.filter(t => !ourTitles.some(ot => ot.includes(t.substring(0, 15))) && !ourExpanded.some(ot => ot.includes(t.substring(0, 15))));
    console.log("--- MISSING TITLES ---");
    console.log(missed.join("\n"));
}
listTitles();
