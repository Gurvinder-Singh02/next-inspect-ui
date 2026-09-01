# Components Demo Gallery

Inspectable card grid on the **dashboard** app (`pnpm dev:dashboard`), route `/components`.

## Sub-features

- Header: “Inspect Components Press ⌥ + x to open the inspector”
- Responsive grid: 1 column mobile, 3 columns `md+`
- Cards include StyleOverview (visible title **Vega**, not “Style Overview”), **Traffic channels** (not “Revenue”), typography, invoice, waveform, etc.

## How to get to it (user POV)

1. `pnpm dev:dashboard` (use `PORT` if 3000 is taken)
2. Open `http://localhost:<dashboard-port>/components`
3. Site footer “Try the live demo →” does **not** get you here — it 404s on `site`

## Driving it with Playwright

```javascript
await page.goto(`${dashboardUrl}/components`)
await page.waitForLoadState("networkidle")
await page.getByText(/Press.*⌥.*x.*inspector/i).waitFor()
await page.getByText("Vega").waitFor()
await page.getByText("Traffic channels").waitFor()
await page.screenshot({ path: "/tmp/verify-evidence/components-gallery-loaded.png", fullPage: true })
```

Do not assert “Style Overview” or “Revenue”.

## Gotchas

- LiveWaveform animates; screenshots will differ frame to frame.
- Dashboard `/` is the admin dashboard, not this gallery.
