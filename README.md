# next-inspect-ui

Dev-only overlay for Next.js. Hover any element to see its source, click to open it.

## How it works

```text
Browser click
     ↓
DOM element
     ↓
React Fiber
     ↓
Fiber debug metadata
     ↓
Source maps (when needed)
     ↓
file.tsx:42:8
     ↓
Editor link
     ↓
Cursor / VS Code
```

Browser code uses source maps. Server code can use Next.js's stack-frame endpoint.
An editor link opens the file directly. Hold ⌥ to climb owners; press Space for the info panel.

```
packages/next-inspect-ui              published library
packages/test-cases                   library unit tests
apps/test                            /test suite and cases
apps/example-01                      dashboard with InspectUI installed
site                                  marketing
```

```bash
pnpm install
pnpm --filter next-inspect-ui build
pnpm test           # library unit tests
pnpm dev            # site
bun run dev:test     # /test suite
bun run dev:example  # dashboard
```

## Compatibility apps

| App | Stack | Run | URL |
|---|---|---|---|
| `apps/test` | Next.js 16 + React 19, Turbopack | `bun run dev:test` | `/test` on port 3000 |
| `apps/test-next-js` | Next.js 16 + React 19, Webpack | `bun run dev:test-next-js` | `/test` on port 3002 |
| `apps/test-vite-react` | React 19 + Vite | `bun run dev:test-vite-react` | `/test` on port 5173 |
| `apps/test-react-18` | React 18 + Vite, experimental | `bun run dev:test-react-18` | `/test` on port 5174 |

Click **Run all** in each app to compare exact node names and source lines. The Vite apps cover browser components; Server Component cases live in the Next.js apps. React 18 is a compatibility test target, not a change to the library’s React 19+ support.

Initial checks: Vite + React 19 passes 8/8. React 18 passes 3/8; Next.js + Webpack passes 0/20 because source locations do not resolve. These apps expose compatibility gaps; their existence does not imply full support.

Run `bun run typecheck:compat` to check all three apps. Each has a matching `build:test-*` command.
