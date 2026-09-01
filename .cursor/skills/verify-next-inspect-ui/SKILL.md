---
name: verify-next-inspect-ui
description: Launch next-inspect-ui demo website, verify InspectUI overlay interactions, capture evidence, and clean up
---

# verify-next-inspect-ui

Verification skill for next-inspect-ui surfaces. The overlay lets developers hover any element to see its source file, click to open it, and hold ⌥ to climb to the component that rendered it.

Surfaces:

- `pnpm dev` — `site` marketing (port 3000)
- `pnpm dev:example` — `apps/nextjs-example` dashboard and `/components`
- `pnpm dev:test` — `apps/next-js-test` accuracy suite at `/test`

## When to use this skill

Use when you need to:
- Verify changes to the InspectUI overlay functionality
- Test user-facing features like hover inspection, keyboard shortcuts, or component climbing
- Capture proof that demo pages render correctly
- Validate that the test suite accuracy cases work as expected

## Launch

### Build dependencies
First ensure the npm packages are built:

```bash
cd /workspace
pnpm install
pnpm run build  # builds next-inspect-ui
```

### Start dev server

```bash
cd /workspace
pnpm run dev
```

This runs `pnpm --filter site dev`, starting the marketing site on port 3000.

Use `pnpm dev:example` for the dashboard and `pnpm dev:test` for `/test`. Assign other ports with `PORT=3001` when more than one app is running.

**Ready signal**: Look for `✓ Ready in` followed by the local URL.

**No auth required**. No seed data needed.

### Teardown

Kill the process started by `pnpm run dev`. If launched via PID:

```bash
kill <PID>
```

If running in a named tmux session, kill that session. Always verify the port is freed before declaring cleanup complete.

## Doctor

Health check after launch, before driving any features. All checks are read-only.

### 1. Server responding

```bash
curl -I http://localhost:3000
```

Expect `200 OK` or `304 Not Modified`.

### 2. Home page loads

```bash
curl -s http://localhost:3000 | grep -q "next-inspect-ui"
```

Should contain the package name in the title or header.

### 3. Site does not host /test or /components

```bash
curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/test
curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/components
```

Expect `404` on the site. Those routes live on `next-js-test` and `nextjs-example`.

**If any check fails**, do not proceed to Drive. Fix or report the issue.

## Drive

Use Playwright to drive real browser interactions. Install if needed:

```bash
cd /workspace
pnpm add -D -w playwright @playwright/test
pnpm exec playwright install chromium
```

### Driving conventions

- **Selectors**: Prefer `data-testid`, ARIA roles/labels, or visible text. Avoid brittle CSS selectors.
- **Wait for navigation**: Use `page.waitForLoadState('networkidle')` or specific element visibility.
- **Screenshots**: Capture before/after states for evidence.
- **Console logs**: Listen to `page.on('console')` to catch errors.

### Example: Navigate to components demo

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/components');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot as proof
  await page.screenshot({ path: '/tmp/verify-evidence/components-loaded.png', fullPage: true });
  
  await browser.close();
})();
```

### Example: Verify InspectUI overlay toggles

The InspectUI overlay is toggled with `⌥ + X`. In Playwright, simulate this:

```javascript
await page.keyboard.down('Alt');
await page.keyboard.press('KeyX');
await page.keyboard.up('Alt');

// Wait for overlay to appear (check for specific class or element)
await page.waitForSelector('[data-inspect-active="true"]', { timeout: 3000 });
```

**Note**: Keyboard shortcuts can be finicky in headless browsers. If the overlay doesn't toggle, consider using browser context with `--headed` mode or programmatically triggering the overlay state if there's a JS hook.

### Example: Hover and inspect an element

```javascript
// Assuming overlay is active
const button = page.locator('button', { hasText: 'Send code' }).first();
await button.hover();

