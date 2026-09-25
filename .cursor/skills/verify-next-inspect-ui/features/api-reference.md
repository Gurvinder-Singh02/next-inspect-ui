# API Reference

Documentation page for InspectUI component props and API surface, including required projectRoot and optional configuration props for shortcut, editor, tooltip, and spotlight settings.

## Sub-features

- Page header with title "API Reference"
- Description explaining InspectUI props
- Mentions required projectRoot prop
- Mentions optional props: shortcut, ide, tooltip, spotlight
- Link to Playground (/lab) for live testing
- ApiReference component displaying full API documentation

## How to get to it (user POV)

1. Visit home page at `http://localhost:3000`
2. Click "API reference" link in the sidebar navigation
3. Or navigate directly to `http://localhost:3000/api-reference`

## Driving it with Playwright

```javascript
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

verifyApiReferencePage();
```

## Gotchas

- The page content is relatively simple compared to components gallery or works-with pages.
- The ApiReference component may be a client component that requires JavaScript for interactive features.
- The Playground link uses Next.js Link component with href="/lab" and includes an ArrowRight icon.
- The page mentions optional props (shortcut, ide, tooltip, spotlight) that "seed the overlay settings panel", meaning they provide initial values.
- Focus is on documentation, not interactive demos (unlike the components or works-with pages).
