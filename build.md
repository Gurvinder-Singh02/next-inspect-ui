# Spec — Accurate source resolution for `next-inspect-ui`

## Problem Statement

Hovering an element in the inspector shows a file path, and clicking opens that
path in Cursor. Sometimes it opens the **wrong file**, with no warning and no way
to tell a good answer from a bad one. Because there is no signal, the failure is
only discovered after landing in an unrelated file, which trains people to stop
trusting the click.

There is also no way to measure whether any given change makes resolution better
or worse. "Sometimes wrong" is not a number, so fixes are guesswork.

The root cause is not a bad algorithm. It is that **React 19 deleted the
information the resolver needs**, verified against the installed packages:

- `_debugSource` no longer exists on fibers — 0 occurrences in `react-dom@19.2.4`
  (vs. 26 for `_debugOwner`). Every code path reading it returns `null`
  permanently.
- `jsxDEV` no longer accepts `__source`. Its React 19 signature is
  `(type, config, maybeKey, isStaticChildren)`. There is no runtime hook that
  carries the authoring location.
- Owner stacks are capped: `trackActualOwner = 1e4 > recentlyCreatedOwnerStacks++`.
  Past 10,000 elements React substitutes a **shared placeholder stack**. Any
  large page silently crosses this line.
- Components whose DOM is constructed inside `node_modules` (Base UI's
  `useRender` + `mergeProps`, used in ~25 files of the test app) have no
  user-code frame in the stack at all.

What remains is an `Error` stack pointing into compiled chunks, which must be
parsed and source-map-decoded. That path is both lossy and slow — it performs
`await fetch(...)` inside the hover path.

## Solution

The compiler still knows every element's exact location. Ask it to write that
down, and read it at runtime.

A build-time transform stamps each JSX element with its own `file:line:column`.
Hover becomes an attribute read: synchronous, exact, no source maps, no fiber
walking. Registered by wrapping the Next config in one line.

The existing runtime inference is retained as a **fallback** for anyone who does
not add the build step, so the package still installs and works with only a
component in the layout. The overlay reports which mode is active, and prompts
for the upgrade when running on the fallback.

To keep the fallback honest, a verification mode runs the runtime resolver
**blind** — forbidden from reading stamps — and scores its answer against the
stamp. That converts "sometimes wrong" into a live per-strategy percentage, and
paints hover green on match and red on mismatch.

Product behaviour is otherwise unchanged: hover shows the path, ⌥ climbs to the
owning component, click opens the editor.

## User Stories

1. As a developer, I want clicking an element to open the file it is actually
   written in, so that I stop losing time in unrelated files.
2. As a developer, I want the tooltip to show the path before I click, so that I
   can tell whether it is worth clicking.
3. As a developer, I want hover to feel instant, so that scanning a page does not
   stutter.
4. As a developer, I want to hold ⌥ to climb to the component that rendered the
   element, so that I can reach the call site rather than the leaf DOM node.
5. As a developer, I want an element whose location cannot be determined to be
   visibly marked as uncertain, so that I am never silently sent somewhere wrong.
6. As a developer, I want the inspector to work with only a component added to my
   layout, so that I can evaluate it in under a minute.
7. As a developer, I want one line of config to upgrade to exact resolution, so
   that I can opt into accuracy once I have decided to keep the tool.
8. As a developer, I want to be told when I am running in the less accurate mode,
   so that I do not blame the tool for a limitation I could remove.
9. As a developer, I want the build step to be impossible to ship to production,
   so that I do not have to audit my own output.
10. As a developer, I want the build step to cost little dev-server time, so that
    accuracy does not trade against iteration speed.
11. As a developer on a monorepo, I want stamped paths to resolve correctly across
    workspace packages and symlinks, so that opening a file works outside the app
    directory.
12. As a developer using shadcn-style wrappers, I want hovering a `<button>`
    rendered by `<Button>` to resolve to the wrapper's own file, so that hover
    answers "where is this DOM written" consistently.
13. As a developer using shadcn-style wrappers, I want ⌥ to take me to the
    `<Button>` call site, so that both questions are answerable from one hover.
14. As a developer using Base UI `render={}` / `useRender`, I want elements
    constructed inside the library to still resolve to my call site, so that a
    quarter of my UI is not a dead zone.
