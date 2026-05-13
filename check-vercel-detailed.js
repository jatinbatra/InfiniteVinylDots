import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  let consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  console.log('Navigating to https://infinite-vinyl-dots.vercel.app/...');
  try {
    await page.goto('https://infinite-vinyl-dots.vercel.app/', { waitUntil: 'networkidle' });
    
    console.log('Waiting 10 seconds to capture network and console activity...');
    await page.waitForTimeout(10000); 

    const errors = consoleLogs.filter(log => log.type === 'error');
    if (errors.length > 0) {
      console.log('⚠️ Console Errors:');
      errors.forEach(err => console.log(`- ${err.text}`));
    }

    const itunesFailures = consoleLogs.filter(log => log.text.includes('itunes.apple.com'));
    if (itunesFailures.length > 0) {
        console.log('❌ Detected iTunes API failures (likely CORS or Region blocks):');
        itunesFailures.forEach(f => console.log(`- ${f.text}`));
    }

    await page.screenshot({ path: 'vercel-check-detailed.png', fullPage: true });
    console.log('✅ Detailed screenshot saved as vercel-check-detailed.png');

  } catch (err) {
    console.error('❌ Error during check:', err);
  } finally {
    await browser.close();
  }
})();
