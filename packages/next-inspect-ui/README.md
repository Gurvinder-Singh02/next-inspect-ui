# next-inspect-ui

Dev-only overlay for Next.js. Hover any element to see the file it was written
in, click to open it in your editor, hold ⌥ to climb to the component that
rendered it.

```bash
npm i -D next-inspect-ui
```

```tsx
// app/layout.tsx

export default async function RootLayout({ children }) {
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
| click | open that line in your editor |
| ⌥ hold | climb to the component that rendered it |
| `[` / `{` · `]` / `}` | move to the parent / child element |
| `Space` | toggle the popover — Component and Element trees |
| `↑` `↓` | select tree rows when the popover is open; otherwise move between siblings |
| `←` `→` | switch tabs when the popover is open; otherwise move between siblings |
| `Esc` | exit |

## Props

| prop | type | |
|---|---|---|
| `projectRoot` | `string` (optional) | Explicit root for relative source paths; not needed for basic setup. |
| `popoverProps` | `{ defaultTab?: "component" \| "element" }` | initial tree tab; defaults to `"component"` |

The Component tab shows immediate ancestors through the page, stopping before layouts and the app shell. The Element tab shows 1–15 nested HTML nodes, prioritizing siblings, then parents, then children. Use `popoverProps={{ defaultTab: "element" }}` to start on Element. Shift does not climb.

Settings — editor, colours, spotlight and tooltip styling — are configurable
at runtime through the overlay's own settings panel.

Supported editors: Cursor, VS Code, VS Code Insiders, Windsurf, Zed.

Guard the import itself with `NODE_ENV`, as above, to exclude the inspector from the production module graph. Exact emitted bytes depend on your app’s bundler; verify its production chunks.

## Install local

Wire next-inspect-ui from the local sibling package. Do not publish or install from npm.

Local package:
`/Users/gxuri/Gxuri_Web/Gxuri_2025/next-inspect-ui/packages/next-inspect-ui`
(name: `next-inspect-ui`, version `0.3.0`)

This app:
`/Users/gxuri/Gxuri_Web/Gxuri_2025/faith-church-website`
Package manager: pnpm

### 1. package.json

Add a dependency with a relative `file:` link, not a registry version:

```json
"next-inspect-ui": "file:../next-inspect-ui/packages/next-inspect-ui"
```

### 2. pnpm-workspace.yaml

If pnpm blocks the install because of `minimumReleaseAge`, add:

```yaml
minimumReleaseAgeExclude:
  - next-inspect-ui@0.3.0
```

### 3. Install

Run `pnpm install` from the church site root so the lockfile picks up the `file:` link.

If the local package has no `dist/`, build it first:

```bash
cd ../next-inspect-ui/packages/next-inspect-ui && pnpm build
```

### 4. app/layout.tsx

Mount it only in development. Do not change fonts, metadata, or the rest of the layout.

```tsx
```

Then inside `<body>`, after `{children}`:

```tsx
{InspectUI && (
  <InspectUI />
)}
```

Keep that `NODE_ENV` guard. Do not ship InspectUI in production.

### 5. Do not commit this

It is local-only. Do not add `.pnpm-store` or `todo-next-inspect-ui.md`.

## License

MIT

In the Element tab, Up/Down previews HTML elements with a half-opacity red highlight, without a ghost tooltip. Enter selects the preview; Enter again opens its source. Click `…` to select an element directly. The Component tree starts at the hovered element and follows its immediate parents up to the page/layout boundary.

The default tooltip and spotlight use `#006efe`. The spotlight has 10% fill and a solid 0.5px border. It follows the element’s bounds and computed corner radius automatically. Spotlight radius and padding props are removed; tooltip radius and padding remain configurable.

## Benchmarks

Run `bun run benchmark` in this repository. [Bundle benchmarks](../../docs/benchmarks.md) explain the guarded import, measured gzip sizes, and limits. Guarded production imports include no inspector library modules in the standalone test; exact app build overhead varies. Runtime speed has not been benchmarked.

## Dev-only script (like React Grab)

The package also exports a self-contained script as `next-inspect-ui/script`. Serve it locally using the [example route](../../apps/nextjs/app/inspect-ui.js/route.ts), which returns 404 in production, and add this in your layout:

```tsx
import Script from "next/script"

{process.env.NODE_ENV === "development" && (
  <Script src="/inspect-ui.js" strategy="afterInteractive" />
)}
```

No inspector component import or mount is needed with this setup. Production excludes the script tag and download. The script includes its own React runtime; use the component setup for a smaller development download. Never include the script unconditionally.
