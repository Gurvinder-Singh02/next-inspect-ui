# next-inspect-ui 0.3 publish-fix plan

Consumers of `next-inspect-ui` get an honest install and a tiny production shim. Maintainers get a debug package that installs from npm and a resolver that exists in one place. The program forbids publishing until each PR below is green. Order is PR-docs, PR-publish, PR-tests, PR-measure, PR-lib, PR-stamp, PR-export, PR-unfork, PR-stamps.

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how-to. The appendices explain and record.

The program runs `pstack/skills/poteto-mode/playbooks/autopilot-stack.md`. Guri reviews and lands every PR. No owner merges.

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] State the protocol and this plan to the operator, then stop. Start execution only on her explicit go.
- [ ] On her go, arm a `/goal` with this exact text. "docs/inspect-ui-03-fix-plan.md. PR ids in order PR-docs PR-publish PR-tests PR-measure PR-lib PR-stamp PR-export PR-unfork PR-stamps. Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Guri merges. Done when PR-stamps is STACK-READY and she lands the stack."
- [ ] Read these from trunk at program start. Re-read them at every tick.
  - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/autopilot-stack.md`
  - [ ] `git show origin/main:pstack/skills/swarm/SKILL.md`
  - [ ] `git show origin/main:pstack/skills/control-ui/SKILL.md`
  - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/opening-a-pr.md`
  - [ ] `git show origin/main:pstack/skills/technical-writing/SKILL.md`
  - [ ] `git show origin/main:pstack/skills/unslop/SKILL.md`
- [ ] Arm the 30-minute audit tick. In a local session, a real terminal `/loop`. In a cloud root, a cloud-sleeper wake chain. Never leave the cadence to memory.
- [ ] Use this tick prompt, verbatim. "Re-read the execution playbook from trunk and the armed /goal. Audit the operation against both and fix drift in this tick. Probe every active lane and judge progress by side effects only. Stand down a stuck lane and dispatch its replacement now. Then send the operator a status message, whether or not anything changed, with the queue table of PR, owner, state, and head SHA, the verdicts since the last tick, what merged, open operator gates, and blockers."
- [ ] On the operator's hold or stand-down, send every owner a zero-writes order at once.

### Spawn owners

- [ ] Spawn one owner per PR with the full lifecycle the execution playbook names.
- [ ] Follow this dependency graph. Start dependent work only after its parent merges, or base it on the parent branch when the execution playbook stacks.
  - [ ] PR-docs, PR-publish, and PR-tests are independent and first. All three branch from `main`.
  - [ ] PR-measure after PR-publish.
  - [ ] PR-lib after PR-measure.
  - [ ] PR-stamp after PR-lib.
  - [ ] PR-export after PR-tests.
  - [ ] PR-unfork after PR-export.
  - [ ] PR-stamps after PR-unfork.
- [ ] Hold the file boundaries. PR-docs touches only markdown and comments. PR-publish touches only manifests and `scripts/`. PR-tests touches only `*.test.ts`. PR-measure touches `prod-test/` and the measured table in `publish.md`. PR-lib touches only `next-inspect-ui-npm/tsup.config.ts`. PR-stamp touches the debug stamper. PR-export touches the public exports map and one barrel. PR-unfork touches `debug-inspector.tsx`. PR-stamps touches `overlay/resolve.ts` and the public overlay call sites.
- [ ] Hold the review gate. PR-unfork and PR-stamps change an interaction. They wait for the operator's review in chat with screenshots and a video before merge.

### PR mechanics, for every PR

- [ ] Open the PR ready, never draft, with `gh pr create` and `draft: false`, or with Graphite `gt` for a stack.
- [ ] Run the repo's lint and typecheck once before the PR-facing push. Push with hooks on.
- [ ] Run `/deslop` before each commit and `/no-comments` before review.
- [ ] Triage every Bugbot and security-reviewer comment per `../references/bugbot-triage.md`.
- [ ] Rebase onto current trunk before babysit and again before the merge-ready report.

### Verdict and merge, for every PR

