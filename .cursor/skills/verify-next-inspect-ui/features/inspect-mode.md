# Inspect mode

Inspect mode is the on/off switch for the overlay. Off, the page is a normal website. On, the cursor is a crosshair and hover can show the spotlight. The debug panel on this website stays available while `debug` is set, even before inspect is on.

## Sub-features

- `inspect-toggle-on` turns inspect on with the default shortcut.
- `inspect-toggle-off` turns inspect off with the same shortcut.
- `inspect-escape` turns inspect off with Escape.
- `inspect-debug-panel` shows the debug log on load and can hide/show it.

## How to get to it (user POV)

- Press ⌥X (`Alt+x`) on any page of the website.
- Press Escape while inspect is on.
- Press ⌥X again while inspect is on.
- Use the debug panel `Hide` control, then the `Debug` pill to show it again.

## Driving it with agent-browser

Preconditions:

- Doctor reports `http://127.0.0.1:4173` with `/test` 200.
- `AGENT_BROWSER_SESSION=verify-next-inspect-ui`.
- Inspect is off at the start of the recipe.

- **Open docs.** Run `npx --yes agent-browser open "$VERIFY_URL/"`. Wait `networkidle`. The heading `next-inspect-ui` is visible and `[data-dev-inspector-log]` exists.
- **Debug panel on load.** Run `npx --yes agent-browser eval '({log:document.querySelector("[data-dev-inspector-log]")?.innerText,display:document.querySelector("[data-dev-inspector-log]")?.style.display,cursor:document.body.style.cursor})'`. `display` is `flex`, the log contains `debug panel ready`, and cursor is not `crosshair`.
- **Toggle on.** Run `npx --yes agent-browser press Alt+x` then `wait 300`. Eval `document.body.style.cursor` is `crosshair` and the log contains `inspect mode on`. Overlay stays `display:none` until a hover.
- **Toggle off.** Run `npx --yes agent-browser press Alt+x` then `wait 300`. Cursor is no longer `crosshair` and the log contains `inspect mode off`.
- **Escape off.** Press `Alt+x` to turn it on, then `npx --yes agent-browser press Escape`. Cursor is not `crosshair` and the log contains `user pressed escape`.
- **Hide debug panel.** With inspect off, run `npx --yes agent-browser find role button click --name "Hide"`. `[data-dev-inspector-log]` is `display:none` and `[data-dev-inspector-debug-toggle]` is visible.
- **Show debug panel.** Run `npx --yes agent-browser find role button click --name "Show debug panel"`. The log panel is `display:flex` again.
- **Proof.** Save `artifacts/inspect-mode/on.png` after toggle-on and `artifacts/inspect-mode/off.png` after Escape. Write the eval JSON to `artifacts/inspect-mode/state.json`. Both screenshots show the docs heading so the URL is identifiable.

## Gotchas

- Overlay nodes are in the DOM while inspect is off. Presence of `[data-dev-inspector-overlay]` is not proof that inspect is on. Read `document.body.style.cursor` and the log line.
- `window` blur deactivates inspect. If a screenshot looks off, check the log for `inspect mode off` before calling it a product bug.
- The debug panel is only mounted because this website passes `debug`. A consumer app without that prop has no log panel. This recipe is for `next-inspect-website`.
- Shortcut matching uses the physical `KeyX` code. `Alt+x` and `Alt+X` both work. `Alt+KeyX` as a string in eval does not.
