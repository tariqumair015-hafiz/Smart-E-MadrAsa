async function debugPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'
      }
    });
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.status}`);
    if (res.status === 404) {
      console.log(`Page not found (404)`);
      return;
    }
    const html = await res.text();
    // Print all <img tags and meta tags with image
    const imgMatches = html.match(/<img[^>]+src="([^"]+)"/gi) || [];
    const metaMatches = html.match(/<meta[^>]+content="([^"]+)"/gi) || [];
    
    console.log('--- META TAGS containing image ---');
    metaMatches.forEach(m => {
      if (m.toLowerCase().includes('image') || m.toLowerCase().includes('jpg') || m.toLowerCase().includes('png')) {
        console.log(m);
      }
    });
    
    console.log('--- FIRST 5 IMG TAGS ---');
    imgMatches.slice(0, 5).forEach(m => console.log(m));
  } catch (e) {
    console.error(e);
  }
}

async function run() {
  await debugPage('https://besturdubooks.net/mishkat-ul-masabih-rahmania/');
  console.log('\n======================================================\n');
  await debugPage('https://besturdubooks.net/nukhbat-ul-fikar/');
}
run();
