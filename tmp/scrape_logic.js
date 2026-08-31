import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const allBooks = [];

  for (let page = 1; page <= 6; page++) {
    const url = page === 1
      ? 'https://besturdubooks.net/dars-e-nizami/mantiq-o-falsafa/'
      : `https://besturdubooks.net/dars-e-nizami/mantiq-o-falsafa/${page}/`;

    console.log(`Scraping page ${page}/6: ${url}...`);
    try {
      const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
      const $ = cheerio.load(data);
      
      // On these direct-listing pages, books are often organized in <p> tags with images and download links.
      // We look for <a> tags with .pdf or Archive.org links and associate them with the nearest previous strong text or image alt.
      
      // Heuristic: Search for <img> first, as they usually mark a new book card.
      $('img').each((i, imgEl) => {
        const title = $(imgEl).attr('alt') || $(imgEl).attr('title');
        const imgSrc = $(imgEl).attr('src') || $(imgEl).attr('data-src');
        
        if (title && imgSrc && title.length > 5 && !title.includes('Best Urdu Books')) {
          // Find the container usually holding this book
          let container = $(imgEl).closest('p').nextAll().first();
          if (!container.length) container = $(imgEl).closest('div');
          
          let volumes = [];
          // Search for links in nearby paragraphs
          let searchLimit = 5;
          let current = $(imgEl).closest('p');
          while (searchLimit > 0 && current.length) {
            current.find('a').each((j, aEl) => {
               const h = $(aEl).attr('href');
               const txt = $(aEl).text().trim();
               if (h && (h.toLowerCase().includes('.pdf') || h.includes('archive.org') || h.includes('mediafire.com'))) {
                 if (h.toLowerCase().includes('.pdf') || h.includes('/details/')) {
                   volumes.push({ title: txt || `جلد ${volumes.length + 1}`, url: h });
                 }
               }
            });
            if (volumes.length > 0) break;
            current = current.next();
            searchLimit--;
          }
          
          volumes = [...new Map(volumes.map(v => [v.url, v])).values()];
          
          if (volumes.length > 0) {
            allBooks.push({
              title,
              author: 'نامعلوم',
              category: 'منطق و فلسفہ',
              cover_url: imgSrc,
              pdf_url: volumes[0].url,
              description: JSON.stringify(volumes),
              pages: 0,
              is_free: true,
              downloads: 0,
              rating: 0,
              language: 'ur'
            });
            console.log(`    ✓ Detected: ${title} (${volumes.length} links)`);
          }
        }
      });
      
      // Second strategy: Many books are list entries starting with text followed by links.
      // If we didn't find many books with images, try a text-based pass for known titles in bold?
      // But usually img+link is more reliable.
      
    } catch (e) {
      console.error(`Error fetching page ${page}: ${e.message}`);
    }
    await delay(1000);
  }

  // Deduplication by pdf_url or title
  const finalBooks = [...new Map(allBooks.map(b => [b.pdf_url, b])).values()];
  console.log(`\nTotal unique books found: ${finalBooks.length}`);

  if (finalBooks.length > 0) {
    const batchSize = 50;
    for (let i = 0; i < finalBooks.length; i += batchSize) {
      const batch = finalBooks.slice(i, i + batchSize);
      const { error } = await supabase.from('Books').upsert(batch, { onConflict: 'pdf_url' });
      if (error) {
        console.error(`Supabase error on batch:`, error);
      } else {
        console.log(`✅ Batch of ${batch.length} books processed.`);
      }
    }
    console.log('🎉 Logic & Philosophy successfully updated!');
  } else {
    console.log('No books found. Please check logic/selectors.');
  }
}

run();
