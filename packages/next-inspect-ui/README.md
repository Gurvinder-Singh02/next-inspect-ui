# next-inspect-ui

Development inspector for React apps. Enable inspect mode, hover an element to see its source, then click to open it in your editor. Hold Option / Alt to inspect its owning component.

```bash
npm i -D next-inspect-ui
```

```tsx
// app/layout.tsx

import type { ReactNode } from "react"

export default async function RootLayout({ children }: { children: ReactNode }) {
  const InspectUI = process.env.NODE_ENV === "development"
    ? (await import("next-inspect-ui")).InspectUI
    : null

  return (
    <html>
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

Press <kbd>⌥</kbd><kbd>X</kbd> to toggle inspect mode.

| key | action |
|---|---|
| hover | show the element's tag and source file |
| click / Enter | open the selected source in your editor |
| ⌥ hold | climb to the component that rendered it |
| `[` / `{` · `]` / `}` | move to the parent / child element |
| `Space` | toggle the Component and Element popover |
| `↑` `↓` | select tree rows when the popover is open; otherwise move between siblings |
| `←` `→` | switch tabs when the popover is open; otherwise move between siblings |
| Command / Ctrl + `↑` / `↓` | jump to the first / last row in the open tab |
| `Esc` | exit |

## Props

| prop | type | |
|---|---|---|
| `projectRoot` | `string` (optional) | Explicit root for relative source paths; not needed for basic setup. |
| `shortcut` | `string` | Inspect-mode shortcut; defaults to `"Alt+X"`. |
| `ide` | `InspectorIde` | Editor for source links; defaults to `"cursor"`. |
| `tooltipProps` | `Partial<TooltipProps>` | Tooltip appearance, placement, and source labels. |
| `devSpotlightProps` | `Partial<DevSpotlightProps>` | Spotlight color, fill, border, and animation. |
| `popoverProps` | `{ defaultTab?: "component" \| "element" }` | initial tree tab; defaults to `"component"` |

The Component tab shows immediate ancestors through the page, stopping before layouts and the app shell. The Element tab shows 1–15 nested HTML nodes, prioritizing siblings, then parents, then children. Use `popoverProps={{ defaultTab: "element" }}` to start on Element. Shift does not climb.

Choose your editor, colors, spotlight, and tooltip styling in the inspector settings.

Supported editors: Cursor, VS Code, VS Code Insiders, Windsurf, Zed.

The default tooltip and spotlight use `#006efe`. The spotlight follows the element’s bounds and computed corners, with 10% fill and a solid 0.5px border.

## React and Vite

React 19+ is supported. React 18 compatibility is experimental and requires development JSX source metadata for the most reliable locations. React and ReactDOM are peer dependencies; the library has no additional runtime dependencies.

For Vite, guard the dynamic import with `import.meta.env.DEV`:

```tsx
// src/main.tsx
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

## Source resolution

The internal resolver reads React’s development metadata. React 18 JSX locations take priority when present. React 19 creation stacks locate element authors and component usage; child-owned frames can locate component definitions. V8 supplies enclosing function locations, while other engines use parsed stack strings.

When creation metadata is missing, a cached React DevTools-style recovery samples the component with the hook dispatcher disabled and restores dispatcher and console state immediately. Known vendor wrappers retain the owner/debug-info fallback. Source availability depends on React’s internal fields and your bundler’s development output.

The built-in source-map decoder handles inline maps, map URL comments, indexed sections, ignored sources, and unmapped segments. Maps are decoded once and searched by generated column. Next.js development endpoints resolve server and Webpack frames, and recover browser locations when a downloadable map is unavailable. Failed requests can retry.

Hold Option / Alt to select the owning component’s usage. Press Space for Component and Element tabs. Up/Down previews rows; Enter or clicking a row opens its source while the original element stays pinned. Ghosts follow the current highlight preset and show no tooltip. Element ancestors stop at `<body>`.

## Production

Guard the import itself, as shown in the Next.js and Vite examples. Your bundler removes the development-only branch containing the import and excludes the whole library, leaving **0 B of inspector code**. The package’s internal development check also disables the inspector after a static import, but that can retain a small wrapper. Guarding only `<InspectUI />` while keeping a static import does not guarantee that the entire library is excluded.

## Local development

Inside this monorepo, apps use the workspace package. Run `pnpm install`, then `bun run build` from the repository root. Use `bun run dev:lib` to rebuild the component package as you edit it.

To try the package in another local project, install it from its directory and build its `dist/` files first. Keep the same guarded import in that project. The guard is required whether the package comes from npm, a workspace, or a local path.

## Benchmarks

Run `bun run benchmark` for [bundle measurements](../../docs/benchmarks.md): 23.1 kB gzip for the development component, 81.2 kB for the standalone script, and 0 B of inspector code with a guarded production import.

Run `bun run dev:bench`, then `bun run benchmark:source` for the [330-case source comparison](../../docs/source-benchmarks.md). The latest run measures 1.1 ms median and 3.8 ms p95, finding 305 expected definition files. This score does not verify exact JSX lines or editor launch time.

The local compatibility suites pass all 74 exact-source cases in Chromium. All 84 unit tests and workspace type checks pass. React 18 remains experimental despite those passing fixtures.

## Dev-only script (like React Grab)

The package also exports a self-contained script as `next-inspect-ui/script`. Serve it locally using the [example route](../../apps/nextjs/app/inspect-ui.js/route.ts), which returns 404 in production, and add this in your layout:

```tsx
import Script from "next/script"

{process.env.NODE_ENV === "development" && (
  <Script src="/inspect-ui.js" strategy="afterInteractive" />
)}
```

No inspector component import or mount is needed with this setup. Production excludes the script tag and download. The script includes its own React runtime; use the component setup for a smaller development download. Never include the script unconditionally.

Hover selects the exact visible element under the pointer, including SVG parts and classless children. Hold Option / Alt to climb to a component; hover does not automatically select its group.

Source lookup uses the built-in React stack reader and source-map decoder. It reads JSX debug metadata when available and recovers component frames when creation stacks are missing. No additional source-resolution library is required. The inspector keeps its own UI, editor opening, and component navigation; no AI or clipboard feature is involved.

## License

MIT