15. As a developer, I want elements inside `.map()` to resolve to the JSX in the
    loop body, so that lists are inspectable.
16. As a developer, I want elements passed as props (`fallback={<Spinner/>}`) to
    resolve to where they are written, so that prop-passed JSX is inspectable.
17. As a developer, I want Server Component output to resolve, so that RSC pages
    are not a blind spot.
18. As a maintainer, I want a page of fixtures covering the common ways people
    compose components, so that I can hover through them and see what breaks.
19. As a maintainer, I want each fixture family on its own route, so that I can
    work through them without endless scrolling.
20. As a maintainer, I want hover to turn green when the resolver is right and red
    when it is wrong, so that correctness is visible rather than inferred.
21. As a maintainer, I want the panel to name which strategy produced each answer,
    so that I know what to fix rather than that something is broken.
22. As a maintainer, I want each answer to carry a confidence number, so that I
    can find the dangerous cases — high confidence and wrong.
23. As a maintainer, I want a running tally across a route, so that I can tell
    whether a change helped.
24. As a maintainer, I want to export the run as JSON, so that I can diff two runs.
25. As a maintainer, I want deliberately broken fixtures, so that I can confirm
    red actually fires and the detector is not merely always green.
26. As a maintainer, I want the verifier to catch a stamp that was overwritten by a
    spread, so that the ground truth is itself checked.
27. As a maintainer, I want elements with no stamp to be scored separately, so that
    unverifiable is distinguishable from wrong.
28. As a maintainer, I want a confident answer on an unverifiable element to score
    red, so that the worst failure mode is not hidden by the scoring.
29. As a maintainer, I want the resolver unable to read stamps, so that the score
    means something.
30. As a maintainer, I want React's 10k owner-stack cap detected at runtime, so
    that large pages degrade visibly instead of silently.
31. As a maintainer, I want all resolution behind one entry point, so that adding a
    strategy does not mean touching the overlay.
32. As a maintainer, I want each strategy independently testable, so that a
    regression points at a function.
33. As a maintainer, I want dead `_debugSource` branches removed, so that the code
    reflects what React 19 actually provides.
34. As a maintainer, I want one normalisation choke point for paths and columns, so
    that two correct answers cannot disagree textually.
35. As a consumer, I want no verification UI or cost unless I ask for it, so that
    the shipped overlay stays lean.
36. As a consumer, I want my configured overlay colours preserved, so that verify
    mode does not hijack my theme.
37. As a consumer, I want the README to state accuracy per mode, so that I know
    what I am getting.
38. As a consumer without the build step, I want today's behaviour unchanged, so
    that upgrading does not regress me.

## Implementation Decisions

**Stamping is the primary resolution path; runtime inference is the fallback.**
Chosen after establishing that runtime accuracy is structurally capped by React
19 and cannot be lifted by better algorithms. Both reference implementations
(`react-dev-inspector`, LocatorJS) require a build step for the same reason.

**Two stamps, not one.** Lowercase JSX carries a *host* stamp — the DOM node's own
authoring site, which is the hover answer. Component JSX carries an *owner* stamp
— the call site, which is the ⌥-climb answer. Components that forward unknown
props (`{...props}`, Base UI `mergeProps`) carry the owner stamp through onto the
DOM node, which is what recovers Base UI hosts. Components that do not forward
simply drop it; that is expected, not a failure. LocatorJS reaches the same
host/owner split via its `wrappingComponentId`, arrived at independently.

**Stamps are pushed last, never unshifted.** `@react-dev-inspector/babel-plugin`
unshifts, so in `<button {...props}>` the caller's spread overwrites the stamp and
the DOM node ends up claiming the call site instead of its own file — precisely
the wrong-file class being fixed. Pushing makes the stamp win. Verified against a
fixture.

**Elements that never render DOM are skipped**: `Fragment`, `Suspense`, and
`*Provider`. Stamping them is meaningless or an error (`Fragment` accepts only
`key`/`children`). Same exclusion set LocatorJS settled on.

**Stamp format is `relative/path:line:column`, parsed from the right**, since a
path may contain a colon but the two trailing numeric fields never do. One shared
client-safe module defines the format so the runtime and the verifier cannot
drift.

