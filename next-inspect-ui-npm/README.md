# next-inspect-ui

Dev-only overlay for Next.js. Hover any element to see the file it was written
in, click to open it in your editor, hold ⌥ to climb to the component that
rendered it.

```bash
npm i -D next-inspect-ui
```

**No extra dependencies.** The package has no runtime dependencies. Resolution
is inferred at runtime from React's owner stacks and source maps.

**Measured production cost: +0.2 KB gzipped.** The component you import is a
tiny shim; the overlay itself loads through a development-only dynamic import,
so a production build never creates the chunk. Keep the `NODE_ENV` guard shown
below regardless — without it, React still serializes your `projectRoot` (an
absolute path on your machine) into the page's payload, and no library code
can prevent that.

```tsx
// app/layout.tsx
import { InspectUI } from "next-inspect-ui"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        {process.env.NODE_ENV === "development" && (
          <InspectUI projectRoot={process.cwd()} />
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
| click | open that line in your editor |
| ⌥ hold | climb to the component that rendered it |
| ⌥ ⇧ | climb another level |
| `[` `]` | move to the parent / child element |
| `I` | open the info panel — used / defined, tree, CSS |
| `Esc` | exit |

## Props

| prop | type | default | |
|---|---|---|---|
| `projectRoot` | `string` | — | absolute path your source is under |
| `debug` | `boolean` | `false` | event log panel, draggable and resizable |
| `verify` | `boolean` | `false` | score the resolver against compile-time traces (needs [`next-inspect-ui-trace`](https://www.npmjs.com/package/next-inspect-ui-trace)) |

Settings — editor, colours, spotlight and tooltip styling — are configurable at
runtime through the overlay's own settings panel.

Supported editors: Cursor, VS Code, VS Code Insiders, Windsurf, Zed.

The main entry exports exactly one thing. The inspector's pure helpers —
settings, stamp parsing, source resolution — live at `next-inspect-ui/lib` for
tooling and test surfaces. Don't import that subpath from a public production
page: whatever a `"use client"` module exports, your bundler ships.

## Exact locations (optional)

For compile-time traces — exact hover, and the `verify` harness — also install
[`next-inspect-ui-trace`](https://www.npmjs.com/package/next-inspect-ui-trace).
Babel arrives with that package; you do not install it separately. Keep both
on the same minor version.

```bash
npm i -D next-inspect-ui-trace
```

## License

MIT
