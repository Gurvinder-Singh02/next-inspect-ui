---
name: verify-next-inspect-ui
description: >-
  Verify InspectUI hover, editor opening, keyboard navigation, and tree
  previews in a real browser; capture evidence for UI changes. Use when
  verifying inspector interactions, accuracy-suite results, marketing usage
  tabs, or shortcut docs against flow.md.
---

# Verify Next Inspect UI

## 1. Read the expected behavior

Read the repository root `flow.md` before testing inspector interactions. It is the source of truth for controls, source resolution, previews, and editor opening. This skill describes how to verify that behavior, rather than repeating the flow.

For fixture failures or exact source-line changes, also use `match-expected-case`. Preserve expected locations unless the fixture's intended source changed; a resolver regression needs a resolver fix.

Done when the changed behavior and its expected result are identified.

## 2. Choose and launch the surface

Run commands from the repository root, found from the current workspace or `git rev-parse --show-toplevel`. Check the current `package.json` scripts and app port configuration.

| Surface | Command | Default URL |
|---|---|---|
| Marketing site | `bun run dev` | `http://localhost:3000/` |
| Next.js accuracy suite | `bun run dev:test-next-js` | `http://localhost:3001/test` |
| Dashboard / component demo | `bun run dev:nextjs` | `http://localhost:3102/components` |
| All compatibility suites | `bun run dev:test` | Ports 3001, 3002, 5173, 5174 at `/test` |

The site does not host `/test` or `/components`. Use the URL printed by the selected server if its configured port differs.

Reuse a suitable running server. Record any server/session started for this verification so cleanup can stop only owned processes. Install dependencies only if missing. Rebuild with `bun run build` when testing library source changes through built package exports; documentation-only edits need no build.

Wait for the ready message, navigate to the intended route, and wait for a specific page element. Capture `pageerror` and relevant console/network failures. Prefer DOM readiness and explicit selectors over `networkidle` on development servers. Doctor the route with a successful page load before driving interactions; after a failed drive, doctor again or relaunch rather than continuing on a wedged state.

Done when the selected route loads without a blocking runtime error.

## 3. Verify the affected interactions

Use Playwright with real mouse and keyboard events for user interactions. The repository already declares Playwright dependencies. Install its browser only if unavailable.

Select checks relevant to the change:

- **Hover:** press `Alt+X`, then move onto a known fixture. Assert the visible `[data-dev-inspector-overlay]` bounds and `[data-dev-inspector-tooltip]` label match the actual element. Include a nested child or SVG part when changing hit testing. Confirm icons and button children are not promoted to a parent unless `flow.md` says so.
- **Climb:** hold Alt on a fixture with an owning component. Assert the selected source and icon match `flow.md`; release Alt and check the host returns. Include plain HTML without a climb owner. Shift must not climb.
- **Tree:** press Space, check `[data-dev-inspector-info]` is visible, and test its Component / Element tabs, row order, selection, title, and source label against `flow.md`. Confirm Space pins the hovered target and Up / Down do not adopt a new hover target.
- **Navigation:** exercise the affected control-table shortcuts from `flow.md` (closed vs open arrows, `[` / `{` parent, `]` / `}` child, ⌘↑ / ⌘↓ first/last when open). Check the resulting selection, including closing-tag rows when relevant. If `/shortcuts` lists a control absent from `flow.md`, report the mismatch; do not treat the page as the source of truth.
- **Preview:** select another tree row and check the separate ghost highlight. Confirm the original tooltip stays pinned. Check that opening the previewed row’s source preserves the intended hovered target. Switching tabs or closing the panel clears the preview.
- **Close:** Space closes the popover; Escape exits inspection. Verify the relevant overlay elements become hidden.
- **Opening:** intercept the final editor endpoint request or editor URL assignment and assert file, line, and column. Leave resolution and input handlers intact. State that the editor launch was intercepted; open a real editor only when requested.
- **Accuracy suite:** use the existing Test / Run all controls, open Logs, and inspect expected/result entries. Report failures rather than treating a rendered page as a passing suite. Check compatibility apps when the change affects React versions or build tools.

Activate inspection with the keyboard rather than an internal setter. `window.__inspectUI.inspect` may diagnose source resolution, but a probe result alone does not verify hover, shortcuts, or editor opening.

Use stable fixture IDs, ARIA roles, visible labels, or existing inspector data attributes. Click the page body first so Alt+X reaches the document. In Playwright, `keyboard.press('Alt+KeyX')` is a reliable chord when separate down/up presses miss. Assert overlay or tooltip after hovering; activating the tool alone need not show an overlay. Prefer `textContent` or computed style for `[data-dev-inspector-tooltip]` because it is `aria-hidden` and Playwright text matchers can read it as empty. The dashboard demo may load InspectUI through `/inspect-ui.js` instead of the React component. If headless keyboard input fails, diagnose focus or retry headed mode rather than bypassing the interaction.

Done when each selected action has an assertion for its observable result.

## 4. Save evidence and clean up

Create `/tmp/verify-evidence/` before taking screenshots. Save descriptive before/after screenshots and relevant failure logs there. Preserve evidence after cleanup.

Close the verification browser. Stop only servers started for this run, using their recorded sessions/PIDs. Leave reused servers running. Confirm owned servers stopped; an unrelated process occupying a port is not permission to kill it.

Report what passed, what failed or was not tested, and the evidence paths. Distinguish source-file accuracy, exact-line accuracy, intercepted editor opening, and actual editor launch.

## Optional benchmark checks

For broad source or open-file comparisons, read `docs/source-benchmarks.md` and the source-benchmark section of `flow.md`. The benchmark checkout is separate from this repository; inspect `scripts/benchmark-checkout.ts` for its location and overrides.

`bun run scripts/verify-exact-hover.ts` delegates to that checkout's hover verification. `bun run benchmark:open` exercises hover/click and Option-click with intercepted editor requests. Use either only when the checkout is available and the requested change warrants benchmark coverage. Neither replaces testing the affected site or accuracy-suite interaction.

## Helpers

`features/README.md` lists short surface checklists. Run `bun .cursor/skills/verify-next-inspect-ui/verify-landing-page.js` for home-page usage checks (`SITE_URL` overrides the URL). Optional `launch-server.sh [dev-script]` and `cleanup-server.sh` manage only the recorded verification process group. Reuse existing servers through the main workflow instead.
