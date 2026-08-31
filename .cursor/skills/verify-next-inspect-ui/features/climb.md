# Climb

Climb answers where a component was used, not where its host DOM was authored. Hold ⌥ after a hover to preview the usage site. ⌥⇧ walks further up the owner chain. Release ⌥ to return to the DOM hover.

## Sub-features

- `climb-hold` shows the usage site in the tooltip while ⌥ is down.
- `climb-stack` adds `[data-dev-inspector-tooltip-under]` chips when a chain exists.
- `climb-shift` walks up one owner with ⌥⇧.
- `climb-release` restores the DOM hover when ⌥ is released.
- `climb-wrapper` stays on an HTML wrapper (overlay may shake) instead of inventing an owner.

## How to get to it (user POV)

- On `/test/source-open/shadcn-host`, hover `Send code`, then hold ⌥. Expected hover is `components/ui/button.tsx`. Expected climb is this fixture file.
- On `/test/source-open/composition`, hover `This paragraph is a child.`, then hold ⌥.

## Driving it with agent-browser

Preconditions:

- Doctor is green.
- Inspect is on.
- Start from a hover that already shows a tooltip. Climb without a hover does nothing.

- **Hover the shadcn button.** Open `$VERIFY_URL/test/source-open/shadcn-host`. Press `Alt+x`. Run `npx --yes agent-browser find text "Send code" hover`. Wait 500ms. Tooltip names `button.tsx`.
- **Hold Option.** Run `npx --yes agent-browser press Alt` (keydown) if the harness supports keydown, otherwise `npx --yes agent-browser eval` that dispatches a `keydown` on `document` with `altKey:true` and `key:"Alt"`. Re-hover `Send code` while alt is considered held, then eval tooltip text and `[data-dev-inspector-tooltip-under]` count. Tooltip path moves from `button.tsx` to `shadcn-host/page.tsx` (or `shadcn-host`).
- **Walk up.** With ⌥ held, run `npx --yes agent-browser press Shift`. The log contains an `⌥` or `⇧ path:` line, or `⇧: top of tree` / `⇧: can't climb` if the chain is already at the top.
- **Release.** Dispatch `keyup` for Alt or press `Escape` then re-enter inspect and hover again. Without ⌥, the tooltip is the DOM author path again.
- **Proof.** Screenshot `artifacts/climb/shadcn-hold.png` while the climb tooltip is visible. Save eval `{label, under: document.querySelectorAll("[data-dev-inspector-tooltip-under]").length, log}` to `artifacts/climb/state.json`.

## Gotchas

- agent-browser `press Alt` may tap rather than hold. If the tooltip never switches, dispatch `keydown`/`keyup` through `eval` on `document` with `altKey` set, then `pointermove` on the target. The inspector reads `event.altKey` from pointer events as well as keyboard.
- HTML wrappers with no owner shake and stay. A stuck tooltip on a `<div>` after ⌥ is not automatically a bug. Read the log for `⌥: HTML wrapper or no owner — can't climb`.
- Release ⌥ resets climb depth. Prove the reset with a second hover, not by assuming the first tooltip is still DOM-mode.
