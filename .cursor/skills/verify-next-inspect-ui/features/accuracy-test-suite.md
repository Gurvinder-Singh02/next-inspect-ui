# Accuracy Test Suite

`/test` on the **example** app (`pnpm dev:example`). Pins InspectUI source resolution. This is the product accuracy check — not hover-and-eyeball.

## Sub-features

- Shell with **Run all**, per-case **Test**, `[data-suite-group]`
- Groups include: basic html snippet, svg, shadcn, base-ui, motion, library, radix, kinds, composition, third-party, server, parent inspectable
- Each case has expected NODE TREE / targets; probe is `window.__inspectUI.inspect`
- Pass = header `N pass` / `0 fail`, cards **Pass** / 100%

## How to get to it (user POV)

1. `pnpm dev:example`
2. `http://localhost:<example-port>/test` (or `/`, which 307s to `/test`)
3. Site footer **Test →** is a dead `/test` href on the marketing origin

## Driving it with Playwright

```javascript
await page.goto(`${exampleUrl}/test`)
await page.waitForLoadState("networkidle")
await page.locator("[data-suite-group]").first().waitFor()
await page.getByRole("button", { name: /^Run all$/ }).click()
await page.getByRole("button", { name: "Running…" }).waitFor({ timeout: 15000 })
await page.getByRole("button", { name: /^Run all$/ }).waitFor({ timeout: 180000 })
const failText = await page.getByText(/\d+ fail/).first().innerText()
if (Number(failText.replace(/\D/g, "")) !== 0) throw new Error(failText)
await page.screenshot({ path: "/tmp/verify-evidence/test-suite-verified.png", fullPage: true })
```

Known case titles still valid: plain heading, plain button, button variants, server component host, lucide icons.

## Gotchas

- Hover only highlights. Scoring is **Test** / **Run all**.
- `(dev)` in `app/(dev)/test` is a route-group name, not a production gate. Example always redirects `/` → `/test`.
- Site `/test` 404 is the correct site doctor result, not a missing suite.
- Count of cases is `TEST_CASE_META` in `apps/next-js-example/test-cases/cases.ts` (19 as of this map).
