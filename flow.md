# App flow

Import `next-inspect-ui` dynamically only inside a development check, then mount `<InspectUI />` with no required props. Next.js uses `process.env.NODE_ENV === "development"`; Vite uses `import.meta.env.DEV`. The guarded import excludes the inspector module from the production graph. `projectRoot` is optional for explicitly resolving relative paths. Absolute source paths open through the configured editor URL; relative paths use Next.js’s `/__nextjs_launch-editor` or `/__open-in-editor` and fall back to the editor URL if unavailable. The dev server uses its configured editor.

Turn on InspectUI, hover an element, then click to open its source in your editor.

```text
Browser click
     ↓
DOM element
     ↓
React Fiber
     ↓
Fiber debug metadata
     ↓
Internal stack reader
     ↓
Source maps (when needed, e.g. Next.js server components)
     ↓
file.tsx:42:8
     ↓
Editor link / dev server
     ↓
Cursor / VS Code
```

Hover selects the topmost visible DOM element at the pointer, including SVG parts and classless or inline-styled children. It checks elementsFromPoint, descends open shadow roots, and skips inspector UI, document roots, hidden elements, and transparent page-covering surfaces. It does not promote icons, button children, or classless elements to a parent. Hit testing temporarily clears an inherited body pointer lock and restores it immediately, so modal-library locks do not force selection to the document root. Moving between children immediately updates selection; Option remains the explicit component-climb action.

## Source resolution

The DOM element connects to React through its Fiber. The resolver reads development metadata to find the element’s author, a component’s usage, or its definition. Those locations stay separate so Option-climb opens the intended source.

```text
React Fiber
     ↓
JSX source / creation stack / server debug info
     ↓
Internal stack reader
     ↓
Project frame found? ── yes → file, line, column
     ↓ no
Browser source map / Next.js development endpoint
     ↓
file, line, column
```

React 18 JSX locations take priority when present. Generated hosts without their own JSX source use the component’s caller metadata. React 19 creation stacks locate authors and usage; frames from children owned by a component can locate its definition. V8 provides enclosing function locations, while other engines use parsed stack strings. React’s debug fields are internal, so their availability depends on the React version and development build.

When React supplies only an `UnknownOwner` stack, cached React DevTools-style recovery samples component types along the render ancestry. It disables the hook dispatcher during the sample and restores dispatcher and console state immediately. Known vendor wrappers keep the owner/debug-info fallback instead of selecting unrelated parents. The source resolver, stack reader, and map decoder are internal; `bippy/source` is no longer a library dependency. React and ReactDOM remain peer dependencies.

Browser frames try a downloadable source map first. The decoder handles map URL comments, inline maps, indexed sections, ignored sources, and unmapped segments. It decodes each map once and uses binary search for generated columns. Framework runtime and vendor entries are excluded. Failed downloads are evicted so they can retry.

Next.js server frames and Webpack stack URLs use `/__nextjs_original-stack-frames` with the matching server/browser mode. Next.js browser chunks use that endpoint when a downloadable map cannot resolve the location. Concurrent endpoint requests are grouped by mode; identical pending frames share a result. Failed requests can retry.

Absolute source paths open through the configured editor URL. Relative paths use `/__nextjs_launch-editor` or `/__open-in-editor`, with an editor URL fallback. The dev server uses its configured editor. Source labels show a project-relative path or filename; opening the editor still uses the original source location.

## UI flow

```text
Option + X
     ↓
Hover an element
     ↓
See its name and source
     ↓
Click to open the source
     ↓
Space → Component / Element tabs
     ↓
Left / Right → switch tabs
Up / Down → select or preview a row
Enter → open source
```

