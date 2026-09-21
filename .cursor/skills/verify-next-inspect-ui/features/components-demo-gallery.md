# Components Demo Gallery

The main showcase page displaying interactive example components that demonstrate the InspectUI overlay functionality.

## Sub-features

- Card components with various content (charts, typography, invoices, etc.)
- Responsive grid layout (1 column on mobile, 3 columns on desktop)
- Header with instructions to "Press ⌥ + x to open the inspector"
- Each component is hoverable and inspectable when overlay is active

## How to get to it (user POV)

**Note**: This page is on the `shadcn-dashboard-001-example` app, not the main site.

1. Start the dashboard server: `pnpm dev:dashboard` (uses PORT env var, or defaults to 3000)
2. Navigate directly to `http://localhost:<PORT>/components` (e.g., `http://localhost:3000/components` if running alone, or `http://localhost:3001/components` if site is already on 3000)

## Driving it with Playwright

```javascript
const { chromium } = require('playwright');
const path = require('path');

async function verifyComponentsGallery() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // NOTE: Components page is on shadcn-dashboard-001-example app
    // Assumes pnpm dev:dashboard is running (adjust port as needed)
    const port = process.env.DASHBOARD_PORT || '3000';
    console.log(`Navigating to components gallery on port ${port}...`);
    await page.goto(`http://localhost:${port}/components`);
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

- **This page is on a different app** (`shadcn-dashboard-001-example`), not the site. Start with `pnpm dev:dashboard`.
- When running multiple servers, use PORT env var to avoid conflicts: `PORT=3001 pnpm dev:dashboard`.
- The page uses server components and may have hydration timing issues. Always wait for `networkidle` before assertions.
- Component cards use responsive grid layout, so element positions change based on viewport size.
- Some components (like LiveWaveform) may have animations that affect screenshot consistency.
- The header instruction text includes Unicode characters (⌥), ensure text matching is unicode-aware.
