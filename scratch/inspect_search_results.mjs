import fs from 'fs';

async function inspectSearch(query) {
  const url = `https://besturdubooks.net/?s=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'
      }
    });
    const html = await res.text();
    console.log(`=== SEARCH RESULTS FOR: "${query}" ===`);
    
    // Regular expression to match article structures or post links and their images
    // In WordPress, search results usually look like:
    // <h2 class="entry-title"><a href="POST_URL">POST_TITLE</a></h2>
    // And there's a featured image close to it or inside the article.
    // Let's find all links containing the post page.
    // Let's search for '<h2 class="[eE]ntry-title"><a href="([^"]+)"[^>]*>([^<]+)</a>'
    // or similar patterns.
    
    const postMatches = [...html.matchAll(/<h[23][^>]*class=["']entry-title["'][^>]*><a\s+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi)];
    if (postMatches.length === 0) {
      // Try a more generic link match
      const genericLinks = [...html.matchAll(/<a\s+href=["'](https:\/\/besturdubooks\.net\/[^"']+)["'][^>]*>([^<]+)<\/a>/gi)];
      console.log(`Found generic links: ${genericLinks.length}`);
      genericLinks.slice(0, 15).forEach(m => {
        if (m[2].trim().length > 5 && !m[1].includes('/category/') && !m[1].includes('/tag/') && !m[1].includes('/author/')) {
          console.log(` - Title: ${m[2].trim()} | Link: ${m[1]}`);
        }
      });
    } else {
      console.log(`Found posts: ${postMatches.length}`);
      postMatches.forEach(m => {
        console.log(` - Title: ${m[2].trim()} | Link: ${m[1]}`);
      });
    }
    console.log('====================================\n');
  } catch (e) {
    console.error(e);
  }
}

async function run() {
  await inspectSearch('Taiseer e Mustalah ul Hadith');
  await inspectSearch('Nuzha tun Nazar');
  await inspectSearch('Mishkat ul Masabih Urdu');
}
run();
