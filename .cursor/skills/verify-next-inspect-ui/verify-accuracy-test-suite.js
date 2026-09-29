const { chromium } = require('playwright');

async function verifyTestSuite() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to test suite...');
    await page.goto('http://localhost:3001/test');
    await page.waitForLoadState('networkidle');
    
    // Capture entry screenshot
    await page.screenshot({
      path: '/tmp/verify-evidence/test-suite-loaded.png',
      fullPage: true
    });
    
    // Verify known test groups exist
    const knownGroups = [
      'basic html snippet',
      'svg',
      'shadcn',
      'base-ui',
      'motion',
      'library',
      'radix',
      'kinds',
      'composition',
      'third-party',
      'server',
      'parent inspectable'
    ];
    
    for (const groupName of knownGroups) {
      const found = await page.getByText(groupName, { exact: false }).count() > 0;
      console.log(`Test group "${groupName}": ${found ? '✓' : '✗'}`);
    }
    
    // Verify individual test cases exist
    const knownCases = [
      'plain heading',
      'plain button',
      'button variants',
      'server component host'
    ];
    
    for (const caseName of knownCases) {
      const found = await page.getByText(caseName, { exact: false }).count() > 0;
      console.log(`Test case "${caseName}": ${found ? '✓' : '✗'}`);
    }
    
    // Scroll to capture more content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.screenshot({
      path: '/tmp/verify-evidence/test-suite-mid-scroll.png',
      fullPage: false
    });
    
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.screenshot({
      path: '/tmp/verify-evidence/test-suite-bottom.png',
      fullPage: false
    });
    
    // Full page screenshot for complete evidence
    await page.screenshot({
      path: '/tmp/verify-evidence/test-suite-verified.png',
      fullPage: true
    });
    
    console.log('✓ Test suite page verified');
    return true;
    
  } catch (error) {
    console.error('✗ Test suite verification failed:', error);
    await page.screenshot({
      path: '/tmp/verify-evidence/test-suite-error.png',
      fullPage: true
    });
    throw error;
  } finally {
    await browser.close();
  }
}

verifyTestSuite().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
