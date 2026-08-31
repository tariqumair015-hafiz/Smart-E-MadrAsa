async function run() {
  const url = `https://besturdubooks.net/?s=${encodeURIComponent('Taiseer e Mustalah ul Hadith')}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'
      }
    });
    const html = await res.text();
    const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
    console.log(`Found ${h2Matches.length} H2 tags:`);
    h2Matches.forEach((h2, idx) => {
      console.log(`H2 [${idx}]: ${h2[1].trim()}`);
    });
    
    // Let's search for <a tags that have any title/link
    // Match any link inside a container like <header or <div class="entry-...
    console.log('\n--- Searching for post entry-title classes or similar ---');
    const entryMatches = [...html.matchAll(/class=["']entry-title["'][^>]*>([\s\S]*?)<\/h[23]>/gi)];
    console.log(`Found entry titles: ${entryMatches.length}`);
    entryMatches.forEach((em, idx) => {
      console.log(`Entry [${idx}]: ${em[1].trim()}`);
    });
    
  } catch (e) {
    console.error(e);
  }
}
run();
