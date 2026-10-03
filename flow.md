# App flow

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
Editor link (cursor:// or vscode://)
     ↓
Cursor / VS Code
```

The DOM element is what you see on the page. Its React Fiber connects it to the React tree. The tool follows that tree to find the element’s source or the selected parent component’s source.

React’s debug fields can contain a file location or a stack trace. They are internal fields, so their availability depends on the React version and build tool.

A source map connects built JavaScript to the original TSX file. It is separate from React’s metadata. Browser code uses source maps when needed; server code can use Next.js’s development stack-frame endpoint. Once the tool finds the file, line, and column, an editor link opens that location.

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
Enter → adopt an element / open source
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
| `[` / `{` | Move to a parent inspectable element. |
| `]` / `}` | Move to a child inspectable element. |
| Enter in Element | Adopt a previewed element; open its source when it is already the current target. |
| `…` in Element | Adopt that element as the current target. |
| Hold Option / Alt | Select a parent component’s source. |
| Escape | Turn the tool off. |

Element navigation follows the rendered elements. Hold Option / Alt to select the immediate owning component; Shift has no climb action and adds no tooltip.

Space pins the hovered element and opens an underline tab bar. The Component tab shows the immediate React parent chain within the current page, starting with the hovered element, then its owning component and successive parents. The tree stops after the page component, or before the nearest layout when there is no page boundary. Layouts and surrounding app providers stay outside the tree; local components and providers remain in their actual order. Framework internals and transparent vendor wrappers are skipped. The Element tab shows the actual HTML tree: 1–15 element nodes, prioritizing nearby siblings, then ancestors, then descendants with any remaining space. Ancestors stop at `<body>`; `<html>` and `<head>` stay outside the tree. It nests child rows between parent opening and closing tags, includes text and actual HTML attributes, and provides a `…` selection button (void elements have no closing tag), without separate CSS or Tailwind sections.

Left / Right switches tabs; Up / Down selects rows without changing the pinned target. In Element, another row shows a separate red highlight at 50% opacity, without a ghost tooltip while the current target stays pinned. Enter adopts that preview and moves the panel to it; Enter on the current target opens its source. The `…` button also adopts its element. Switching tabs or closing the panel clears the preview. In Component, Enter or a source link opens the selected row’s file. Each tab remembers its row while the popover is open. Space closes it and restores focus; Escape exits inspect mode. A new popover starts on Component, or on Element when configured with `<InspectUI popoverProps={{ defaultTab: "element" }} ... />`.


## Test suite flow

All test apps use the same suite UI: choose groups, press **Run all**, then open **Logs** to compare expected and found source locations. **Show source** opens the fixture snippets. Vite runs the browser cases; Next.js also runs the Server Component cases.

Names, files, lines, and node counts must match exactly. Each app keeps its own expectations: Vite’s local Link has its host in `src/link.tsx`, and React 18’s generated hosts use the caller fallback described above.

## Competitor app flow

Run `bun run dev:competitor` → open port 3104 → choose a library → the page reloads → try that library’s shortcut on the same dashboard. The selection is stored in a cookie. **Off** loads no inspector.

Agentation and InterfaceKit also mount in development, independently of the inspector switch. Use their own buttons to annotate elements or adjust styles; both remain available when the inspector selection is **Off**.

The comparison toolbar stays usable while inspecting. Only the selected inspector loads in development. React Grab’s installed script loads before React; the other inspectors mount as client components. Show Component uses Option + right-click (add Shift for its tree). React Grab uses ⌘C / Ctrl+C. Click to React Component uses Option + click and depends on older React source metadata, so lookup may fail on this React 19 page.