- [ ] At the merge-ready head SHA, run the swarm per `pstack/skills/swarm/SKILL.md`. One gates lane. The ten live lanes from the PR's **Verify, live** block. The perf lane from its **Verify, perf** block. One audit lane that reads the diff and the receipts and distrusts the PR body.
- [ ] Clean only when every lane is `PASS`. Findings go back to the owner. A new head gets a fresh swarm and a fresh verdict.
- [ ] The root appends the PR to the Graphite stack. Guri lands it. Patch-id must match the verdict SHA per `playbooks/shipping.md`.

### Boot recipe, for every live lane

Each live lane runs on its own cloud VM at the PR head. Drive through `control-ui` or `control-cli` from `cursor-team-kit`.

- [ ] `git fetch origin <head-branch> && git checkout <head SHA>`.
- [ ] Run `pnpm install --no-frozen-lockfile`. For overlay PRs, run `pnpm --filter next-inspect-ui build && pnpm --filter next-inspect-ui-debug build && pnpm --filter next-inspect-website dev` and wait for the local URL. For pack PRs, stay in the shell.
- [ ] Deliver input only through the control skill's commands. Name the read-only diagnostics. Use `control-ui` on the website. Use `control-cli` on `npm pack`, `node --test`, and `rg`.
- [ ] Save every screenshot to `/tmp/swarm-<pr-id>/worker-<n>/<slug>.png` and return the paths with the report.

## Tell the true install story (PR-docs)

**Depends on.** None.

**Files.**

- [ ] Edit `next-inspect-ui-npm/README.md`.
- [ ] Edit `next-inspect-ui-debug/README.md`.
- [ ] Edit `next-inspect-ui-debug/src/with-inspect-ui.ts`.
- [ ] Edit `next-inspect-ui-npm/src/lib/inspector-stamp.ts`.
- [ ] Edit `publish.md`.

**Build.**

- [ ] State that public `InspectUI` never reads stamps. Exact hover needs `InspectUI` from `next-inspect-ui-debug/inspect`.
- [ ] Delete P6 lines that `require` `next-inspect-ui/plugin` or `next-inspect-ui/babel-stamp`.
- [ ] Fix the `withInspectUI` header and the stamp-reader comment that claims one package owns both ends.

**You see.**

- [ ] `rg "next-inspect-ui/plugin" publish.md next-inspect-ui-npm` prints nothing.
- [ ] The public README still shows the `NODE_ENV` gate and does not say the stamper makes public hover exact.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] No new test file. Run `rg -n "exact|plugin|babel-stamp" next-inspect-ui-npm/README.md next-inspect-ui-debug/README.md publish.md` and keep the log.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Open `next-inspect-ui-npm/README.md`. Save `readme-public.png`. Pass when the layout snippet gates on `NODE_ENV` and names only `projectRoot`.
- [ ] Lane 2. Scroll the debug section of that README. Save `readme-public-debug.png`. Pass when it says exact hover lives in `next-inspect-ui-debug/inspect`.
- [ ] Lane 3. Open `next-inspect-ui-debug/README.md`. Save `readme-debug.png`. Pass when the layout import is `next-inspect-ui-debug/inspect`.
- [ ] Lane 4. Read the `withInspectUI` block in that README. Save `readme-debug-plugin.png`. Pass when it does not claim public `InspectUI` reads stamps.
- [ ] Lane 5. Open `publish.md` P6. Save `publish-p6.png`. Pass when P6 names `next-inspect-ui-debug` exports only.
- [ ] Lane 6. Open the public site install section in the running website. Save `site-install.png`. Pass when the snippet matches the public README.
- [ ] Lane 7. Open the site API section. Save `site-api.png`. Pass when public props list only `projectRoot`.
- [ ] Lane 8. Grep `with-inspect-ui.ts` for the old "hover and click-to-open read" claim. Save `wrapper-doc.png`. Pass when that sentence is gone or names the debug overlay.
- [ ] Lane 9. Grep `inspector-stamp.ts` for "changes in one place". Save `stamp-comment.png`. Pass when the comment no longer claims one package owns writer and reader.
- [ ] Lane 10. Load `/` on the website in production-mode copy if available, else the README table. Save `docs-no-plugin-export.png`. Pass when no page tells a user to import `next-inspect-ui/plugin`.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Public README byte length.
- [ ] Probe. `wc -c next-inspect-ui-npm/README.md` at trunk and at the head, interleaved.
- [ ] Baseline. Record the trunk byte count first.
- [ ] Rule. Head may grow. Fail if the file shrinks by more than half, which means the install snippet was deleted.

