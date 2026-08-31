import { chromium } from 'playwright';

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log('[BROWSER ERROR]', err);
  });

  console.log('Navigating to http://localhost:5173/...');
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 30000 });
    console.log('Page loaded. Waiting 5s...');
    await new Promise(r => setTimeout(r, 5000));
    const content = await page.content();
    console.log('Page content length:', content.length);
  } catch (err) {
    console.error('Navigation error:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
