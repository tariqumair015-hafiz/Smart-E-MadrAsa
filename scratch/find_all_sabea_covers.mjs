import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// Explicit pages first, fallback to search query
const EXPLICIT_MAPPING = {
  21916: 'https://besturdubooks.net/tafseer-e-baizawi/',
  21917: 'https://besturdubooks.net/tafseer-e-baizawi-al-bushra/',
  21918: 'https://besturdubooks.net/tafseer-e-baizawi-meer-muhammad/',
  21919: 'https://besturdubooks.net/tafseer-e-baizawi-rahmania/',
  21920: 'https://besturdubooks.net/tafseer-e-baizawi-rashidia/',
  21921: 'https://besturdubooks.net/al-tibyan/',
  21922: 'https://besturdubooks.net/mishkat-ul-masabih/',
  21923: 'https://besturdubooks.net/mishkat-ul-masabih-qadimi/',
  21926: 'https://besturdubooks.net/al-hidayah/',
  21927: 'https://besturdubooks.net/al-hidayah-rahmania/',
  21928: 'https://besturdubooks.net/al-hidayah-rasheediya/',
  21932: 'https://besturdubooks.net/al-mutawwal/',
};

// Titles to search if not in mapping or returns null
const SEARCH_QUERIES = {
  21924: 'Mishkat ul Masabih Rahmania',
  21925: 'Mishkat ul Masabih Urdu',
  21929: 'Nukhbatul Fikar Imdad un Nazar',
  21930: 'Nuzhat un Nazar Al Bushra',
  21931: 'Taiseer e Mustalah ul Hadith',
  21933: 'Al Haiat ul Wusta',
};

async function fetchImageFromPage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' }
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    // Try og:image first
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) || 
                         html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    if (ogImageMatch) {
      return ogImageMatch[1].replace(/\?w=\d+/, '').replace(/-\d+x\d+(?=\.\w+$)/, '');
    }
    
    // Try first image in content
    const imgMatches = [...html.matchAll(/<img[^>]+src=["']?([^"' >]+)["']?/gi)].map(m => m[1]);
    const filtered = imgMatches.filter(src => src.includes('/uploads/') && !src.includes('logo') && !src.includes('profile'));
    if (filtered.length > 0) {
      return filtered[0].replace(/\?w=\d+/, '').replace(/-\d+x\d+(?=\.\w+$)/, '');
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function fetchImageFromSearch(query) {
  try {
    const url = `https://besturdubooks.net/?s=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' }
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    const imgMatches = [...html.matchAll(/<img[^>]+src=["']?([^"' >]+)["']?/gi)].map(m => m[1]);
    const filtered = imgMatches.filter(src => src.includes('/uploads/') && !src.includes('logo') && !src.includes('profile') && !src.includes('banner'));
    
    // Find the one that best matches the query keywords in its filename
    if (filtered.length > 0) {
      // Return first match
      return filtered[0].replace(/\?w=\d+/, '').replace(/-\d+x\d+(?=\.\w+$)/, '');
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function run() {
  const url = `${SUPABASE_URL}/rest/v1/Books?category=eq.${encodeURIComponent('درجہ سابعہ')}&sub_category=eq.${encodeURIComponent('درسی کتب')}&select=id,title,cover_url`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const books = await res.json();
  
  const results = [];
  for (const book of books) {
    let cover = null;
    let method = '';
    
    if (EXPLICIT_MAPPING[book.id]) {
      cover = await fetchImageFromPage(EXPLICIT_MAPPING[book.id]);
      method = `page: ${EXPLICIT_MAPPING[book.id]}`;
    }
    
    if (!cover && SEARCH_QUERIES[book.id]) {
      cover = await fetchImageFromSearch(SEARCH_QUERIES[book.id]);
      method = `search: ${SEARCH_QUERIES[book.id]}`;
    }
    
    if (!cover) {
      // General title search
      cover = await fetchImageFromSearch(book.title.split(' ')[0] + ' ' + (book.title.split(' ')[1] || ''));
      method = `fallback search: ${book.title}`;
    }
    
    results.push({
      id: book.id,
      title: book.title,
      currentCover: book.cover_url,
      newCover: cover,
      method
    });
    
    console.log(`Book: ${book.title}`);
    console.log(`  New Cover: ${cover}`);
    console.log(`  Method: ${method}`);
    console.log('------------------------------------');
    await new Promise(r => setTimeout(r, 1000));
  }
  
  fs.writeFileSync('scratch/sabea_covers_resolved.json', JSON.stringify(results, null, 2));
  console.log('Saved resolved covers to scratch/sabea_covers_resolved.json');
}

run();
