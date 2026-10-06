# test-vite-react-19

Vite + React 19.2.4. Run `bun run dev:test-vite-react-19` from the repository root and open http://localhost:5173/test.

The same suite UI as every other test app: groups, status dots, Run all, Show source, and expected/result logs. This app runs 17 cases. Server Component cases run only in Next.js; Vite uses native links.

Run `bun run sync:test-ui` after updating the canonical UI in `apps/test-next-js`. Keep fixtures and exact source expectations local.

The latest local Chromium run passes all 17/17 exact-source cases with the internal resolver. Fixture expectations were unchanged. See [source benchmarks](../../docs/source-benchmarks.md) for the verification scope and comparison results.
