---
name: verify-next-inspect-ui
description: Verify next-inspect-ui in a real browser — inspect-mode hover, source-open AutoRunner scoring, Option-climb, the I info panel, or docs routes on the Next.js website.
---

# Verify next-inspect-ui

Drive the real website overlay the way a user would. Unit tests and `__inspectUIVerify` evals are not a substitute for a feature the map says to click, hover, or key.

The surface is `next-inspect-website` running `next dev`. InspectUI mounts from `next-inspect-ui-debug/inspect` with `debug` and `verify`. Fixture routes under `/test` 404 in production; this skill never uses `next start` or `next build`.

## Launch

```bash
.cursor/skills/verify-next-inspect-ui/bin/launch
```

Starts `next-inspect-website` at `http://127.0.0.1:4173` with `INSPECT_VERIFY_DIST_DIR=.next-verify` so it does not share `.next` with a user server on :3000. The process is double-forked so it survives the agent shell that started it. Ready when the script prints `ready` and exits 0 (`GET /test` is 200).

Teardown is `bin/cleanup`. It kills only the pid this run recorded. It does not delete `artifacts/`.

Do not open `http://localhost:3000` even if it looks healthy. That is the user's session.

## Doctor

```bash
.cursor/skills/verify-next-inspect-ui/bin/doctor
```

Run this first whenever anything looks off. Healthy output includes the URL, a live pid that owns port 4173, and `dev-fixtures: /test 200`. Anything else: stop driving, run `bin/cleanup` if this run started the server, then `bin/launch` again.

## Drive

Install once if needed: `npm i -g agent-browser && agent-browser install`. Then load `agent-browser skills get core --full` before the first command in a session that has not used it.

Every run uses an isolated browser session. Never the default unnamed session:

```bash
export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix verify-next-inspect-ui)"
```

Read `features/README.md`, then the matching feature file. Start from the baseline in that README. Prefer the feature file's handles (`run`, `Send code`, `[data-dev-inspector-log]`, `[data-dev-inspector-overlay]`) over coordinates.

Typical loop:

```bash
agent-browser open http://127.0.0.1:4173/test/source-open/shadcn-host
agent-browser wait --text "Automated check"
agent-browser snapshot -i
agent-browser find role button click --name "run"
```

Refs (`@eN`) go stale after every navigation or overlay toggle. Re-snapshot before the next ref click.

**Overlay chrome is `aria-hidden`.** `[data-dev-inspector-overlay]`, the hover tooltip, and the I panel do not appear in `snapshot`. Prove them with a screenshot plus `eval --stdin` (display / textContent) and the debug log, which is in the accessibility tree while open.

## Evidence

Write proof under `.cursor/skills/verify-next-inspect-ui/artifacts/<feature-id>/`. Keep it after cleanup.

| Kind | Capture |
|---|---|
| Action | snapshot or eval taken *before* the resulting state, plus the command that caused it |
| Overlay / tooltip / I panel | screenshot *and* `eval` of the node (snapshot cannot see them) |
| Debug log | snapshot of `[data-dev-inspector-log]` or `eval` of its text (`inspect mode on`, `hover: …`) |
| AutoRunner | screenshot plus the `N/N matched` line with zero mismatches |
| Docs | snapshot showing the page `h1` and the matching nav link |

Standards:

- Exercise the user path on the running site. Do not call `window.__inspectUIVerify` yourself; click `run` on the fixture page so AutoRunner does.
- Capture the action and the resulting state, not only the last frame.
- A click in inspect mode opens the IDE. Hover and AutoRunner are the proofs unless the feature file is specifically about open-in-editor.
- Record the feature ID and the entry-point URL on every artifact.

## Cleanup

```bash
.cursor/skills/verify-next-inspect-ui/bin/cleanup
```

Stops the :4173 server this run started and closes `AGENT_BROWSER_SESSION` if that env var is set. Does not kill by process name. Does not delete `artifacts/`. After cleanup, confirm the proof files are still on disk.

## Helpers

| Script | When |
|---|---|
| `bin/launch` | start (idempotent if already healthy) |
| `bin/doctor` | read-only health |
| `bin/cleanup` | tear down this run's server and browser session |

All three live in `.cursor/skills/verify-next-inspect-ui/bin/` and are executable. Source of shared constants: `bin/common`.