| Control | Action |
|---|---|
| Option + X (Alt + X on Windows/Linux) | Turn the tool on or off. |
| Hover | Highlight an element and find its source. |
| Click or Enter | Open the selected source in the editor. |
| Space | Open or close the tree popover. Component opens first by default. |
| Up / Left with the popover closed | Move to the previous sibling element. |
| Down / Right with the popover closed | Move to the next sibling element. |
| Left / Right with the popover open | Switch between Component and Element tabs. |
| Up / Down with the popover open | Select a component row or preview an element row. |
| Command + Up / Down (Ctrl on Windows/Linux) with the popover open | Jump to the first / last row in the current tab, including closing tags. |
| `[` / `{` | Move to a parent inspectable element. |
| `]` / `}` | Move to a child inspectable element. |
| Enter or click in Element | Open the selected element’s source. |
| Hold Option / Alt | Select a parent component’s source. |
| Escape | Turn the tool off. |

Element navigation follows the rendered elements. Hold Option / Alt to select the immediate owning component; Shift has no climb action and adds no tooltip.

Space pins the hovered element and opens an underline tab bar. The Component tab shows the immediate React parent chain within the current page, starting with the hovered element, then its owning component and successive parents. The tree stops after the page component, or before the nearest layout when there is no page boundary. Layouts and surrounding app providers stay outside the tree; local components and providers remain in their actual order. Framework internals and transparent vendor wrappers are skipped. The Element tab shows the actual HTML tree: 1–15 element nodes, prioritizing nearby siblings, then ancestors, then descendants with any remaining space. Ancestors stop at `<body>`; `<html>` and `<head>` stay outside the tree. It nests child rows between parent opening and closing tags. Text stays inline with its element’s tags; the hovered element row is selected by default. Up / Down can reach closing tags too; they highlight and open the same element as their opening tag. Rails continue through the closing rows. The tree includes text and actual HTML attributes, and scrolls as one area without row buttons or relation labels (void elements have no closing tag), without separate CSS or Tailwind sections.

Left / Right switches tabs; Up / Down selects rows without changing the pinned target. In Element, another row shows a separate highlight matching the current preset at 100% overall opacity, without a ghost tooltip while the current target stays pinned. Enter, clicking a row, or clicking its preview opens that element’s source without adopting it or changing the hover tooltip. Switching tabs or closing the panel clears the preview. In Component, moving through rows shows the same ghost highlight matching the current preset at 100% overall opacity around the component’s rendered elements, while the original target stays pinned. Enter, a source link, or clicking that ghost opens the selected row’s file. Each tab remembers its row while the popover is open. Space closes it and restores focus; Escape exits inspect mode. A new popover starts on Component, or on Element when configured with `<InspectUI popoverProps={{ defaultTab: "element" }} ... />`.


## Test suite flow

All test apps use the same suite UI: choose groups, press **Run all**, then open **Logs** to compare expected and found source locations. **Show source** opens the fixture snippets. Vite runs the browser cases; Next.js also runs the Server Component cases.

The latest Chromium verification passes all 74 cases: Next/Turbopack 20/20, Next/Webpack 20/20, Vite React 19 17/17, and React 18 17/17. Fixture expectations were unchanged. React 18 remains experimental; the package declares React 19+ peer support.

Names, files, lines, and node counts must match exactly. Each app keeps its own expectations: Vite’s local Link has its host in `src/link.tsx`, and React 18’s generated hosts use the caller fallback described above.

## Inspector presentation

The selected row updates the panel title and its source link. Opening the panel and resolving row sources leave the tooltip unchanged; only deliberate row navigation can update it. The first Component row shows the hovered element and preserves its Option icon (`⌥`) when an owner is available. Only when the hovered host supports Option climbing (such as a Button host), the second row shows the immediate owner and source, matching Option-click. A plain nested HTML element such as `<h1>` shows no climb icon and ancestor rows do not change its tooltip. Further ancestor rows keep that tooltip fixed while the panel title, source link, and ghost change. Element selection also keeps the tooltip fixed. The title source uses the same short path and line as the tooltip. Continuous left rails show row depth; component rows show only file name and line. The footer shows keyboard hints: Left / Right switches tabs, Up / Down previews rows, Enter selects or opens, and Space closes. An Option icon (`⌥`) on the hover tooltip means Option can select an owning component. Holding Option shows the React icon instead.

The default tooltip and spotlight are blue (`#006efe`). The spotlight uses 10% fill and a solid 0.5px border. It follows the element’s actual bounds and computed corners, with no custom spotlight padding or radius props. Tooltip padding and radius remain configurable.

