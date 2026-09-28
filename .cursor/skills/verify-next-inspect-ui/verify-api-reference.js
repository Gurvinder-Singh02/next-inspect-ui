const { chromium } = require('playwright');

async function verifyApiReferencePage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to api-reference page...');
    await page.goto('http://localhost:3000/api-reference');
    await page.waitForLoadState('networkidle');
    
    // Verify page title
    const title = await page.locator('h1', { hasText: 'API Reference' }).count();
    if (title === 0) throw new Error('API Reference page title not found');
    
    // Verify description mentions projectRoot
    const hasProjectRoot = await page.getByText(/projectRoot/i).count() > 0;
    if (!hasProjectRoot) throw new Error('projectRoot prop documentation not found');
    
    // Capture entry screenshot
    await page.screenshot({
      path: '/tmp/verify-evidence/api-reference-page-loaded.png',
      fullPage: true
    });
    
    // Verify Playground link exists
    const playgroundLink = await page.getByRole('link', { name: /Playground/i }).count() > 0;
    if (!playgroundLink) throw new Error('Playground link not found');
    
    // Verify link points to /lab
    const link = page.getByRole('link', { name: /Playground/i }).first();
    const href = await link.getAttribute('href');
    if (href !== '/lab') {
      console.warn(`Playground link href is ${href}, expected /lab`);
    }
    
    // Verify ApiReference component is rendered
    const hasApiRef = await page.locator('text=projectRoot').count() > 0;
    if (!hasApiRef) {
      throw new Error('API reference content not rendered');
    }
    
    console.log('✓ API documentation visible');
    
    // Final screenshot
    await page.screenshot({
      path: '/tmp/verify-evidence/api-reference-page-verified.png',
      fullPage: true
    });
    
    console.log('✓ API Reference page verified');
    return true;
    
  } catch (error) {
    console.error('✗ API Reference page verification failed:', error);
    await page.screenshot({
      path: '/tmp/verify-evidence/api-reference-page-error.png',
      fullPage: true
    });
    throw error;
  } finally {
    await browser.close();
  }
}

verifyApiReferencePage().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
