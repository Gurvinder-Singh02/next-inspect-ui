# Shortcuts Documentation

A documentation page listing all keyboard and pointer controls available when the InspectUI overlay is active.

## Sub-features

- Page header with title "Shortcuts"
- Description text explaining the purpose
- Shortcuts reference table or list showing:
  - Key combinations (⌥X, I, ↑/↓, [/], Esc, etc.)
  - Actions for each shortcut (toggle inspect mode, open info panel, climb tree, etc.)
- Visual representation of keyboard keys

## How to get to it (user POV)

1. Visit home page at `http://localhost:3000`
2. Click "Shortcuts" link in the sidebar navigation
3. Or navigate directly to `http://localhost:3000/shortcuts`

## Driving it with Playwright

```javascript
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
    
    // Verify shortcuts reference component exists
    const hasReference = await page.locator('[class*="shortcut"]').count() > 0 ||
                         await page.locator('table').count() > 0 ||
                         await page.locator('dl').count() > 0; // Could be various formats
    
    if (!hasReference) {
      console.warn('Shortcuts reference format not detected, checking for key text...');
    }
    
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

verifyShortcutsPage();
```

## Gotchas

- The shortcuts reference component (`<ShortcutsReference />`) is imported from components, so exact DOM structure depends on that component's implementation.
- Keyboard symbols (⌥, ⇧, ↑, ↓, etc.) may be rendered as Unicode characters or as styled kbd elements.
- The page layout is relatively simple compared to the components gallery, so it loads quickly.
- Check for either a table, definition list, or custom component structure when verifying shortcuts content.
