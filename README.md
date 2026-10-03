# next-inspect-ui

Dev-only overlay for Next.js. Hover any element to see its source, click to open it.

## How it works

```text
Browser click
     ↓
DOM element
     ↓
React Fiber
     ↓
Fiber debug metadata
     ↓
Source maps (when needed)
     ↓
file.tsx:42:8
     ↓
Editor link
     ↓
Cursor / VS Code
```

Browser code uses source maps. Server code can use Next.js's stack-frame endpoint.
An editor link opens the file directly. Hold ⌥ to climb owners; press Space for the info panel.

```
packages/next-inspect-ui              published library
packages/test-cases                   library unit tests
apps/test                            /test suite and cases
apps/example-01                      dashboard with InspectUI installed
site                                  marketing
```

```bash
pnpm install
pnpm --filter next-inspect-ui build
pnpm test           # library unit tests
pnpm dev            # site
bun run dev:test     # /test suite
bun run dev:example  # dashboard
```
