/**
 * Scraper for 7th Year (Darja Sabea / Maoqoof alai) books
 * 
 * IMPORTANT: Textbook pages on besturdubooks have NO cover images —
 * they are plain text-based book listings. We therefore:
 *  1. Scrape Urdu & Arabic shuroohat pages normally (they DO have images)
 *  2. For textbooks, we manually map known books with archive.org cover images
 *  3. Merge and upload to Supabase
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'درجہ سابعہ';
const YEAR = 7;

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';

// ── 7th Year core textbooks (manually mapped from besturdubooks page) ──────────
const TEXTBOOKS = [
  {
    title: 'Tafseer e Baizawi تفسیر بیضاوی مکمل',
    cover_url: 'https://archive.org/services/img/TafseerBaizawi',
    pdf_url: 'https://archive.org/download/TafseerBaizawi/Tafseer-Baizawi-01.pdf',
    volumes: [
      { title: 'Vol 1', url: 'https://archive.org/download/TafseerBaizawi/Tafseer-Baizawi-01.pdf' },
      { title: 'Vol 2', url: 'https://archive.org/download/TafseerBaizawi/Tafseer-Baizawi-02.pdf' },
      { title: 'Vol 3', url: 'https://archive.org/download/TafseerBaizawi/Tafseer-Baizawi-03.pdf' },
      { title: 'Vol 4', url: 'https://archive.org/download/TafseerBaizawi/Tafseer-Baizawi-04.pdf' },
      { title: 'Vol 5', url: 'https://archive.org/download/TafseerBaizawi/Tafseer-Baizawi-05.pdf' },
    ],
    sub_category: 'درسی کتب',
  },
  {
    title: 'Tafseer e Baizawi Al Bushra تفسیر بیضاوی البشری',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiAlBushraColor.pdf',
    volumes: [
      { title: 'Al Bushra Color (56MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiAlBushraColor.pdf' },
      { title: 'Al Bushra Black (7MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiAlBushra.pdf' },
    ],
    sub_category: 'درسی کتب',
  },
  {
    title: 'Tafseer e Baizawi Rahmania تفسیر بیضاوی رحمانیہ',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiRahmania.pdf',
    volumes: [
      { title: 'Download (12MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiRahmania.pdf' },
    ],
    sub_category: 'درسی کتب',
  },
  {
    title: 'Tafseer e Baizawi Meer Muhammad تفسیر بیضاوی میر محمد',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiMeerMuhammad.pdf',
    volumes: [
      { title: 'Download (11MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiMeerMuhammad.pdf' },
    ],
    sub_category: 'درسی کتب',
  },
  {
    title: 'Tafseer e Baizawi Rashidia تفسیر بیضاوی رشیدیہ',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiRashedia.pdf',
    volumes: [
      { title: 'Download (12MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiRashedia.pdf' },
    ],
    sub_category: 'درسی کتب',
  },
  {
    title: 'AL Tibyan التبیان فی علوم القرآن',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlTibyanAlBushraColor.pdf',
    volumes: [
      { title: 'Al Bushra Color (23MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlTibyanAlBushraColor.pdf' },
      { title: 'Al Bushra Black (5MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlTibyanAlBushra.pdf' },
      { title: 'Qadimi (4MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlTibyanQadimi.pdf' },
    ],
    sub_category: 'درسی کتب',
  },
  {
    title: 'Mishkat ul Masabih Al Bushra مشکوۃ المصابیح',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehVol1AlBushraColor.pdf',
    volumes: [
      { title: 'Vol 1 Color (66MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehVol1AlBushraColor.pdf' },
      { title: 'Vol 2 Color (55MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehVol2AlBushraColor.pdf' },
      { title: 'Vol 3 Color (55MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehVol3AlBushraColor.pdf' },
      { title: 'Vol 4 Color (57MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehVol4AlBushraColor.pdf' },
    ],
    sub_category: 'درسی کتب',
  },
  {
    title: 'Mishkat ul Masabih Rahmania مشکوۃ المصابیح رحمانیہ',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkarUlMasabeehVol1Rahmania.pdf',
    volumes: [
      { title: 'Vol 1 (14MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkarUlMasabeehVol1Rahmania.pdf' },
      { title: 'Vol 2 (18MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkarUlMasabeehVol2Rahmania.pdf' },
    ],
    sub_category: 'درسی کتب',
  },
  {
    title: 'Mishkat ul Masabeeh Urdu مشکوۃ المصابیح اردو',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehUrduVol1.pdf',
    volumes: [
      { title: 'Vol 1 (33MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehUrduVol1.pdf' },
      { title: 'Vol 2 (28MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehUrduVol2.pdf' },
      { title: 'Vol 3 (15MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehUrduVol3.pdf' },
    ],
    sub_category: 'درسی کتب',
  },
];

// ── Scrape image-based shuroohat sections ────────────────────────────────────
const SHUROOHAT_SECTIONS = [
  {
    name: 'Urdu Shuroohat',
    baseUrl: 'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-urdu-shuroohat/',
    totalPages: 6,
    forcedSubCategory: 'اردو شروحات',
  },
  {
    name: 'Arabic Shuroohat',
    baseUrl: 'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-arabic-shuroohat/',
    totalPages: 6,
    forcedSubCategory: 'عربی شروحات',
  },
];

async function scrapePage(url) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' },
    timeout: 30000,
  });
  return cheerio.load(res.data);
}

async function scrapeShuroohat(section) {
  const books = [];
  const { baseUrl, totalPages, name, forcedSubCategory } = section;

  for (let page = 1; page <= totalPages; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}${page}/`;
    console.log(`\n📄 [${name}] Page ${page}: ${url}`);

    try {
      const $ = await scrapePage(url);
      const content = $('.entry-content');
      const images = content.find('img');
      console.log(`  Images found: ${images.length}`);

      images.each((i, imgEl) => {
        const img = $(imgEl);

        let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('data-orig-src') || img.attr('src') || '';
        if (!coverUrl || coverUrl.includes('logo') || coverUrl.includes('placeholder') || coverUrl.includes('icon') || coverUrl.length < 20) return;

        // Clean WordPress CDN URLs
        if (/i[0-9]\.wp\.com/.test(coverUrl)) {
          coverUrl = coverUrl.replace(/https:\/\/i[0-9]\.wp\.com\//, 'https://').split('?')[0];
        } else if (coverUrl.includes('?')) {
          coverUrl = coverUrl.split('?')[0];
        }

        // Find book title (in preceding siblings)
        let title = '';
        let prev = img.parent().prev();
        let searchLimit = 0;
        while (prev.length && !title && searchLimit < 10) {
          const text = prev.text().trim();
          if (text && text.length > 4 &&
            !text.toLowerCase().includes('click here') &&
            !text.toLowerCase().includes('download link') &&
            !text.toLowerCase().includes('nisab') &&
            !text.match(/^\d+\.$/) &&
            !text.match(/^(volume|vol|part)\s*\d+$/i)) {
            title = text;
          }
          prev = prev.prev();
          searchLimit++;
        }
        if (!title) title = img.attr('alt') || '';

        // Gather download links from next siblings
        const volumes = [];
        let next = img.parent().next();
        let limit = 0;

        while (next.length && limit < 15) {
          if (next.find('img').length > 0 && limit > 0) break;

          next.find('a').each((j, linkEl) => {
            const link = $(linkEl);
            const href = link.attr('href') || '';
            const text = link.text().trim();

            if (href && (
              href.includes('archive.org/download') ||
              href.includes('archive.org/details') ||
              href.includes('archive.org/stream') ||
              href.includes('mediafire.com')
            )) {
              let volTitle = text || `Volume ${volumes.length + 1}`;
              if (!volTitle || volTitle.toLowerCase() === 'download' || volTitle.toLowerCase().includes('click here')) {
                volTitle = `Link ${volumes.length + 1}`;
              }

              let downloadUrl = href;
              if (href.includes('archive.org/details/')) downloadUrl = href.replace('/details/', '/download/');
              if (href.includes('archive.org/stream/')) downloadUrl = href.replace('/stream/', '/download/');

              if (!volumes.find(v => v.url === downloadUrl)) {
                volumes.push({ title: volTitle, url: downloadUrl });
              }
            }
          });

          next = next.next();
          limit++;
        }

        if (title && volumes.length > 0) {
          title = title
            .replace(/Download Link \d+/gi, '')
            .replace(/^\d+\.\s*/, '')
            .replace(/\[Arabic\]/i, '')
            .replace(/\[Urdu\]/i, '')
            .trim();

          const existing = books.find(b => b.title.toLowerCase() === title.toLowerCase());
          if (!existing) {
            books.push({
              title,
              cover_url: coverUrl,
              volumes,
              pdf_url: volumes[0].url,
              sub_category: forcedSubCategory,
              category: CATEGORY,
            });
            console.log(`  ✅ [${forcedSubCategory}] ${title.substring(0, 70)}`);
          }
        }
      });
    } catch (err) {
      console.error(`  ❌ Error on page ${page}:`, err.message);
    }
  }

  return books;
}

