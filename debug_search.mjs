import { chromium } from 'playwright';

async function debugSearch() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const query = "خلاصۃ التجوید";
  console.log(`Searching for: ${query}`);
  await page.goto(`https://besturdubooks.net/?s=${encodeURIComponent(query)}`);
  
  const results = await page.evaluate(() => {
     return Array.from(document.querySelectorAll('article, .post-item, .item')).map(item => {
        return {
           innerText: item.innerText.substring(0, 100),
           h2: item.querySelector('h2')?.innerText,
           img: item.querySelector('img')?.src
        };
     });
  });
  
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}
debugSearch();
