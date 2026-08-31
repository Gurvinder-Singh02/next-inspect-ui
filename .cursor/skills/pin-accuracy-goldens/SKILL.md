---
name: pin-accuracy-goldens
description: >-
  Pin /test accuracy goldens in cases.ts to stamp ground truth. Use when
  re-pinning expected NODE TREE lines, editing SuiteCase / SuiteTarget fixtures
  on app/(dev)/test/page.tsx, syncing TEST_CASE_META or case-source-examples,
  or when a suite case fails on line mismatch.
---

# Pin accuracy goldens

Manual goldens for `/test`. There is no Snapshot button — **pin** by hand from
**stamp** ground truth, then keep meta/source in lockstep.

## Files

| Role | Path |
|---|---|
| Fixtures | `next-inspect-website/app/(dev)/test/page.tsx` |
| Goldens | `next-inspect-website/app/(dev)/test/cases.ts` |
| Sticky meta | `TEST_CASE_META` in `cases.ts` |
| Show source | `next-inspect-website/app/(dev)/test/case-source-examples.ts` |

## Steps

### 1. Read the fixture

Open `page.tsx` (and any fixture file the case imports). Note every usage site
and every host site the golden should name.

Done when every target’s JSX site is identified by file + line.

### 2. Pin from stamps

Stamps are build-time ground truth (`data-inspect-owner` / `data-inspect-host`).
Exact line match — no tolerance.

1. Prefer the live stamp on the probed host (DevTools attribute, or
   `window.__inspectUI.inspect(el)` → `nodes[].source`).
2. Climb / composite node (`Button`, `Badge`, `ServerCard`, …) → **pin** to the
   `data-inspect-owner` line (file:line before the column).
3. Host / DOM node (`button`, `span`, `div`, `h1`, …) → **pin** to
   `data-inspect-host`, else the host JSX line in the defining file
   (e.g. `components/ui/button.tsx` return).

**SuiteTarget trap.** Wrapping a fixture in `<SuiteTarget>` often makes the
owner stamp land on the `SuiteTarget` line, not the inner `<Button>` line.
Pin the stamp line, not the inner JSX line you wish were stamped.

Done when every `AccuracyNode.line` in `cases.ts` equals the stamp/inspect
line for that node.

### 3. Sync companions

When cases are added, removed, renamed, or regrouped:

- `TEST_CASE_META` — same `id` / `title` / `group` order as rendered cases
- `case-source-examples.ts` — short snippet for the Show source panel

Done when meta ids match rendered `SuiteCase` ids and every case with a Show
source panel has an examples entry.

### 4. Shift after page edits

Inserting/removing lines in `page.tsx` shifts every later `TEST_PAGE` golden.
Re-pin **every** `file: TEST_PAGE` line that moved — not only the case you
touched.

Done when a full read of `page.tsx` usage sites matches all `TEST_PAGE`
goldens (and stamps, for SuiteTarget-wrapped targets).

### 5. Verify failures

On line-mismatch fails: re-probe the target, compare RESULT lines to expected,
re-pin, re-run the case Test (or suite). Stop when the case shows **PASS**.

## Reference

- Goldens are `AccuracyNode[]` / `AccuracyTarget[]` — climb parents first, host
  last (Inspect NODE TREE order).
- Paths are project-relative (`app/(dev)/test/page.tsx`, not absolute).
- Nested HTML under another host does not climb; return-root hosts do.
- Rebuild `next-inspect-ui` / `next-inspect-ui-debug` only when stamp or climb
  behavior itself changed — golden **pin** edits do not require a package build.
