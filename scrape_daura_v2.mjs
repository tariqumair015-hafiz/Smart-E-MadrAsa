import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function getDetailLinks(url) {
    if (!url) return [];
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
        const $ = cheerio.load(res.data);
        const volumes = [];
        
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            if (href && (href.includes('archive.org/download/') || href.includes('mediafire.com/') || href.includes('archive.org/details/'))) {
                let downloadHref = href;
                if (href.includes('archive.org/details/')) downloadHref = href.replace('/details/', '/download/');
                if (!volumes.find(v => v.url === downloadHref)) {
                    volumes.push({ title: text || `Volume ${volumes.length + 1}`, url: downloadHref });
                }
            }
        });
        return volumes;
    } catch (e) {
        return [];
    }
}

async function scrapeCategoryExpanded(baseUrl, totalPages, subCategoryName) {
    const allBooks = [];
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
                        if (prev.length) {
                             const prevText = prev.text().trim();
                             if (prevText && prevText.length > 5 && !prevText.includes('Download')) title = prevText;
                        }
                        search = prev;
                    }
                    limit++;
                }
                if (!title) title = img.attr('alt') || img.parent().text().trim();
                title = title.replace(/Download Link \d+/g, '').replace(/Download/g, '').replace(/\[.*?\]/g, '').trim().split('\n')[0].trim();

                // Group links by publisher
                let publisherGroups = [];
                let currentLinks = [];
                let currentPublisher = ''; // Default

                let scan = img.parent();
                limit = 0;
                while (scan.length && limit < 40) {
                    const next = scan.next();
                    if (!next.length || next.find('img').length > 0) break; // Next book
                    
                    const text = next.text().trim();
                    const aTags = next.find('a');

                    // Detect separator or publisher name
                    if (aTags.length === 0 && text.length > 0 && text.length < 60 && !text.includes('Download') && !text.includes('Read') && !text.includes('آن لائن')) {
                        if (text.includes('——') || text.includes('___')) {
                            // Boundary hit
                            if (currentLinks.length > 0) {
                                publisherGroups.push({ pub: currentPublisher, links: currentLinks });
                                currentLinks = [];
                            }
                            currentPublisher = '';
                        } else {
                            // Publisher text
                            if (currentLinks.length > 0) {
                                publisherGroups.push({ pub: currentPublisher, links: currentLinks });
                                currentLinks = [];
                            }
                            currentPublisher = text;
                        }
                    }

                    aTags.each((j, el) => {
                        let href = $(el).attr('href');
                        let ltext = $(el).text().trim();
                        if (href && (href.includes('archive.org') || href.includes('mediafire.com'))) {
                            if (href.includes('/details/')) href = href.replace('/details/', '/download/');
                            
                            // Try to deduplicate mirrors inside the SAME publisher group
                            let isDuplicate = false;
                            
                            for(let known of currentLinks) {
                                if (known.url === href) isDuplicate = true;
                                // Basic overlap check: if known holds archive, and we found mediafire for same book, skip
                                if (href.includes('mediafire') && known.url.includes('archive.org')) {
                                   let extractedNew = href.split('/').pop().replace('.pdf', '');
                                   let extractedOld = known.url.split('/').pop().replace('.pdf', '');
                                   if (extractedNew === extractedOld) isDuplicate = true;
                                }
                            }
                            
                            if (!isDuplicate) {
                                currentLinks.push({ title: ltext || `Vol ${currentLinks.length+1}`, url: href });
                            }
                        }
                    });
                    
                    // Detail link support for single link bundles
                    if (currentLinks.length === 0) {
                         let dlLink = '';
                         aTags.each((j, el) => {
                             const thref = $(el).attr('href');
                             const ttext = $(el).text().trim();
                             if (thref && (ttext.includes('ڈاؤنلوڈ') || ttext.includes('Detail') || ttext.includes('آن لائن'))) {
                                 dlLink = thref;
                             }
                         });
                         if (dlLink) {
                             currentLinks.push({ detailPage: dlLink });
                         }
                    }

                    scan = next;
                    limit++;
                }
                
                if (currentLinks.length > 0) {
                    publisherGroups.push({ pub: currentPublisher, links: currentLinks });
                }

                // Append each publisher as its own entry!
                let counter = 0;
                for (const group of publisherGroups) {
                    // Resolve detail links 
                    let resolvedLinks = [];
                    for (const req of group.links) {
                        if (req.detailPage) {
                            const got = await getDetailLinks(req.detailPage);
                            resolvedLinks.push(...got);
                        } else {
                            resolvedLinks.push(req);
                        }
                    }
                    
                    if (resolvedLinks.length > 0) {
                        // Cleanup links to just archive if there are duplicates of "Download Link 1" vs "Read Online"
                        let bestLinks = resolvedLinks.filter(l => !l.title.includes('Read') && !l.title.includes('آن لائن پڑھیں'));
                        if (bestLinks.length === 0) bestLinks = resolvedLinks; // fallback
                        
                        // Limit to one full set of volumes (if there are duplicate archive mirrors)
                        let uniqueVols = [];
                        let urlsSeen = new Set();
                        let maxV = bestLinks.length > 20 ? 40 : bestLinks.length; // max limit
                        
                        for (let cl of bestLinks) {
                            if(!urlsSeen.has(cl.url) && uniqueVols.length < maxV) {
                                uniqueVols.push(cl);
                                urlsSeen.add(cl.url);
                            }
                        }

                        let finalTitle = title;
                        if (group.pub) finalTitle += ` (${group.pub.replace(/_/g, '').trim()})`;
                        else if (counter > 0) finalTitle += ` (Edition ${counter + 1})`;

                        allBooks.push({
                            title: finalTitle,
                            cover_url: coverUrl,
                            volumes: uniqueVols,
                            pdf_url: uniqueVols[0] ? uniqueVols[0].url : '',
                            category: categoryName,
                            sub_category: subCategoryName
                        });
                        counter++;
                        console.log(`  Added: ${finalTitle} (${uniqueVols.length} vols)`);
                    }
                }
            }
        } catch (e) {
            console.error(`Error on ${url}: ${e.message}`);
        }
    }
    return allBooks;
}

async function run() {
    console.log("Starting Daura Hadith Expanded Scraping...");
    const textbooks = await scrapeCategoryExpanded('https://besturdubooks.net/dars-e-nizami/dora-e-hadith-books/dora-e-hadith-text-books/', 8, 'درسی کتب');
    const arabicShuroohat = await scrapeCategoryExpanded('https://besturdubooks.net/dars-e-nizami/dora-e-hadith-books/dora-e-hadith-arabic-shuroohat/', 4, 'عربی شروحات');
    
    const allData = [...textbooks, ...arabicShuroohat];
    fs.writeFileSync('daura_books_expanded.json', JSON.stringify(allData, null, 2));
    console.log(`Finished! Total books separated: ${allData.length}`);
}

run();