**Columns are normalised to 1-based at stamp time.** Babel columns are 0-based
while lines are 1-based, and editors want both 1-based. Normalising at emit means
no downstream consumer has to guess, and off-by-one errors cannot masquerade as
resolver failures.

**Files outside the configured root are not stamped.** The runtime could not join
such a path back, so a stamp would be worse than none.

**Registration is a Next config wrapper** taking optional `root`, `include`, and
`exclude`. It registers a Turbopack rule running `babel-loader` in parse-only mode
— no presets, only `typescript` and `jsx` parser plugins — so Babel parses,
injects, and reprints while Turbopack still performs the real compile. The app is
therefore built by the same pipeline as any other, which matters because the
fallback depends on Turbopack's own source maps.

**Loader source maps are enabled.** Injected attributes shift columns; without a
chained map, the fallback's measured accuracy would be degraded by the tooling
measuring it, corrupting the score.

**The wrapper hard-gates on production with no override.** It writes attributes
into someone else's HTML; an override is only a way for that to happen by
accident.

**Turbopack only, `next >=16`.** Turbopack is the default in Next 16 and is what
the test app runs. Webpack support would be a second untested path.

**Babel dependencies are optional peers.** The wrapper throws a directed install
message when missing, naming the fallback as the alternative, so the zero-config
install is unaffected.

**`node_modules` is excluded at the plugin level, not by narrowing the glob.** A
rule glob expressing "not node_modules" is brittle, and the plugin must make the
same call anyway when a file resolves outside the root.

**The plugin is idempotent** — a second stamp would shadow the first across HMR
rounds.

**The stamp plugin path is resolved from the consumer's project**, not from the
wrapper's own location, so it behaves identically whether the config was loaded
as ESM or CJS.

**The resolver may never read stamps.** A resolver that can see the answer
verifies nothing. Any future opt-in stamp-reading mode must use a distinct
attribute so the oracle stays independent.

**One normalisation choke point** for every strategy: absolute, symlink-resolved,
1-based line and column. Two strategies that are both correct must not disagree
textually, or the verifier scores a correct answer red.

**Verification runs client-side.** Stamps are already in the DOM, so the check is
a string compare in the same tick as the hover — no fetch, no dev route.

**Scoring**: match is green, mismatch is red. Elements with no stamp are scored
by confidence — confident and unverifiable is red, humble and unverifiable is
grey. Counting all unverifiable elements red would make the score unreachable;
excluding them would hide the worst failure mode.

**Verification is gated behind a prop** so consumers see nothing and pay nothing,
and their configured overlay colours are never overridden.

**Runtime resolution consolidates behind one entry point** returning source,
strategy name, confidence, and a trace of what each strategy returned. Confidence
numbers start as estimates and are calibrated once the fixture matrix produces
data; the trace is what makes them derivable rather than arguable.

**React's 10k owner-stack cap is detected at runtime** by recognising the shared
placeholder stack, dropping confidence to zero so the tooltip goes red before the
click. Chosen over a bulk fixture route, which would have poisoned every other
fixture sharing the page via React's global counter.

**Legacy resolution is removed rather than kept for comparison.** Consequence,
accepted deliberately: the fixture matrix becomes the only regression net, which
is why it is built before the resolver is touched. The dead `_debugSource`
branches are deleted with the legacy path.

**Editor opening stays on the direct protocol URL.** `react-dev-inspector`'s
middleware approach would require a custom server, which is a regression on
Next 16 and slower than the current handoff.

## Testing Decisions

A good test here asserts **externally observable behaviour**: given a rendered
page, does the resolver name the location the compiler recorded? It must not
assert which internal strategy fired — that is exactly what is expected to change
as the fallback improves.

**Seams — needs confirmation before building.** The proposal is two, at the
highest points available:

1. **The resolver entry point.** One function, element in, `{source, strategy,
   confidence, trace}` out. Every runtime strategy sits behind it. This is the
   single seam almost everything is tested through, and it already has prior art
   in the existing pure helpers, which are separated from the overlay for this
   reason.
2. **The Babel plugin's transform.** Source in, stamped source out. Pure and
   synchronous, testable without a browser. Prior art: both reference libraries
   test their plugins as input/output fixture pairs.

The green/red overlay is deliberately **not** a third seam — it renders what seam
1 returns compared against the stamp, and testing it separately would test the
DOM rather than the logic.

