# Source-open scoring

Source-open is the fixture matrix that scores runtime hover resolution against compile-time stamps. A case passes when AutoRunner reports every scored host as a match (grey unscored is allowed where the case says so).

## Sub-features

- `source-index` lists every fixture from `/test/source-open`.
- `source-run` scores every `[data-inspect-host]` on a case via the on-page `run` button.
- `source-match` requires `N/N matched` with no mismatch rows.
- `source-grey` on Base UI allows unscored hosts and forbids red mismatches.
- `source-hover` still shows a tooltip whose file matches the case's expected line.

## How to get to it (user POV)

- Open `/test`, choose `Source-open test`.
- Open `/test/source-open`, then one of:
  - `/test/source-open/shadcn-host`
  - `/test/source-open/base-ui-render`
  - `/test/source-open/server-component`
  - `/test/source-open/motion`
  - `/test/source-open/library-rendered`
  - `/test/source-open/radix`
  - `/test/source-open/component-kinds`
  - `/test/source-open/composition`
  - `/test/source-open/third-party`
- On the case page, choose `run` under `Automated check`.

## Driving it with agent-browser

Preconditions:

- Doctor reports healthy at `http://127.0.0.1:4173`.
- Named `AGENT_BROWSER_SESSION` is set.
- InspectUI has published the on-page verifier (`Automated check` reads `Scores every stamped element against the compiler's record.`, not `Waiting for InspectUI`).

Drive **each** URL in the list above with this recipe. Do not mark the feature verified from a single case.

- **Open case.** Run `agent-browser open http://127.0.0.1:4173/test/source-open/shadcn-host` (replace the path). Wait until `--text "Automated check"` and `--text "expected ·"` are visible. Heading matches the case title (for shadcn-host: `shadcn wrapper host`).
- **Wait until ready.** Wait until `--text "Scores every stamped element"` is visible. If it stays on `Waiting for InspectUI`, the overlay did not mount — fail doctor and relaunch.
- **Run.** Choose `run`. Run `agent-browser find role button click --name "run"`. Wait until `--text "matched"` is visible and the button label is `run` again (not `running…`).
- **Assert score.** For every case except `base-ui-render`, the summary is `N/N matched` with N > 0 and no red mismatch rows. For `base-ui-render`, mismatches must be zero; unscored hosts are expected.
- **Proof.** Run `agent-browser screenshot .cursor/skills/verify-next-inspect-ui/artifacts/source-open/<case-slug>.png` and `agent-browser snapshot > .cursor/skills/verify-next-inspect-ui/artifacts/source-open/<case-slug>.aria.txt`. Both show the case heading, `Automated check`, and the match line.

## Gotchas

- Click `run` on the page. Calling `window.__inspectUIVerify` from eval skips the user path.
- `run` is disabled until InspectUI is ready. Clicking early is a no-op.
- `base-ui-render` has no host stamp. Grey unscored is a pass; red is a fail.
- `library-rendered` must decline rather than invent a project file. A match that points at the page is a fail even if AutoRunner is green — read the case `expected ·` line.
- AutoRunner ignores nodes inside `[data-algo-runner]`. Do not treat the `run` button as a scored host.
- First load of a fresh `.next-verify` distDir compiles slowly. Wait on the ready copy, not a fixed sleep.
