# Component source benchmark

Run `bun run dev:bench`, then `bun run benchmark:source`. Open http://localhost:3106 to see the fixture page.

The app contains the 330 cases from [React Grab Bench](https://github.com/millionco/react-grab-bench). `apps/react-grab-bench/UPSTREAM.md` records the exact upstream revision and its MIT license is included.

This local run measures **direct source lookup**, not the upstream Claude agent benchmark. It makes no agent API calls. Results go to `docs/source-benchmark-results.json` and include every expected file, returned file, lookup time, missing target, and error.

An exact match means the returned path is the expected **component definition file**. Next Inspect UI normally opens the JSX author or usage location, so this score does not measure whether its normal editor link is correct. `chainContainsFile` separately checks whether the returned tree/context contains the expected file. It is a hint metric, not an agent success rate.

React Grab uses its public `getElementContext` primitive. Show Component uses its public `getClickTarget` callback and lazy source resolver; navigation is suppressed. Click to React Component uses unmodified copies of its installed 1.1.3 source utilities, with its license. Next Inspect UI uses its existing development inspect probe. No competitor source resolution is patched.

Each library gets a fresh browser page with the same fixtures and upstream interactions. The source comparison loads React Grab instrumentation and both component tools, except that Click to React Component skips React Grab instrumentation. The editor-opening test loads only Next Inspect UI; this is a shared-instrumentation comparison, not a fully isolated installation test. Timing includes context/tree gathering and source-map requests, with warm caches during the run; it is not hover FPS, editor launch speed, or production bundle size. See `docs/benchmarks.md` for bytes.

Upstream publishes agent retrieval accuracy and agent runtime. Those numbers cannot be compared directly with these source lookup scores. A full upstream agent run additionally requires Claude credentials and incurs API usage; it is not part of this local command.

The upstream compound table renders text directly inside a table row, producing a hydration warning. The fixture is retained unchanged; six targets were missing in the measured run and are reported separately.

## Measured results

Next.js 16.2.6, React 19.2.4, Turbopack, Chromium, local development. Six of 330 targets were missing for every tool; none produced a lookup error. The denominator retains all cases.

| Tool | Definition file matches | Tree/context contains file | Median | p95 |
|---|---:|---:|---:|---:|
| next-inspect-ui | 9/330 (2.7%) | 9/330 | 16.4 ms | 32.1 ms |
| react-grab | 270/330 (81.8%) | 9/330 | 1.5 ms | 3.3 ms |
| show-component | 5/330 (1.5%) | 8/330 | 0.0 ms | 0.2 ms |
| click-to-react-component | 0/330 (0.0%) | 0/330 | 4.6 ms | 5.6 ms |

Show Component’s near-zero timings mostly reflect cached framework locations, not faster correct lookup. Click to React Component found no sources on this React 19 corpus.

## Where ours lags

React Grab finds the expected file in 262 cases where ours does not. Ours frequently returns `app/page.tsx:21`, with a styled layout/grid in the tree. This suggests target promotion or owner selection skips the target too early; investigate before changing resolution. Usage-versus-definition semantics also contribute.

| Test ID group | React Grab succeeds, ours fails |
|---|---:|
| generic | 41 |
| deep | 36 |
| factory | 27 |
| sibling | 23 |
| dynamic | 18 |
| util | 18 |
| hook | 9 |
| config | 8 |

| Example | Expected | Ours |
|---|---|---|
| alias-alert-banner | `components/aliased/internal-alert-impl.tsx` | `app/page.tsx` |
| alias-confirm-modal | `components/aliased/internal-modal-base.tsx` | `app/page.tsx` |
| alias-footer | `components/aliased/internal-footer-center.tsx` | `app/page.tsx` |
| alias-main-nav | `components/aliased/internal-nav-base.tsx` | `app/page.tsx` |
| alias-search-bar | `components/aliased/internal-search-core.tsx` | `app/page.tsx` |

Check target promotion for styled wrappers, then owner chains for generic/deep/factory cases. Consider a separate definition lookup alongside JSX usage lookup. Repeat this corpus after fixes; keep the existing exact-line suite too.

## Actual editor-opening check

Run `bun run benchmark:open` while the app is on port 3106. This exercises the real pointer-move, pointer-down, and click handlers, with and without Option. It intercepts the editor endpoint and saves its requested file/line/column instead of launching an editor. DOM hits are controlled at each target’s own coordinates; this is a handler test, not physical browser hit-testing.

| Mode | Requested expected definition file | Missing target | No captured endpoint request |
|---|---:|---:|---:|
| click | 4/330 | 6 | 6 |
| optionClick | 2/330 | 6 | 5 |

Full destinations are in `open-benchmark-results.json`. A request to a different file is a definition-file mismatch, not automatically an incorrect JSX usage location. However, repeated `app/page.tsx:21` destinations show that parent promotion affects actual opening too, not only the development probe. The class-name preference in `resolveInspectElement` promotes many inline-styled targets to a classed styled-layout ancestor. That needs a targeted fix.

No captured request is inconclusive: it can mean no source, delayed lookup, or an absolute-path editor protocol link, which this endpoint interception does not record. The test does not verify the editor application launches or an exact expected line; upstream provides only definition-file expectations. The existing test suite remains the check for authored JSX locations.

Exact-hover update: parent promotion by CSS class, button/link roles, and icon markup has been removed. Hover now selects the precise DOM hit, checks the hit stack, descends open shadow roots, and skips non-target surfaces. Real mouse verification matches spotlight bounds to the hovered children and checks info navigation. This fixes target selection; the low definition-file lookup rate still needs separate source-resolution work. Earlier opening measurements are superseded by the current JSON because the harness now isolates our inspector.
