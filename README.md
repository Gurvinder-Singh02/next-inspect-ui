# next-inspect-ui

Inspect any React or Next.js component in your browser and jump directly to its source in your IDE. Works with compound components too. Hold Option / Alt to inspect the owning component’s usage.

## Installation

Install with your preferred package manager:

**npm**

```bash
npm i -D next-inspect-ui
```

**pnpm**

```bash
pnpm add -D next-inspect-ui
```

**yarn**

```bash
yarn add -D next-inspect-ui
```

**bun**

```bash
bun add -D next-inspect-ui
```

## Usage

<details open>
<summary>Next.js</summary>

**Tell your agent**

```text
Install next-inspect-ui as a dev dependency. In the async Next.js root layout, dynamically import InspectUI inside a NODE_ENV development check. Mount it once alongside children inside body, preserving existing fonts, providers, and styles.
```

Or do it manually. Add this to app/layout.tsx. Keep your existing fonts, providers, and body styles.

```tsx
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const InspectUI = process.env.NODE_ENV === "development"
    ? (await import("next-inspect-ui")).InspectUI
    : null

  return (
    <html lang="en">
      <body>
        {children}
        {InspectUI && (
          <InspectUI />
        )}
      </body>
    </html>
  )
}
```

</details>

<details>
<summary>React (Vite)</summary>

**Tell your agent**

```text
Install next-inspect-ui as a dev dependency in this React + Vite app. In src/main.tsx, dynamically import InspectUI only when import.meta.env.DEV is true. Mount it once alongside App, preserving StrictMode, providers, and styles. Keep it out of the production bundle.
```

Or do it manually. Add this to src/main.tsx. Vite replaces import.meta.env.DEV at build time.

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"

async function main() {
  const InspectUI = import.meta.env.DEV
    ? (await import("next-inspect-ui")).InspectUI
    : null

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
      {InspectUI && <InspectUI />}
    </StrictMode>
  )
}

void main()
```

</details>

<details>
<summary>React</summary>

**Tell your agent**

```text
Install next-inspect-ui as a dev dependency in this React app. In the root entry, dynamically import InspectUI inside a NODE_ENV development check. Mount it once alongside App, preserving StrictMode, providers, styles, and performance reporting. Keep it out of the production bundle.
```

Or do it manually. For Create React App, update src/index.js. Keep any existing performance reporting after the render.

```jsx
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

async function main() {
  const InspectUI = process.env.NODE_ENV === "development"
    ? (await import("next-inspect-ui")).InspectUI
    : null

  const root = ReactDOM.createRoot(document.getElementById("root"))
  root.render(
    <React.StrictMode>
      <App />
      {InspectUI && <InspectUI />}
    </React.StrictMode>
  )
}

void main()
```

</details>

<details>
<summary>React 18</summary>

**Tell your agent**

```text
Set up next-inspect-ui for this experimental React 18 + Vite app. Check the React 19+ peer dependency requirement first and explain any compatibility changes needed. Dynamically import InspectUI only when import.meta.env.DEV is true and mount it once alongside App. Preserve existing providers and styles; do not upgrade React without asking.
```

Or do it manually. React 18 + Vite is experimental. The package declares React 19+ peer support; React 18 source locations may be incomplete.

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"

async function main() {
  const InspectUI = import.meta.env.DEV
    ? (await import("next-inspect-ui")).InspectUI
    : null

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
      {InspectUI && <InspectUI />}
    </StrictMode>
  )
}

void main()
```

</details>

## FAQ

### How does this work?

Press Option / Alt + X to enable inspect mode, then hover an element. The inspector reads React Fiber metadata and source maps to find its source. Click or press Enter to open it. Hold Option / Alt to inspect the owning component’s usage.

### Does this affect production?

Use the development-only dynamic import shown in Usage. Your bundler tree-shakes the whole library, leaving 0 B of inspector code in production. A static import disables the inspector but may retain a small wrapper. Serve the standalone script only in development.

### Does it rely on any other libraries internally?

No additional runtime libraries are required. Source resolution, stack parsing, and source-map decoding are built in. React and ReactDOM are peer dependencies.

### Is this a build plugin?

No. There is no Webpack, Vite, Turbopack, Babel, or SWC plugin. You mount InspectUI in development. It reads the React fiber tree at runtime. No props are required. projectRoot can optionally resolve relative paths explicitly.

### Does this only work with Next.js?

