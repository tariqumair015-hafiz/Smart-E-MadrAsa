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
    // Remove quotes
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
  const url = `${SUPABASE_URL}/rest/v1/Books?category=eq.${encodeURIComponent('درجہ سابعہ')}&select=id,title,cover_url,sub_category`;
  
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
    console.log(`Found ${books.length} books in Sabea:`);
    books.forEach(b => {
      console.log(`- ID: ${b.id} | Sub: ${b.sub_category} | Title: ${b.title.substring(0, 50)} | Cover: ${b.cover_url}`);
    });
  } catch (err) {
    console.error(err);
  }
}
check();
