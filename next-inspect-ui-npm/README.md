# next-inspect-ui

Dev-only overlay for Next.js. Hover any element to see the file it was written
in, click to open it in your editor, hold ⌥ to climb to the component that
rendered it.

```bash
npm i next-inspect-ui
```

**No dependencies.** Babel and Next are optional peers, so nothing is installed
unless you opt into exact mode below.

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

---

## Two modes

The package ships one thing and can be given a second.

**Runtime mode** — what you get from the install above. Resolution is inferred
at runtime from React's owner stacks and source maps.

**Exact mode** — a build step records each element's location at compile time,
so the inspector reads an answer instead of deriving one.

The difference is not cosmetic, and it is worth understanding before choosing.

### Why runtime mode cannot be exact

React 19 removed `_debugSource` from fibers and dropped `__source` from the
`jsxDEV` signature. The authoring location of a JSX element is no longer
recorded anywhere the browser can reach.

What remains is an `Error` captured when the element was created, whose frames
point into compiled chunks. Translating those back to your source means fetching
and decoding a source map — accurate most of the time, but it takes a moment,
and some cases are unrecoverable:

- elements built inside `node_modules` with no project frame anywhere in their
  owner chain
- anything created past React's 10,000-element owner-stack cap, where React
  substitutes a shared placeholder

Runtime mode is good. It is not provable, and there is a short window after
hover where it has no answer yet.

### Exact mode

```bash
npm i -D @babel/core babel-loader
```

```ts
// next.config.ts
import type { NextConfig } from "next"
import { withInspectUI } from "next-inspect-ui/plugin"

const nextConfig: NextConfig = {}

export default withInspectUI(nextConfig)
```

```tsx
// app/layout.tsx
import { InspectUI } from "next-inspect-ui"
import { inspectUIProjectRoot } from "next-inspect-ui/plugin"

<InspectUI projectRoot={inspectUIProjectRoot()} />
```

Use `inspectUIProjectRoot()` rather than `process.cwd()`. The stamper writes
paths relative to a root and the runtime joins that root back on; if the two
disagree, every location becomes unjoinable and it looks exactly like a broken
resolver rather than a config mismatch. Both ends read from this one call.

Requires **Next ≥ 16** with Turbopack. Development only — the wrapper is a no-op
under `next build`, so stamps cannot reach production. Measured cost on a real
app: about 0.13s added to a cold compile of a heavy route, with server start
unchanged.

> Turbopack does not watch the loader's plugin file. After changing anything in
> `next.config`, clear `.next` and restart, or you will be debugging a cached
> bundle.

### Options

```ts
withInspectUI(nextConfig, {
  root: "/abs/path",              // default: realpath of process.cwd()
  include: ["**/*.tsx"],          // default: **/*.tsx and **/*.jsx
  exclude: ["generated"],         // path substrings, on top of node_modules
})
```

`exclude` takes **strings only**. Turbopack passes loader options as JSON, so a
RegExp would arrive at the plugin as an empty object.

---

## Verifying resolution

With exact mode on, `verify` runs the runtime resolver a second time with the
stamps hidden from it, and scores its answer against what the compiler recorded.

```tsx
<InspectUI projectRoot={inspectUIProjectRoot()} debug verify />
```

The debug panel then shows, per hover:

```
run time check : components/ui/button.tsx:50
stamp check    : components/ui/button.tsx:50
match          : 100% (24/24)
```

Green where the two agree, red where they do not, purple where the disagreement
is expected — a library built the DOM, so the stamp records an inner call the
climb steps past on purpose.

This exists because "it sometimes opens the wrong file" is not a number. It is
how the runtime path went from roughly half right to matching the compiler on
every element of a real application.

---

## Props

| prop | type | default | |
|---|---|---|---|
| `projectRoot` | `string` | — | absolute path your source is under |
| `debug` | `boolean` | `false` | event log panel, draggable and resizable |
| `verify` | `boolean` | `false` | score the resolver against the stamps |

Settings — editor, colours, spotlight and tooltip styling — are configurable at
runtime through the overlay's own settings panel.

Supported editors: Cursor, VS Code, VS Code Insiders, Windsurf, Zed.

---

## License

MIT
