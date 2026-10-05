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
| next-inspect-ui | 305/330 | 311/330 | 1.1 ms | 3.8 ms |
| react-grab | 270/330 | 9/330 | 1.3 ms | 3.6 ms |
| show-component | 5/330 | 8/330 | 0.0 ms | 0.2 ms |
| click-to-react-component | 0/330 | 0/330 | 4.5 ms | 6.0 ms |

Next Inspect UI uses its internal stack reader and source-map decoder, with no source-resolution dependency. It matches 305 definition files in this run; the previous bippy-based report matched 299. The full owner chain is still gathered for this comparison; hover can paint sooner after its host source resolves. Show Component’s near-zero timings mostly reflect cached framework locations, not correct resolution.

The earlier surrounding-page results came from parent promotion and unreliable debug stacks. Exact hover no longer promotes classless children to groups. Source recovery now prefers a project source from trusted debug information or a recovered component stack, before falling back to a page. React 18 JSX metadata remains supported. Component usage and definition sources remain separate for the existing UI and Option-climb flow.

## Actual editor-opening check

Run `bun run benchmark:open`. This loads only our inspector and exercises its real hover, pointer-down, and click handlers, with and without Option. DOM hits are controlled at each target’s coordinates. It intercepts local editor endpoint requests and stubs only the final editor-protocol assignment in the delivered test JavaScript. Source resolution and the click handler are unchanged. No editor is launched.

| Mode | Requested expected definition file | Missing target | No captured destination |
|---|---:|---:|---:|
| click | 305/330 | 6 | 0 |
| optionClick | 299/330 | 6 | 0 |

`open-benchmark-results.json` contains the requested file, line, and column for every available target. This does not verify the editor application launches, and upstream does not supply expected lines. A definition-file mismatch can be a valid component usage location, especially with Option-click; keep the local exact-line suite too.

There are still 25 source-lookup mismatches including the six missing targets. Many involve adapters, inline components, projected children, and render tunnels; those remain in the report rather than being counted as successes. Real mouse checks also verify exact spotlight bounds and info-panel navigation (`bun run scripts/verify-exact-hover.ts`).

## Internal resolver

The previous bippy-based report measured 2.1 ms median and 18.6 ms p95. The internal resolver measures 1.1 ms median and 3.8 ms p95 in this run. Timing varies with dev-server load and cache state; this is not a hover FPS measurement. Development component gzip falls from 30,510 B to 23,624 B; standalone script gzip falls from 89,516 B to 83,171 B. A guarded production import still excludes the library.

The stack reader uses V8 enclosing locations when available and parses formatted stacks on other engines. Creation frames take priority over fallback recovery. When React supplies only an UnknownOwner stack, a cached React DevTools-style component sample recovers a frame with the hook dispatcher disabled and restores dispatcher and console state immediately. Known vendor stacks retain the owner/debug-info fallback instead of selecting an unrelated parent. React 18 JSX metadata takes priority for generated hosts.

Browser source maps are fetched once per inspector cache, decoded once per map, and searched by generated column with binary search. Map comments, inline maps, indexed sections, ignored sources, and unmapped segments are supported. Failed map requests are evicted. Next.js endpoint requests remain deduplicated and batched by browser/server mode. Hover resolves the host first; parent details wait until Option or the panel needs them.

Validation: all 74 exact-source cases pass in local Chromium: Next/Turbopack 20/20, Next/Webpack 20/20, Vite React 19 17/17, React 18 17/17. Fixture expectations were not changed. All 84 unit tests and workspace/compatibility type checks pass. Exact hover bounds and info-panel navigation also pass in Chromium. The benchmark still has unmatched definition files and missing targets, as reported above.

## Source availability

The fresh run returns a file path for all 324 rendered targets. Of those, 305 match the expected definition file (94.1%); 19 return a different file. Six of the 330 fixtures are missing. There are no lookup errors. Returning a file is separate from matching the intended definition; some different files are valid JSX usage locations.

The tree/context includes the expected file for 311 targets. Real click and Option-click each capture a destination for all 324 rendered targets; definition matches are 305 and 299 respectively. No editor application is launched.

[Source status](source-status.json) records the counts, percentages, 19 different-file cases, and six missing targets. [Compatibility results](compatibility-test-results.json) includes the original expected/result logs for all 74 passing cases.
