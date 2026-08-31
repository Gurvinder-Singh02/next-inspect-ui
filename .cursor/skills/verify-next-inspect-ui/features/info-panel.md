# Info panel

The info panel is the `I` overlay. It shows used/defined sources, a short owner tree, and CSS. It opens from a current hover and closes with `I` again or by leaving inspect.

## Sub-features

- `info-open` opens the panel from a hover with `I`.
- `info-tree` renders `[data-dev-inspector-owner-tree]` when parents exist.
- `info-close` hides the panel with a second `I`.
- `info-no-hover` does nothing when there is no hovered element.

## How to get to it (user POV)

- Press ⌥X, hover a fixture or demo element, press `I`.
- Press `I` again to close.

## Driving it with agent-browser

Preconditions:

- Doctor is green.
- Inspect is on and a tooltip is already showing.

- **Hover.** Open `$VERIFY_URL/test/source-open/composition`. Press `Alt+x`. Hover `This paragraph is a child.` Wait until the tooltip is visible.
- **Open.** Run `npx --yes agent-browser press i`. Wait 300ms. Eval `document.querySelector("[data-dev-inspector-owner-tree]")` is non-null or the info node (`[data-dev-inspector-tooltip]` besides the hover chip, the `info` panel in the DOM) is `display` other than `none`. The log contains `user opened info`.
- **Close.** Run `npx --yes agent-browser press i` again. The log contains `user closed info` and the tree is gone or the info node is `display:none`.
- **No hover.** Press Escape, press `Alt+x`, press `I` without hovering. No info panel appears.
- **Proof.** Screenshot `artifacts/info-panel/open.png` while the panel is visible. Save eval `{log, tree: !!document.querySelector("[data-dev-inspector-owner-tree]")}` to `artifacts/info-panel/state.json`.

## Gotchas

- `I` is ignored when nothing is hovered. Toggle-on alone is not enough.
- The hover tooltip and the info panel both use `data-dev-inspector-tooltip`. Prefer `[data-dev-inspector-owner-tree]` and the log line to tell them apart.
- Info panel source rows are clickable and open the editor. Do not click those links in this recipe.
