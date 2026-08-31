import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Go to the local app
  await page.goto('http://localhost:5173/');
  
  console.log('App loaded. Waiting for books to render...');
  await page.waitForTimeout(5000); // Wait for API fetch and rendering

  // Find all BookCards and check if they are showing the placeholder
  // In App.jsx BookCard, the placeholder has a linear-gradient background.
  // The actual image has className "featured-cover" or is inside OfflineImage.
  
  const books = await page.evaluate(() => {
    const results = [];
    // Featured books section
    const featuredCards = document.querySelectorAll('.featured-card');
    featuredCards.forEach(card => {
      const titleEl = card.querySelector('.featured-title');
      const title = titleEl ? titleEl.innerText : 'Unknown';
      const hasImage = card.querySelector('img') !== null;
      results.push({ section: 'Featured', title, hasImage });
    });

    // Other BookCards (Categories)
    // BookCards have width: 110
    const allCards = document.querySelectorAll('div[style*="width: 110"]');
    allCards.forEach(card => {
      const titleEls = card.querySelectorAll('p');
      let title = 'Unknown';
      titleEls.forEach(el => {
        if (el.innerText && el.innerText.trim().length > 0) {
          title = el.innerText;
        }
      });
      const hasImage = card.querySelector('img') !== null;
      results.push({ section: 'Category', title, hasImage });
    });

    return results;
  });

  const missing = books.filter(b => !b.hasImage);
  const ok = books.filter(b => b.hasImage);
  
  console.log(`\nTotal Books visible on screen: ${books.length}`);
  console.log(`✅ Books showing Images: ${ok.length}`);
  console.log(`❌ Books showing Placeholders: ${missing.length}\n`);

  if (missing.length > 0) {
    console.log('List of visible books showing placeholders:');
    missing.forEach(b => console.log(`- [${b.section}] ${b.title}`));
  }

  await browser.close();
})();