**Modules tested.** The stamping plugin, via input/output fixture pairs covering
hosts, components, member-expression names, spread ordering, excluded element
types, elements in props, elements in loops, and files outside the root. The
resolver entry point, via the fixture routes, scored against stamps.

**Prior art.** The repo already carries two runner-driven suites under the dev
route group, plus shared pure helpers extracted specifically so the live overlay
and the test sandbox cannot drift. The new matrix follows that pattern: fixtures
render, the runner walks them, results display in-page.

**The matrix must be able to fail.** A deliberately-broken fixture set — file
edited after compile, paths containing spaces and unicode, a file outside the
project root — is part of the suite. A detector that has never gone red is not
yet a detector.

**Manual hovering is a first-class mode.** Routes are built to be walked by hand,
one family per route, because the reported symptom is intermittent and eyes on
the overlay are how it was noticed in the first place.

## Out of Scope

- Webpack support. Turbopack only until someone asks.
- Non-Next React apps. The package is Next-specific by name and by config surface.
- Any change to hover labelling, ⌥ climb semantics, keyboard shortcuts, overlay
  styling, or the settings surface. Current behaviour is correct.
- Replacing the editor-open mechanism.
- A server-side check that re-reads the file from disk on click. Only catches
  edits made after compile; deferred until the broken-fixture route shows whether
  that happens in practice.
- CI enforcement. Deferred until the score is stable enough to assert against —
  wiring it now would encode today's bugs as the contract. The JSON export is
  built so this is cheap to add later.
- Verifying the full ⌥ climb chain. Hover plus the first climb step only; deeper
  steps need a stamped ancestry model for failures that get rarer with depth.
- An opt-in mode where the shipped resolver reads stamps directly. Possible later,
  must use a distinct attribute.
- Publishing to npm.

## Further Notes

**On the choice being a product decision, not just a technical one.** Zero-config
install was the differentiator, and it is also what caused the bug. Requiring a
build step would have made the package functionally equivalent to LocatorJS,
which is actively maintained and ships a browser extension. The two-tier shape
keeps zero-config as the onboarding path and accuracy as the payoff, and it lets
the README publish a real accuracy number per mode — which no competitor does,
because none of them measure it.

**On dev-server cost.** The Babel pass is the one real objection to the build
step. It is parse-only, dev-gated, and cached per file by Turbopack. Cold-start
and HMR numbers should be measured on the test app once the loader is wired, and
recorded here.

**On the reference libraries.** `react-dev-inspector` (v2.0.1, last published July
2024, peer `react >=16.8.0`) emits three literal attributes and its runtime does
nothing but read them. LocatorJS (`@locator/babel-jsx` v0.5.1, January 2026) emits
an id into a global side table carrying full start/end ranges and the wrapping
component. Neither performs runtime inference, and neither has a verification
layer — they do not need one, because they never guess. This project needs one
precisely because it does.

**On what the verifier is really for.** With stamping primary, stamped elements
are correct by construction. The harness therefore points at the fallback: it
measures how good zero-config mode actually is, and that number is what tells you
whether the fallback is worth keeping, improving, or eventually dropping.

---

## Measured Results

**Stamping works end to end.** 78 host stamps and 14 owner stamps in the served
HTML of the index route; 332 on `/dashboard`. Spot-checked locations land exactly
on the `<` of the intended element, including an owner stamp on a component.

**Dev-server cost is small.** Single-run cold compiles, same machine, `.next`
cleared between runs:

| route | without plugin | with plugin | delta |
|---|---|---|---|
| `/` | 0.06s | 0.06s | — |
| `/dashboard` | 1.39s | 1.52s | +0.13s |
| `/components` | 2.32s | 2.45s | +0.13s |

Server readiness was unchanged (276–309ms across runs). The perf objection to the
build step does not survive measurement.

**First real finding from the harness.** On plain hosts in the index route, the
runtime fallback's *synchronous* pass returns **no answer at all**, and the
*asynchronous* pass then resolves correctly:

```
✗ runtime had no answer · stamp app/(main)/page.tsx:45
  ↳ async recovered: app/(main)/page.tsx:45
```

The tooltip paints from the sync pass. So there is a window between hover and the
async resolve completing during which the inspector has no location — and a click
inside that window has nothing correct to open. This is a strong candidate
mechanism for the intermittent wrong-file opens that started this work, and it is
a *race*, not a bad heuristic. Worth confirming before the fallback is rewritten,
because it would change what needs fixing.

