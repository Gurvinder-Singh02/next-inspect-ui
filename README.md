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
An editor link opens the file directly. Hold ⌥ to select the owning component; press Space for Component and Element trees. Left/Right switches tabs and Up/Down selects rows.

```
packages/next-inspect-ui              published library
packages/test-cases                   library unit tests
apps/nextjs                          dashboard with InspectUI
apps/test-next-js                    Next.js / Turbopack suite
apps/test-next-js-webpack            Next.js / Webpack suite
apps/test-vite-react-19              Vite / React 19 suite
apps/test-react-18                   Vite / React 18 suite
site                                marketing
```

```bash
pnpm install
pnpm --filter next-inspect-ui build
pnpm test           # library unit tests
pnpm dev            # site
bun run dev:test     # all four test apps
bun run dev:example  # dashboard
```

## Test apps

| App | Stack | Command | Port |
|---|---|---|---|
| `apps/nextjs` | Dashboard example | `bun run dev:nextjs` | 3102 |
| `apps/test-next-js` | Next.js 16 + React 19, Turbopack | `bun run dev:test-next-js` | 3001 |
| `apps/test-next-js-webpack` | Next.js 16 + React 19, Webpack | `bun run dev:test-next-js-webpack` | 3002 |
| `apps/test-vite-react-19` | React 19 + Vite | `bun run dev:test-vite-react-19` | 5173 |
| `apps/test-react-18` | React 18 + Vite, experimental | `bun run dev:test-react-18` | 5174 |

Open `/test` in any test app. Every suite uses the same header, group controls, case layout, source panels, and expected/result logs. The Next.js suites have 20 cases; Vite has the same 17 browser cases. The three Server Component cases require Next.js. Vite uses native links in place of Next.js links.

`apps/test-next-js` is the canonical UI. Run `bun run sync:test-ui` after changing its suite components or styles to update all test apps. Fixture files and exact source expectations remain local to each app.

React 18 is a compatibility target; the library still declares React 19+ support. A runnable app does not imply every inspection case passes.

Run `bun run typecheck:compat` to check all test apps. Each app has a matching `build:<app-name>` command. `bun run dev:test` starts all four test apps on ports 3001, 3002, 5173, and 5174. Press Ctrl+C to stop them together. If a port is busy, the launcher stops before starting any apps. `dev:example` remains an alias for `dev:nextjs`.

## Inspector comparison

Run `bun run dev:competitor` and open [localhost:3104](http://localhost:3104). `apps/competitor` has a dashboard with nested components, a searchable/filterable project table, a chart, a dialog, and server-rendered activity. Use the **Library** selector to compare Next Inspect UI, Show Component, React Grab, and Click to React Component. Switching reloads the page, keeping just one inspector loaded. This app is separate from the four-app `dev:test` launcher.

In the Element tab, Up/Down previews HTML elements with a half-opacity red highlight, without a ghost tooltip. Enter selects the preview; Enter again opens its source. Click `…` to select an element directly. The Component tree starts at the hovered element and follows its immediate parents up to the page/layout boundary.
