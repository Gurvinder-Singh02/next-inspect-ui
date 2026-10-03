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

## UI flow

```text
Option + X
     ↓
Hover an element
     ↓
See its name and source
     ↓
Click to open the source
```

| Control | Action |
|---|---|
| Option + X (Alt + X on Windows/Linux) | Turn the tool on or off. |
| Hover | Highlight an element and find its source. |
| Click or Enter | Open the selected source in the editor. |
| Space | Open or close the info panel with the component tree. |
| Up / Left | Move to the previous sibling element. |
| Down / Right | Move to the next sibling element. |
| Up / Down with the info panel open | Move through the tree rows. |
| `[` | Move to a parent inspectable element. |
| `]` | Move to a child inspectable element. |
| Hold Option / Alt | Select a parent component’s source. |
| Option / Alt + Shift | Climb another level in the component chain. |
| Escape | Turn the tool off. |

Element navigation follows the rendered elements. Component climbing follows the React component chain. The info panel shows the resolved chain and source locations; click a source path to open it.


## Test suite flow

All test apps use the same suite UI: choose groups, press **Run all**, then open **Logs** to compare expected and found source locations. **Show source** opens the fixture snippets. Vite runs the browser cases; Next.js also runs the Server Component cases.