**Review gate.** None. PR-docs is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends the PR to the Graphite stack and the operator lands it.

## Make debug publish-safe (PR-publish)

**Depends on.** None.

**Files.**

- [ ] Edit `next-inspect-ui-debug/package.json`.
- [ ] Edit `package.json`.
- [ ] Create `scripts/check-debug-tarball.mjs`.

**Build.**

- [ ] Set the debug runtime dep to `workspace:^0.3.0` so `pnpm publish` writes `^0.3.0`.
- [ ] Add a root `release:debug` script that runs `pnpm publish` from `next-inspect-ui-debug`.
- [ ] Add `scripts/check-debug-tarball.mjs` that packs the debug package and fails if the packed `package.json` contains `workspace:`.

**You see.**

- [ ] `node scripts/check-debug-tarball.mjs` exits 0 after a local pack.
- [ ] The packed debug manifest lists `next-inspect-ui` as `^0.3.0` or another semver range, never `workspace:*`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `scripts/check-debug-tarball.mjs` is the check. Run `node scripts/check-debug-tarball.mjs`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Open `next-inspect-ui-debug/package.json`. Save `debug-manifest.png`. Pass when the `next-inspect-ui` dep is `workspace:^0.3.0`.
- [ ] Lane 2. Open root `package.json` scripts. Save `release-script.png`. Pass when `release:debug` contains `pnpm publish`.
- [ ] Lane 3. Run `node scripts/check-debug-tarball.mjs`. Save `tarball-check.png`. Pass when the process exits 0.
- [ ] Lane 4. Open the packed debug `package.json` inside the tarball. Save `packed-manifest.png`. Pass when it has no `workspace:` string.
- [ ] Lane 5. Confirm `prepublishOnly` still runs `npm run build`. Save `prepublish.png`. Pass when that script exists.
- [ ] Lane 6. Run `pnpm --filter next-inspect-ui-debug typecheck`. Save `debug-typecheck.png`. Pass when typecheck exits 0.
- [ ] Lane 7. Run `pnpm --filter next-inspect-ui-debug test`. Save `debug-test.png`. Pass when tests exit 0.
- [ ] Lane 8. Grep `publish.md` is out of scope. Save `publish-untouched.png`. Pass when this PR diff excludes `publish.md` unless a one-line release command was added in a later PR.
- [ ] Lane 9. Show `pnpm why next-inspect-ui` from `next-inspect-ui-debug`. Save `why-dep.png`. Pass when the workspace link still resolves locally.
- [ ] Lane 10. Confirm website `pnpm --filter next-inspect-website typecheck` still passes. Save `web-typecheck.png`. Pass when typecheck exits 0.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Packed debug tarball size.
- [ ] Probe. `npm pack --dry-run` in `next-inspect-ui-debug` at trunk and at the head, interleaved.
- [ ] Baseline. Record the trunk pack byte estimate first. If trunk pack fails on empty `dist`, build once on trunk first.
- [ ] Rule. Head pack size may change after a build. Fail if the packed manifest still contains `workspace:`.

**Review gate.** None. PR-publish is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends the PR to the Graphite stack and the operator lands it.

## Add resolver behavior tests (PR-tests)

**Depends on.** None.

**Files.**

- [ ] Create `next-inspect-ui-npm/src/lib/inspector-stamp.test.ts`.
- [ ] Create `next-inspect-ui-npm/src/overlay/resolve.vlq.test.ts`.

**Build.**

- [ ] Add `parseStampValue` cases for a normal path, a path that contains a colon, and a bad string.
- [ ] Add `decodeVlq` cases for a known source-map segment.
- [ ] Leave `helpers.pin.test.ts` in place. Do not treat it as the suite.

**You see.**

