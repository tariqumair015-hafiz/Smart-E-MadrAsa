import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'درجہ سابعہ';
const YEAR = 7;

const SECTIONS = [
  {
    name: 'Textbooks',
    baseUrl: 'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-text-books/',
    totalPages: 2,
    forcedSubCategory: 'درسی کتب', // textbook pages always contain core texts
  },
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

// 7th Year textbook keywords
const DARSI_KEYWORDS = [
  'بیضاوی', 'baizawi', 'baydawi', 'beizawi', 'tafseer e baizawi', 'tafsir bayzawi',
  'متوال', 'mutawwal', 'al mutawwal',
  'مشکوٰۃ', 'مشکوۃ', 'mishkat', 'mishkaat', 'mishkat ul masabih',
  'طیبی', 'tibbi',
  'تبیان', 'tibyan', 'al-tibyan', 'al tibyan',
  'الفیین', 'alfiyyain', 'alfiyyan', 'al-alfiyyan',
  'ملا جلال', 'mulla jalaluddin', 'mulla jalal',
  'شرح جامی', 'sharah jami', 'sharh jami',
  'نور الانوار', 'noor ul anwar', 'nur ul anwar',
  'جامی', 'jami',
  'سلم العلوم', 'sullam ul uloom', 'sullam',
  'التوضیح', 'al tawzeeh', 'tawzeeh',
  'مسلم الثبوت', 'muslim us subut',
  'شرح تہذیب', 'sharh tehzeeb',
  'میبذی', 'meybodi', 'maibudi'
];

const COMMENTARY_MARKERS = [
  'شرح', 'شروح', 'sharh ', 'sharah', ' sharh', 'حاشیہ', 'hashiya', 'hashia',
  'تشریح', 'tashrih', 'تقریر', 'آسان', 'اردو شرح', 'عربی شرح',
  'تبیین', 'تسہیل', 'tasheel', 'تسهيل', 'توضیح', 'تفہیم', 'حواشی',
  'کشف', 'انوار', 'انوار', 'امداد', 'درس نظامی شرح',
  'النور', 'اشراق', 'الخیر', 'فیض',
  'حل ', 'الحل',
  'تسہیل المشکوٰۃ', 'asaan mishkat', 'آسان مشکوٰۃ',
  'درسِ نظامی'
];

function classifyBook(title, forcedSubCategory) {
  if (forcedSubCategory) return forcedSubCategory;

  const t = (title || '').toLowerCase();
  const isDarsi = DARSI_KEYWORDS.some(kw => t.includes(kw.toLowerCase()));

  if (isDarsi) {
    const hasCommentaryMarker = COMMENTARY_MARKERS.some(kw => t.includes(kw.toLowerCase()));
    if (hasCommentaryMarker) {
      if (t.includes('عربی') || t.includes('arabic') || t.includes('عربیہ')) return 'عربی شروحات';
      return 'اردو شروحات';
    }
    return 'درسی کتب';
  }

  if (t.includes('عربی') || t.includes('arabic') || t.includes('عربیہ')) return 'عربی شروحات';
  return 'اردو شروحات';
}

async function scrapePage(url) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' },
    timeout: 30000,
  });
  return cheerio.load(res.data);
}

async function scrapeSection(section) {
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
        if (coverUrl.includes('i2.wp.com') || coverUrl.includes('i0.wp.com') || coverUrl.includes('i1.wp.com')) {
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

          const sub_category = classifyBook(title, forcedSubCategory);

          const existing = books.find(b => b.title.toLowerCase() === title.toLowerCase());
          if (!existing) {
            books.push({
              title,
              cover_url: coverUrl,
              volumes,
              pdf_url: volumes[0].url,
              sub_category,
              category: CATEGORY,
            });
            console.log(`  ✅ [${sub_category}] ${title.substring(0, 70)}`);
          }
        }
      });
    } catch (err) {
      console.error(`  ❌ Error on page ${page}:`, err.message);
    }
  }

  return books;
}

async function scrapeAll() {
  const allBooks = [];

  for (const section of SECTIONS) {
    const sectionBooks = await scrapeSection(section);
    allBooks.push(...sectionBooks);
  }

  fs.writeFileSync('sabea_final_books.json', JSON.stringify(allBooks, null, 2), 'utf8');
  console.log(`\n✅ SCRAPING COMPLETE! Total books: ${allBooks.length}`);

  const byCategory = {};
  allBooks.forEach(b => {
    byCategory[b.sub_category] = (byCategory[b.sub_category] || 0) + 1;
  });
  console.log('\nBreakdown by sub_category:');
  Object.entries(byCategory).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  return allBooks;
}

async function uploadToDB() {
  const dataPath = 'sabea_final_books.json';
  if (!fs.existsSync(dataPath)) {
    console.log('No data found to upload!');
    return;
  }

  const books = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`\nUploading ${books.length} books to Supabase for ${CATEGORY} (Year ${YEAR})`);

  const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Wipe previous 7th year entries
  const { error: delError } = await supabase.from('Books').delete().eq('category', CATEGORY);
  if (delError) {
    console.log('Error clearing old 7th year books:', delError.message);
  } else {
    console.log(`Wiped previous books for ${CATEGORY}`);
  }

  let uploaded = 0;
  let skipped = 0;

  for (const book of books) {
    try {
      const primary_url = book.pdf_url || (book.volumes[0] && book.volumes[0].url) || '';

      const dbBook = {
        title: book.title.trim(),
        author: 'BestUrduBooks',
        category: CATEGORY,
        sub_category: book.sub_category,
        cover_url: book.cover_url || '',
        pdf_url: primary_url,
        description: JSON.stringify(book.volumes || []),
        size_mb: 15,
        is_free: true,
        downloads: 0,
        rating: 0,
        pages: 0,
        year: YEAR,
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
      console.log(`Exception on ${book.title}:`, err.message);
    }
  }

  console.log(`\nFINISH! Uploaded: ${uploaded}, Skipped: ${skipped}`);
}

async function runAll() {
  await scrapeAll();
  await uploadToDB();
}

runAll();
