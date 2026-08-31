const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkDB() {
  const url = `${SUPABASE_URL}/rest/v1/Books?category=eq.درجہ سابعہ&select=*`;
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!response.ok) {
    console.error('Fetch failed:', response.status, await response.text());
    return;
  }

  const data = await response.json();
  console.log(`Total books in DB for درجہ سابعہ: ${data.length}`);
  const categories = {};
  data.forEach(b => {
    categories[b.sub_category] = (categories[b.sub_category] || 0) + 1;
  });
  console.log('Categories breakdown:', categories);
  console.log('\n--- Textbooks (درسی کتب) in DB: ---');
  data.filter(b => b.sub_category === 'درسی کتب').forEach((b, idx) => {
    console.log(`${idx + 1}. ${b.title}`);
  });
}

checkDB().catch(console.error);
