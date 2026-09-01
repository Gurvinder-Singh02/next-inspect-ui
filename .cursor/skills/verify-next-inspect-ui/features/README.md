# Feature Map

User-facing features for next-inspect-ui demo surfaces. Each file describes what the user sees and how to drive it with Playwright.

## Baseline Preconditions

Three apps, three doctor checks — not one server on `:3000` for everything.

- Playwright Chromium available (`unset PLAYWRIGHT_BROWSERS_PATH` if the sandbox cache is empty)
- Evidence directory: `/tmp/verify-evidence/`
- **Site** (`pnpm dev`): `/` 200, `/shortcuts` 200, `/test` and `/components` **404**
- **Example** (`pnpm dev:example`): `/test` 200 with **Run all**
- **Dashboard** (`pnpm dev:dashboard`): `/components` 200 with **Inspect Components**

Use `PORT` when 3000 is already taken. Typical all-features layout: site 3000, example 3001, dashboard 3002.

## Driving Conventions

- Playwright Chromium, headless by default
- Overlay: dispatch Alt+X, assert `body` cursor `crosshair`, then hover; wait for `[data-dev-inspector-overlay]` `display !== none`
- Capture screenshots before/after; names `<feature>-<state>.png`

## Proof Reporting

1. **Entry screenshot**: page loaded
2. **Interaction proof**: action + resulting state
3. **Exit screenshot** when state changed
4. **Console log** only if errors

## Skip Conditions

- That app’s doctor failed
- Playwright install failed
- A documented prerequisite is missing (record `verified-unreachable`)

## Mapped Features

1. [Landing Page](./landing-page.md) — site `/` (docs home). Demo/test footer hrefs 404 on this app.
2. [Shortcuts Documentation](./shortcuts-documentation.md) — site `/shortcuts`
3. [InspectUI Overlay Toggle](./inspect-overlay-toggle.md) — Alt+X on any app that mounts `<InspectUI />`
4. [Components Demo Gallery](./components-demo-gallery.md) — dashboard `/components` (`pnpm dev:dashboard`)
5. [Accuracy Test Suite](./accuracy-test-suite.md) — example `/test` (`pnpm dev:example`), **Run all**

Features 1–2 and 4 are page loads on the matching app. Feature 3 needs keyboard (or a dispatched `keydown`). Feature 5 is scored by **Run all** / **Test**, not by hover.
