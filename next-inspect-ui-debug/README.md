# next-inspect-ui-debug

Debug harness and compile-time stamps for [`next-inspect-ui`](https://www.npmjs.com/package/next-inspect-ui).

Use this package when you want the event log, `verify` scoring, or exact
hover from build-time stamps. Regular apps only need `next-inspect-ui`.

`withInspectUI()` alone does not change public `InspectUI`. Exact hover
needs the import from `next-inspect-ui-debug/inspect` below.

`@babel/core` and `babel-loader` install with this package.

```bash
npm i -D next-inspect-ui
npm i -D next-inspect-ui-debug
```

```ts
// next.config.ts
import type { NextConfig } from "next"
import { withInspectUI } from "next-inspect-ui-debug"

const nextConfig: NextConfig = {}

export default withInspectUI(nextConfig)
```

```tsx
// app/layout.tsx — Server Component, not "use client"
import { inspectUIProjectRoot } from "next-inspect-ui-debug"
import { InspectUI } from "next-inspect-ui-debug/inspect"

{process.env.NODE_ENV === "development" && (
  <InspectUI projectRoot={inspectUIProjectRoot()} debug verify />
)}
```

| prop | default | |
|---|---|---|
| `projectRoot` | — | absolute path your source is under |
| `debug` | `false` | keep the event log panel open |
| `verify` | `false` | score runtime resolution against stamps |

`withInspectUI()` is a no-op under `next build`. Keep both packages on the
same minor version.

## License

MIT
