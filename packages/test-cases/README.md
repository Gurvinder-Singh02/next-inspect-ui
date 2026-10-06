# @next-inspect-ui/test-cases

Unit tests for `packages/next-inspect-ui`.

```bash
pnpm test
```

`src/lib.test.ts` locks paint, tooltip placement, shortcuts, and labels.
`src/engine.test.ts` locks climb, sourcemaps, and path rules.
`src/inspect-element.test.ts` locks SVG-under-host climb and chrome skip.
`src/styles.test.ts` locks the injected stylesheet, CSS variables, and SVG icons.

`src/fiber-stack.test.ts` covers V8 and Firefox/Safari stack formats, enclosing locations, owned-child traversal, component recovery, inline and indexed maps, ignored sources, retries, and React 18 caller metadata.
`src/source-cache.test.ts` covers shared promises, source revisions, retry behavior, and stale failures.

The current suite has 84 passing unit tests. The four browser apps separately verify 74 exact-source cases; see [source benchmarks](../../docs/source-benchmarks.md). Run `bun run typecheck` and `bun run typecheck:compat` from the repository root for library, site, and app type checks.
