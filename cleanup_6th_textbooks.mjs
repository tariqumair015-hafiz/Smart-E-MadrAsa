import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const category = 'درجہ سادسہ';

async function cleanup() {
  console.log('Cleaning up 6th Year Textbooks...');
  
  // 1) Identify books currently in Textbooks that shouldn't be
  const { data: currentTexts } = await supabase.from('Books')
    .select('id, title')
    .eq('category', category)
    .eq('sub_category', 'درسی کتب');

  const syllabusKeywords = [
    'jalalain', 'جلالین',
    'fauzul kabeer', 'fauz ul kabeer', 'الفوز الکبیر',
    'khair ul usool', 'خیر الاصول',
    'siraji', 'سراجی',
    'kitab ul athar', 'kitab ul asar', 'کتاب الآثار',
    'hidayah', 'hidaya', 'ہدایہ',
    'tauzeeh', 'tauzih', 'توضیح',
    'sharh aqaid', 'sharh e aqaid', 'شرح عقائد',
    'deoband', 'دیوبند',
    'falkiyat', 'فلکیات',
    'hamasa', 'حماسہ',
    'kafi', 'کافی'
  ];

  for (const book of currentTexts) {
    const t = book.title.toLowerCase();
    const matches = syllabusKeywords.some(kw => t.includes(kw));
    const isCommentary = t.includes('sharh') || t.includes('sharah') || t.includes('توضیحات') || t.includes('اردو') || t.includes('عربی') || t.includes('talkhees') || t.includes('خلاصہ') || t.includes('reah');
    
    // special cases for 'sharah aqaid' and 'tauzeeh' which are core texts
    let reallyTextbook = matches;
    if (isCommentary) {
        if (t.includes('sharh aqaid') || t.includes('tauzeeh')) {
             // keep unless it's an 'urdu sharh' or something
             if (t.includes('urdu') || t.includes('عربی') || t.includes('easy') || t.includes('آسان')) {
                 reallyTextbook = false;
             } else {
                 reallyTextbook = true;
             }
        } else {
            reallyTextbook = false;
        }
    }

    if (!reallyTextbook) {
      console.log(`Moving to Commentaries: ${book.title}`);
      await supabase.from('Books').update({ sub_category: 'اردو شروحات' }).eq('id', book.id);
    }
  }
}

cleanup();
