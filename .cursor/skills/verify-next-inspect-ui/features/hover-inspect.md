# Hover inspect

Hover inspect shows the hovered node's DOM tag and author source in a tooltip, with a dashed spotlight on the element. Click would open that line in the editor. This recipe stops at hover.

## Sub-features

- `hover-spotlight` paints `[data-dev-inspector-overlay]` over the target.
- `hover-tooltip` fills `[data-dev-inspector-tooltip-front]` with a tag and a file label.
- `hover-log` appends a `hover:` line to the debug panel.
- `hover-components-demo` works on `/components`, the public live demo.
- `hover-fixture` works on a source-open fixture page.

## How to get to it (user POV)

- Press ⌥X, then move the pointer over an element on `/components`.
- Press ⌥X, then hover a labeled fixture on `/test/source-open/composition`.

## Driving it with agent-browser

Preconditions:

- Doctor is green at `http://127.0.0.1:4173`.
- Inspect starts off.
- Do not click the hovered node.

- **Demo entry.** Run `npx --yes agent-browser open "$VERIFY_URL/components"` and wait `networkidle`. The page contains `Inspect Components Press ⌥ + x`.
- **Turn inspect on.** Run `npx --yes agent-browser press Alt+x` then `wait 300`. Cursor is `crosshair`.
- **Hover a card.** Run `npx --yes agent-browser find text "Inspect Components Press ⌥ + x to open the inspector" hover` or hover a visible card title on the grid. Wait 500ms.
- **Read overlay.** Run `npx --yes agent-browser eval '({overlay:document.querySelector("[data-dev-inspector-overlay]")?.style.display,label:document.querySelector("[data-dev-inspector-tooltip-front]")?.textContent,log:document.querySelector("[data-dev-inspector-log]")?.innerText})'`. Overlay `display` is `block`, the label is non-empty, and the log contains a `hover:` line.
- **Fixture entry.** Open `$VERIFY_URL/test/source-open/composition`. Press `Alt+x`. Run `npx --yes agent-browser find text "This paragraph is a child." hover`. Wait 500ms. Tooltip text names this file (`composition/page.tsx` or `composition`) and the log `hover:` line points at that path.
- **Proof.** Save `artifacts/hover-inspect/components.png` and `artifacts/hover-inspect/composition.png` while the spotlight is visible. Save the eval JSON next to each screenshot. Both images must show the tooltip chip, not only the page.

## Gotchas

- First hover after hydrate can take a beat while source maps resolve. Wait for tooltip text, not a fixed 50ms.
- Inspector chrome (`[data-dev-inspector-log]` and the overlay itself) is skipped by hit testing. Hovering the debug panel will not inspect the page.
- A grey or empty tooltip means resolution declined. That is a pass on library-rendered fixtures and a fail on composition's own paragraph.
- Clicking the hovered node is out of bounds for this feature. It navigates to `cursor://file...`.
