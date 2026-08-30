# next-inspect-ui-stamper

Optional build-time JSX stamper for [`next-inspect-ui`](https://www.npmjs.com/package/next-inspect-ui).

Most people do not need this. `next-inspect-ui` already resolves source at
runtime. This package records each element's location at compile time so hover
is exact and synchronous — and so the overlay's `verify` prop has something
to score the runtime resolver against.

Keep the two packages on the same minor version. The stamp format
(`data-inspect-host` / `data-inspect-owner`) is defined by the runtime
package; a mismatch looks like a broken resolver, not a config error.

```bash
npm i next-inspect-ui
npm i -D next-inspect-ui-stamper @babel/core babel-loader
```

```ts
// next.config.ts
import type { NextConfig } from "next"
import { withInspectUI } from "next-inspect-ui-stamper"

const nextConfig: NextConfig = {}

export default withInspectUI(nextConfig)
```

```tsx
// app/layout.tsx — Server Component, not "use client"
import { InspectUI } from "next-inspect-ui"
import { inspectUIProjectRoot } from "next-inspect-ui-stamper"

{process.env.NODE_ENV === "development" && (
  <InspectUI projectRoot={inspectUIProjectRoot()} />
)}
```

`inspectUIProjectRoot()` must be the same root the stamper wrote paths
relative to. Using `process.cwd()` on one end and this helper on the other
makes every stamp unjoinable.

Requires **Next ≥ 16** with Turbopack. Development only — `withInspectUI()` is
a no-op under `next build`, so stamps cannot reach production.

```ts
withInspectUI(nextConfig, {
  root: "/abs/path",              // default: realpath of process.cwd()
  include: ["**/*.tsx"],          // default: **/*.tsx and **/*.jsx
  exclude: ["generated"],         // path substrings, on top of node_modules
})
```

`exclude` takes **strings only**. Turbopack passes loader options as JSON, so a
RegExp would arrive as an empty object.

After changing `next.config`, clear `.next` and restart. Turbopack does not
watch the loader's plugin file.

## License

MIT
