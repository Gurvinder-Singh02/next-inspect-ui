# Landing Page

The home page that explains what next-inspect-ui is, how to install it, and how to use it.

## Sub-features

- Package name and version display
- Installation section with npm/pnpm commands
- FAQ section with common questions
- Links to "See it in action" (walkthrough) and API reference
- Navigation sidebar with links to other sections

## How to get to it (user POV)

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
    
    // Verify Installation section
    const installation = await page.locator('h2', { hasText: 'Installation' }).count() > 0;
    if (!installation) throw new Error('Installation section not found');
    
    // Verify FAQ section
    const faq = await page.locator('h2', { hasText: 'FAQ' }).count() > 0;
    if (!faq) throw new Error('FAQ section not found');
    
    // Verify walkthrough link exists
    const walkthroughLink = await page.getByRole('link', { name: /see it in action/i }).count() > 0;
    if (!walkthroughLink) throw new Error('Walkthrough link not found');
    
    // Verify API reference link exists
    const apiLink = await page.getByRole('link', { name: /api reference/i }).count() > 0;
    if (!apiLink) throw new Error('API reference link not found');
    
    console.log('✓ Landing page sections verified');
    
    // Test navigation to walkthrough
    await page.getByRole('link', { name: /see it in action/i }).first().click();
    await page.waitForURL('**/walkthrough');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: '/tmp/verify-evidence/landing-page-walkthrough-navigation.png',
      fullPage: true
    });
    
    console.log('✓ Navigation to walkthrough works');
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
- The "See it in action" link navigates to `/walkthrough`, not to a components demo.
- The version number is dynamic (from package.json), so don't assert specific version values.
