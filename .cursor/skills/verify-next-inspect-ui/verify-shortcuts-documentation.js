const { chromium } = require('playwright');

async function verifyShortcutsPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to shortcuts page...');
    await page.goto('http://localhost:3000/shortcuts');
    await page.waitForLoadState('networkidle');
    
    // Verify page title
    const title = await page.locator('h1', { hasText: 'Shortcuts' }).count();
    if (title === 0) throw new Error('Shortcuts page title not found');
    
    // Verify description
    const hasDescription = await page.getByText(/Keyboard and pointer controls/i).count() > 0;
    if (!hasDescription) throw new Error('Shortcuts description not found');
    
    // Capture entry screenshot
    await page.screenshot({
      path: '/tmp/verify-evidence/shortcuts-page-loaded.png',
      fullPage: true
    });
    
    // Verify known shortcuts are documented
    const knownShortcuts = [
      'hover',
      'click',
      'hold',
      'Esc'
    ];
    
    let foundShortcuts = 0;
    for (const shortcut of knownShortcuts) {
      const found = await page.getByText(shortcut, { exact: false }).count() > 0;
      if (found) foundShortcuts++;
      console.log(`Shortcut "${shortcut}": ${found ? '✓' : '✗'}`);
    }
    
    if (foundShortcuts < 3) {
      throw new Error(`Only found ${foundShortcuts} of ${knownShortcuts.length} expected shortcuts`);
    }
    
    // Final screenshot
    await page.screenshot({
      path: '/tmp/verify-evidence/shortcuts-page-verified.png',
      fullPage: true
    });
    
    console.log('✓ Shortcuts page verified');
    return true;
    
  } catch (error) {
    console.error('✗ Shortcuts page verification failed:', error);
    await page.screenshot({
      path: '/tmp/verify-evidence/shortcuts-page-error.png',
      fullPage: true
    });
    throw error;
  } finally {
    await browser.close();
  }
}

verifyShortcutsPage().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
