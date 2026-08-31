# Inspect mode

Inspect mode is the overlay a developer toggles on a running Next.js page: hover shows the DOM tag and source file, the Debug log records the toggle, and Escape turns it off.

## Sub-features

- `inspect-toggle` turns inspect mode on and off with Alt+X.
- `inspect-hover` shows the spotlight and tooltip for a hovered host.
- `inspect-log` writes `inspect mode on` / `hover:` lines into the Debug panel.
- `inspect-esc` exits inspect mode without leaving the page.

## How to get to it (user POV)

- Open `/components` (public demo) and press Alt+X.
- Open any `/test/source-open/*` fixture and press Alt+X.
- Default shortcut is Alt+X (Option+X on macOS). It is configurable; verification uses the default.

## Driving it with agent-browser

Preconditions:

- Doctor reports healthy at `http://127.0.0.1:4173`.
- Named `AGENT_BROWSER_SESSION` is set.
- Inspect mode is off (no crosshair; overlay `display` is `none`).

- **Open demo.** Open the public component gallery. Run `agent-browser open http://127.0.0.1:4173/components`. Wait until `--text "Inspect Components"` is visible. The Debug panel (`[data-dev-inspector-log]`) is on screen and contains `debug panel ready`.
- **Toggle on.** Focus the page and press the shortcut. Run `agent-browser press Alt+x`. Debug log gains `inspect mode on`. Cursor is crosshair.
- **Hover a host.** Hover a visible control. Run `agent-browser find role button hover --name "Send code"` on `/test/source-open/shadcn-host`, or hover any labeled card control on `/components` via snapshot ref. Overlay `[data-dev-inspector-overlay]` `display` is `block`. Tooltip `[data-dev-inspector-tooltip-front]` shows a DOM tag such as `<button>` and a source path. Debug log gains a `hover: <…> ; …` line.
- **Capture on-state.** Run `agent-browser screenshot .cursor/skills/verify-next-inspect-ui/artifacts/inspect-mode/hover.png` and `agent-browser snapshot > .cursor/skills/verify-next-inspect-ui/artifacts/inspect-mode/hover.aria.txt`. Eval overlay display and tooltip text into `hover.eval.txt`.
- **Exit.** Press Escape. Run `agent-browser press Escape`. Overlay `display` is `none`. Debug log gains `user pressed escape`. Page URL is unchanged.

## Gotchas

- Overlay and tooltip are `aria-hidden`. A snapshot without a screenshot or eval does not prove hover.
- `window` blur deactivates inspect mode. Keep the agent-browser tab focused; do not switch to another window mid-recipe.
- Click while inspect mode is on opens the file in the configured editor. Hover only unless the recipe is specifically about open-in-editor.
- Shortcut matching uses physical `KeyX`. Send `Alt+x`, not a layout-specific character.
- `/components` is a dense gallery. `/test/source-open/shadcn-host` is the calmer hover target if the gallery fights the pointer.
