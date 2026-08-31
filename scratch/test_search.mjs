async function testSearch(title) {
  const q = encodeURIComponent(title);
  const url = `https://besturdubooks.net/?s=${q}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'
      }
    });
    console.log(`Title: ${title}`);
    console.log(`Search URL: ${url}`);
    console.log(`Status: ${res.status}`);
    const html = await res.text();
    
    // Let's find image links
    // Often there's a featured image in the search results like:
    // <img width="..." height="..." src="https://besturdubooks.net/wp-content/uploads/..."
    const matches = [...html.matchAll(/<img[^>]+src=["']?([^"' >]+)["']?/gi)].map(m => m[1]);
    
    console.log(`Found images:`);
    const filtered = matches.filter(src => src.includes('/uploads/') && !src.includes('logo') && !src.includes('profile'));
    filtered.slice(0, 5).forEach(img => console.log(` - ${img}`));
    console.log('------------------------------------');
  } catch (e) {
    console.error(e);
  }
}

async function run() {
  await testSearch('Mishkat ul Masabih Rahmania');
  await testSearch('Nukhbatul Fikar');
  await testSearch('Nuzha tun Nazar');
  await testSearch('Al Hai\'at Ul Wusta');
  await testSearch('Taiseer e Mustalah ul Hadith');
}
run();
