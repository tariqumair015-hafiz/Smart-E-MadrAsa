import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
  console.log('\n🔍 Verifying Maulana Sarfaraz Khan Safdar Books...\n');
  
  const { data, error } = await supabase
    .from('Books')
    .select('title, author, cover_url, pdf_url')
    .eq('sub_category', 'maulana-sarfaraz-safdar')
    .order('title', { ascending: true });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No books found!');
    return;
  }

  console.log(`✅ Found ${data.length} books\n`);
  
  let coverIssues = 0;
  let pdfIssues = 0;
  
  data.forEach((book, idx) => {
    const title = book.title.substring(0, 40);
    let status = '✅';
    
    if (!book.cover_url || book.cover_url.trim() === '') {
      status = '❌ MISSING COVER';
      coverIssues++;
    } else if (book.cover_url.includes('undefined') || book.cover_url.includes('null')) {
      status = '❌ INVALID COVER URL';
      coverIssues++;
    }
    
    if (!book.pdf_url || book.pdf_url.trim() === '') {
      status = '❌ MISSING PDF';
      pdfIssues++;
    }
    
    console.log(`${status} [${idx + 1}] ${title}`);
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`Total Books: ${data.length}`);
  console.log(`Missing/Invalid Covers: ${coverIssues}`);
  console.log(`Missing PDFs: ${pdfIssues}`);
  
  if (coverIssues === 0 && pdfIssues === 0) {
    console.log('✅ ALL BOOKS VERIFIED SUCCESSFULLY!\n');
  } else {
    console.log('⚠️ ISSUES FOUND!\n');
  }
}

verify();
