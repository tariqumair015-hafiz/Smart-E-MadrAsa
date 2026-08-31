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
      
      const links = [];
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        const title = $(el).find('img').attr('alt') || $(el).attr('title') || $(el).text().trim();
        const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
        if (href && href.startsWith('https://besturdubooks.net/') && !href.includes('/category/') && !href.includes('/tag/') && !href.includes('/author/') && !href.includes('/page/') && href.length > 30 && img) {
            links.push({href, title, img});
        }
      });
      // Deduplicate by href
      const uniqueLinks = [...new Map(links.map(item => [item.href, item])).values()];
      
      for (const item of uniqueLinks) {
        const href = item.href;
        const title = item.title;
        let img = item.img;
        
        if (!href) continue;
        
        try {
          const res = await axios.get(href);
          const $2 = cheerio.load(res.data);
          let pdfUrl = '';
          $2('a').each((i, link) => {
            const h = $2(link).attr('href');
            if (h && (h.toLowerCase().includes('.pdf') || h.toLowerCase().includes('download'))) {
              if (h.toLowerCase().includes('.pdf')) {
                pdfUrl = h;
                return false;
              }
            }
          });
          
          if (!pdfUrl) {
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
        await delay(500);
      }
    } catch (e) {
      console.error(`Error fetching page ${page}:`, e.message);
    }
  }
  
  console.log(`Found ${allBooks.length} books. Inserting into Supabase...`);
  
  if (allBooks.length > 0) {
    // using upsert to avoid duplicate key errors
    const { data: inserted, error } = await supabase.from('Books').upsert(allBooks, { onConflict: 'pdf_url', ignoreDuplicates: true });
    if (error) {
      console.error('Supabase Upsert Error:', error);
    } else {
      console.log('Successfully inserted all books!');
    }
  }
}

run();
