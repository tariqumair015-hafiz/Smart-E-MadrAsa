async function testPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'
      }
    });
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.status}`);
    if (res.status === 200) {
      const html = await res.text();
      const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) || 
                           html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
      console.log(`  og:image: ${ogImageMatch ? ogImageMatch[1] : 'not found'}`);
    }
  } catch (e) {
    console.error(e);
  }
}

async function run() {
  await testPage('https://besturdubooks.net/taiseer-e-mustalah-ul-hadith/');
  await testPage('https://besturdubooks.net/nuzhat-un-nazar/');
  await testPage('https://besturdubooks.net/mishkat-ul-masabih-urdu/');
}
run();