- [ ] `pnpm --filter next-inspect-ui test` prints the new case names and exits 0.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `inspector-stamp.test.ts` and `resolve.vlq.test.ts`. Run `pnpm --filter next-inspect-ui test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Run the public test script. Save `npm-test.png`. Pass when both new files appear in the output.
- [ ] Lane 2. Open `inspector-stamp.test.ts`. Save `stamp-cases.png`. Pass when a colon-in-path case exists.
- [ ] Lane 3. Fail the colon-in-path case on purpose in a scratch edit, run tests, then revert. Save `stamp-red.png`. Pass when the scratch run failed for that case.
- [ ] Lane 4. Open `resolve.vlq.test.ts`. Save `vlq-cases.png`. Pass when a numeric expectation exists.
- [ ] Lane 5. Run `helpers.pin.test.ts` only. Save `pin-still.png`. Pass when the pin test still passes.
- [ ] Lane 6. Run `pnpm --filter next-inspect-ui typecheck`. Save `npm-typecheck.png`. Pass when typecheck exits 0.
- [ ] Lane 7. Confirm debug tests still pass. Save `debug-tests-untouched.png`. Pass when `pnpm --filter next-inspect-ui-debug test` exits 0.
- [ ] Lane 8. Grep for `TODO` in the new tests. Save `no-todo.png`. Pass when there is no `TODO`.
- [ ] Lane 9. Show that `parseStampValue` is imported from `./inspector-stamp`, not copied. Save `import-reader.png`. Pass when the test file imports the production function.
- [ ] Lane 10. Show that `decodeVlq` is imported from `overlay/resolve.ts`. Save `import-vlq.png`. Pass when the test file imports the production function.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Public test suite wall time.
- [ ] Probe. `pnpm --filter next-inspect-ui test` at trunk and at the head, interleaved.
- [ ] Baseline. Record the trunk elapsed ms first.
- [ ] Rule. Fail if head takes more than 3 times the trunk time.

**Review gate.** None. PR-tests is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends the PR to the Graphite stack and the operator lands it.

## Refresh the production measure (PR-measure)

**Depends on.** PR-publish.

**Files.**

- [ ] Edit `prod-test/measure.mjs`.
- [ ] Edit `publish.md`.

**Build.**

- [ ] Change `SENTINELS` so every string still exists in the public overlay or `/lib` path the scenario imports.
- [ ] Add a layout that imports `next-inspect-ui/lib` and a scenario P4 for that layout.
- [ ] Drop `"inspect mode on"` unless a scenario mounts the debug overlay.
- [ ] Rebuild both packages. Run `pnpm --filter prod-test measure`. Write the new table into `publish.md`.

**You see.**

- [ ] Measure prints a P4 row. P1 client gzip delta stays near +0.2 KB or the new number is written in `publish.md`.
- [ ] P1 still reports no path leak.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] No Jest file. The harness is `prod-test/measure.mjs`. Run `pnpm --filter prod-test measure`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Open `measure.mjs` `SENTINELS`. Save `sentinels.png`. Pass when `"inspect mode on"` is gone or a debug scenario owns it.
- [ ] Lane 2. Open the P4 layout source in `measure.mjs`. Save `p4-layout.png`. Pass when it imports `next-inspect-ui/lib`.
- [ ] Lane 3. Run measure and wait for P0. Save `measure-p0.png`. Pass when P0 is the baseline and did not fail the build.
- [ ] Lane 4. Wait for P1. Save `measure-p1.png`. Pass when P1 path leak is `no`.
- [ ] Lane 5. Wait for P2. Save `measure-p2.png`. Pass when P2 path leak is `LEAKED`.
- [ ] Lane 6. Wait for P3. Save `measure-p3.png`. Pass when P3 builds.
- [ ] Lane 7. Wait for P4. Save `measure-p4.png`. Pass when P4 prints a client gzip delta.
- [ ] Lane 8. Open the new table in `publish.md`. Save `publish-table.png`. Pass when the table matches the measure printout.
- [ ] Lane 9. Confirm P1 sentinels are not a tautology. Save `p1-sentinel-reason.png`. Pass when at least one remaining sentinel string exists in `dev-inspector.tsx`.
- [ ] Lane 10. Confirm `layout.jsx` is restored to the gated layout after measure. Save `layout-restored.png`. Pass when `prod-test/app/layout.jsx` still gates `InspectUI`.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. P1 client gzip delta vs P0.
- [ ] Probe. `pnpm --filter prod-test measure` at trunk and at the head, interleaved.
- [ ] Baseline. Record the trunk P1 gzip delta first. If trunk dist is empty, build both packages on trunk first.
- [ ] Rule. Fail if head P1 gzip delta is more than +1.0 KB.

**Review gate.** None. PR-measure is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends the PR to the Graphite stack and the operator lands it.

## Stop stamping use client on lib (PR-lib)

**Depends on.** PR-measure.

**Files.**

- [ ] Edit `next-inspect-ui-npm/tsup.config.ts`.

**Build.**

- [ ] Split the tsup config into two entries. Keep the `"use client"` banner on `index` only.
- [ ] Leave `lib` without that banner.

**You see.**

- [ ] After `pnpm --filter next-inspect-ui build`, `dist/lib.js` does not start with `"use client"`.
- [ ] `dist/index.js` still starts with `"use client"`.
- [ ] P4 gzip delta in a fresh measure is written next to the PR-measure number.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] No new test file. Run `pnpm --filter next-inspect-ui build` and `head -n 2 next-inspect-ui-npm/dist/lib.js next-inspect-ui-npm/dist/index.js`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Open `tsup.config.ts`. Save `tsup-split.png`. Pass when the banner lives only on the index config.
- [ ] Lane 2. Open `dist/index.js`. Save `dist-index.png`. Pass when the first line is `"use client"`.
- [ ] Lane 3. Open `dist/lib.js`. Save `dist-lib.png`. Pass when the first line is not `"use client"`.
- [ ] Lane 4. Run public tests. Save `lib-tests.png`. Pass when tests exit 0.
- [ ] Lane 5. Run public typecheck. Save `lib-typecheck.png`. Pass when typecheck exits 0.
- [ ] Lane 6. Start the website and open `/variant-test` if that route exists, else the settings toolbar in a `(dev)` fixture. Save `toolbar.png`. Pass when the toolbar still changes spotlight color.
- [ ] Lane 7. Hover a host on a `(dev)` fixture. Save `hover-after-lib.png`. Pass when a tooltip still appears.
- [ ] Lane 8. Run measure P4 only if the harness allows it, else full measure. Save `measure-p4-after.png`. Pass when P4 still builds.
- [ ] Lane 9. Confirm website production build. Save `web-build.png`. Pass when `pnpm --filter next-inspect-website build` exits 0.
- [ ] Lane 10. Confirm `next-inspect-ui/lib` still resolves from the website toolbar file. Save `toolbar-import.png`. Pass when the import path is unchanged.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. P4 client gzip delta vs P0.
- [ ] Probe. `pnpm --filter prod-test measure` at the PR-measure SHA and at this head, interleaved.
- [ ] Baseline. Record the PR-measure P4 gzip delta first.
- [ ] Rule. Fail if head P4 gzip delta is more than 2 KB above that baseline.

**Review gate.** None. PR-lib is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends the PR to the Graphite stack and the operator lands it.

## Share stamp attribute names (PR-stamp)

**Depends on.** PR-lib.

**Files.**

- [ ] Edit `next-inspect-ui-debug/src/babel-stamp.ts`.
- [ ] Edit `next-inspect-ui-debug/src/babel-stamp.test.ts`.

**Build.**

- [ ] Import `HOST_STAMP_ATTR` and `OWNER_STAMP_ATTR` from `next-inspect-ui/lib`.
- [ ] Delete `HOST_ATTR` and `OWNER_ATTR` locals.
- [ ] Add a test that the imported strings equal `data-inspect-host` and `data-inspect-owner`.

**You see.**

- [ ] `rg "const HOST_ATTR" next-inspect-ui-debug/src` prints nothing.
- [ ] `pnpm --filter next-inspect-ui-debug test` exits 0.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `babel-stamp.test.ts` gains the shared-name case. Run `pnpm --filter next-inspect-ui-debug test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Open `babel-stamp.ts` imports. Save `stamp-import.png`. Pass when it imports the two attr names from `next-inspect-ui/lib`.
- [ ] Lane 2. Run debug tests. Save `stamp-tests.png`. Pass when tests exit 0.
- [ ] Lane 3. Start the website with `withInspectUI`. Open a `(dev)` fixture view-source. Save `stamp-attr.png`. Pass when a `data-inspect-host` attribute exists.
- [ ] Lane 4. Confirm `data-inspect-owner` exists on a component fixture. Save `owner-attr.png`. Pass when that attribute exists.
- [ ] Lane 5. Run debug typecheck. Save `stamp-typecheck.png`. Pass when typecheck exits 0.
- [ ] Lane 6. Confirm the public package still builds. Save `public-build.png`. Pass when the public build exits 0.
- [ ] Lane 7. Grep debug `src` for the old local names. Save `no-local-attr.png`. Pass when `HOST_ATTR` is gone.
- [ ] Lane 8. Open the new test case. Save `shared-name-test.png`. Pass when it asserts the imported constants.
- [ ] Lane 9. Confirm `inspector-stamp.ts` still defines the constants. Save `reader-owns.png`. Pass when the public file still exports them.
- [ ] Lane 10. Reload a stamped fixture and hover. Save `hover-stamped.png`. Pass when hover still shows a file label.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Debug test suite wall time.
- [ ] Probe. `pnpm --filter next-inspect-ui-debug test` at the parent SHA and at the head, interleaved.
- [ ] Baseline. Record the parent elapsed ms first.
- [ ] Rule. Fail if head takes more than 3 times the parent time.

