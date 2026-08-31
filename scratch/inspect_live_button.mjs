import { chromium } from 'playwright';

async function run() {
  console.log('Launching browser to inspect live page...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to mobile size
  await page.setViewportSize({ width: 390, height: 844 });
  
  console.log('Navigating to http://localhost:5173/...');
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('Page loaded.');
    
    // Wait for splash screen to complete (it takes a few seconds or sets a state)
    console.log('Waiting 4 seconds for splash screen to clear...');
    await page.waitForTimeout(4000);
    
    // Check if the floating button is in the DOM
    const btn = await page.$('#floating-ai-btn');
    if (btn) {
      console.log('✅ Found #floating-ai-btn in DOM!');
      
      // Get bounding box and computed styles
      const box = await btn.boundingBox();
      console.log('Bounding Box:', box);
      
      const styles = await page.evaluate((el) => {
        const s = window.getComputedStyle(el);
        return {
          display: s.display,
          visibility: s.visibility,
          opacity: s.opacity,
          zIndex: s.zIndex,
          position: s.position,
          right: s.right,
          bottom: s.bottom,
          left: s.left,
          top: s.top,
          width: s.width,
          height: s.height
        };
      }, btn);
      console.log('Computed Styles:', styles);
      
      // Take a screenshot
      await page.screenshot({ path: 'scratch/button_debug_mobile.png' });
      console.log('Captured mobile screenshot to scratch/button_debug_mobile.png');
    } else {
      console.log('❌ #floating-ai-btn NOT found in DOM!');
      
      // Dump DOM outline
      const content = await page.content();
      console.log('HTML contains "#floating-ai-btn"?', content.includes('floating-ai-btn'));
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
}
run();
