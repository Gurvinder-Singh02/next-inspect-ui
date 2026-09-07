# @next-inspect-ui/test-cases

Unit tests for `packages/next-inspect-ui`.

```bash
pnpm test
```

`src/lib.test.ts` locks paint, tooltip placement, shortcuts, and labels.
`src/engine.test.ts` locks climb, sourcemaps, and path rules.
`src/inspect-element.test.ts` locks SVG-under-host climb and chrome skip.
`src/styles.test.ts` locks the injected stylesheet, CSS variables, and SVG icons.
