# Accuracy Test Suite

A comprehensive test page at `/test` that displays various component patterns and edge cases to verify the InspectUI overlay's source resolution accuracy.

## Sub-features

- Test suite shell with title and navigation
- Multiple test groups:
  - basic html snippet
  - svg
  - shadcn
  - base-ui
  - motion
  - library
  - radix
  - kinds (forwardRef, memo, compound)
  - composition (map)
  - third-party (icons)
  - server
  - parent inspectable
- Individual test cases with:
  - Title and description
  - Target component to hover/inspect
  - Expected NODE TREE or targets metadata
- Visual pass/fail indicators (when overlay is active and hovering)

## How to get to it (user POV)

1. Navigate directly to `http://localhost:3001/test` (example app)

**Note**: The test suite is hosted by the `apps/test-next-js` app on port 3001, not the site app on port 3000. Route file is `apps/test-next-js/app/(dev)/test/page.tsx`.

## Driving it with Playwright

```javascript
const { chromium } = require('playwright');

async function verifyTestSuite() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to test suite...');
    await page.goto('http://localhost:3001/test');
    await page.waitForLoadState('networkidle');
    
    // Capture entry screenshot
    await page.screenshot({
      path: '/tmp/verify-evidence/test-suite-loaded.png',
      fullPage: true
    });
    
    // Verify test suite shell exists
    const hasSuiteGroups = await page.locator('[data-suite-group]').count() > 0;
    if (!hasSuiteGroups) {
      // Try alternative: look for known test group titles
      const hasGroups = await page.getByText('basic html snippet').count() > 0;
      if (!hasGroups) throw new Error('Test suite groups not found');
    }
    
    // Verify known test groups exist
    const knownGroups = [
      'basic html snippet',
      'svg',
      'shadcn',
      'base-ui',
      'motion',
      'library',
      'radix',
      'kinds',
      'composition',
      'third-party',
      'server',
      'parent inspectable'
    ];
    
    for (const groupName of knownGroups) {
      const found = await page.getByText(groupName, { exact: false }).count() > 0;
      console.log(`Test group "${groupName}": ${found ? '✓' : '✗'}`);
    }
    
    // Verify individual test cases exist
    const knownCases = [
      'plain heading',
      'plain button',
      'button variants',
      'server component host'
    ];
    
    for (const caseName of knownCases) {
      const found = await page.getByText(caseName, { exact: false }).count() > 0;
      console.log(`Test case "${caseName}": ${found ? '✓' : '✗'}`);
    }
    
    // Scroll to capture more content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.screenshot({
      path: '/tmp/verify-evidence/test-suite-mid-scroll.png',
      fullPage: false
    });
    
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.screenshot({
      path: '/tmp/verify-evidence/test-suite-bottom.png',
      fullPage: false
    });
    
    // Full page screenshot for complete evidence
    await page.screenshot({
      path: '/tmp/verify-evidence/test-suite-verified.png',
      fullPage: true
    });
    
    console.log('✓ Test suite page verified');
    return true;
    
  } catch (error) {
    console.error('✗ Test suite verification failed:', error);
    await page.screenshot({
      path: '/tmp/verify-evidence/test-suite-error.png',
      fullPage: true
    });
    throw error;
  } finally {
    await browser.close();
  }
}

verifyTestSuite();
```

## Gotchas

- This is a dev-only route. It won't be accessible in production builds.
- The page is very long with many test cases. Use `fullPage: true` for complete screenshots or scroll and capture sections.
- Test cases use `data-accuracy-target` attributes for programmatic testing, but these may not be visible in the DOM without inspecting.
- Some test cases involve server components which have SSR-specific behavior.
- The test suite may import fixtures from other files, so build must be complete before this page works correctly.
