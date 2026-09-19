# Install local

Wire next-inspect-ui from the local sibling package. Do not publish or install from npm.

Local package:
`/Users/gxuri/Gxuri_Web/Gxuri_2025/next-inspect-ui/packages/next-inspect-ui`
(name: `next-inspect-ui`, version `0.3.0`)

This app:
`/Users/gxuri/Gxuri_Web/Gxuri_2025/faith-church-website`
Package manager: pnpm

## 1. package.json

Add a dependency with a relative `file:` link, not a registry version:

```json
"next-inspect-ui": "file:../next-inspect-ui/packages/next-inspect-ui"
```

## 2. pnpm-workspace.yaml

If pnpm blocks the install because of `minimumReleaseAge`, add:

```yaml
minimumReleaseAgeExclude:
  - next-inspect-ui@0.3.0
```

## 3. Install

Run `pnpm install` from the church site root so the lockfile picks up the `file:` link.

If the local package has no `dist/`, build it first:

```bash
cd ../next-inspect-ui/packages/next-inspect-ui && pnpm build
```

## 4. app/layout.tsx

Mount it only in development. Do not change fonts, metadata, or the rest of the layout.

```tsx
import { InspectUI } from "next-inspect-ui"
```

Then inside `<body>`, after `{children}`:

```tsx
{process.env.NODE_ENV === "development" && (
  <InspectUI projectRoot={process.cwd()} />
)}
```

Keep that `NODE_ENV` guard. Do not ship InspectUI in production.

## 5. Do not commit this

It is local-only. Do not add `.pnpm-store` or `todo-next-inspect-ui.md`.
