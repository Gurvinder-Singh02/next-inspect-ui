---
name: match-expected-case
description: >-
  Match /test SuiteCase expected NODE TREE lines in apps/next-js-example/test-cases
  to live inspect. Use when editing fixtures on apps/next-js-example, a case
  fails on line mismatch, or syncing TEST_CASE_META or case-source-examples.
---

# Match expected case

Hand-edit expected cases for `apps/next-js-example`. No capture script. Open the
case, inspect the fixture, pin `apps/next-js-example/test-cases/cases.ts` to the
RESULT `file:line`.

## Files

| Role | Path |
|---|---|
| Fixtures | `apps/next-js-example/app/(dev)/test/page.tsx` |
| Expected | `apps/next-js-example/test-cases/cases.ts` |
| Sticky meta | `TEST_CASE_META` in `cases.ts` |
| Show source | `apps/next-js-example/test-cases/case-source-examples.ts` |

## Steps

### 1. Read the fixture

Open `page.tsx` (and any fixture file the case imports). Note every usage site
and every host site the case should name.

Mark multi-target hosts with `data-accuracy-target={id}` on the element itself
(the button, svg, span, …), not a wrapper.

Done when every target’s JSX site is identified by file + line.

### 2. Pin from inspect

Exact line match. No tolerance.

1. Probe the host (`window.__inspectUI.inspect(el)` → `nodes[].source`, or the
   case Test RESULT lines).
2. Climb / composite node (`Button`, `Badge`, `ServerCard`, …) → **pin** to that
   node’s inspect `file:line`.
3. Host / DOM node (`button`, `span`, `div`, `h1`, …) → **pin** to the host
   inspect line, else the host JSX line in the defining file
   (e.g. `components/ui/button.tsx` return).

Done when every `AccuracyNode.line` in `cases.ts` equals the inspect line for
that node.

### 3. Sync companions

When cases are added, removed, renamed, or regrouped:

- `TEST_CASE_META` — same `id` / `title` / `group` order as rendered cases
- `case-source-examples.ts` — short snippet for the Show source panel

Done when meta ids match rendered `SuiteCase` ids and every case with a Show
source panel has an examples entry.

### 4. Shift after page edits

Inserting/removing lines in `page.tsx` shifts every later `TEST_PAGE` expected
line. Re-pin **every** `file: TEST_PAGE` line that moved — not only the case you
touched.

Done when a full read of `page.tsx` usage sites matches all `TEST_PAGE`
expected lines.

### 5. Verify failures

On line-mismatch fails: re-probe the target, compare RESULT lines to expected,
re-pin, re-run the case Test (or suite). Stop when the case shows **PASS**.

## Reference

- Expected trees are `AccuracyNode[]` / `AccuracyTarget[]` — climb parents first, host
  last (Inspect NODE TREE order).
- Paths are project-relative (`app/(dev)/test/page.tsx`, not absolute).
- Nested HTML under another host does not climb; return-root hosts do.
  `motion.*` is treated as the host it produces (`<div><motion.div/></div>`
  does not climb; `const Box = () => <motion.div/>` climbs to `Box`).
- Rebuild `next-inspect-ui` only when climb behavior itself changed. Matching
  expected lines does not need a package build.
