# Landing Page

Docs home on the **site** app (`pnpm dev`). Explains what next-inspect-ui is, how to install it (shadcn registry), and the inspect comments.

## Sub-features

- h1 `next-inspect-ui` plus `v{semver} · react`
- “What it does” section
- Installation: shadcn `add` commands (npm / pnpm / yarn / bun), not `npm install next-inspect-ui`
- Usage: Activate / Inspect / Open comment tabs
- Left nav: Overview, Usage, Source Code, API Reference, Shortcuts (always visible; Overview is home — there is no logo)
- Footer “Try the live demo →” href `/components` — **404 on site**. Same for dev-only `/test`, `/dashboard`, `/variant-test`

## How to get to it (user POV)

1. `pnpm dev` → `http://localhost:<site-port>/`
2. Or click **Overview** in the left nav from another site docs page

## Driving it with Playwright

Use `SITE_URL` (default `http://localhost:3000`). Doctor first: `/` must be 200, not a 307 to `/test`.

```javascript
await page.goto(process.env.SITE_URL || "http://localhost:3000")
await page.waitForLoadState("networkidle")
await page.locator("h1", { hasText: "next-inspect-ui" }).waitFor()
await page.getByText(/v\d+\.\d+\.\d+/).first().waitFor()
await page.locator("h2", { hasText: "What it does" }).waitFor()
await page.locator("h2", { hasText: "Installation" }).waitFor()
await page.locator("h2", { hasText: "Usage" }).waitFor()
await page.getByRole("link", { name: /live demo/i }).waitFor()
await page.screenshot({ path: "/tmp/verify-evidence/landing-page-loaded.png", fullPage: true })

await page.getByRole("link", { name: /live demo/i }).first().click()
await page.waitForLoadState("networkidle")
// Site has no /components. URL should still be this origin + /components, page is 404.
```

Or: `SITE_URL=… node .cursor/skills/verify-next-inspect-ui/verify-landing-page.js`

## Gotchas

- Do not `waitForURL('**/components')` as success — that route is the **dashboard** app.
- Version comes from `packages/next-inspect-ui/package.json`; do not pin a number.
- `/usage` is a video placeholder; `/source` is “Coming soon”. They are sibling pages, not this feature.
