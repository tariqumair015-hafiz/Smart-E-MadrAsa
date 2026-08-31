async function getBestUrduBooksTextbooks() {
  const urls = [
    'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-text-books/',
    'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-text-books/page/2/'
  ];

  const onlineBooks = [];

  for (const url of urls) {
    console.log(`Fetching: ${url}`);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) {
        console.error(`Error fetching ${url}: ${res.status}`);
        continue;
      }
      const html = await res.text();
      
      // Use regex to match all <img ... alt="something" ...>
      const imgRegex = /<img[^>]+alt=["']([^"']+)["']/gi;
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        let title = match[1]
          .replace(/Download Link \d+/gi, '')
          .replace(/Download/gi, '')
          .replace(/\[.*?\]/g, '')
          .trim();
        if (title && !title.toLowerCase().includes('logo') && !title.toLowerCase().includes('banner') && title.length > 5) {
          if (!onlineBooks.includes(title)) {
            onlineBooks.push(title);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  console.log('\n--- Textbooks listed on BestUrduBooks website: ---');
  onlineBooks.forEach((t, i) => console.log(`${i + 1}. ${t}`));
}

getBestUrduBooksTextbooks().catch(console.error);
