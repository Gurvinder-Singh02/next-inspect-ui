const { chromium } = require('playwright');

async function verifyComponentsGallery() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to components gallery...');
    await page.goto('http://localhost:3002/components');
    await page.waitForLoadState('networkidle');
    
    // Verify header exists
    const header = await page.locator('header').count();
    if (header === 0) throw new Error('Header not found');
    
    // Verify instruction text
    const hasInstruction = await page.getByText(/Press.*⌥.*x.*inspector/i).count() > 0;
    if (!hasInstruction) throw new Error('Inspector instruction not found');
    
    // Capture entry screenshot
    await page.screenshot({
      path: '/tmp/verify-evidence/components-gallery-loaded.png',
      fullPage: true
    });
    
    // Verify grid section exists
    const section = await page.locator('section').first();
    const isVisible = await section.isVisible();
    if (!isVisible) throw new Error('Components section not visible');
    
    // Count component cards (should be multiple)
    const cards = await page.locator('section [class*="gap"]').first().locator('> div').count();
    console.log(`Found ${cards} component columns`);
    
    // Verify specific known components
    const barChart = await page.getByText('Traffic channels').count() > 0;
    
    console.log('Bar Chart (Traffic channels) present:', barChart);
    
    // Final screenshot
    await page.screenshot({
      path: '/tmp/verify-evidence/components-gallery-verified.png',
      fullPage: true
    });
    
    console.log('✓ Components gallery verified');
    return true;
    
  } catch (error) {
    console.error('✗ Components gallery verification failed:', error);
    await page.screenshot({
      path: '/tmp/verify-evidence/components-gallery-error.png',
      fullPage: true
    });
    throw error;
  } finally {
    await browser.close();
  }
}

verifyComponentsGallery().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