**Review gate.** None. PR-stamp is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends the PR to the Graphite stack and the operator lands it.

## Export the overlay engine (PR-export)

**Depends on.** PR-tests.

**Files.**

- [ ] Create `next-inspect-ui-npm/src/overlay.ts`.
- [ ] Edit `next-inspect-ui-npm/package.json`.
- [ ] Edit `next-inspect-ui-npm/tsup.config.ts`.

**Build.**

- [ ] Add a barrel that re-exports `overlay/fiber.ts`, `overlay/resolve.ts`, and `overlay/chrome.ts`.
- [ ] Add a `./overlay` export. Keep it out of the main entry.
- [ ] Add the overlay entry to tsup without a `"use client"` banner if the barrel is types and functions only.

**You see.**

- [ ] `node -e "import('next-inspect-ui/overlay').then(m => console.log(typeof m.getHostAuthorSource))"` prints `function`.
- [ ] `next-inspect-ui` main entry still exports only `InspectUI`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Existing pin test plus a one-line import smoke in `overlay.ts` consumers. Run `pnpm --filter next-inspect-ui test && pnpm --filter next-inspect-ui typecheck`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Open `package.json` exports. Save `overlay-export.png`. Pass when `./overlay` exists.
- [ ] Lane 2. Open `src/index.ts`. Save `index-still-tiny.png`. Pass when it still exports only `InspectUI`.
- [ ] Lane 3. Build the public package. Save `overlay-build.png`. Pass when `dist/overlay.js` exists.
- [ ] Lane 4. Resolve `getHostAuthorSource` from the built overlay entry. Save `overlay-symbol.png`. Pass when the type is function.
- [ ] Lane 5. Run public tests. Save `overlay-tests.png`. Pass when tests exit 0.
- [ ] Lane 6. Run measure P1. Save `overlay-p1.png`. Pass when P1 gzip delta stays under +1.0 KB.
- [ ] Lane 7. Confirm the website still builds. Save `overlay-web-build.png`. Pass when the website build exits 0.
- [ ] Lane 8. Hover on a `(dev)` fixture. Save `overlay-hover.png`. Pass when hover still works.
- [ ] Lane 9. Confirm `./lib` still exists. Save `lib-export-stays.png`. Pass when `./lib` remains in exports.
- [ ] Lane 10. Pack the public package and list files. Save `overlay-pack.png`. Pass when `dist/overlay.js` is in the tarball and `src/` is not.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. P1 client gzip delta vs P0.
- [ ] Probe. `pnpm --filter prod-test measure` at the parent SHA and at the head, interleaved.
- [ ] Baseline. Record the parent P1 gzip delta first.
- [ ] Rule. Fail if head P1 gzip delta is more than +1.0 KB.

