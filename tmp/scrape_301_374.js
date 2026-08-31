
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const categoryMapping = {
  'quran-e-majeed': 'قرآن مجید',
  'tafseer-ul-quran': 'تفسیر القرآن',
  'uloom-e-quran': 'علوم قرآن',
  'tajweed-o-qirat': 'تجوید و قراءت',
  'usool-e-hadith': 'اصول حدیث',
  'hadith': 'احادیث',
  'usool-e-fiqh': 'اصول فقہ',
  'fiqh': 'فقہ و فتاویٰ',
  'fatawa': 'فقہ و فتاویٰ',
  'ahkam-o-masail': 'احکام و مسائل',
  'aqaid-o-kalam': 'عقائد',
  'seerat-un-nabi': 'سیرت و تاریخ',
  'seerat-e-sahaba': 'سیرت و تاریخ',
  'tasawwuf': 'تصوف',
  'ulama-books': 'علمائے کرام',
  'fiqh/jadid-fiqh': 'جدید فقہ',
  'ahkam-o-masail/namaz': 'نماز',
  'ahkam-o-masail/zakat': 'زکوٰۃ',
  'ahkam-o-masail/hajj-o-umrah': 'حج و عمرہ',
  'ahkam-o-masail/roza-ramazan': 'روزہ',
  'ahkam-o-masail/nikah-o-talaq': 'نکاح و طلاق',
  'islam': 'اسلام',
  'falkiyaat': 'فلکیات',
  'tareekh': 'تاریخ',
  'dream-interpretation': 'خواب و تعبیر',
  'judgment-day': 'قیامت',
  'solved-papers': 'حل شدہ پرچے',
  'logic-philosophy': 'منطق و فلسفہ',
  'islahi': 'اصلاحی نصاب',
  'general': 'متفرق',
  'khutbaat-o-maqalaat': 'متفرق'
};

async function scrapeBookDetails(url, coverUrl) {
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    const $ = cheerio.load(data);
    
    const h1Text = $('h1').first().text().trim();
    if (!h1Text) return null;

    // Dupe check
    const { data: existing } = await supabase.from('Books').select('id').eq('title', h1Text).limit(1);
    if (existing && existing.length > 0) {
      console.log(`- Skipping duplicate: ${h1Text}`);
      return null;
    }

    let title = h1Text;
    let author = 'Unknown';
    
    if (h1Text.includes(' By ')) {
      const parts = h1Text.split(' By ');
      const titleBefore = parts[0].trim();
      const afterBy = parts[1].trim();
      const authorParts = afterBy.split(' ');
      author = authorParts[0] + (authorParts[1] && !authorParts[1].match(/[\u0600-\u06FF]/) ? ' ' + authorParts[1] : '');
      const urduPartMatch = afterBy.match(/[\u0600-\u06FF].+/);
      title = titleBefore + (urduPartMatch ? ' ' + urduPartMatch[0] : '');
    }
    
    let pdf_url = '';
    const archiveLink = $('a[href*="archive.org/download"]').first().attr('href');
    const streamLink = $('a[href*="archive.org/stream"]').first().attr('href');
    
    if (archiveLink) pdf_url = archiveLink;
    else if (streamLink) pdf_url = streamLink.replace('/stream/', '/download/') + '.pdf';
    else pdf_url = $('a[href$=".pdf"]').first().attr('href') || $('a[href*="mediafire.com"]').first().attr('href') || '';

    if (!pdf_url) return null;

    let finalCategory = 'متفرق';
    const tagLinks = $('.wp-block-post-terms a, .entry-categories a');
    const tags = [];
    tagLinks.each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        const slug = href.split('/category/')[1]?.replace(/\/$/, '') || '';
        tags.push(slug);
      }
    });

    if (h1Text.toLowerCase().includes('bukhari') && h1Text.toLowerCase().includes('sharah')) finalCategory = 'بخاری شریف کی شروحات';
    else if (h1Text.toLowerCase().includes('tirmizi') && h1Text.toLowerCase().includes('sharah')) finalCategory = 'ترمذی شریف کی شروحات';
    else if (h1Text.toLowerCase().includes('hidayah') && h1Text.toLowerCase().includes('sharah')) finalCategory = 'ہدایہ کی شروحات';
    else if (h1Text.toLowerCase().includes('mishkat') && h1Text.toLowerCase().includes('sharah')) finalCategory = 'مشکاۃ کی شروحات';
    else if (h1Text.toLowerCase().includes('jalalain') && h1Text.toLowerCase().includes('sharah')) finalCategory = 'تفسیر جلالین کی شروحات';
    else {
      for (const tag of tags) {
        if (categoryMapping[tag]) {
          finalCategory = categoryMapping[tag];
          break;
        }
      }
    }

    return {
      title: title.substring(0, 255),
      author: author.substring(0, 100),
      category: finalCategory,
      sub_category: 'عام کتب',
      cover_url: coverUrl,
      pdf_url: pdf_url,
      language: 'Urdu',
      is_free: true,
      price: 0
    };
  } catch (error) {
    console.error(`Error scraping detail ${url}:`, error.message);
    return null;
  }
}

async function start() {
  for (let page = 301; page <= 374; page++) {
    console.log(`\n--- Progress: Page ${page} / 374 ---`);
    try {
      const { data } = await axios.get(`https://besturdubooks.net/page/${page}/`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000
      });
      const $ = cheerio.load(data);
      
      const booksOnPage = [];
      $('article').each((i, el) => {
        const link = $(el).find('h2.entry-title a').attr('href');
        const img = $(el).find('img').first().attr('src');
        if (link && !link.includes('/tag/') && !link.includes('/category/')) {
          booksOnPage.push({ link, img });
        }
      });

      console.log(`Found ${booksOnPage.length} items.`);
      
      for (const book of booksOnPage) {
        const bookData = await scrapeBookDetails(book.link, book.img);
        if (bookData) {
          const { error } = await supabase.from('Books').insert([bookData]);
          if (error) console.error(`Error inserting ${bookData.title}:`, error.message);
          else console.log(`✓ Inserted: ${bookData.title}`);
        }
        await new Promise(r => setTimeout(r, 600)); // Faster but safe
      }
    } catch (error) {
      console.error(`Error on page ${page}:`, error.message);
    }
  }
  console.log('Finished all pages!');
}

start();
