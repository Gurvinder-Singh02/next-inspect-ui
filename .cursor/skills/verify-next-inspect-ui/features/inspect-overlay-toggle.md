# InspectUI Overlay Toggle

Activate inspect mode with ⌥/Alt+X, hover to see source, Esc to leave. Works on **site**, **example**, and **dashboard** — each mounts `<InspectUI />` in development.

## Sub-features

- Default shortcut Alt+X (`code: "KeyX"`, `altKey`)
- Active = `document.body.style.cursor === "crosshair"` (no `data-inspect-active`, no `inspect` class on `html`/`body`)
- Overlay and tooltip nodes exist after mount with `display: none` until hover while active
- Markers: `[data-dev-inspector-overlay]`, `[data-dev-inspector-tooltip]`
- Esc or Alt+X again deactivates
- `window.__inspectUI.inspect` probes a node; it does **not** toggle mode

## How to get to it (user POV)

1. Open any page on site, example `/test`, or dashboard `/components`
2. Press ⌥+X
3. Hover an element — spotlight + tooltip
4. Esc to leave

## Driving it with Playwright

Headless Alt chord is unreliable. Dispatch the event. Prefer dashboard `/components` or site `/` after that app’s doctor.

```javascript
await page.waitForFunction(
  () => !!document.querySelector("[data-dev-inspector-overlay]") && !!window.__inspectUI
)
await page.evaluate(() =>
  document.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "x",
      code: "KeyX",
      altKey: true,
      bubbles: true,
      cancelable: true,
    })
  )
)
await page.waitForFunction(() => document.body.style.cursor === "crosshair")
await page.locator("h1, main button, [data-slot='card']").first().hover()
await page.waitForFunction(() => {
  const o = document.querySelector("[data-dev-inspector-overlay]")
  const t = document.querySelector("[data-dev-inspector-tooltip]")
  return o && t && getComputedStyle(o).display !== "none" && getComputedStyle(t).display !== "none"
})
await page.keyboard.press("Escape")
await page.waitForFunction(() => document.body.style.cursor !== "crosshair")
```

`[class*="inspect"]` is a false positive (`next-inspect-ui-overlay` is always on the node).

## Gotchas

- Overlay visible ≠ mode on. Mode on ≠ overlay visible. Need both cursor and hover.
- Dev only (`NODE_ENV=development`).
- Do not drive this on site `/components` — that URL 404s.
