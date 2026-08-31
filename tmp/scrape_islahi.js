import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const allBooks = [];

  for (let page = 1; page <= 27; page++) {
    const url = page === 1
      ? 'https://besturdubooks.net/category/islahi/'
      : `https://besturdubooks.net/category/islahi/page/${page}/`;

    console.log(`Scraping page ${page}/27: ${url}...`);
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
          
          let volumes = [];
          
          $2('a').each((i, link) => {
            const h = $2(link).attr('href');
            const linkText = $2(link).text().trim();
            if (h && (h.toLowerCase().includes('.pdf') || h.toLowerCase().includes('download'))) {
              if (h.toLowerCase().includes('.pdf')) {
                volumes.push({
                   title: linkText || `جلد ${volumes.length + 1}`,
                   url: h
                });
              } else if (h.includes('drive.google.com') || h.includes('archive.org')) {
                volumes.push({
                   title: linkText || `جلد ${volumes.length + 1}`,
                   url: h
                });
              }
            }
          });

          volumes = [...new Map(volumes.map(v => [v.url, v])).values()];

          if (volumes.length > 0 && img && title) {
            allBooks.push({
              title,
              author: 'نامعلوم',
              category: 'اصلاحی نصاب', // "Islahi Nisab"
              cover_url: img,
              pdf_url: volumes[0].url,
              description: JSON.stringify(volumes),
              pages: 0,
              is_free: true,
              downloads: 0,
              rating: 0,
              language: 'ur'
            });
            console.log(`    ✓ ${title} (${volumes.length} volumes found)`);
          } else {
            console.log(`    ✗ Skipped: ${title}`);
          }
        } catch (e) {
          console.error(`    Error fetching ${href}: ${e.message}`);
        }
        await delay(350);
      }
      
      // Batch save progress every 5 pages
      if (page % 5 === 0 && allBooks.length > 0) {
        const toInsert = [...allBooks];
        allBooks.length = 0;
        const { error } = await supabase.from('Books').upsert(toInsert, { onConflict: 'pdf_url' });
        if (error) console.error(`Batch error at page ${page}:`, error);
        else console.log(`✅ Progress saved at page ${page} (${toInsert.length} books)`);
      }
    } catch (e) {
      console.error(`Error fetching page ${page}: ${e.message}`);
    }
  }

  console.log(`\nTotal books found for Islahi Nisab: ${allBooks.length}`);

  if (allBooks.length > 0) {
    const { error } = await supabase.from('Books').upsert(allBooks, { onConflict: 'pdf_url' });
    if (error) {
      console.error(`Supabase error on final batch:`, error);
    } else {
      console.log(`✅ Final batch inserted (${allBooks.length} books)`);
    }
  }
}

run();
