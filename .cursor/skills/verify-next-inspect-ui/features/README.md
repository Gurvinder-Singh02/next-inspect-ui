# Feature Map

User-facing features for the next-inspect-ui demo website. Each feature file describes what the user sees and how to drive it with Playwright.

## Baseline Preconditions

- All three dev servers running:
  - Site app: `http://localhost:3000` (pnpm run dev)
  - Example app: `http://localhost:3001` (PORT=3001 pnpm dev:example)
  - Dashboard app: `http://localhost:3002` (PORT=3002 pnpm dev:dashboard)
- Playwright installed and chromium browser available
- Evidence directory exists: `/tmp/verify-evidence/`
- Servers passed doctor checks

## Driving Conventions

- Use Playwright with chromium in headless mode by default
- Navigate via `page.goto()` with `waitForLoadState('networkidle')`
- Prefer ARIA selectors, `data-testid`, or visible text over CSS selectors
- Capture screenshots before and after state changes
- Save console logs when errors occur
- Use descriptive filenames for evidence: `<feature>-<state>.png`

## Proof Reporting

Each feature verification should produce:

1. **Entry screenshot**: Feature page loaded, before interaction
2. **Interaction proof**: Screenshot or log showing the action was performed
3. **Exit screenshot**: Final state after interaction
4. **Console log**: If any errors/warnings, save to `<feature>-console.log`

## Skip Conditions

Skip a feature verification if:
- Server fails doctor check
- Required dependency (Playwright) not installed and installation fails
- Previous feature in dependency chain failed (document dependencies in feature files)

## Mapped Features

1. [Landing Page](./landing-page.md) - Home page on site app (port 3000)
2. [Shortcuts Documentation](./shortcuts-documentation.md) - Keyboard shortcuts page on site app (port 3000)
3. [Components Demo Gallery](./components-demo-gallery.md) - Showcase page on dashboard app (port 3002)
4. [Accuracy Test Suite](./accuracy-test-suite.md) - Test page on example app (port 3001)
5. [InspectUI Overlay Toggle](./inspect-overlay-toggle.md) - Activating overlay with ⌥X (works on any app, test on site:3000)

Features 1-4 are page load verifications. Feature 5 requires browser automation of keyboard shortcuts.

## Multi-App Architecture

This monorepo has three Next.js apps, each hosting different routes:

- **site** (port 3000): `/`, `/shortcuts`, `/walkthrough`, `/works-with`, `/api-reference`
- **next-js-example** (port 3001): `/test` (dev-only accuracy test suite)
- **shadcn-dashboard-001-example** (port 3002): `/components` (component gallery)

Start multiple servers with PORT env var: `PORT=3001 pnpm dev:example`
