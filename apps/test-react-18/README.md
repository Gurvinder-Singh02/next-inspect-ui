# test-react-18

Vite + React 18.3.1 (experimental). Run `bun run dev:test-react-18` from the repository root and open http://localhost:5174/test.

The same suite UI as every other test app: groups, status dots, Run all, Show source, and expected/result logs. This app runs 17 cases. Server Component cases run only in Next.js; Vite uses native links.

Run `bun run sync:test-ui` after updating the canonical UI in `apps/test-next-js`. Keep fixtures and exact source expectations local.

React 18 is experimental; the library still declares React 19+ support.