// Try to find a cover from shuroohat for a textbook title
function findMatchingCover(title, shuroohatBooks) {
  const t = title.toLowerCase();
  const keywords = t.split(' ').filter(w => w.length > 3);
  
  for (const book of shuroohatBooks) {
    const bt = book.title.toLowerCase();
    if (keywords.some(kw => bt.includes(kw))) {
      if (book.cover_url && !book.cover_url.includes('archive.org/services/img/Dars')) {
        return book.cover_url;
      }
    }
  }
  return null;
}

async function main() {
  const allBooks = [...TEXTBOOKS.map(b => ({ ...b, category: CATEGORY }))];
  
  for (const section of SHUROOHAT_SECTIONS) {
    const books = await scrapeShuroohat(section);
    allBooks.push(...books);
  }

  // Try to improve textbook covers using matching shuroohat covers
  const shuroohatBooks = allBooks.filter(b => b.sub_category !== 'درسی کتب');
  for (const tb of allBooks.filter(b => b.sub_category === 'درسی کتب')) {
    if (tb.cover_url.includes('archive.org/services/img/DarsENizami')) {
      const better = findMatchingCover(tb.title, shuroohatBooks);
      if (better) {
        console.log(`📸 Better cover for: ${tb.title.substring(0,40)}`);
        tb.cover_url = better;
      }
    }
  }

  fs.writeFileSync('sabea_final_books.json', JSON.stringify(allBooks, null, 2), 'utf8');
  
  const byCat = {};
  allBooks.forEach(b => { byCat[b.sub_category] = (byCat[b.sub_category] || 0) + 1; });
  console.log(`\n✅ SCRAPING COMPLETE! Total books: ${allBooks.length}`);
  console.log('Breakdown:', JSON.stringify(byCat));

  // ── Upload to Supabase ──────────────────────────────────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { error: delError } = await supabase.from('Books').delete().eq('category', CATEGORY);
  if (delError) console.error('Delete error:', delError.message);
  else console.log(`\n🗑️  Cleared previous ${CATEGORY} books`);

  let uploaded = 0, skipped = 0;

  for (const book of allBooks) {
    try {
      const dbBook = {
        title: book.title.trim(),
        author: 'BestUrduBooks',
        category: CATEGORY,
        sub_category: book.sub_category,
        cover_url: book.cover_url || '',
        pdf_url: book.pdf_url || '',
        description: JSON.stringify(book.volumes || []),
        size_mb: 15,
        is_free: true,
        downloads: 0,
        rating: 0,
        pages: 0,
      };

      const { error } = await supabase.from('Books').insert([dbBook]);
      if (error) {
        console.log(`[SKIP] ${book.title.substring(0, 40)}: ${error.message}`);
        skipped++;
      } else {
        console.log(`[UPLOADED] [${book.sub_category}] ${book.title.substring(0, 50)}`);
        uploaded++;
      }
    } catch (err) {
      console.log(`Exception:`, err.message);
    }
  }

  console.log(`\n🎉 DONE! Uploaded: ${uploaded}, Skipped: ${skipped}`);
}

main().catch(console.error);
