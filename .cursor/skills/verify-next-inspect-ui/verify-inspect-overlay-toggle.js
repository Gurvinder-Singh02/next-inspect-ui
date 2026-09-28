const { chromium } = require('playwright');

async function verifyOverlayToggle() {
  const browser = await chromium.launch({ 
    headless: true,
  });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to site home page...');
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Capture before activation
    await page.screenshot({
      path: '/tmp/verify-evidence/overlay-before-activation.png',
      fullPage: true
    });
    
    console.log('Pressing Alt+X to activate overlay...');
    await page.keyboard.down('Alt');
    await page.keyboard.press('KeyX');
    await page.keyboard.up('Alt');
    
    // Wait for overlay state change
    await page.waitForTimeout(500);
    
    // Check for overlay activation via data attributes
    const hasOverlay = await page.locator('[data-dev-inspector-overlay]').count() > 0;
    const hasTooltip = await page.locator('[data-dev-inspector-tooltip]').count() > 0;
    
    console.log('Overlay activation detection:');
    console.log('  [data-dev-inspector-overlay]:', hasOverlay);
    console.log('  [data-dev-inspector-tooltip]:', hasTooltip);
    
    if (!hasOverlay) {
      throw new Error('Overlay not activated - data-dev-inspector-overlay not found');
    }
    
    // Capture after activation attempt
    await page.screenshot({
      path: '/tmp/verify-evidence/overlay-after-activation.png',
      fullPage: true
    });
    
    // Try hovering an element to trigger tooltip
    console.log('Hovering button element...');
    const button = page.locator('button').first();
    await button.hover();
    await page.waitForTimeout(300);
    
    await page.screenshot({
      path: '/tmp/verify-evidence/overlay-hover-tooltip.png',
      fullPage: true
    });
    
    // Deactivate overlay
    console.log('Pressing Alt+X to deactivate overlay...');
    await page.keyboard.down('Alt');
    await page.keyboard.press('KeyX');
    await page.keyboard.up('Alt');
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: '/tmp/verify-evidence/overlay-after-deactivation.png',
      fullPage: true
    });
    
    console.log('✓ Overlay toggle sequence completed');
    console.log('Review screenshots to confirm activation/deactivation');
    return true;
    
  } catch (error) {
    console.error('✗ Overlay toggle verification failed:', error);
    await page.screenshot({
      path: '/tmp/verify-evidence/overlay-toggle-error.png',
      fullPage: true
    });
    throw error;
  } finally {
    await browser.close();
  }
}

verifyOverlayToggle().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
