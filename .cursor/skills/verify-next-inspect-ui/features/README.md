# Feature Map

User-facing features for the next-inspect-ui demo website. Each feature file describes what the user sees and how to drive it with Playwright.

## Baseline Preconditions

- Dev server running on `http://localhost:3000`
- Playwright installed and chromium browser available
- Evidence directory exists: `/tmp/verify-evidence/`
- Server passed doctor checks (home page loads, components page accessible)

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

1. [Components Demo Gallery](./components-demo-gallery.md) - Main showcase page with example components
2. [Landing Page](./landing-page.md) - Home page explaining what next-inspect-ui does
3. [Accuracy Test Suite](./accuracy-test-suite.md) - Test page with visual accuracy cases
4. [Shortcuts Documentation](./shortcuts-documentation.md) - Keyboard shortcuts reference page
5. [InspectUI Overlay Toggle](./inspect-overlay-toggle.md) - Activating the overlay with ⌥X (integration test)

Features 1-4 are page load verifications. Feature 5 requires browser automation of keyboard shortcuts.