// The InspectUI tooltip should appear showing source file info
// Capture screenshot
await page.screenshot({ path: '/tmp/verify-evidence/hover-inspect.png' });
```

## Evidence

All evidence must survive cleanup. Store artifacts in:

```
/tmp/verify-evidence/
```

Or under the skill directory:

```
/workspace/.cursor/skills/verify-next-inspect-ui/artifacts/
```

### What to capture

1. **Screenshots**: Before/after states for UI changes. Use descriptive names like `components-page-loaded.png`, `overlay-activated.png`.
2. **Console logs**: Save to `.log` files if errors or warnings occur.
3. **Network captures**: If testing API routes or data fetching, save HAR files or response bodies.
4. **DOM snapshots**: For complex interactions, save HTML snapshots with `page.content()`.

### Proof standards

- **Real user path**: Navigate like a human, don't use internal setters or test hooks to cheat state.
- **Action + resulting state**: Show the action taken (e.g., "pressed ⌥X") and the resulting state (overlay visible).
- **Observable proof**: Screenshots or logs that clearly show the feature working.
- **No implementation internals**: Evidence should be about what the user sees, not internal variables or logs that agents wouldn't see.

## Cleanup

**Must never delete proof artifacts**.

### Kill dev server

If PID was captured:

```bash
kill <PID>
wait <PID> 2>/dev/null || true
```

If running in tmux:

```bash
tmux kill-session -t dev-server
```

### Verify port is free

```bash
! lsof -i :3000
```

### Leave evidence intact

Do NOT run:

```bash
rm -rf /tmp/verify-evidence  # WRONG
```

Evidence must persist for review.

## Helpers

### `launch-server.sh`

```bash
#!/usr/bin/env bash
# Launch dev server and wait for ready signal

cd /workspace
pnpm run dev > /tmp/dev-server.log 2>&1 &
PID=$!
echo $PID > /tmp/dev-server.pid

# Wait for ready signal
timeout 30 bash -c '
  while ! grep -q "Ready in" /tmp/dev-server.log 2>/dev/null; do
    sleep 0.5
  done
'

if grep -q "Ready in" /tmp/dev-server.log; then
  echo "Server ready on http://localhost:3000 (PID $PID)"
  exit 0
else
  echo "Server failed to start"
  cat /tmp/dev-server.log
  exit 1
fi
```

**Invocation**:

```bash
bash /workspace/.cursor/skills/verify-next-inspect-ui/launch-server.sh
```

### `cleanup-server.sh`

```bash
#!/usr/bin/env bash
# Kill dev server and verify port is free

if [ -f /tmp/dev-server.pid ]; then
  PID=$(cat /tmp/dev-server.pid)
  if kill -0 $PID 2>/dev/null; then
    kill $PID
    wait $PID 2>/dev/null || true
    echo "Killed PID $PID"
  fi
  rm /tmp/dev-server.pid
fi

# Verify port is free
if lsof -i :3000 >/dev/null 2>&1; then
  echo "WARNING: Port 3000 still in use"
  exit 1
else
  echo "Port 3000 is free"
fi
```

**Invocation**:

```bash
bash /workspace/.cursor/skills/verify-next-inspect-ui/cleanup-server.sh
```

### `verify-feature.js`

Playwright script template for feature verification:

```javascript
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EVIDENCE_DIR = '/tmp/verify-evidence';

async function main() {
  // Ensure evidence directory exists
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navigating to feature page...');
    // Replace with actual feature URL
    await page.goto('http://localhost:3000/components');
    await page.waitForLoadState('networkidle');

    console.log('Feature loaded, capturing screenshot...');
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, 'feature-loaded.png'),
      fullPage: true
    });

    console.log('Performing feature interaction...');
    // Add feature-specific interactions here

    console.log('Capturing final state...');
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, 'feature-complete.png'),
      fullPage: true
    });

    console.log('✓ Feature verification complete');
    console.log(`Evidence saved to ${EVIDENCE_DIR}`);
  } catch (error) {
    console.error('✗ Feature verification failed:', error);
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, 'error.png'),
      fullPage: true
    });
    throw error;
  } finally {
    await browser.close();
  }
}

main();
```

**Invocation**:

```bash
node /workspace/.cursor/skills/verify-next-inspect-ui/verify-feature.js
```