**Review gate.** None. PR-export is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends the PR to the Graphite stack and the operator lands it.

## Delete the debug resolver fork (PR-unfork)

**Depends on.** PR-export.

**Files.**

- [ ] Edit `next-inspect-ui-debug/src/debug-inspector.tsx`.
- [ ] Edit `next-inspect-ui-debug/tsup.config.ts`.

**Build.**

- [ ] Import fiber, resolve, and chrome symbols from `next-inspect-ui/overlay`.
- [ ] Delete the local copies of those functions.
- [ ] Keep the log panel, verify, stamp toggle, and `__inspectUIVerify`.
- [ ] External `next-inspect-ui/overlay` in tsup.

**You see.**

- [ ] `rg "const decodeVlq" next-inspect-ui-debug/src/debug-inspector.tsx` prints nothing.
- [ ] Website hover and verify still run on `/test/source-open`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Public pin test plus debug stamp tests. Run `pnpm --filter next-inspect-ui test && pnpm --filter next-inspect-ui-debug test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Open `/test/source-open` in the website. Save `unfork-home.png`. Pass when the fixture index renders.
- [ ] Lane 2. Hover a host fixture. Save `unfork-hover.png`. Pass when the tooltip shows a project file.
- [ ] Lane 3. Click the host. Save `unfork-click.png`. Pass when the editor open is attempted or the pending label appears, not a guessed file.
- [ ] Lane 4. Hold option and climb. Save `unfork-climb.png`. Pass when the label changes owner.
- [ ] Lane 5. Open the info panel with `I`. Save `unfork-info.png`. Pass when used and defined rows appear.
- [ ] Lane 6. Confirm the debug log panel still mounts. Save `unfork-log.png`. Pass when the log panel is in the DOM.
- [ ] Lane 7. Toggle stamp-resolve if the control is present. Save `unfork-toggle.png`. Pass when the control still exists.
- [ ] Lane 8. Run verify on a stamped host. Save `unfork-verify.png`. Pass when a match or mismatch chip appears.
- [ ] Lane 9. Grep the debug file for `decodeVlq`. Save `unfork-no-vlq.png`. Pass when the local function is gone.
- [ ] Lane 10. Settings change from the toolbar still paints. Save `unfork-settings.png`. Pass when spotlight color updates.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Debug overlay chunk size.
- [ ] Probe. `wc -c next-inspect-ui-debug/dist/debug-inspector*.js` at the parent SHA and at the head, interleaved.
- [ ] Baseline. Record the parent chunk bytes first.
- [ ] Rule. Fail if head is larger than the parent. The fork delete must shrink the file.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2 and lane 8 screenshots into `docs/media/PR-unfork-review-hover.png` and `docs/media/PR-unfork-review-verify.png`.
- [ ] Record a 30 to 60 second video of hover, click, climb, and verify on a lane VM. Save it as `docs/media/PR-unfork-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends the PR to the Graphite stack and the operator lands it.

