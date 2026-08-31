const url = 'https://ymizqgtlnhvkqlidftiy.supabase.co/rest/v1/Books?category=eq.%D8%AF%D9%88%D8%B1%D9%87%20%D8%AD%D8%AF%DB%8C%D8%AB&select=title,category&limit=5';
fetch(url, { headers: { 'apikey': 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI' } })
  .then(res => res.json())
  .then(data => console.log('BOOKS API RESULT:', JSON.stringify(data)))
  .catch(console.error);
