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
Fiber debug metadata (React adds this in development)
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

The DOM element is what you see on the page. Its React Fiber connects it to the React tree. The tool follows that tree to find the element’s source or the selected parent component’s source. React 19 lookups use `bippy/source`, the source resolver also used by React Grab, to recover trusted owner stacks or component frames and map them to project files. Browser creation frames reuse `bippy/source` decoded source maps before asking the Next.js stack endpoint. Framework runtime and vendor map entries are excluded. React 18 JSX metadata remains the first path when present. Component definitions and component usage locations stay separate so Option-climb keeps its existing behavior.

React’s debug fields can contain a file location or a stack trace. They are internal fields, so their availability depends on the React version and build tool.

A source map connects built JavaScript to the original TSX file. It is separate from React’s metadata. Next.js browser chunks use the development stack-frame endpoint with browser mode; other browser builds use source maps when needed; server code can use Next.js’s development stack-frame endpoint. Concurrent Next.js frame requests are grouped by browser/server mode and identical pending requests share one result. Failed requests can retry. Once the tool finds the file, line, and column, an editor link opens that location.

Webpack’s browser and server stack URLs also use Next.js’s development stack-frame endpoint, with the matching browser or server mode. Vendor host builders with the same name as a project wrapper are skipped so the wrapper keeps its usage location. React 18 reads a component’s own JSX source for that usage, including wrappers defined in the same file. When a React 18 host is built with `createElement` or `useRender` and has no JSX source, its location falls back to the component’s caller.

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

Names, files, lines, and node counts must match exactly. Each app keeps its own expectations: Vite’s local Link has its host in `src/link.tsx`, and React 18’s generated hosts use the caller fallback described above.

## Competitor app flow

Run `bun run dev:competitor` → open port 3104 → choose a library → the page reloads → try that library’s shortcut on the same dashboard. The selection is stored in a cookie. **Off** loads no inspector.

Agentation and InterfaceKit also mount in development, independently of the inspector switch. Use their own buttons to annotate elements or adjust styles; both remain available when the inspector selection is **Off**.

The comparison toolbar stays usable while inspecting. Only the selected inspector loads in development. React Grab’s installed script loads before React; the other inspectors mount as client components. Show Component uses Option + right-click (add Shift for its tree). React Grab uses ⌘C / Ctrl+C. Click to React Component uses Option + click and depends on older React source metadata, so lookup may fail on this React 19 page.

The selected row updates the panel title and its source link. Opening the panel and resolving row sources leave the tooltip unchanged; only deliberate row navigation can update it. The first Component row shows the hovered element and preserves its Option icon (`⌥`) when an owner is available. Only when the hovered host supports Option climbing (such as a Button host), the second row shows the immediate owner and source, matching Option-click. A plain nested HTML element such as `<h1>` shows no climb icon and ancestor rows do not change its tooltip. Further ancestor rows keep that tooltip fixed while the panel title, source link, and ghost change. Element selection also keeps the tooltip fixed. The title source uses the same short path and line as the tooltip. Continuous left rails show row depth; component rows show only file name and line. The footer shows keyboard hints: Left / Right switches tabs, Up / Down previews rows, Enter selects or opens, and Space closes. An Option icon (`⌥`) on the hover tooltip means Option can select an owning component. Holding Option shows the React icon instead.

The default tooltip and spotlight are blue (`#006efe`). The spotlight uses 10% fill and a solid 0.5px border. It follows the element’s actual bounds and computed corners, with no custom spotlight padding or radius props. Tooltip padding and radius remain configurable.

The tooltip has no border or border-color prop.

Ghost previews use the current preset’s fill and border colors at 100% overall opacity. The ghost border is dotted and 1px wide at full opacity. Its fill uses the preset color at half the current highlight fill opacity (5% when the highlight is 10%). Animation and element corners follow the current spotlight settings.

Show full URL (`tooltipProps.showFullUrl`) controls the source label in the tooltip and panel title: on shows the current path and line; off shows only the filename and line. The source label is always visible when available.

## Production flow

`Development check → dynamic import → InspectUI`. In production the import branch is removed. Keep the component as a sibling of the app. Use an async Next.js layout; Vite checks `import.meta.env.DEV`. Run `bun run benchmark` for repeatable standalone bundle sizes; see `docs/benchmarks.md`. This benchmark measures bytes, not interaction speed.

## Dev-only script setup

Next.js can also load `<Script src="/inspect-ui.js" strategy="afterInteractive" />` only when `NODE_ENV` is development. The local route serves the installed `next-inspect-ui/script` file and returns 404 in production. The standalone script mounts the inspector automatically; do not mount the component too. Production visitors receive no inspector script tag or script download. The script bundles its own React runtime, making it larger in development than the component setup.

## Source benchmark flow

`bun run dev:bench` → port 3106 → `bun run benchmark:source` → 330 upstream cases → compare expected definition files with source results → `docs/source-benchmark-results.json`. This local test opens no editor and uses no agent API. See `docs/source-benchmarks.md` for scoring limits.

`bun run benchmark:open` exercises the actual hover and click handlers for normal click and Option-click. It intercepts editor endpoint requests, records file/line/column in `docs/open-benchmark-results.json`, and opens no editor. Pointer hits are controlled so offscreen fixtures can be tested. The upstream expected file is the component definition; JSX usage correctness needs separate expectations.

Source labels in the tooltip and panel show project-relative paths, never the machine’s absolute path. When no projectRoot is set, recovered absolute paths are shortened at the workspace app/package or a source folder; root files show their filename. Editor opening still uses the original full source path.

Unavailable source or navigation targets do not shake or flash the highlight or tooltip.

## Source lookup performance

`Hover → cached host source → tooltip`. A successful host lookup updates the tooltip immediately, without waiting for component definitions or the complete owner chain. Option resolves its selected owner; the tree resolves row sources when opened. Missing host locations retain the definition and owner fallback paths.

Hover, panel, pointer-down warming, and editor opening share per-fiber source promises. Cache revisions include React source metadata so edits trigger a new lookup; missing sources and failed requests are evicted. Outdated Option requests cannot repaint a different hovered element. Caches belong to the mounted inspector and are discarded when it unmounts.

The development inspection probe still waits for the full owner chain. Host and chain work run concurrently, and the optional profiling flag reports both durations from their common start; the durations overlap and must not be added. The source benchmark retains its complete context and exact-file scoring.
