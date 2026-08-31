import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

function findBetterTitle($, el) {
  let cur = $(el).parent();
  let attempts = 0;
  while (attempts < 8 && cur.length) {
    let t = cur.text().trim().split('\n')[0].split('Download')[0].split('Link')[0].split('آن لائن')[0].trim();
    if (t.length > 5 && !/^(Vol|Link|Download|جلد|آن لائن|black|color|آن لائن)/i.test(t)) return t;
    let prev = cur.prev();
    while (prev.length && prev.text().trim() === '') prev = prev.prev();
    if (!prev.length) cur = cur.parent();
    else cur = prev;
    attempts++;
  }
  return '';
}

async function run() {
  const allBooks = [];
  const startPage = 1;
  const endPage = 9;

  const skipKeywords = [
    'دوره حدیث', 'دورہ حدیث', 'Dora e Hadith', 'Daura e Hadith',
    'درجہ اولیٰ', 'درجہ ثالثہ', 'درجہ رابعہ', 'درجہ خامسہ', 'درجہ سادسہ', 'درجہ سابعہ', 'درجہ ثامنہ',
    '1st Year', '3rd Year', '4th Year', '5th Year', '6th Year', '7th Year', '8th Year',
    'ثانویہ عامہ', 'ثانویہ خاصہ', 'عالیہ', 'عالمیہ', 'نصابی کتب', 'نصابی کتابیں', 'درسی کتب فہرست'
  ];

  for (let page = startPage; page <= endPage; page++) {
    const url = page === 1 ? 'https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/' : `https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/${page}/`;
    console.log(`\nScraping page ${page}/${endPage}: ${url}`);

    try {
      const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
      const $ = cheerio.load(data);

      $('a').each((i, el) => {
        const h = $(el).attr('href');
        if (h && (h.toLowerCase().includes('.pdf') || h.includes('archive.org/download/') || h.includes('mediafire.com/file/'))) {
           let title = findBetterTitle($, el);
           if (!title || title.length < 5) return;
           if (skipKeywords.some(kw => title.toLowerCase().includes(kw.toLowerCase()))) return;
           allBooks.push({ title, author: 'نامعلوم', category: 'درجہ ثانیہ', sub_category: title.includes('شرح')||title.includes('sharah')?'اردو شروحات':'درسی کتب', cover_url: 'https://via.placeholder.com/200x300?text=No+Cover', pdf_url: h, description: JSON.stringify([{ title: $(el).text().trim() || 'Download', url: h }]), is_free: true, downloads: 0, rating: 0, language: 'ur' });
           console.log(`    ✓ [Direct] ${title.substring(0, 40)}`);
        }
      });
      
      const pageLinks = [];
      $('a').each((i, el) => {
        const h = $(el).attr('href');
        if (h && h.startsWith('https://besturdubooks.net/') && !h.includes('/category/') && !h.includes('/tag/') && !h.includes('/author/') && h.length > 30 && h !== url && !h.includes('-year')) pageLinks.push(h);
      });
      const uniquePageLinks = [...new Set(pageLinks)];
      console.log(`  Found ${uniquePageLinks.length} candidate page links`);

      for (const h of uniquePageLinks) {
         if (h.includes('/contact-us/') || h.includes('/privacy-policy/')) continue;
         try {
           const res = await axios.get(h, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
           const $2 = cheerio.load(res.data);
           let title = $2('h1.entry-title').text().trim() || $2('h1').first().text().trim();
           if (!title || title.length < 5) continue;
           if (skipKeywords.some(kw => title.toLowerCase().includes(kw.toLowerCase()))) continue;

           let volumes = [];
           $2('a').each((j, link) => {
             const vh = $2(link).attr('href');
             if (vh && (vh.toLowerCase().includes('.pdf') || vh.includes('archive.org/download/'))) volumes.push({ title: $2(link).text().trim() || `جلد ${volumes.length+1}`, url: vh });
           });
           if (volumes.length > 0) {
             const bookImg = $2('img.wp-post-image').attr('src') || $2('img.wp-post-image').attr('data-src') || $2('.entry-content img').first().attr('src');
             allBooks.push({ title, author: 'نامعلوم', category: 'درجہ ثانیہ', sub_category: title.includes('شرح')?'اردو شروحات':'درسی کتب', cover_url: bookImg || 'https://via.placeholder.com/200x300?text=No+Cover', pdf_url: volumes[0].url, description: JSON.stringify(volumes), is_free: true, downloads: 0, rating: 0, language: 'ur' });
             console.log(`    ✓ [Page] ${title.substring(0, 40)}`);
           }
         } catch(e) {}
         await delay(150);
      }

      if (allBooks.length > 0) {
        const toSave = [...allBooks];
        allBooks.length = 0;
        const final = [...new Map(toSave.map(b => [b.pdf_url, b])).values()];
        const { error } = await supabase.from('Books').upsert(final, { onConflict: 'pdf_url' });
        if (error) console.error('  Save error:', error.message);
        else console.log(`  ✅ Page ${page} synchronized (${final.length} books)`);
      }
    } catch(e) { console.error(`Error page ${page}: ${e.message}`); }
  }
}
run();
