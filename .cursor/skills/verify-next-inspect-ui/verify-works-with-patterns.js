const { chromium } = require('playwright');

async function verifyWorksWithPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to works-with page...');
    await page.goto('http://localhost:3000/works-with');
    await page.waitForLoadState('networkidle');
    
    // Verify page title
    const title = await page.locator('h1', { hasText: 'Works with' }).count();
    if (title === 0) throw new Error('Works with page title not found');
    
    // Capture entry screenshot
    await page.screenshot({
      path: '/tmp/verify-evidence/works-with-page-loaded.png',
      fullPage: true
    });
    
    // Verify known pattern sections exist
    const knownPatterns = [
      'HTML',
      'shadcn',
      'Motion',
      'Server host'
    ];
    
    let foundPatterns = 0;
    for (const pattern of knownPatterns) {
      const found = await page.getByText(pattern, { exact: false }).count() > 0;
      if (found) foundPatterns++;
      console.log(`Pattern "${pattern}": ${found ? '✓' : '✗'}`);
    }
    
    if (foundPatterns < 3) {
      throw new Error(`Only found ${foundPatterns} of ${knownPatterns.length} expected patterns`);
    }
    
    // Verify async Server Components caveat is documented
    const hasCaveat = await page.getByText(/Async Server Components are not inspectable yet/i).count() > 0;
    if (!hasCaveat) {
      console.warn('Warning: Async Server Components caveat not found');
    }
    
    // Final screenshot
    await page.screenshot({
      path: '/tmp/verify-evidence/works-with-page-verified.png',
      fullPage: true
    });
    
    console.log('✓ Works with page verified');
    return true;
    
  } catch (error) {
    console.error('✗ Works with page verification failed:', error);
    await page.screenshot({
      path: '/tmp/verify-evidence/works-with-page-error.png',
      fullPage: true
    });
    throw error;
  } finally {
    await browser.close();
  }
}

verifyWorksWithPage().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
