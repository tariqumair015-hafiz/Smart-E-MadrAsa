import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Nisab books from the 2nd image (درجہ اولیٰ وفاق المدارس پاکستان)
const NISAB_BOOKS = [
  // نحو - علم النحو/ نحومیر فارسی یا عربی ، شرح مائتہ عامل مع الترکیب
  { subject: 'نحو', books: ['علم النحو', 'نحومیر', 'شرح مائتہ عامل', 'مائتہ عامل'] },
  // صرف - میزان الصرف و منشعب / ارشاد الصرف اردو یا علم الصرف تین حصص
  { subject: 'صرف', books: ['میزان الصرف', 'ارشاد الصرف', 'علم الصرف', 'منشعب'] },
  // تمرین الصرف - صفوة المصادر، تیسیر الابواب
  { subject: 'تمرین الصرف', books: ['صفوة المصادر', 'تیسیر الابواب', 'صفوۃ المصادر', 'ابواب الصرف'] },
  // تمرین النحو - المنهاج في القواعد والاعراب, النحو البسير, تسهيل النحو
  { subject: 'تمرین النحو', books: ['المنهاج', 'النحو البسير', 'تسهيل النحو', 'النحو البسیر', 'تسہیل النحو'] },
  // لغت عربیہ - الطریقة العصریہ جلد اول و دوم
  { subject: 'لغت عربیہ', books: ['الطريقة العصرية', 'الطریقة العصریہ', 'الطریقۃ العصریہ', 'طریقة العصریہ'] },
  // حفظ حدیث - جوامع الکلم (حضرت مولانا مفتی محمد شفیع عثمانی)
  { subject: 'حفظ حدیث', books: ['جوامع الکلم', 'جوامع الكلم'] },
  // تجوید - جمال القرآن، حفظ پاره عم نصف آخر مع التجوید
  { subject: 'تجوید', books: ['جمال القرآن', 'جمال القران', 'پاره عم'] },
];

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
        resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
      });
      req.on('error', () => resolve({ status: 0, ok: false }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 0, ok: false }); });
      req.end();
    } catch {
      resolve({ status: 0, ok: false });
    }
  });
}

async function audit() {
  console.log('='.repeat(70));
  console.log('  AUDIT: درجہ اولیٰ (1st Year) Books in Supabase');
  console.log('='.repeat(70));

  // 1. Fetch ALL books in درجہ اولیٰ category
  const { data: allBooks, error } = await supabase
    .from('Books')
    .select('id, title, cover_url, sub_category, pdf_url')
    .eq('category', 'درجہ اولیٰ');

  if (error) { console.error('Supabase error:', error); return; }

  console.log(`\n📚 Total books in درجہ اولیٰ: ${allBooks.length}`);
  
  const darsi = allBooks.filter(b => b.sub_category === 'درسی کتب');
  const urduSharah = allBooks.filter(b => b.sub_category === 'اردو شروحات');
  const arabiSharah = allBooks.filter(b => b.sub_category === 'عربی شروحات');
  
  console.log(`  درسی کتب (Textbooks): ${darsi.length}`);
  console.log(`  اردو شروحات (Urdu Sharah): ${urduSharah.length}`);
  console.log(`  عربی شروحات (Arabic Sharah): ${arabiSharah.length}`);

  // 2. CHECK COVER IMAGES
  console.log('\n' + '='.repeat(70));
  console.log('  🖼️  COVER IMAGE CHECK');
  console.log('='.repeat(70));
  
  const noCover = allBooks.filter(b => !b.cover_url || b.cover_url.trim() === '');
  console.log(`\n❌ Books with NO cover_url: ${noCover.length}`);
  noCover.forEach(b => console.log(`  - [${b.sub_category}] ${b.title}`));

  // Check which covers are broken (return non-200)
  console.log('\n🔍 Checking cover URLs for broken images (sampling first 30)...');
  const sample = allBooks.filter(b => b.cover_url).slice(0, 30);
  let broken = [];
  for (const b of sample) {
    const result = await checkUrl(b.cover_url);
    if (!result.ok) {
      broken.push({ title: b.title, url: b.cover_url, status: result.status });
    }
  }
  
  if (broken.length > 0) {
    console.log(`\n⚠️ Broken cover URLs (${broken.length}):`);
    broken.forEach(b => console.log(`  - ${b.title}\n    URL: ${b.url}\n    Status: ${b.status}`));
  } else {
    console.log('✅ All sampled cover URLs are accessible!');
  }

  // 3. CHECK NISAB BOOKS PRESENCE
  console.log('\n' + '='.repeat(70));
  console.log('  📋 NISAB VERIFICATION (2nd Image - وفاق المدارس نصاب)');
  console.log('='.repeat(70));
  
  const allTitles = allBooks.map(b => b.title.toLowerCase());
  
  for (const nisab of NISAB_BOOKS) {
    console.log(`\n📖 ${nisab.subject}:`);
    let found = false;
    for (const keyword of nisab.books) {
      const matches = allBooks.filter(b => 
        b.title.includes(keyword) || 
        b.title.toLowerCase().includes(keyword.toLowerCase())
      );
      if (matches.length > 0) {
        found = true;
        matches.forEach(m => console.log(`  ✅ Found: "${m.title}" [${m.sub_category}] cover: ${m.cover_url ? '✅' : '❌'}`));
      }
    }
    if (!found) {
      console.log(`  ❌ NOT FOUND in database!`);
    }
  }

  // 4. LIST ALL DARSI BOOKS (Textbooks) for verification  
  console.log('\n' + '='.repeat(70));
  console.log('  📚 ALL درسی کتب (Textbooks) in درجہ اولیٰ');
  console.log('='.repeat(70));
  darsi.forEach((b, i) => {
    console.log(`${i+1}. ${b.title}`);
    console.log(`   Cover: ${b.cover_url ? b.cover_url.substring(0, 60) + '...' : '❌ MISSING'}`);
  });

  // 5. Check how many show on the homepage (first 15 darsi books)
  console.log('\n' + '='.repeat(70));
  console.log('  🏠 HOME PAGE VISIBILITY (first 15 darsi books shown)');
  console.log('='.repeat(70));
  const homeBooks = darsi.slice(0, 15);
  homeBooks.forEach((b, i) => {
    const hasCover = b.cover_url && b.cover_url.trim() !== '';
    console.log(`${i+1}. ${hasCover ? '✅' : '🟢placeholder'} ${b.title}`);
  });
}

audit().catch(console.error);