Note the displayed running percentage is computed at the sync verdict and does not
retroactively reflect async recoveries in the same log line; the tally itself is
corrected. Cosmetic, listed below.

---

## Build Checklist

### 1 · Stamping plugin
- [x] Host stamp on lowercase JSX; owner stamp on component JSX
- [x] Attributes pushed after any `{...props}` spread — verified on a fixture
- [x] `Fragment` / `Suspense` / `*Provider` skipped
- [x] Member-expression names (`Card.Header`) handled
- [x] Columns normalised to 1-based at emit
- [x] Files outside the configured root left unstamped
- [x] Idempotent across repeated HMR transforms
- [x] Builds as a standalone Node entry, no `"use client"` banner
- [x] Fixture-pair tests for each case above

### 2 · Config wrapper
- [x] `withInspectUI(config, opts)` registering a Turbopack rule
- [x] Parse-only `babel-loader` (no presets, `typescript` + `jsx` parser plugins)
- [x] Chained source maps enabled
- [x] Hard production gate, no override
- [x] `include` / `exclude` options, `node_modules` excluded by default
- [x] Directed error when Babel dependencies are missing
- [x] Plugin path resolved from the consumer's project
- [x] Subpath exports and optional peer dependencies declared
- [x] Wired into the test app's config
- [x] Stamps confirmed present in served HTML
- [x] Cold-start and HMR cost measured and recorded

### 3 · Shared stamp reading
- [x] Client-safe parser, format defined in one place
- [x] Host / owner readers plus nearest-stamped-ancestor lookup
- [x] Stamp-presence check for the upgrade prompt
- [x] Exercised end-to-end against real DOM

### 4 · Resolver integration
- [x] Synchronous host-stamp lookup ahead of runtime inference on hover
- [x] Owner-stamp fallback when a host was built inside node_modules
- [ ] Owner-stamp lookup wired into the ⌥ climb step specifically
- [x] Single normalisation choke point: absolute, symlink-resolved, 1-based
- [x] Clean fallback to runtime inference when no stamp is present
- [ ] Mode surfaced in the panel, with the upgrade prompt when unstamped

### 5 · Verify mode
- [x] `verify` prop; nothing rendered and nothing paid when off
- [x] Runtime resolver runs blind — cannot read stamps
- [x] Green on match, red on mismatch, configured colours restored when off
- [ ] Tooltip badge showing strategy and confidence (verdict currently shown via outline colour + log)
- [ ] Stamp-integrity check (clobbered or missing)
- [ ] Confident-but-unverifiable scores red; humble-and-unverifiable scores grey
- [x] Running tally per route
- [ ] Copy-report JSON export (log lines are copyable today via Copy logs)

### 6 · Fixture routes
- [ ] Index linking every family
- [ ] Nested hosts · component-in-component trees
- [ ] `children` · elements-as-props · render props
- [ ] `.map()` lists · conditional JSX · fragments
- [ ] Default vs named exports · `memo` / `forwardRef` / HOC
- [ ] shadcn wrappers · Base UI `render={}` / `useRender` · `cva` variants
- [ ] Server Components · `"use client"` boundaries · async RSC
- [ ] Third-party (`lucide`, `next/image`, `next/link`)
- [ ] Portals · `Suspense` · `cloneElement`
- [ ] Broken on purpose: edited after compile, spaces/unicode paths, outside root
- [ ] Confirmed red fires on the broken set

### 7 · Fallback consolidation
- [ ] Single entry point returning source, strategy, confidence, trace
- [ ] Strategies split into named, individually testable functions
- [ ] 10k owner-stack-cap detection dropping confidence to zero
- [ ] Dead `_debugSource` branches and their helper deleted
- [ ] Confidence numbers calibrated against matrix results
- [ ] Legacy path removed

### 8 · Documentation
- [ ] README: two modes, accuracy per mode, one-line upgrade
- [ ] `next >=16` / Turbopack requirement stated
- [ ] Measured dev-server cost published

- [ ] Fix: running percentage in the log line is computed before async recovery is counted
- [ ] Confirm whether the sync/async race is the actual cause of the reported wrong-file opens
