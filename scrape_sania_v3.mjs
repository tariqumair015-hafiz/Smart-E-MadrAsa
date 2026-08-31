/**
 * Scraper for Dars-e-Nizami 2nd Year (درجہ ثانیہ)
 * URL: https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/
 * Pages: 1-9
 * 
 * Syllabus textbooks (درسی کتب):
 *   - ترجمہ پارہ عم / Para Aam
 *   - فوائد مکیہ / Fawaid Makkiya
 *   - زاد الطالبین / Zad ul Talibeen
 *   - القراءة الراشدة / Qiraat ur Rashida
 *   - معلم الانشاء / Moalim ul Insha
 *   - مختصر القدوری / Mukhtasar ul Quduri
 *   - علم الصيغة / Ilm us Seegh / Khasiyat Abwab
 *   - هداية النحو / Hidayat un Nahw
 *   - تيسير المنطق / Tayseer ul Mantiq
 *   - مرقاة / Mirqat
 * 
 * Everything else → commentaries (اردو شروحات / عربی شروحات)
 */

import fs from 'fs';

const BASE_URL = 'https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/';
const TOTAL_PAGES = 9;

// Keywords to classify a book as درسی کتب (textbook based on syllabus)
const TEXTBOOK_KEYWORDS = [
  // Para Aam / Tarjuma
  'پارہ عم', 'para aam', 'para amm', 'ترجمہ پارہ', 'tarjuma para',
  // Fawaid Makkiya
  'فوائد مکیہ', 'fawaid makkiya', 'فوائد', 'fawa',
  // Zad ul Talibeen
  'زاد الطالبین', 'zad ul talibeen', 'zad al talibeen', 'zaad',
  // Qiraat ur Rashida 
  'القراءة الراشدة', 'القراءة الراشدہ', 'qiraat ur rashida', 'al qiraat', 'al-qiraat', 'rashida',
  // Moalim ul Insha
  'معلم الانشاء', 'moalim ul insha', 'mualim ul insha', 'معلم',
  // Mukhtasar ul Quduri (the original text, not commentaries)
  'مختصر القدوری', 'mukhtasar ul quduri', 'mukhtasar al quduri', 'quduri ma', 'قدوری مع',
  // Ilm us Seegh / Khasiyat Abwab
  'علم الصيغة', 'علم الصیغہ', 'ilm us seegh', 'ilm al siga', 'خاصیات ابواب', 'khasiyat abwab', 'khasiyaat abwab',
  // Hidayat un Nahw
  'ہدایۃ النحو', 'هداية النحو', 'hidayat un nahw', 'hidayatun nahw', 'hidaya al nahw',
  // Tayseer ul Mantiq
  'تیسیر المنطق', 'تيسير المنطق', 'tayseer ul mantiq', 'taiseer ul mantiq', 'taisir ul mantiq',
  // Mirqat
  'مرقاة', 'مرقات', 'mirqat', 'mirqaat',
];

// Keywords that clearly indicate commentary/sharh → commentaries
const COMMENTARY_KEYWORDS = [
  'شرح', 'شروح', 'sharh', 'sharah', 'commentary', 'حاشیہ', 'hashiya',
  'تشریح', 'tashrih', 'التشریح', 'تقریر', 'taqreer', 'آسان', 'asaan', 'asan',
  'اردو شرح', 'عربی شرح', 'مفتاح', 'مرشد', 'نور', 'اشراق', 'خیر', 'فیض',
  'تبیین', 'tabyin', 'اماله', 'الامالة', 'حل', 'al hall', 'الحل',
  'النور', 'noor', 'اضواء', 'ضوء', 'الجوہرة', 'jawahir', 'مسائل',
];

function isTextbook(title) {
  const t = title.toLowerCase();
  // First check: if it matches a textbook keyword
  const matchesTextbook = TEXTBOOK_KEYWORDS.some(kw => t.includes(kw.toLowerCase()));
  if (!matchesTextbook) return false;
  
  // Second check: if it also contains commentary keywords, it's a commentary
  const matchesCommentary = COMMENTARY_KEYWORDS.some(kw => t.includes(kw.toLowerCase()));
  
  // Special cases: "Zad ul Talibeen" IS a textbook even if "talibeen" appears
  // "Mukhtasar ul Quduri plain" is textbook, "Sharh Quduri" is commentary
  if (matchesCommentary) {
    // Exception: Zad ul Talibeen is the actual textbook
    if (t.includes('زاد الطالبین') || t.includes('zad ul talibeen') || t.includes('zad al talibeen') || t.includes('zaad')) {
      return true;
    }
    // Exception: Al Qiraat ur Rashida itself
    if (t.includes('القراءة الراشد') || t.includes('al qiraat ur rashid') || t.includes('rashida')) {
      return true;
    }
    // Exception: Hidayat un Nahw itself (not commentary of it)
    if ((t.includes('ہدایۃ النحو') || t.includes('hidayatun nahw')) && !t.includes('شرح') && !t.includes('sharh')) {
      return true;
    }
    return false;
  }
  return true;
}

