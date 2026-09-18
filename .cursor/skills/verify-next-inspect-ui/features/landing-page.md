# Landing Page

The home page that explains what next-inspect-ui is, how to install it, and how to use it.

## Sub-features

- Package name and version display
- "What it does" section with feature list
- Installation instructions with npm/pnpm commands
- Usage code examples
- Link to live demo (`/components`)
- Navigation sidebar with links to other sections (shortcuts, source, usage, API reference)

## How to get to it (user POV)

**App**: `site` (port 3000)

1. Visit `http://localhost:3000` (root URL)
2. Or click the logo/home link from any other page

## Driving it with Playwright

```javascript
const { chromium } = require('playwright');

async function verifyLandingPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to landing page...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Verify title
    const title = await page.locator('h1', { hasText: 'next-inspect-ui' }).count();
    if (title === 0) throw new Error('Page title not found');
    
    // Verify version display
    const version = await page.getByText(/v\d+\.\d+\.\d+/).count() > 0;
    if (!version) throw new Error('Version not displayed');
    
    // Capture entry screenshot
    await page.screenshot({
      path: '/tmp/verify-evidence/landing-page-loaded.png',
      fullPage: true
    });
    
    // Verify "What it does" section
    const whatItDoes = await page.locator('h2', { hasText: 'What it does' }).count() > 0;
    if (!whatItDoes) throw new Error('"What it does" section not found');
    
    // Verify Installation section
    const installation = await page.locator('h2', { hasText: 'Installation' }).count() > 0;
    if (!installation) throw new Error('Installation section not found');
    
    // Verify Usage section
    const usage = await page.locator('h2', { hasText: 'Usage' }).count() > 0;
    if (!usage) throw new Error('Usage section not found');
    
    // Verify demo link exists
    const demoLink = await page.getByRole('link', { name: /live demo/i }).count() > 0;
    if (!demoLink) throw new Error('Demo link not found');
    
    console.log('✓ Landing page sections verified');
    
    // Note: Demo link points to /components which doesn't exist on site app (port 3000)
    // Components gallery lives on dashboard app (port 3002)
    // Testing the link will result in 404 - this is a known cross-app navigation issue
    console.log('⚠ Demo link leads to 404 (components are on port 3002, not 3000)');
    
    return true;
    
  } catch (error) {
    console.error('✗ Landing page verification failed:', error);
    await page.screenshot({
      path: '/tmp/verify-evidence/landing-page-error.png',
      fullPage: true
    });
    throw error;
  } finally {
    await browser.close();
  }
}

verifyLandingPage();
```

## Gotchas

- The page includes code blocks with syntax highlighting which may take time to render. Wait for `networkidle`.
- Navigation sidebar is visible on larger screens but may be hidden on mobile viewports.
- Demo link text might vary slightly, use case-insensitive matching with `/live demo/i`.
- The version number is dynamic (from package.json), so don't assert specific version values.
- **Known issue**: The demo link points to `/components` which doesn't exist on the site app (port 3000). The components gallery lives on the dashboard app (port 3002), causing a 404 when clicked from the landing page.