## Read host stamps in the public overlay (PR-stamps)

**Depends on.** PR-unfork.

**Files.**

- [ ] Edit `next-inspect-ui-npm/src/overlay/resolve.ts`.
- [ ] Edit `next-inspect-ui-npm/src/overlay/resolve.vlq.test.ts` or add `resolve.stamp.test.ts`.

**Build.**

- [ ] Make `getHostAuthorSource` read `stampedHostSource` when a host stamp exists. No session flag. Presence of the attribute is the signal.
- [ ] Leave climb on runtime sources in this PR. Owner-stamp climb is out of scope.
- [ ] Add a unit case that a fiber with a stamped host wins over a wrong `_debugSource`.

**You see.**

- [ ] A stamped host on the public overlay tooltip matches `data-inspect-host` without importing the debug overlay.
- [ ] An unstamped host still uses runtime inference.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `resolve.stamp.test.ts` or the extended vlq file. Run `pnpm --filter next-inspect-ui test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Temporarily mount public `InspectUI` with `withInspectUI` on one fixture, or use a local harness page. Save `public-stamped-setup.png`. Pass when the page loads and stamps exist in view-source.
- [ ] Lane 2. Hover a stamped host. Save `public-stamped-hover.png`. Pass when the tooltip file matches the host stamp path.
- [ ] Lane 3. Click that host. Save `public-stamped-click.png`. Pass when open targets the stamp line.
- [ ] Lane 4. Hover an unstamped host if one exists, else a node_modules skip. Save `public-unstamped.png`. Pass when a runtime label still appears or the skip is explicit.
- [ ] Lane 5. Climb with option. Save `public-climb.png`. Pass when climb still works and does not require an owner stamp.
- [ ] Lane 6. Open info. Save `public-info.png`. Pass when the panel still renders.
- [ ] Lane 7. Confirm debug overlay is not mounted on this page. Save `no-debug.png`. Pass when there is no log panel.
- [ ] Lane 8. Run public tests. Save `stamp-unit.png`. Pass when the new stamp case passes.
- [ ] Lane 9. Run measure P1. Save `stamps-p1.png`. Pass when P1 gzip delta stays under +1.0 KB.
- [ ] Lane 10. Restore the website layout to the debug overlay after the probe. Save `layout-restored-debug.png`. Pass when `app/layout.tsx` still imports `next-inspect-ui-debug/inspect` for the site itself.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. P1 client gzip delta vs P0.
- [ ] Probe. `pnpm --filter prod-test measure` at the parent SHA and at the head, interleaved.
- [ ] Baseline. Record the parent P1 gzip delta first.
- [ ] Rule. Fail if head P1 gzip delta is more than +1.0 KB.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2 and lane 7 screenshots into `docs/media/PR-stamps-review-hover.png` and `docs/media/PR-stamps-review-no-debug.png`.
- [ ] Record a 30 to 60 second video of stamped hover and click on the public overlay. Save it as `docs/media/PR-stamps-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends the PR to the Graphite stack and the operator lands it.

