import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const allBooks = [];

  for (let page = 1; page <= 46; page++) {
    const url = page === 1
      ? 'https://besturdubooks.net/category/hadith/'
      : `https://besturdubooks.net/category/hadith/page/${page}/`;

    console.log(`Scraping page ${page}/46: ${url}...`);
    try {
      const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
      const $ = cheerio.load(data);

      const links = [];
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        const title = $(el).find('img').attr('alt') || $(el).attr('title') || $(el).text().trim();
        const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
        if (
          href &&
          href.startsWith('https://besturdubooks.net/') &&
          !href.includes('/category/') &&
          !href.includes('/tag/') &&
          !href.includes('/author/') &&
          !href.includes('/page/') &&
          href.length > 30 &&
          img
        ) {
          links.push({ href, title, img });
        }
      });

      const uniqueLinks = [...new Map(links.map(item => [item.href, item])).values()];
      console.log(`  Found ${uniqueLinks.length} book cards on page ${page}`);

      for (const item of uniqueLinks) {
        const { href, title, img } = item;

        try {
          const res = await axios.get(href, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
          const $2 = cheerio.load(res.data);
          let pdfUrl = '';

          $2('a').each((i, link) => {
            const h = $2(link).attr('href');
            if (h && h.toLowerCase().includes('.pdf')) {
              pdfUrl = h;
              return false;
            }
          });

          if (!pdfUrl) {
            $2('a').each((i, link) => {
              const h = $2(link).attr('href');
              if (h && (h.includes('drive.google.com') || h.includes('archive.org'))) {
                pdfUrl = h;
                return false;
              }
            });
          }

          if (pdfUrl && img && title) {
            allBooks.push({
              title,
              author: 'نامعلوم',
              category: 'احادیث',
              cover_url: img,
              pdf_url: pdfUrl,
              pages: 0,
              is_free: true,
              downloads: 0,
              rating: 0
            });
            console.log(`    ✓ ${title}`);
          } else {
            console.log(`    ✗ Skipped: ${title}`);
          }
        } catch (e) {
          console.error(`    Error fetching ${href}: ${e.message}`);
        }
        await delay(350);
      }
    } catch (e) {
      console.error(`Error fetching page ${page}: ${e.message}`);
    }
  }

  console.log(`\nTotal books found for Ahadith: ${allBooks.length}`);

  if (allBooks.length > 0) {
    const batchSize = 50;
    for (let i = 0; i < allBooks.length; i += batchSize) {
      const batch = allBooks.slice(i, i + batchSize);
      const { error } = await supabase.from('Books').upsert(batch, { onConflict: 'pdf_url', ignoreDuplicates: true });
      if (error) {
        console.error(`Supabase error on batch ${Math.floor(i/batchSize)+1}:`, error);
      } else {
        console.log(`✅ Batch ${Math.floor(i/batchSize)+1} inserted (${batch.length} books)`);
      }
    }
    console.log('🎉 All Ahadith books inserted successfully!');
  }
}

run();
