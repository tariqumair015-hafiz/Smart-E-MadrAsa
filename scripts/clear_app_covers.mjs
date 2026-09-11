import fs from 'fs';

// Load env credentials
const env = JSON.parse(fs.readFileSync('./env_config.json', 'utf8'));
const SUPABASE_URL = (env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseHeaders = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function clearAppCovers() {
  console.log('==================================================');
  console.log('🧹 Clearing cover_url from App Metadata & Database');
  console.log('⚠️ (Cloudflare R2 bucket files WILL NOT BE TOUCHED)');
  console.log('==================================================\n');

  const metadataPath = './books_metadata.json';
  if (!fs.existsSync(metadataPath)) {
    console.error('❌ books_metadata.json not found!');
    return;
  }

  const books = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  let clearedCount = 0;

  for (let i = 0; i < books.length; i++) {
    if (books[i].cover_url !== null) {
      books[i].cover_url = null;
      clearedCount++;
    }
  }

  fs.writeFileSync('./books_metadata.json', JSON.stringify(books, null, 2), 'utf8');
  if (fs.existsSync('./public/books_metadata.json')) {
    fs.writeFileSync('./public/books_metadata.json', JSON.stringify(books, null, 2), 'utf8');
  }

  console.log(`✅ Cleared cover_url in books_metadata.json & public/books_metadata.json (${clearedCount} books updated).`);

  if (SUPABASE_URL) {
    try {
      console.log('🔄 Updating Supabase DB Books table (setting cover_url to null)...');
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Books?cover_url=not.is.null`, {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify({ cover_url: null })
      });
      if (res.ok) {
        console.log('✅ Supabase DB Books table updated successfully!');
      } else {
        console.warn(` ⚠️ Supabase PATCH HTTP ${res.status}`);
      }
    } catch (e) {
      console.warn(' ⚠️ Supabase DB update skipped (offline/unreachable).');
    }
  }

  console.log('\n==================================================');
  console.log('🎉 APP COVERS CLEARED SUCCESSFULLY!');
  console.log('App will now display clean default book emblems/card placeholders.');
  console.log('==================================================\n');
}

clearAppCovers();
