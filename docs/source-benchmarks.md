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

Next.js 16.2.6, React 19.2.4, Turbopack, local Chromium. Six of 330 targets were missing for every tool. Expected files are component definitions; this is not an agent accuracy score or an exact-line score.

| Tool | Definition file matches | Tree/context contains file | Median | p95 |
|---|---:|---:|---:|---:|
| next-inspect-ui | 299/330 | 301/330 | 2.1 ms | 18.6 ms |
| react-grab | 270/330 | 9/330 | 1.7 ms | 4.0 ms |
| show-component | 5/330 | 9/330 | 0.1 ms | 0.2 ms |
| click-to-react-component | 0/330 | 0/330 | 6.9 ms | 7.9 ms |

Next Inspect UI now uses `bippy/source` for recovered component frames, the same source-resolution package used by React Grab. Ours matches 29 additional definition files in this run. The full owner chain is still gathered for this comparison; hover can paint sooner after its host source resolves. Show Component’s near-zero timings mostly reflect cached framework locations, not correct resolution.

The earlier surrounding-page results came from parent promotion and unreliable debug stacks. Exact hover no longer promotes classless children to groups. Source recovery now prefers a project source from trusted debug information or a recovered component stack, before falling back to a page. React 18 JSX metadata remains supported. Component usage and definition sources remain separate for the existing UI and Option-climb flow.

## Actual editor-opening check

Run `bun run benchmark:open`. This loads only our inspector and exercises its real hover, pointer-down, and click handlers, with and without Option. DOM hits are controlled at each target’s coordinates. It intercepts local editor endpoint requests and stubs only the final editor-protocol assignment in the delivered test JavaScript. Source resolution and the click handler are unchanged. No editor is launched.

| Mode | Requested expected definition file | Missing target | No captured destination |
|---|---:|---:|---:|
| click | 275/330 | 6 | 0 |
| optionClick | 272/330 | 6 | 0 |

`open-benchmark-results.json` contains the requested file, line, and column for every available target. This does not verify the editor application launches, and upstream does not supply expected lines. A definition-file mismatch can be a valid component usage location, especially with Option-click; keep the local exact-line suite too.

There are still 31 source-lookup mismatches including the six missing targets. Many involve adapters, inline components, projected children, and render tunnels; those remain in the report rather than being counted as successes. Real mouse checks also verify exact spotlight bounds and info-panel navigation (`bun run scripts/verify-exact-hover.ts`).

## Lookup optimization

A fresh baseline before this change measured 7.2 ms median and 42.5 ms p95 (275 definition files, 284 tree/context files). The final four-tool run measures 2.1 ms median and 18.6 ms p95: about 71% less median lookup time. Timing varies with dev-server load and cache state; this is not a hover FPS measurement.

The implementation follows React Grab's source strategy: reuse bippy decoded maps, share pending per-fiber resolution, and resolve independent host/owner work concurrently. Next.js endpoint requests are deduplicated and batched separately for browser/server frames. Frame scanning stops after the first usable source when no preferred component frame exists. Normal hover resolves the host first and postpones parent details until Option or the panel needs them. Failed source requests remain retryable.

Validation: 75 unit tests and workspace type checks pass; exact hover bounds and info-panel navigation pass in Chromium. The existing exact-line app suites still have failures: Next/Turbopack 19/20, Next/Webpack 2/20, Vite React 19 0/17. These same counts reproduce with the pre-optimization engine and inspector. React 18's current suite also has failures (6/17); its baseline rerun was unavailable after that server stopped. These failures are not counted as passing or fixed by this performance change.
