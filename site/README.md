# site

Marketing site for next-inspect-ui.

```bash
pnpm --filter site dev
```

Usage lives on the overview page, with guarded imports for Next.js, React/Vite, and React entry points. React 18 is experimental. How it works describes the internal stack reader, source-map decoder, editor links, keyboard navigation, and production guard.

The bundle-size table reads `docs/benchmark-results.json`. Run `bun run benchmark` from the repository root to refresh it. Keep published explanations aligned with [App flow](../flow.md), [bundle measurements](../docs/benchmarks.md), and [source measurements](../docs/source-benchmarks.md).