The tooltip has no border or border-color prop.

Ghost previews use the current preset’s fill and border colors at 100% overall opacity. The ghost border is dotted and 1px wide at full opacity. Its fill uses the preset color at half the current highlight fill opacity (5% when the highlight is 10%). Animation and element corners follow the current spotlight settings.

Show full URL (`tooltipProps.showFullUrl`) controls the source label in the tooltip and panel title: on shows the current path and line; off shows only the filename and line. The source label is always visible when available.

## Production flow

`Development check → dynamic import → InspectUI`. Guard the import itself so the bundler removes the development-only branch and excludes the whole library in production. The production result contains **0 B of inspector code**. Guarding only the rendered component while keeping a static import can retain a small wrapper; the internal development check disables the inspector but does not guarantee the whole package is excluded.

Next.js uses an async layout:

```tsx
const InspectUI = process.env.NODE_ENV === "development"
  ? (await import("next-inspect-ui")).InspectUI
  : null
```

Vite uses its build-time development flag:

```tsx
const InspectUI = import.meta.env.DEV
  ? (await import("next-inspect-ui")).InspectUI
  : null
```

Mount `{InspectUI && <InspectUI />}` once beside the app. Keep existing fonts, providers, styles, and metadata. The guard works for npm, workspace, and local-path installs.

Run `bun run benchmark` for the repeatable bundle check. The current component is 23.1 kB gzip in development; the standalone script is 81.2 kB. These are standalone measurements, not the total app size. See [Bundle benchmarks](docs/benchmarks.md).

## Dev-only script setup

Next.js can also load `<Script src="/inspect-ui.js" strategy="afterInteractive" />` only when `NODE_ENV` is development. The local route serves the installed `next-inspect-ui/script` file and returns 404 in production. The standalone script mounts the inspector automatically; do not mount the component too. Production visitors receive no inspector script tag or script download. The script bundles its own React runtime, making it larger in development than the component setup.

## Source benchmark flow

`bun run dev:bench` → port 3106 → `bun run benchmark:source` → 330 upstream cases → compare expected definition files with source results → `docs/source-benchmark-results.json`. This local test opens no editor and uses no agent API. See `docs/source-benchmarks.md` for scoring limits.

`bun run benchmark:open` exercises the actual hover and click handlers for normal click and Option-click. It intercepts editor endpoint requests, records file/line/column in `docs/open-benchmark-results.json`, and opens no editor. Pointer hits are controlled so offscreen fixtures can be tested. The upstream expected file is the component definition; JSX usage correctness needs separate expectations.

Source labels in the tooltip and panel show project-relative paths, never the machine’s absolute path. When no projectRoot is set, recovered absolute paths are shortened at the workspace app/package or a source folder; root files show their filename. Editor opening still uses the original full source path.

Unavailable source or navigation targets do not shake or flash the highlight or tooltip.

## Source lookup performance

`Hover → cached host source → tooltip`. A successful host lookup updates the tooltip immediately, without waiting for component definitions or the complete owner chain. Option resolves its selected owner; the tree resolves row sources when opened. Missing host locations retain the definition and owner fallback paths.

Hover, panel, pointer-down warming, and editor opening share per-fiber source promises. Cache revisions include React source metadata so edits trigger a new lookup; missing sources and failed requests are evicted. Outdated Option requests cannot repaint a different hovered element. Host promises and map requests belong to the mounted inspector. Parsed stacks and component samples use weak caches keyed by Error or component type, so they can be collected when those objects are no longer referenced.

The development inspection probe still waits for the full owner chain. Host and chain work run concurrently, and the optional profiling flag reports both durations from their common start; the durations overlap and must not be added. The source benchmark retains its complete context and exact-file scoring.

The latest source report measures 1.1 ms median and 3.8 ms p95 for lookup plus tree/context gathering. It finds 305/330 expected definition files, including six missing targets in the denominator. This is not an exact-line score, hover FPS, or editor launch time. All 84 unit tests and workspace/compatibility type checks pass. See [Source benchmarks](docs/source-benchmarks.md) for the full report.
