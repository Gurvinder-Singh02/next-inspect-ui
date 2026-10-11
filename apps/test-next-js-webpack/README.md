# test-next-js-webpack

Next.js 16 + React 19, Webpack. Run `bun run dev:test-next-js-webpack` from the repository root and open http://localhost:3002/test.

The same suite UI as every other test app: groups, status dots, Run all, Show source, and expected/result logs. This app runs 20 cases. Server Component cases run only in Next.js; Vite uses native links.

Run `bun run sync:test-ui` after updating the canonical UI in `apps/test-next-js`. Keep fixtures and exact source expectations local.

The latest local Chromium run passes all 20/20 exact-source cases with the internal resolver. Fixture expectations were unchanged.
