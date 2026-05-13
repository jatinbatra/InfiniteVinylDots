import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  let errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  console.log('Navigating to https://infinite-vinyl-dots.vercel.app/...');
  try {
    await page.goto('https://infinite-vinyl-dots.vercel.app/', { waitUntil: 'networkidle' });
    
    // Wait for the 3D globe to initialize
    console.log('Waiting 5 seconds for WebGL scene to load...');
    await page.waitForTimeout(5000); 

    const title = await page.title();
    console.log(`Page title: ${title}`);

    const hasCanvas = await page.evaluate(() => !!document.querySelector('canvas'));
    console.log(`3D Globe Canvas detected: ${hasCanvas ? 'YES' : 'NO'}`);

    const hudVisible = await page.evaluate(() => {
        return !!Array.from(document.querySelectorAll('div')).find(d => d.textContent?.includes('VinylVerse'));
    });
    console.log(`HUD UI detected: ${hudVisible ? 'YES' : 'NO'}`);

    if (errors.length > 0) {
      console.log('⚠️ Console errors detected:');
      errors.forEach(err => console.log(`- ${err}`));
    } else {
      console.log('✅ No console errors detected.');
    }

    await page.screenshot({ path: 'vercel-check.png', fullPage: true });
    console.log('✅ Screenshot saved as vercel-check.png');

  } catch (err) {
    console.error('❌ Failed to load page:', err);
  } finally {
    await browser.close();
  }
})();