## Close the program

- [ ] Every box above is checked with its evidence.
- [ ] Reply to the operator with the report the execution playbook names.

## Appendix A. Prototype evidence

No prototype branch. The open product call was whether public `InspectUI` should read stamps. I chose yes. Presence of `data-inspect-host` is the switch. No session flag. That matches how a consumer composes `withInspectUI` plus the public component.

Unproven until PR-stamps lives. Whether a fiber test can inject a stamp without jsdom. If it cannot, the unit case becomes a DOM fixture on the website and the unit box records that.

Unproven until PR-unfork lives. Whether `debug-inspector.tsx` can import `next-inspect-ui/overlay` without a cycle. The public overlay must not import the debug package.

## Appendix B. Alternatives rejected

Keep stamps debug-only. Rejected. `withInspectUI` plus public `InspectUI` would stay a no-op for hover. That is the product lie the critic named.

Merge the 5k debug file in the first PR. Rejected. One change per PR. The export must exist before the fork can die.

Change the debug dep to a hardcoded `^0.3.0` inside the repo. Rejected. Local `pnpm` needs the workspace protocol. `workspace:^0.3.0` plus a pack check is the structural fix.

Hold public 0.3.0 until `/lib` is remeasured. Rejected as a publish block. PR-measure and PR-lib still run, in that order, so the number is proven before anyone quotes it again.

`globalThis` settings dedupe. Deferred. PR-publish pins the range. Two copies become a later bug if a consumer ignores the pin.

Owner-stamp climb. Deferred. PR-stamps does host hover only.

## Appendix C. Risks

This repo has no `pstack/` on `origin/main`. The arm boxes that `git show` those paths will fail. Owners read the same playbooks from the local pstack plugin cache and note that in the first status message.

`control-ui` is not vendored here. Live lanes on overlay PRs drive the website through the Cursor browser tools if the plugin is missing. That is a risk for PR-unfork and PR-stamps.

Empty `dist/` at program start. PR-measure and PR-publish must build first. The pack check and the measure baseline both say so.

PR-unfork edits a 5000-line file. Conflict risk is high. Hold the file boundary. No other PR touches `debug-inspector.tsx`.

PR-stamps can change hover on stamped apps. That is why it is review-gated.

`projectRoot` still leaks when the consumer skips the `NODE_ENV` gate. No PR in this program tries to fix RSC serialization.

## Appendix D. Links and reading list

Read `publish.md`, both README files, `next-inspect-ui-npm/tsup.config.ts`, `prod-test/measure.mjs`, `next-inspect-ui-debug/package.json`, and `next-inspect-ui-npm/src/overlay/resolve.ts` before editing.

PR-unfork and PR-stamps get `pstack/skills/how/SKILL.md` at owner start. PR-stamps also gets `pstack/skills/interrogate/SKILL.md` before the review-gate post.

Keep a local `decisions.tsv` per owner. Do not commit it. Return it in the STACK-READY report per `pstack/skills/show-me-your-work/SKILL.md`.
