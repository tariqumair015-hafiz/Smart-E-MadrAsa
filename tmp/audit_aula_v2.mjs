import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import https from 'https';
import http from 'http';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Nisab keywords from the 2nd image
const NISAB_KEYWORDS = [
  'علم النحو', 'نحومیر', 'نحو میر', 'Nahw Meer', 'مائتہ عامل', 'Miata Amil',
  'میزان الصرف', 'Mizan', 'ارشاد الصرف', 'Irshad', 'علم الصرف',
  'صفوة المصادر', 'صفوۃ المصادر', 'Safwat', 'تیسیر الابواب', 'Taiseer', 'ابواب الصرف', 'Abwab',
  'المنهاج', 'النحو البسیر', 'تسہیل', 'Tasheel', 'Minhaj',
  'الطریقة العصریہ', 'الطریقۃ العصریہ', 'Tariqa', 'Tareeqa',
  'جوامع الکلم', 'Jawami',
  'جمال القرآن', 'جمال القران', 'Jamal', 'Jamal ul Quran',
  'مقدمات', 'Muqaddemat', 'Muqaddimat',
  'تصویر', 'Tasveer', 'Tasweer',
  'مفتاح', 'Miftah',
  'تیسیر المبتدی', 'Taiseer ul Mubtadi', 'Tayseer',
];

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
        resolve(res.statusCode);
      });
      req.on('error', () => resolve(0));
      req.on('timeout', () => { req.destroy(); resolve(0); });
      req.end();
    } catch {
      resolve(0);
    }
  });
}

async function audit() {
  const { data: allBooks, error } = await supabase
    .from('Books')
    .select('id, title, cover_url, sub_category, pdf_url')
    .eq('category', 'درجہ اولیٰ');

  if (error) { console.error('Error:', error); return; }

  const result = {
    total: allBooks.length,
    darsi: [],
    urduSharah: [],
    arabiSharah: [],
    missingCovers: [],
    brokenCovers: [],
    nisabFound: [],
    nisabMissing: [],
  };

  for (const b of allBooks) {
    const entry = { id: b.id, title: b.title, sub_category: b.sub_category, cover_url: b.cover_url || 'MISSING' };
    if (b.sub_category === 'درسی کتب') result.darsi.push(entry);
    else if (b.sub_category === 'اردو شروحات') result.urduSharah.push(entry);
    else if (b.sub_category === 'عربی شروحات') result.arabiSharah.push(entry);

    if (!b.cover_url || b.cover_url.trim() === '') {
      result.missingCovers.push(entry);
    }
  }

  // Check cover URLs for darsi books
  console.log('Checking cover URLs for darsi books...');
  for (const b of result.darsi) {
    if (b.cover_url && b.cover_url !== 'MISSING') {
      const status = await checkUrl(b.cover_url);
      if (status < 200 || status >= 400) {
        result.brokenCovers.push({ title: b.title, cover_url: b.cover_url, status });
      }
    }
  }

  // Check nisab books
  for (const keyword of NISAB_KEYWORDS) {
    const matches = allBooks.filter(b =>
      b.title.toLowerCase().includes(keyword.toLowerCase())
    );
    if (matches.length > 0) {
      for (const m of matches) {
        if (!result.nisabFound.find(x => x.id === m.id)) {
          result.nisabFound.push({
            id: m.id,
            title: m.title,
            sub_category: m.sub_category,
            has_cover: !!(m.cover_url && m.cover_url.trim() !== ''),
            keyword_matched: keyword
          });
        }
      }
    }
  }

  result.summary = {
    total_books: allBooks.length,
    darsi_count: result.darsi.length,
    urdu_sharah_count: result.urduSharah.length,
    arabi_sharah_count: result.arabiSharah.length,
    missing_covers: result.missingCovers.length,
    broken_covers: result.brokenCovers.length,
    nisab_books_found: result.nisabFound.length,
  };

  writeFileSync('tmp/audit_result.json', JSON.stringify(result, null, 2), 'utf8');
  console.log('Done! Results written to tmp/audit_result.json');
  console.log('Summary:', JSON.stringify(result.summary, null, 2));
}

audit().catch(console.error);
