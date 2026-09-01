# Shortcuts Documentation

Docs page on the **site** app listing inspect-mode keyboard and pointer controls.

## Sub-features

- h1 **Shortcuts**
- Lead: “Keyboard and pointer controls while inspect mode is active.”
- `ShortcutsReference`: stacked rows of `<Kbd>` (`[data-slot="kbd"]`), a type badge, and a description
- Toggle chord is Lucide Option icon + `x`, not a literal `⌥X` string
- Parent/child nav is `⌘`+`[` and `⌘`+`]`. Info panel key is `i`

## How to get to it (user POV)

1. Site home → left nav **Shortcuts**
2. Or `http://localhost:<site-port>/shortcuts`

## Driving it with Playwright

```javascript
await page.goto(`${siteUrl}/shortcuts`)
await page.waitForLoadState("networkidle")
await page.locator("h1", { hasText: "Shortcuts" }).waitFor()
await page.getByText(/Keyboard and pointer controls/i).waitFor()
const kbd = await page.locator('[data-slot="kbd"]').count()
if (kbd < 3) throw new Error("expected kbd rows")
await page.screenshot({ path: "/tmp/verify-evidence/shortcuts-page-loaded.png", fullPage: true })
```

Do not require `table`, `dl`, `[class*="shortcut"]`, the word “hover”, or Unicode `⌥` in the key column.

## Gotchas

- Rows are bordered `div`s, not a table.
- `⌥` appears in some descriptions; the toggle key column is an SVG Option icon.
