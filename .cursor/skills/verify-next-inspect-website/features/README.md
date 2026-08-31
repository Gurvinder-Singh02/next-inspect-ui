# next-inspect-website verification map

This directory is the maintained source for verifying user-facing behavior of next-inspect-website. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch with `.cursor/skills/verify-next-inspect-website/bin/launch`. The instance is `http://127.0.0.1:4173`.
- Run `.cursor/skills/verify-next-inspect-website/bin/doctor` and require `dev-fixtures: /test 200`.
- Set `AGENT_BROWSER_SESSION` with `agent-browser session id --scope worktree --prefix verify-next-inspect-website`.
- Root layout mounts `<InspectUI debug verify />` from `next-inspect-ui-debug/inspect` in development. The Debug panel at the bottom-left is the inspect-mode oracle.
- Never drive `localhost:3000` or any instance this run did not start.

## Driving conventions

- Start every recipe from the baseline unless its preconditions say otherwise.
- Prefer ARIA roles, accessible names, and `data-dev-inspector-*` / `data-algo-runner` attributes over DOM position.
- Treat every command as literal.
- Run browser actions through `agent-browser` in the named session.
- Overlay, tooltip, and I panel are `aria-hidden`. Screenshot plus `eval` are required for those nodes. The Debug panel is visible to `snapshot` while open.
- Restore inspect mode to off (`Escape`) after a mutation recipe. Do not remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- Overlay proof includes a screenshot with the Debug panel visible and an `eval` of `[data-dev-inspector-overlay]` / tooltip text.
- AutoRunner proof includes the `N/N matched` line and a screenshot of the fixture page.
- Record the feature ID and entry-point URL with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with agent-browser` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Source-open scoring](./source-open.md) covers the `/test/source-open` fixture matrix and AutoRunner `run`.
- [Inspect mode](./inspect-mode.md) covers Alt+X toggle, hover tooltip, Escape exit, and the Debug log.
- [Climb](./climb.md) covers holding Option to climb from a host to the usage site.
- [Info panel](./info-panel.md) covers pressing I on a hovered element.
- [Docs site](./docs-site.md) covers Overview, Usage, Source Code, API Reference, and Shortcuts.
