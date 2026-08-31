import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const allBooks = [];
  const startPage = 1;
  const endPage = 11;

  const skipKeywords = [
    'دوره حدیث', 'دورہ حدیث', 'Dora e Hadith', 'Daura e Hadith',
    'درجہ ثانیہ', 'درجہ ثالثہ', 'درجہ رابعہ', 'درجہ خامسہ', 'درجہ سادسہ', 'درجہ سابعہ', 'درجہ ثامنہ',
    '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year', '7th Year', '8th Year',
    'ثانویہ عامہ', 'ثانویہ خاصہ', 'عالیہ', 'عالمیہ', 'نصابی کتب', 'نصابی کتابیں', 'درسی کتب فہرست',
     'Dars e Nizami', 'Dars-e-Nizami', 'Year-1', 'Year-2', 'Year-3', 'Year-4', 'Year-5', 'Year-6', 'Year-7', 'Year-8',
     'Darja Aula', 'Darja Sanya', 'Darja Salisa', 'Darja Rabia', 'Darja Khamisa', 'Darja Sadisa', 'Darja Sabia'
  ];

  for (let page = startPage; page <= endPage; page++) {
    const url = page === 1
      ? 'https://besturdubooks.net/dars-e-nizami/al-aula-1st-year/'
      : `https://besturdubooks.net/dars-e-nizami/al-aula-1st-year/${page}/`;

    console.log(`\n-----------------------------------------`);
    console.log(`Scraping page ${page}/${endPage}: ${url}`);
    console.log(`-----------------------------------------`);
    try {
      const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
      const $ = cheerio.load(data);

      const links = [];
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.startsWith('https://besturdubooks.net/') && 
            !href.includes('/category/') && !href.includes('/tag/') && !href.includes('/author/') && 
            !href.toLowerCase().includes('dars-e-nizami') && // More aggressive skip
            !href.toLowerCase().includes('-year') &&
            href.length > 30 && href !== url) {
          links.push(href);
        }
      });

      const uniqueLinks = [...new Set(links)];
      console.log(`  Found ${uniqueLinks.length} candidate individual book links`);

      for (const href of uniqueLinks) {
        if (href.includes('/contact-us/') || href.includes('/about-us/') || href.includes('/privacy-policy/')) continue;
        console.log(`    → Fetching: ${href.substring(0, 50)}...`);

        try {
          const res = await axios.get(href, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
          const $2 = cheerio.load(res.data);
          
          let title = $2('h1.entry-title').text().trim() || $2('h1').first().text().trim();
          
          if (!title || title.length < 5) {
             console.log(`      ✕ Title too short or not found`);
             continue;
          }
          
          const titleLower = title.toLowerCase();
          const shouldSkip = skipKeywords.some(kw => titleLower.includes(kw.toLowerCase()));
          if (shouldSkip) {
             console.log(`      ✕ Skipped (Class Mismatch): ${title.substring(0, 40)}`);
             continue;
          }

          let volumes = [];
          $2('a').each((i, link) => {
            const h = $2(link).attr('href');
            const linkText = $2(link).text().trim();
            if (h && (h.toLowerCase().includes('.pdf') || h.includes('archive.org/download/') || h.includes('mediafire.com/file/'))) {
               volumes.push({ title: linkText || `جلد ${volumes.length + 1}`, url: h });
            }
          });

          volumes = [...new Map(volumes.map(v => [v.url, v])).values()];

          const bookImg = $2('img.wp-post-image').attr('src') || $2('img.wp-post-image').attr('data-src') || $2('.entry-content img').first().attr('src');

          if (volumes.length > 0) {
            let subCat = 'درسی کتب';
            const isSharah = titleLower.includes('sharah') || titleLower.includes('urdu') || titleLower.includes('شرح') || titleLower.includes('شروحات') || titleLower.includes('توضیح') || titleLower.includes('تقریر') || titleLower.includes('حاشیہ');
            const isArabic = titleLower.includes('arabic') || titleLower.includes('عربی');

            if (isSharah) subCat = 'اردو شروحات';
            if (isArabic) subCat = 'عربی شروحات';

            allBooks.push({
              title,
              author: 'نامعلوم',
              category: 'درجہ اولیٰ',
              sub_category: subCat,
              cover_url: bookImg || 'https://via.placeholder.com/200x300?text=No+Cover',
              pdf_url: volumes[0].url,
              description: JSON.stringify(volumes),
              pages: 0,
              is_free: true,
              downloads: 0,
              rating: 0,
              language: 'ur'
            });
            console.log(`      ✓ [${subCat}] Saved into allBooks array`);
          } else {
             console.log(`      ✕ No PDF links found`);
          }
        } catch (e) {
          console.log(`      ✕ Error: ${e.message}`);
        }
        await delay(200);
      }
      
      if (allBooks.length > 0) {
        const toSave = [...allBooks];
        allBooks.length = 0;
        console.log(`  Updating Supabase with ${toSave.length} books...`);
        const { error } = await supabase.from('Books').upsert(toSave, { onConflict: 'pdf_url' });
        if (error) console.error('  Save error:', error.message);
        else console.log(`  ✅ DB updated for page ${page}`);
      }

    } catch (e) {
      console.error(`Error page ${page}: ${e.message}`);
    }
  }
}

run();
