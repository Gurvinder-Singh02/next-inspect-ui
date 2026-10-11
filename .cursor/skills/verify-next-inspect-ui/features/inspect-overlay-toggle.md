# Overlay toggle

On the accuracy suite or dashboard demo, click the page body, press Alt+X (Playwright `Alt+KeyX` also works), hover a known fixture, and assert `[data-dev-inspector-overlay]` and `[data-dev-inspector-tooltip]` show the expected bounds and label. Read the tooltip with `textContent` because it is `aria-hidden`. Include a second fixture with a nested child or SVG part when hit testing changed. Include plain HTML without an Option climb owner when climb behavior changed.

Press Space and assert `[data-dev-inspector-info]` opens and closes while the hovered target stays pinned. Press Escape and assert the inspector turns off (overlay, tooltip, and info become hidden).

Use real keyboard events. Overlay DOM nodes can exist while inactive; existence alone does not prove activation. Follow `flow.md` for climb icons, tree previews, and navigation. Prefer Vite `/test` when the Next accuracy suite fails doctor.
