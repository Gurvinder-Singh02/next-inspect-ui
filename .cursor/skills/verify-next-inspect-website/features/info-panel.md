# Info panel

The info panel is the I-key details view on a hovered element: used / defined sources, the node tree, and CSS. It stays up until I is pressed again or inspect mode ends.

## Sub-features

- `info-open` opens the panel from a hovered host with I.
- `info-tree` shows the `Node tree` section (`[data-dev-inspector-owner-tree]`).
- `info-close` hides the panel when I is pressed again on the same host.
- `info-blocks-click` does not open the editor while the panel is visible.

## How to get to it (user POV)

- Turn inspect mode on, hover an element, press I.
- Press I again on the same element to close.
- Escape exits inspect mode and closes the panel.

## Driving it with agent-browser

Preconditions:

- Doctor reports healthy at `http://127.0.0.1:4173`.
- Named `AGENT_BROWSER_SESSION` is set.
- Inspect mode is on and a host is hovered.

- **Open the shadcn case.** Run `agent-browser open http://127.0.0.1:4173/test/source-open/shadcn-host`. Wait until `--text "Send code"` is visible. Press `Alt+x` if needed.
- **Hover.** Run `agent-browser find role button hover --name "Send code"`. Overlay is visible.
- **Open panel.** Run `agent-browser press i`. Debug log gains `user opened info · dom`. Eval: the second `[data-dev-inspector-tooltip]` (the info node) has `display` other than `none`. It contains `Node tree` (`[data-dev-inspector-owner-tree]`).
- **Proof.** Screenshot `./.cursor/skills/verify-next-inspect-website/artifacts/info-panel/open.png` showing the panel over the button. Eval panel text into `./.cursor/skills/verify-next-inspect-website/artifacts/info-panel/open.eval.txt`.
- **Close.** Run `agent-browser press i` again. Debug log gains `user closed info`. Info node `display` is `none`. Inspect mode remains on.

## Gotchas

- I does nothing unless a host is hovered. Pressing I on an empty page is not a fail of the panel.
- The info node reuses `data-dev-inspector-tooltip`. Query `display` and `Node tree` text, not a unique data attribute on the panel root.
- The panel is `aria-hidden`. Snapshot will miss it; screenshot plus eval are required.
- While the panel is open, clicks are swallowed (they do not open the editor). That is expected.
