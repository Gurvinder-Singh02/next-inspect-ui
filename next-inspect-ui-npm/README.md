# next-inspect-ui

Dev-only overlay for Next.js. Hover any element to see the file it was written
in, click to open it in your editor, hold ⌥ to climb to the component that
rendered it.

```bash
npm i -D next-inspect-ui
```

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

| prop | type | |
|---|---|---|
| `projectRoot` | `string` | absolute path your source is under |

Settings — editor, colours, spotlight and tooltip styling — are configurable
at runtime through the overlay's own settings panel.

Supported editors: Cursor, VS Code, VS Code Insiders, Windsurf, Zed.

**Measured production cost: +0.2 KB gzipped** when gated on `NODE_ENV`. Keep
that guard — without it, React serializes `projectRoot` into the page payload.

## Debug and exact stamps

The event log, `verify` scoring, and compile-time stamps live in
[`next-inspect-ui-debug`](https://www.npmjs.com/package/next-inspect-ui-debug).

```bash
npm i -D next-inspect-ui-debug
```

`withInspectUI()` writes `data-inspect-host` attributes. This package's
`InspectUI` does not read them. Exact hover needs the debug overlay.

```tsx
import { inspectUIProjectRoot } from "next-inspect-ui-debug"
import { InspectUI } from "next-inspect-ui-debug/inspect"

{process.env.NODE_ENV === "development" && (
  <InspectUI projectRoot={inspectUIProjectRoot()} />
)}
```

Keep both packages on the same minor version.

## License

MIT
