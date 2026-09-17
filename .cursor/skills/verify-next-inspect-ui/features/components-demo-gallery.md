# Components Demo Gallery

The main showcase page displaying interactive example components that demonstrate the InspectUI overlay functionality.

## Sub-features

- Card components with various content (charts, typography, invoices, etc.)
- Responsive grid layout (1 column on mobile, 3 columns on desktop)
- Header with instructions to "Press ⌥ + x to open the inspector"
- Each component is hoverable and inspectable when overlay is active

## How to get to it (user POV)

**App**: `shadcn-dashboard-001-example` (port 3002)

1. Visit `http://localhost:3002/components` directly
2. Or from home page, navigate to components showcase

## Driving it with Playwright

```javascript
const { chromium } = require('playwright');
const path = require('path');

async function verifyComponentsGallery() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to components gallery...');
    // Components demo is on dashboard app (port 3002)
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
    const styleOverview = await page.getByText('Style Overview').count() > 0;
    const barChart = await page.getByText('Revenue').count() > 0;
    
    console.log('Style Overview present:', styleOverview);
    console.log('Bar Chart present:', barChart);
    
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

verifyComponentsGallery();
```

## Gotchas

- The page uses server components and may have hydration timing issues. Always wait for `networkidle` before assertions.
- Component cards use responsive grid layout, so element positions change based on viewport size.
- Some components (like LiveWaveform) may have animations that affect screenshot consistency.
- The header instruction text includes Unicode characters (⌥), ensure text matching is unicode-aware.
