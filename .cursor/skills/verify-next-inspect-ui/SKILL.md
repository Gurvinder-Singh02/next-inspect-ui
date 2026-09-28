---
name: verify-next-inspect-ui
description: Launch next-inspect-ui demo website, verify InspectUI overlay interactions, capture evidence, and clean up
---

# verify-next-inspect-ui

Verification skill for next-inspect-ui surfaces. The overlay lets developers hover any element to see its source file, click to open it, and hold ⌥ to climb to the component that rendered it.

Surfaces across three apps:

- `pnpm dev` — `site` marketing (port 3000): `/`, `/shortcuts`, `/walkthrough`, `/works-with`, `/api-reference`
- `pnpm dev:example` — `next-js-example` (port 3001): `/test` accuracy suite
- `pnpm dev:dashboard` — `shadcn-dashboard-001-example` (port 3002): `/components` gallery

Each app defaults to port 3000. Run multiple servers concurrently using `PORT=<port>` env var.

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

### Start dev servers

For site app (port 3000):
```bash
cd /workspace
pnpm run dev
```

For example app (port 3001):
```bash
cd /workspace
PORT=3001 pnpm dev:example
```

For dashboard app (port 3002):
```bash
cd /workspace
PORT=3002 pnpm dev:dashboard
```

To verify all features, all three servers must be running concurrently on their respective ports.

**Ready signal**: Look for `✓ Ready in` followed by the local URL.

**No auth required**. No seed data needed.

### Teardown

Kill all three dev server processes. If launched via PIDs:

```bash
kill <SITE_PID> <EXAMPLE_PID> <DASHBOARD_PID>
```

If running in tmux sessions, kill those sessions. Always verify all ports (3000, 3001, 3002) are freed before declaring cleanup complete.

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

### 3. Site does not host /test or /components (expect 404)

```bash
curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/test
curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/components
```

Expect `404` on the site. Those routes live on other apps.

### 4. Example app hosts /test

```bash
curl -I http://localhost:3001/test
```

Expect `200 OK`.

### 5. Dashboard app hosts /components

```bash
curl -I http://localhost:3002/components
```

Expect `200 OK`.

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
  
  await page.goto('http://localhost:3002/components');
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

// Wait for overlay to appear (check for data-dev-inspector-overlay attribute)
await page.waitForSelector('[data-dev-inspector-overlay]', { timeout: 3000 });
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

### Feature verification scripts

All scripts require dev servers to be running and passing doctor checks. Ensure `/tmp/verify-evidence/` directory exists before running.

#### `verify-landing-page.js`

Verifies site home page (Installation/Usage/FAQ sections) and navigation to `/walkthrough`.

**Invocation**:

```bash
node /workspace/.cursor/skills/verify-next-inspect-ui/verify-landing-page.js
```

#### `verify-shortcuts-documentation.js`

Verifies keyboard shortcuts reference page at `/shortcuts`.

**Invocation**:

```bash
node /workspace/.cursor/skills/verify-next-inspect-ui/verify-shortcuts-documentation.js
```

#### `verify-components-demo-gallery.js`

Verifies dashboard components showcase at `:3002/components` with Traffic channels example.

**Invocation**:

```bash
node /workspace/.cursor/skills/verify-next-inspect-ui/verify-components-demo-gallery.js
```

#### `verify-accuracy-test-suite.js`

Verifies example app test suite at `:3001/test` including all test groups (basic html, svg, shadcn, motion, server).

**Invocation**:

```bash
node /workspace/.cursor/skills/verify-next-inspect-ui/verify-accuracy-test-suite.js
```

#### `verify-inspect-overlay-toggle.js`

Verifies InspectUI overlay activation/deactivation with Alt+X keyboard shortcut and hover interactions.

**Invocation**:

```bash
node /workspace/.cursor/skills/verify-next-inspect-ui/verify-inspect-overlay-toggle.js
```

#### `verify-works-with-patterns.js`

Verifies pattern showcase page at `/works-with` documenting supported component patterns (HTML, shadcn, Motion, Server host).

**Invocation**:

```bash
node /workspace/.cursor/skills/verify-next-inspect-ui/verify-works-with-patterns.js
```

#### `verify-api-reference.js`

Verifies API documentation page at `/api-reference` including projectRoot prop and Playground link.

**Invocation**:

```bash
node /workspace/.cursor/skills/verify-next-inspect-ui/verify-api-reference.js
```
