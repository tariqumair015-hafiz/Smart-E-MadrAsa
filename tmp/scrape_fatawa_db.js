import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const allBooks = [];
  
  for (let page = 1; page <= 7; page++) {
    const url = page === 1 
      ? 'https://besturdubooks.net/category/fatawa/' 
      : `https://besturdubooks.net/category/fatawa/page/${page}/`;
    
    console.log(`Scraping page ${page}: ${url}...`);
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      
      const articles = $('article').toArray();
      
      for (const el of articles) {
        const a = $(el).find('a').first();
        const href = a.attr('href');
        const title = $(el).find('h2, h3, .title').text().trim() || a.attr('title');
        let img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
        
        if (!href) continue;
        
        // Fetch book page to get PDF link
        try {
          const res = await axios.get(href);
          const $2 = cheerio.load(res.data);
          let pdfUrl = '';
          $2('a').each((i, link) => {
            const h = $2(link).attr('href');
            if (h && (h.toLowerCase().includes('.pdf') || h.toLowerCase().includes('download'))) {
              if (h.toLowerCase().includes('.pdf')) {
                pdfUrl = h;
                return false; // break
              }
            }
          });
          
          if (!pdfUrl) {
            // fallback
            $2('a').each((i, link) => {
               const h = $2(link).attr('href');
               if (h && h.includes('drive.google.com')) pdfUrl = h;
               if (h && h.includes('archive.org')) pdfUrl = h;
            });
          }
          
          if (pdfUrl && img && title) {
            allBooks.push({
              title,
              author: 'مفتی / نامعلوم',
              category: 'فقہ و فتاویٰ',
              cover_url: img,
              pdf_url: pdfUrl,
              pages: 0,
              is_free: true,
              downloads: 0,
              rating: 0
            });
          }
        } catch (e) {
          console.error(`Error fetching book page ${href}:`, e.message);
        }
        await delay(500); // polite delay
      }
    } catch (e) {
      console.error(`Error fetching page ${page}:`, e.message);
    }
  }
  
  console.log(`Found ${allBooks.length} books. Inserting into Supabase...`);
  
  if (allBooks.length > 0) {
    // Insert into Supabase
    const { data: inserted, error } = await supabase.from('Books').insert(allBooks);
    if (error) {
      console.error('Supabase Insert Error:', error);
    } else {
      console.log('Successfully inserted all books!');
    }
  }
}

run();