function classifyBook(title) {
  const t = title.toLowerCase();
  
  if (isTextbook(title)) return 'درسی کتب';
  
  // Check if it's Arabic commentary
  const arabicIndicators = ['عربی', 'arabic', 'عربیہ', 'arabiya'];
  const hasArabicIndicator = arabicIndicators.some(ind => t.includes(ind));
  
  // Check for Arabic script only title patterns (no Urdu like "اردو" mentioned)
  // Books with "عربی شرح" in title
  if (hasArabicIndicator) return 'عربی شروحات';
  
  return 'اردو شروحات';
}

async function fetchPage(url) {
  console.log(`Fetching: ${url}`);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractBooksFromListingPage(html) {
  const books = [];
  
  // Match each article/book block - besturdubooks uses article tags
  const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
  let articleMatch;
  
  while ((articleMatch = articleRegex.exec(html)) !== null) {
    const block = articleMatch[1];
    
    // Extract title and URL from heading link
    const titleLinkMatch = block.match(/<h2[^>]*class="[^"]*entry-title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
      || block.match(/<h3[^>]*class="[^"]*entry-title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    
    if (!titleLinkMatch) continue;
    
    const bookUrl = titleLinkMatch[1].trim();
    const rawTitle = titleLinkMatch[2].replace(/<[^>]+>/g, '').trim();
    
    // Skip non-book pages
    if (!bookUrl.includes('besturdubooks.net')) continue;
    if (bookUrl.includes('/category/') || bookUrl.includes('/tag/') || bookUrl.includes('/page/')) continue;
    if (rawTitle.length < 3) continue;
    
    // Extract cover image
    const imgMatch = block.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
    const coverUrl = imgMatch ? imgMatch[1] : null;
    
    books.push({ title: rawTitle, bookUrl, coverUrl });
  }
  
  return books;
}

async function scrapeBookDetail(bookUrl) {
  const html = await fetchPage(bookUrl);
  
  // Extract all download links from the book detail page
  const volumes = [];
  const seenUrls = new Set();
  
  // Strategy 1: Look for archive.org and mediafire links in anchor tags
  const allLinksRegex = /<a[^>]*href="([^"]*(?:archive\.org|mediafire\.com|drive\.google\.com|dropbox\.com|4shared\.com|ziddu\.com)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch;
  
  while ((linkMatch = allLinksRegex.exec(html)) !== null) {
    const url = linkMatch[1].trim();
    const text = linkMatch[2].replace(/<[^>]+>/g, '').trim() || 'Download';
    
    if (seenUrls.has(url)) continue;
    if (url.includes('/search?') || url.includes('?q=') || url.length < 10) continue;
    
    seenUrls.add(url);
    volumes.push({ title: text, url });
  }
  
  // Strategy 2: Look for WordPress download button links
  const wpBtnRegex = /<a[^>]*class="[^"]*(?:btn|button|download)[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  while ((linkMatch = wpBtnRegex.exec(html)) !== null) {
    const url = linkMatch[1].trim();
    const text = linkMatch[2].replace(/<[^>]+>/g, '').trim() || 'Download';
    if (!seenUrls.has(url) && url.startsWith('http')) {
      seenUrls.add(url);
      volumes.push({ title: text, url });
    }
  }
  
  return volumes;
}

async function main() {
  const allBooks = [];
  
  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const url = page === 1 ? BASE_URL : `${BASE_URL}${page}/`;
    
    let html;
    try {
      html = await fetchPage(url);
    } catch (e) {
      console.error(`Failed to fetch page ${page}: ${e.message}`);
      continue;
    }
    
    const pageBooks = extractBooksFromListingPage(html);
    console.log(`  Page ${page}: Found ${pageBooks.length} books`);
    
    for (const book of pageBooks) {
      console.log(`    Scraping: ${book.title}`);
      
      let volumes = [];
      try {
        volumes = await scrapeBookDetail(book.bookUrl);
        // Brief pause to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.error(`    Failed to scrape detail for ${book.title}: ${e.message}`);
      }
      
      const sub_category = classifyBook(book.title);
      const pdf_url = volumes.length > 0 ? volumes[0].url : '';
      
      allBooks.push({
        title: book.title,
        cover_url: book.coverUrl || '',
        volumes,
        pdf_url,
        sub_category,
        category: 'درجہ ثانیہ (2nd Year)',
      });
      
      console.log(`    → sub_category: ${sub_category} | volumes: ${volumes.length}`);
    }
  }
  
  fs.writeFileSync('sania_v3_books.json', JSON.stringify(allBooks, null, 2), 'utf8');
  
  const textbooks = allBooks.filter(b => b.sub_category === 'درسی کتب');
  const urduSharah = allBooks.filter(b => b.sub_category === 'اردو شروحات');
  const arabicSharah = allBooks.filter(b => b.sub_category === 'عربی شروحات');
  
  console.log(`\n✅ DONE! Total: ${allBooks.length} books`);
  console.log(`   درسی کتب (Textbooks): ${textbooks.length}`);
  console.log(`   اردو شروحات: ${urduSharah.length}`);
  console.log(`   عربی شروحات: ${arabicSharah.length}`);
  console.log(`   Saved to: sania_v3_books.json`);
}

main().catch(console.error);
