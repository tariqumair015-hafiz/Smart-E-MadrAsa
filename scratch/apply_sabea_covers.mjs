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

const COVERS_TO_UPDATE = [
  { id: 21916, cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/tafseer-e-baizawi.jpg' },
  { id: 21917, cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/Tafseer-al-Baizawi-Al-Bushra.jpg' },
  { id: 21918, cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/Tafseer-al-Baizawi-Meer-Muhammad.jpg' },
  { id: 21919, cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/Tafseer-al-Baizawi-Rahmania.jpg' },
  { id: 21920, cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/Tafseer-al-Baizawi-Rashedia.jpg' },
  { id: 21921, cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/al-tibyan.jpg' },
  { id: 21922, cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/Mishkat-al-Masabeeh-Al-Bushra.jpg' },
  { id: 21923, cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/Mishkat-al-Masabeeh-Qademi.jpg' },
  { id: 21924, cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/Mishkar-al-Masabeeh-Rahmania.jpg' },
  { id: 21925, cover: 'https://besturdubooks.net/wp-content/uploads/2018/11/Mishkat-Ul-Masabeeh.jpg' },
  { id: 21926, cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/Al-Hidayah.jpg' },
  { id: 21927, cover: 'https://besturdubooks.net/wp-content/uploads/2024/05/AL-HIDAYAH-RAHMANIA.jpg' },
  { id: 21928, cover: 'https://besturdubooks.net/wp-content/uploads/2024/05/Al_Hidaya_Rasheedia.jpg' },
  { id: 21929, cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/NUHBATUL-FIKAR-IMDAD-UN-NAZAR.jpg' },
  { id: 21930, cover: 'https://besturdubooks.net/wp-content/uploads/2026/05/%D9%86%D8%B2%D9%87%D8%A9-%D8%A7%D9%84%D9%86%D8%B8%D8%B1-%D9%81%D9%8I-%D8%AA%D9%88%D8%B6%D9%8A%D8%AD-%D9%86%D8%AE%D8%A8%D8%A9-%D8%A7%D9%84%D9%81%D9%83%D8%B1.jpg' },
  { id: 21932, cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/AL-MUTAWWAL.jpg' },
  { id: 21933, cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/al-haiat-ul-wusta.jpg' },
  { id: 21931, cover: 'https://besturdubooks.net/wp-content/uploads/2018/12/Taiseer-E-Mustalah-Ul-Hadith.jpg' }
];

async function updateCover(bookId, newCoverUrl) {
  const url = `${SUPABASE_URL}/rest/v1/Books?id=eq.${bookId}`;
  
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ cover_url: newCoverUrl })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ Failed to update Book ID ${bookId}: Status ${res.status} - ${errorText}`);
      return false;
    }
    
    console.log(`✅ Successfully updated Book ID ${bookId} with new cover.`);
    return true;
  } catch (err) {
    console.error(`❌ Error updating Book ID ${bookId}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`Starting update for ${COVERS_TO_UPDATE.length} Sabia textbook covers...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const item of COVERS_TO_UPDATE) {
    const success = await updateCover(item.id, item.cover);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    // Polite delay
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`\nFinished! Success: ${successCount}, Failed: ${failCount}`);
}

main().catch(console.error);
