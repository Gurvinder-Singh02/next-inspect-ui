# next-inspect-ui verification map

This directory is the maintained source for verifying the overlay the way a user uses it. Read this index, then the matching feature file.

## Baseline preconditions

- Launch with `./.cursor/skills/verify-next-inspect-ui/bin/launch`. Default URL is `http://127.0.0.1:4173`.
- Run `./.cursor/skills/verify-next-inspect-ui/bin/doctor` and require `/` and `/test` both 200, owned by the recorded PID.
- Set `AGENT_BROWSER_SESSION=verify-next-inspect-ui`.
- Never drive port 3000 or any server this run did not start.
- Inspect mode starts off. Press `Alt+x` after the page hydrates (`wait --load networkidle`, then a short wait).
- Do not click inspected elements and do not press Enter while inspect is on. Those open the editor via `cursor://file...` and unload the page.

## Driving conventions

- Start every recipe from the baseline unless the feature file says otherwise.
- Prefer the `data-dev-inspector-*` and `data-inspect-host` attributes, accessible names, and visible text from this repo.
- Treat every `agent-browser` command as literal.
- Restore inspect-off with `Escape` between features when leftover crosshair would confuse the next recipe.
- Keep proof artifacts. Cleanup removes only `.run/`.

## Proof and skip reporting

- Capture the keypress or hover and the resulting overlay or log, not only the last screenshot.
- UI proof is a screenshot where the overlay or debug panel is visible, plus an `eval` JSON of cursor, overlay display, tooltip text, and log text.
- Record the feature id and the URL used with every artifact.
- Report an unreachable path with the command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph of user-visible behavior. Then exactly four H2 sections, in this order.

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with agent-browser`
4. `Gotchas`

## Features

- [Inspect mode](./inspect-mode.md) covers ⌥X, Escape, and the debug panel.
- [Hover inspect](./hover-inspect.md) covers the spotlight and tooltip after a hover.
- [Climb](./climb.md) covers holding ⌥ to walk the owner chain.
- [Info panel](./info-panel.md) covers `I` for used/defined/tree/CSS.
- [Source-open fixtures](./source-open-fixtures.md) covers `/test/source-open/*` and AutoRunner scoring.
