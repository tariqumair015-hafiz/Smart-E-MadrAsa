import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('Fetching related cover URLs from commentaries...');
  
  // Find a cover for Kanz
  const {data: kanzShurooh} = await supabase.from('Books').select('cover_url').ilike('title', '%kanz%').neq('cover_url', '').limit(1);
  const kanzCover = kanzShurooh && kanzShurooh[0] && kanzShurooh[0].cover_url ? kanzShurooh[0].cover_url : 'https://besturdubooks.net/wp-content/uploads/2018/10/Kanz-Ud-Daqaiq.jpg';

  // Find a cover for Noor
  const {data: noorShurooh} = await supabase.from('Books').select('cover_url').ilike('title', '%anwar%').neq('cover_url', '').limit(2);
  let noorCover = '';
  if (noorShurooh) {
     const validNoor = noorShurooh.find(x => x.cover_url && x.cover_url.length > 20 && !x.cover_url.includes('placeholder'));
     if (validNoor) noorCover = validNoor.cover_url;
  }
  if (!noorCover) noorCover = 'https://besturdubooks.net/wp-content/uploads/2018/10/Noor-ul-Anwaar.jpg';

  // Find a cover for Maqamat
  const {data: maqamatShurooh} = await supabase.from('Books').select('cover_url').ilike('title', '%maqamat%').neq('cover_url', '').limit(2);
  let maqCover = '';
  if (maqamatShurooh) {
     const validMaq = maqamatShurooh.find(x => x.cover_url && x.cover_url.length > 20 && !x.cover_url.includes('placeholder'));
     if (validMaq) maqCover = validMaq.cover_url;
  }
  if (!maqCover) maqCover = 'https://besturdubooks.net/wp-content/uploads/2018/09/Maqamat-e-Hariri-200x300.jpg';

  // For Al Balaghat ul Wazeha, try getting Duroos ul Balagha
  const {data: balagha} = await supabase.from('Books').select('cover_url').ilike('title', '%balagha%').neq('cover_url', '').limit(1);
  const balaghaCover = balagha && balagha[0] && balagha[0].cover_url ? balagha[0].cover_url : 'https://besturdubooks.net/wp-content/uploads/2018/10/Al-Balaghat-Ul-Waziha.jpg';

  console.log('Found Covers:');
  console.log('Kanz:', kanzCover);
  console.log('Noor:', noorCover);
  console.log('Maqamat:', maqCover);
  console.log('Balagha:', balaghaCover);

  console.log('\nApplying covers to the missing core books...');

  await supabase.from('Books').update({cover_url: kanzCover}).eq('title', 'Kanz ud Daqaiq كنـز الـدقـائـق');
  await supabase.from('Books').update({cover_url: noorCover}).eq('title', 'Noor ul Anwar نـور الانـوار');
  await supabase.from('Books').update({cover_url: maqCover}).eq('title', 'Maqamat e Hariri مـقامات حـریری');
  await supabase.from('Books').update({cover_url: balaghaCover}).eq('title', 'Al Balaghat ul Wazeha البلاغۃ الواضحۃ');

  console.log('Covers updated successfully.');
}

run();
