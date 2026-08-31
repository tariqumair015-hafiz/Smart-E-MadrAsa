import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const category = 'درجہ خامسہ';

async function fix() {
  // 1) Move "Al Sabul Muallaqat Urdu" to Urdu Sharah - it's a translation, not the original
  const {error: e1} = await supabase.from('Books')
    .update({sub_category: 'اردو شروحات'})
    .eq('category', category)
    .ilike('title', '%Sabul Muallaqat Urdu%');
  if(!e1) console.log('✅ Fixed: Al Sabul Muallaqat Urdu -> اردو شروحات');

  // 2) Move "Usool e Hidayah" - it's a condensed/explanation of Hidaya, NOT the original
  const {error: e2} = await supabase.from('Books')
    .update({sub_category: 'اردو شروحات'})
    .eq('category', category)
    .ilike('title', '%Usool e Hidayah%');
  if(!e2) console.log('✅ Fixed: Usool e Hidayah -> اردو شروحات');

  // 3) Ensure textbooks that are missing need proper covers
  // Check what core syllabus books are present as درسی کتب
  const {data: texts} = await supabase.from('Books')
    .select('id, title, cover_url')
    .eq('category', category)
    .eq('sub_category', 'درسی کتب');
  
  console.log(`\nFinal textbook count: ${texts.length}`);
  texts.forEach(t => {
    const hasGoodCover = t.cover_url && !t.cover_url.includes('archive.org/services/img');
    console.log(`${hasGoodCover ? '✅' : '⚠️ (no cover)'} ${t.title.substring(0,55)}`);
  });

  // 4) For any book with archive.org default image (pillar icon), try to borrow a cover from commentaries
  const archiveCoverBooks = texts.filter(t => t.cover_url && t.cover_url.includes('archive.org/services/img'));
  
  for (const core of archiveCoverBooks) {
    // Try fetching a commentary of the same topic for a nice cover
    const titleWords = core.title.split(' ').slice(0, 2).join(' ');
    const {data: related} = await supabase.from('Books')
      .select('cover_url')
      .eq('category', category)
      .neq('sub_category', 'درسی کتب')
      .ilike('title', `%${titleWords}%`)
      .not('cover_url', 'ilike', '%archive.org/services%')
      .limit(1);
    
    if (related && related[0] && related[0].cover_url) {
      await supabase.from('Books').update({cover_url: related[0].cover_url}).eq('id', core.id);
      console.log(`✅ Borrowed cover for: ${core.title.substring(0,40)}`);
    }
  }
}

fix();
