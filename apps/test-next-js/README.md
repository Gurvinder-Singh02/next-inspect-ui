# test-next-js

Next.js 16 + React 19, Turbopack. Run `bun run dev:test-next-js` from the repository root and open http://localhost:3000/test.

The same suite UI as every other test app: groups, status dots, Run all, Show source, and expected/result logs. This app runs 20 cases. Server Component cases run only in Next.js; Vite uses native links.

Run `bun run sync:test-ui` after updating the canonical UI in `apps/test-next-js`. Keep fixtures and exact source expectations local.
