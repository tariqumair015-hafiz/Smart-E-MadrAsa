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

const BOOK_PAGES = [
  { match: 'Tafseer e Baizawi تفسیر بیضاوی مکمل', page: 'https://besturdubooks.net/tafseer-e-baizawi/' },
  { match: 'Tafseer e Baizawi Al Bushra', page: 'https://besturdubooks.net/tafseer-e-baizawi-al-bushra/' },
  { match: 'Tafseer e Baizawi Meer Muhammad', page: 'https://besturdubooks.net/tafseer-e-baizawi-meer-muhammad/' },
  { match: 'Tafseer e Baizawi Rahmania', page: 'https://besturdubooks.net/tafseer-e-baizawi-rahmania/' },
  { match: 'Tafseer e Baizawi Rashidia', page: 'https://besturdubooks.net/tafseer-e-baizawi-rashidia/' },
  { match: 'AL Tibyan', page: 'https://besturdubooks.net/al-tibyan/' },
  { match: 'Mishkat ul Masabih Al Bushra', page: 'https://besturdubooks.net/mishkat-ul-masabih/' },
  { match: 'Mishkat ul Masabih Qadimi', page: 'https://besturdubooks.net/mishkat-ul-masabih-qadimi/' },
  { match: 'Mishkat ul Masabih Rahmania', page: 'https://besturdubooks.net/mishkat-ul-masabih-rahmania/' },
  { match: 'Mishkat ul Masabeeh Urdu', page: 'https://besturdubooks.net/mishkat-ul-masabih-urdu/' },
  { match: 'Al Hidaya Al Bushra Vol 5-8', page: 'https://besturdubooks.net/al-hidayah/' },
  { match: 'Al Hidaya Rahmania', page: 'https://besturdubooks.net/al-hidayah-rahmania/' },
  { match: 'Al Hidaya Rashidia', page: 'https://besturdubooks.net/al-hidayah-rasheediya/' },
  { match: 'Nukhbatul Fikar', page: 'https://besturdubooks.net/nukhbat-ul-fikar/' },
  { match: 'Nuzha tun Nazar', page: 'https://besturdubooks.net/nuzhat-un-nazar/' },
  { match: 'Taiseer e Mustalah', page: 'https://besturdubooks.net/taiseer-e-mustalah-ul-hadith/' },
  { match: 'Al Mutawwal', page: 'https://besturdubooks.net/al-mutawwal/' },
  { match: "Al Hai'at Ul Wusta", page: 'https://besturdubooks.net/al-haiat-ul-wusta/' },
];

async function getOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) || 
                         html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    if (ogImageMatch) {
      let img = ogImageMatch[1];
      // Clean WordPress CDN artifacts or size details if any
      img = img.replace(/\?w=\d+/, '').replace(/-\d+x\d+(?=\.\w+$)/, '');
      return img;
    }
    return null;
  } catch (err) {
    console.error(`Error fetching ${url}: ${err.message}`);
    return null;
  }
}

async function verify() {
  const url = `${SUPABASE_URL}/rest/v1/Books?category=eq.${encodeURIComponent('درجہ سابعہ')}&sub_category=eq.${encodeURIComponent('درسی کتب')}&select=id,title,cover_url`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status} - ${await res.text()}`);
    }
    
    const books = await res.json();
    console.log(`Found ${books.length} Sabea textbooks:\n`);
    
    for (const book of books) {
      const mapping = BOOK_PAGES.find(m => book.title.includes(m.match));
      if (!mapping) {
        console.log(`❌ No mapping found for: ${book.title}`);
        continue;
      }
      
      console.log(`Checking: ${book.title}`);
      console.log(`  Mapping Page: ${mapping.page}`);
      const img = await getOgImage(mapping.page);
      console.log(`  Found Image:  ${img}`);
      console.log(`  Current DB:   ${book.cover_url}`);
      console.log('----------------------------------------------------');
      
      // Delay to respect the target server
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch (err) {
    console.error(err);
  }
}

verify();
