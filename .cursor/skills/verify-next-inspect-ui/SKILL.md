---
name: verify-next-inspect-ui
description: Drive the next-inspect-ui overlay on the local website the way a user does. Use when proving inspect mode, hover tooltips, Option climb, the info panel, or source-open fixture scoring, and when a change needs live evidence rather than unit tests.
---

# Verify next-inspect-ui

The product is a **dev-only overlay**. Users install `next-inspect-ui`, mount `<InspectUI />` in a Next.js layout, press ⌥X, and hover. This skill drives that overlay on `next-inspect-website` in development, where root layout already mounts the debug overlay with `debug` and `verify`.

Unit tests under `next-inspect-ui-npm/src/**/*.test.ts` and `prod-test/measure.mjs` are not this skill. They do not prove hover, climb, or the debug panel.

Read `features/README.md`, then the matching feature file. Drive every listed entry point for that feature. A proof that uses one convenient page is incomplete when the map lists others.

## Launch

Helpers live in this skill's `bin/`. They record the PID they start and refuse to hijack a server they did not start. The usual `pnpm dev` on port 3000 is the operator's session. Do not drive it.

```bash
./.cursor/skills/verify-next-inspect-ui/bin/launch
```

Default bind is `http://127.0.0.1:4173`. Override with `VERIFY_PORT`. Ready means `GET /test` returns 200 (the `(dev)` route group 404s in production). The helper rebuilds `next-inspect-ui` and `next-inspect-ui-debug` first. The website loads those packages from `dist/`, so a source-only change is invisible until that build.

Teardown is `bin/cleanup`. It kills the recorded PID tree. It leaves `artifacts/` in place.

## Doctor

Run this first whenever the instance looks wrong, and again before driving.

```bash
./.cursor/skills/verify-next-inspect-ui/bin/doctor
```

Pass requires all of:

- `$SKILL/.run/pid` exists and that process is alive
- that process (or a child) owns `VERIFY_PORT`
- `GET http://127.0.0.1:$PORT/` is 200
- `GET http://127.0.0.1:$PORT/test` is 200

Fail means launch again. Do not fall back to port 3000.

## Drive

Harness is `agent-browser` via `npx`. This repo already uses it that way. Isolate the session from any other browser the operator has open.

```bash
export AGENT_BROWSER_SESSION=verify-next-inspect-ui
export VERIFY_URL="$(cat .cursor/skills/verify-next-inspect-ui/.run/url)"
npx --yes agent-browser open "$VERIFY_URL/"
npx --yes agent-browser wait --load networkidle
```

If `agent-browser` is missing Chrome, run `npx --yes agent-browser install` once.

Stable handles (use these, not coordinates):

| What | Handle |
|---|---|
| Spotlight | `[data-dev-inspector-overlay]` |
| Tooltip | `[data-dev-inspector-tooltip]` |
| Tooltip label | `[data-dev-inspector-tooltip-front]` |
| Climb stack chip | `[data-dev-inspector-tooltip-under]` |
| Info tree | `[data-dev-inspector-owner-tree]` |
| Debug panel | `[data-dev-inspector-log]` |
| Debug show button | `[data-dev-inspector-debug-toggle]` (`aria-label` "Show debug panel") |
| Debug hide | `role=button` name `Hide` inside the log panel |
| Host stamp | `[data-inspect-host]` |
| AutoRunner | `[data-algo-runner]` |
| AutoRunner run | `role=button` name `run` |

Inspect mode starts **off**. Overlay nodes exist after hydrate, with `display:none`, until ⌥X then a hover.

```bash
npx --yes agent-browser press Alt+x
npx --yes agent-browser wait 300
npx --yes agent-browser find text "This paragraph is a child." hover
npx --yes agent-browser eval '({cursor:document.body.style.cursor,overlay:document.querySelector("[data-dev-inspector-overlay]")?.style.display,tooltip:document.querySelector("[data-dev-inspector-tooltip-front]")?.textContent,log:document.querySelector("[data-dev-inspector-log]")?.innerText,stamps:document.querySelectorAll("[data-inspect-host]").length})'
```

Inspect on means `document.body.style.cursor === "crosshair"` and the debug log contains `inspect mode on`. Hover means overlay `display` is `block` and the tooltip label is non-empty.

Do not click a hovered element, and do not press Enter, while inspect is on. Click and Enter set `window.location` to a `cursor://file...` URL and leave the page. Hover, keyboard nav, and the AutoRunner `run` button are the safe paths. The `run` button is inspector chrome, so the click handler ignores it.

`window` blur turns inspect off. Keep the agent-browser session focused. A screenshot that shows no overlay after a focus change is not a product failure.

Close the browser when the recipe is done, before cleanup:

```bash
npx --yes agent-browser close
```

## Evidence

Write proof under `.cursor/skills/verify-next-inspect-ui/artifacts/<feature-id>/`. Cleanup must not touch that tree.

Every proof includes:

1. The action (screenshot or eval before/during)
2. The resulting state (screenshot plus `agent-browser eval` JSON)
3. The feature id and the entry point URL in the eval payload or a `meta.txt`

Standards:

- Drive the overlay the user drives. AutoRunner is a user-facing control on fixture pages, not a test-only hook. `window.__inspectUIVerify` is what that button calls. Clicking `run` is in bounds. Calling the function from eval to skip the button is not.
- Overlay, tooltip, debug log, and AutoRunner tally are the oracles. A green screenshot without the matching eval is incomplete.
- Click-to-open-editor is a side effect on `window.location`. Prove it only when a feature file asks, and capture the attempted URL with eval rather than following it.
- Unit tests and `prod-test` gzip numbers are extra, not a substitute.

## Cleanup

```bash
./.cursor/skills/verify-next-inspect-ui/bin/cleanup
```

Kills the PID tree recorded at launch. Removes `.run/`. Leaves `artifacts/` alone. After cleanup, confirm the proof files still exist.

## Helpers

All three are executable. Run them from the repo root.

| Command | Does |
|---|---|
| `./.cursor/skills/verify-next-inspect-ui/bin/launch` | Build both packages, start the website on `VERIFY_PORT` (default 4173), write `.run/pid` and `.run/url` |
| `./.cursor/skills/verify-next-inspect-ui/bin/doctor` | Confirm that instance still owns the port and serves `/` plus `/test` |
| `./.cursor/skills/verify-next-inspect-ui/bin/cleanup` | Kill that PID tree, delete `.run/` |

Env: `VERIFY_PORT` (default `4173`), `VERIFY_HOST` (default `127.0.0.1`).