No. It supports React 19+ apps, including Next.js and Vite. React 18 compatibility is experimental. Source accuracy depends on your framework’s development metadata and source maps; Next.js Server Component locations use available server debug metadata.

### How do I navigate the tree?

Press Space to open the popover. Component shows immediate parents up to the page boundary. Element shows nearby HTML, stopping at body. Left / Right switches tabs; Up / Down moves between rows and previews their elements. Enter opens the selected source. Press Space to close the popover or Escape to exit inspect mode.

### Which editors does it support?

Cursor, VS Code, VS Code Insiders, Windsurf, and Zed. Choose your editor in the inspector settings. The inspector opens source through an editor URL or your framework’s development endpoint.

### What kind of elements can I inspect?

Elements connected to React’s rendered tree, including:

- HTML: headings, buttons, links, cards.
- SVG: `svg`, `rect`, and SVG components.
- shadcn/ui: Button, Card, Badge, and nested composition.
- Base UI: `useRender` hosts and nested children such as Collapsible Trigger / Panel.
- Motion: `motion.div` and `motion.rect`.
- Radix: Slot / `asChild`.
- React: `forwardRef`, `memo`, and compound components.
- Lists: children created in `.map()`.
- Icons: Lucide and other third-party SVG.
- Server-rendered HTML when Next.js exposes source metadata.

See the [example dashboard](apps/nextjs/README.md) and [API reference](packages/next-inspect-ui/README.md#props).

<details>
<summary>How it works, repository development, tests, and benchmarks</summary>

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
Editor link / dev server
     ↓
Cursor / VS Code
```

The internal stack reader uses React’s development metadata first, then source maps when needed. Next.js server and Webpack frames use the development stack-frame endpoint.
Absolute paths open through an editor link. Relative paths use the local dev server’s editor endpoint, with an editor-link fallback. Hold ⌥ to select the owning component; press Space for Component and Element trees. Left/Right switches tabs and Up/Down selects rows.

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

React 18 remains experimental; the package declares React 19+ peer support. The latest Chromium run passes all 74 exact-source cases: 20 in each Next.js app and 17 in each Vite app. Fixture expectations were unchanged.

Run `bun run typecheck:compat` to check all test apps. Each app has a matching `build:<app-name>` command. `bun run dev:test` starts all four test apps on ports 3001, 3002, 5173, and 5174. Press Ctrl+C to stop them together. If a port is busy, the launcher stops before starting any apps. `dev:example` remains an alias for `dev:nextjs`.

## Inspector comparison

Run `bun run dev:competitor` and open [localhost:3104](http://localhost:3104). `apps/competitor` has a dashboard with nested components, a searchable/filterable project table, a chart, a dialog, and server-rendered activity. Use the **Library** selector to compare Next Inspect UI, Show Component, React Grab, and Click to React Component. Switching reloads the page, keeping just one inspector loaded. This app is separate from the four-app `dev:test` launcher.

In the Element tab, Up/Down previews HTML elements with a highlight that follows the current preset, without a ghost tooltip. Enter or clicking a row opens its source while the original element stays pinned. The Component tree starts at the hovered element and follows its immediate parents to the page boundary. See [App flow](flow.md) for the full control table.

## Benchmarks

Run `bun run benchmark` for [bundle sizes](docs/benchmarks.md). The development component is 23.1 kB gzip and the standalone script is 81.2 kB gzip. A development-only dynamic import excludes the whole library from production, leaving 0 B of inspector code. A static import disables the inspector but can retain a small wrapper.

The latest [source benchmark](docs/source-benchmarks.md) measures 1.1 ms median and 3.8 ms p95, with 305 of 330 expected definition files found. These measurements include source lookup and tree/context gathering; they do not measure hover FPS or editor launch time.

A dev-only standalone script is also available, like React Grab. The Next.js dashboard uses a guarded `/inspect-ui.js` script; the route returns 404 in production. See the [script setup](packages/next-inspect-ui/README.md#dev-only-script-like-react-grab).

For the 330-case component source comparison, see [source-benchmarks](docs/source-benchmarks.md). Run `bun run dev:bench`, then `bun run benchmark:source`.

Hover selects the exact visible element under the pointer, including SVG parts and classless children. Hold Option / Alt to climb to a component; hover does not automatically select its group.

Source lookup uses the built-in React stack reader and source-map decoder. It reads JSX debug metadata when available and recovers component frames when creation stacks are missing. No additional source-resolution library is required. The inspector keeps its own UI, editor opening, and component navigation; no AI or clipboard feature is involved.

</details>
