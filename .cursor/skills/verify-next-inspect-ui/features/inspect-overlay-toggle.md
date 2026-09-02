# InspectUI Overlay Toggle

The core functionality of the InspectUI: activating the overlay with the keyboard shortcut ⌥ + X to enable hover inspection of components.

## Sub-features

- Keyboard shortcut ⌥ + X toggles the overlay on/off
- When active, overlay state is indicated visually (possibly with a border or indicator)
- Overlay elements have `data-dev-inspector-overlay` and `data-dev-inspector-tooltip` attributes
- Overlay state is controlled via CSS `display` property (none/block), not attribute values
- When active, hovering elements shows tooltips with source file information
- Pressing Esc or ⌥ + X again deactivates the overlay

## How to get to it (user POV)

1. Navigate to any page in the app (e.g., `/components` or `/`)
2. Press ⌥ + X on the keyboard
3. Overlay activates (visual indicator appears)
4. Hover any element to see source info
5. Press Esc or ⌥ + X to deactivate

## Driving it with Playwright

**Important**: Keyboard shortcuts in headless browsers can be unreliable. The InspectUI overlay responds to `Alt + X`. Test in headed mode if headless fails.

```javascript
const { chromium } = require('playwright');

async function verifyOverlayToggle() {
  const browser = await chromium.launch({ 
    headless: true,
    // Use headed mode if headless fails: headless: false
  });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to components page...');
    await page.goto('http://localhost:3000/components');
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
    // This may vary depending on implementation
    // Check for data attribute, class change, or visual indicator
    await page.waitForTimeout(500); // Small delay for state change
    
    // Detect overlay activation by checking for overlay elements
    const hasOverlay = await page.locator('[data-dev-inspector-overlay]').count() > 0;
    const hasTooltip = await page.locator('[data-dev-inspector-tooltip]').count() > 0;
    
    console.log('Overlay activation detection:');
    console.log('  data-dev-inspector-overlay:', hasOverlay);
    console.log('  data-dev-inspector-tooltip:', hasTooltip);
    
    // Capture after activation attempt
    await page.screenshot({
      path: '/tmp/verify-evidence/overlay-after-activation.png',
      fullPage: true
    });
    
    // Try hovering an element to trigger tooltip
    console.log('Hovering button element...');
    const button = page.locator('button').first();
    await button.hover();
    await page.waitForTimeout(300); // Wait for tooltip
    
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

verifyOverlayToggle();
```

## Gotchas

- **Keyboard shortcuts are unreliable in headless browsers**. Alt+X may not fire correctly. Consider:
  - Running in headed mode (`headless: false`)
  - Using `page.evaluate()` to trigger the toggle programmatically if there's a JS API
  - Checking if the InspectUI component exposes a test hook or data attribute for programmatic activation
- The overlay elements (`data-dev-inspector-overlay`, `data-dev-inspector-tooltip`) are present in the DOM when the InspectUI is mounted, but their visibility is controlled via CSS `display` property.
- The tooltip may require both overlay activation AND hovering, so test both states.
- Timing is critical: wait after keyboard press before checking state or capturing screenshots.
- If activation fails silently, check browser console logs for errors with `page.on('console')`.
- The overlay is only active in development mode. Ensure `NODE_ENV=development`.
