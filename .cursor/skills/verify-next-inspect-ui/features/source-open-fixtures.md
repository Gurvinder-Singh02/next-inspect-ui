# Source-open fixtures

The `/test/source-open` routes are the live resolution matrix. Each page states the bug it reproduces and the expected hover. The debug panel scores hover against `data-inspect-host`. AutoRunner walks every stamped node and prints `matched` / `mismatch`.

## Sub-features

- `fixture-index` lists every case from `/test/source-open`.
- `fixture-hover-score` stays green on a case's expected host path.
- `fixture-autorunner` uses the on-page `run` button to score every `[data-inspect-host]`.
- `fixture-grey` on Base UI hosts is unscored, not red.
- `fixture-library` declines rather than inventing a project file.

## How to get to it (user POV)

- Open `/test`, choose `Source-open test`.
- Open a case URL under `/test/source-open/...`.
- Press ⌥X and hover each fixture, or click `run` on Automated check.

Case index (every URL is an entry point):

- `/test/source-open/shadcn-host`
- `/test/source-open/base-ui-render`
- `/test/source-open/server-component`
- `/test/source-open/motion`
- `/test/source-open/library-rendered`
- `/test/source-open/radix`
- `/test/source-open/component-kinds`
- `/test/source-open/composition`
- `/test/source-open/third-party`

## Driving it with agent-browser

Preconditions:

- Doctor is green. `/test` 200 means this is the dev server, not `next start`.
- The page shows `Automated check` and eventually enables `run` (`window.__inspectUIVerify` is published only with the `verify` prop, which this website sets).

- **Index.** Open `$VERIFY_URL/test/source-open`. The heading is `Source-open test` and each case title from the list above is a link.
- **Composition autorun.** Open `$VERIFY_URL/test/source-open/composition`. Wait until the `run` button is not disabled (eval `!document.querySelector("[data-algo-runner] button")?.disabled`). Run `npx --yes agent-browser find role button click --name run`. Wait until the runner text matches `/\d+\/\d+ matched/`. Zero mismatches. Unscored count may be non-zero.
- **Composition hover.** Press `Alt+x`. Hover `This paragraph is a child.` Overlay border is green (`#22c55e` family) or the log `match` line is green and not `mismatch`. Expected path is this fixture file.
- **shadcn-host.** Open `/test/source-open/shadcn-host`. Hover `Send code`. Tooltip names `button.tsx`. Click `run`. No mismatch rows.
- **Base UI.** Open `/test/source-open/base-ui-render`. Click `run`. Failures listed as mismatch are a fail. Grey / unscored hosts are the expected outcome for nodes with no host stamp.
- **Library-rendered.** Open `/test/source-open/library-rendered`. Hover the fixture. Resolution declines (no invented page path). `run` has no mismatch that claims a project file for the library node.
- **Remaining cases.** Repeat `run` on server-component, motion, radix, component-kinds, and third-party. Record each URL. A skip is only allowed when the page did not load. It is not allowed because another case already passed.
- **Proof.** For each case driven, save `artifacts/source-open-fixtures/<slug>.png` after `run` (tally visible) and `artifacts/source-open-fixtures/<slug>.json` with `{url, tally, mismatches: [...]}` from eval of `[data-algo-runner]`.

## Gotchas

- `/test/*` is `notFound()` when `NODE_ENV === "production"`. A 404 means you launched `next start` or a production build.
- AutoRunner ignores nodes inside `[data-algo-runner]`. That is deliberate.
- Calling `window.__inspectUIVerify` from eval skips the user control. Click `run`.
- `run` stays disabled until InspectUI hydrates. Wait for the button, not a fixed sleep after `networkidle`.
- Base UI's `useRender` hosts have no stamp. Scoring them red is a regression. Scoring them grey is the contract.
