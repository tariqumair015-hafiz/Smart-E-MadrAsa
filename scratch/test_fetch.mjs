async function test() {
  const url = 'https://besturdubooks.net/tafseer-e-baizawi-al-bushra/';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'
      }
    });
    console.log(`Status: ${res.status}`);
    const html = await res.text();
    console.log(`HTML length: ${html.length}`);
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) || 
                         html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    console.log(`og:image match:`, ogImageMatch ? ogImageMatch[1] : 'not found');
  } catch (e) {
    console.error(e);
  }
}
test();
