import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function getDetailLinks(url) {
    if (!url) return [];
    try {
        console.log(`    Following detail: ${url}`);
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
        const $ = cheerio.load(res.data);
        const volumes = [];
        
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            if (href && (href.includes('archive.org/download/') || href.includes('mediafire.com/') || href.includes('archive.org/details/'))) {
                let volTitle = text || `Volume ${volumes.length + 1}`;
                if (volTitle.toLowerCase().includes('download')) volTitle = `Volume ${volumes.length + 1}`;
                
                let downloadHref = href;
                if (href.includes('archive.org/details/')) {
                    downloadHref = href.replace('/details/', '/download/');
                }
                
                if (!volumes.find(v => v.url === downloadHref)) {
                    volumes.push({ title: volTitle, url: downloadHref });
                }
            }
        });
        return volumes;
    } catch (e) {
        return [];
    }
}

async function scrapeCategoryImproved(baseUrl, totalPages, subCategoryName) {
    const allBooks = [];
    const processedDetailLinks = new Set();
    const categoryName = 'دورہ حدیث';

    for (let page = 1; page <= totalPages; page++) {
        const url = page === 1 ? baseUrl : `${baseUrl}page/${page}/`;
        console.log(`Scraping ${subCategoryName} page ${page}: ${url}`);
        
        try {
            const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(res.data);
            const content = $('.entry-content');
            const images = content.find('img');
            
            for (let i = 0; i < images.length; i++) {
                const img = $(images[i]);
                if (img.attr('src') && img.attr('src').includes('logo')) continue;

                let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('data-orig-src') || img.attr('src');
                if (!coverUrl || coverUrl.includes('placeholder')) continue;
                
                if (coverUrl.includes('wp.com/')) {
                    const match = coverUrl.match(/i\d\.wp\.com\/(.*?)\?/);
                    if (match) coverUrl = 'https://' + match[1];
                }
                if (coverUrl.includes('?')) coverUrl = coverUrl.split('?')[0];

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
                        const prevText = prev.text().trim();
                        if (prevText && prevText.length > 5 && !prevText.includes('Download')) {
                            title = prevText;
                        }
                        search = prev;
                    }
                    limit++;
                }
                
                if (!title) {
                    title = img.attr('alt') || img.parent().text().trim();
                }

                let volumes = [];
                let detailLink = '';
                let scan = img.parent();
                limit = 0;
                while (scan.length && limit < 25) {
                    const next = scan.next();
                    if (next.find('img').length > 0) break; // Next book
                    
                    const links = next.find('a');
                    links.each((j, el) => {
                        const href = $(el).attr('href');
                        const text = $(el).text().trim();
                        if (href && (href.includes('archive.org') || href.includes('mediafire.com'))) {
                            let downloadHref = href;
                            if (href.includes('/details/')) downloadHref = href.replace('/details/', '/download/');
                            
                            if (!volumes.find(v => v.url === downloadHref)) {
                                volumes.push({ title: text || `Vol ${volumes.length+1}`, url: downloadHref });
                            }
                        } else if (href && (text.includes('ڈاؤنلوڈ کریں') || text.includes('آن لائن') || text.includes('Detail'))) {
                            detailLink = href;
                        }
                    });
                    
                    scan = next;
                    limit++;
                }

                if (volumes.length === 0 && detailLink && !processedDetailLinks.has(detailLink)) {
                    volumes = await getDetailLinks(detailLink);
                    processedDetailLinks.add(detailLink);
                }

                if (title && volumes.length > 0) {
                    title = title.replace(/Download Link \d+/g, '').replace(/Download/g, '').replace(/\[.*?\]/g, '').trim().split('\n')[0].trim();
                     allBooks.push({
                        title: title,
                        cover_url: coverUrl,
                        volumes: volumes,
                        pdf_url: volumes[0].url,
                        category: categoryName,
                        sub_category: subCategoryName
                    });
                    console.log(`  Found: ${title.substring(0, 40)} (${volumes.length} vols)`);
                }
            }
        } catch (e) {
            console.error(`Error on ${url}: ${e.message}`);
        }
    }
    return allBooks;
}

async function run() {
    console.log("Starting Daura Hadith Scraping...");
    
    // 1. Text Books (1-8 pages)
    const textbooks = await scrapeCategoryImproved('https://besturdubooks.net/dars-e-nizami/dora-e-hadith-books/dora-e-hadith-text-books/', 8, 'درسی کتب');
    
    // 2. Arabic Commentaries (1-4 pages)
    const arabicShuroohat = await scrapeCategoryImproved('https://besturdubooks.net/dars-e-nizami/dora-e-hadith-books/dora-e-hadith-arabic-shuroohat/', 4, 'عربی شروحات');
    
    const allData = [...textbooks, ...arabicShuroohat];
    fs.writeFileSync('daura_books.json', JSON.stringify(allData, null, 2));
    console.log(`Finished! Total books found: ${allData.length}`);
}

run();
