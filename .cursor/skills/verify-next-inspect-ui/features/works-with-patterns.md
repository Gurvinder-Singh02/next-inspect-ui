# Works with Patterns

A comprehensive documentation page showcasing the different component patterns that next-inspect-ui can inspect, including HTML, SVG, shadcn, Base UI, Motion, Radix Slot, forwardRef, memo, compound components, and more.

## Sub-features

- Page header with title "Works with"
- Description explaining pattern support
- Multiple pattern sections (11 total), each with:
  - Pattern title
  - Pattern description
  - Live preview component
  - Code snippet with syntax highlighting
- Complete pattern list:
  1. HTML - Native markup authored on the page
  2. SVG - svg and nested hosts like rect
  3. shadcn - Button, variants, and a Button nested in Card
  4. Base UI - useRender hosts like Badge, and nested compound children
  5. Motion - motion.div as a return root, nested motion.div, and motion.rect
  6. Library host - DOM built with createElement instead of JSX
  7. Radix Slot - asChild merges onto the child host
  8. forwardRef, memo, compound - Different fiber shapes
  9. Mapped lists - Elements created in .map() still open the authoring file
  10. Icons - Third-party SVG such as Lucide
  11. Server host - A sync server component that emits DOM
- Caveat: Async Server Components are not inspectable yet

## How to get to it (user POV)

1. Visit home page at `http://localhost:3000`
2. Click "Works with" link in the sidebar navigation
3. Or navigate directly to `http://localhost:3000/works-with`

## Driving it with Playwright

```javascript
const { chromium } = require('playwright');

async function verifyWorksWithPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to works-with page...');
    await page.goto('http://localhost:3000/works-with');
    await page.waitForLoadState('networkidle');
    
    // Verify page title
    const title = await page.locator('h1', { hasText: 'Works with' }).count();
    if (title === 0) throw new Error('Works with page title not found');
    
    // Verify description mentions patterns
    const hasDescription = await page.getByText(/HTML, SVG.*shadcn.*Motion/i).count() > 0;
    if (!hasDescription) throw new Error('Pattern description not found');
    
    // Capture entry screenshot
    await page.screenshot({
      path: '/tmp/verify-evidence/works-with-page-loaded.png',
      fullPage: true
    });
    
    // Verify known pattern sections exist
    const knownPatterns = [
      'HTML',
      'SVG',
      'shadcn',
      'Base UI',
      'Motion',
      'Library host',
      'Radix Slot',
      'forwardRef, memo, compound',
      'Mapped lists',
      'Icons',
      'Server host'
    ];
    
    let foundPatterns = 0;
    for (const pattern of knownPatterns) {
      const found = await page.getByText(pattern, { exact: false }).count() > 0;
      if (found) foundPatterns++;
      console.log(`Pattern "${pattern}": ${found ? '✓' : '✗'}`);
    }
    
    if (foundPatterns < 9) {
      throw new Error(`Only found ${foundPatterns} of ${knownPatterns.length} expected patterns`);
    }
    
    // Verify async Server Components caveat is documented
    const hasCaveat = await page.getByText(/Async Server Components are not inspectable yet/i).count() > 0;
    if (!hasCaveat) {
      console.warn('Warning: Async Server Components caveat not found');
    }
    
    // Final screenshot
    await page.screenshot({
      path: '/tmp/verify-evidence/works-with-page-verified.png',
      fullPage: true
    });
    
    console.log('✓ Works with page verified');
    return true;
    
  } catch (error) {
    console.error('✗ Works with page verification failed:', error);
    await page.screenshot({
      path: '/tmp/verify-evidence/works-with-page-error.png',
      fullPage: true
    });
    throw error;
  } finally {
    await browser.close();
  }
}

verifyWorksWithPage();
```

## Gotchas

- The page includes many code blocks with syntax highlighting which may take extra time to render. Wait for `networkidle`.
- Each pattern section includes a live preview component that requires JavaScript to render.
- The "Server host" section mentions that only sync Server Components are inspectable; async ones are not yet supported.
- Pattern sections use the WorksWithPattern component which combines preview + code.
- Code snippets are pre-highlighted on the server, so they should be visible without JS.
