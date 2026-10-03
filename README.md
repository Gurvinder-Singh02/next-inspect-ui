# next-inspect-ui

Dev-only overlay for Next.js. Hover any element to see its source, click to open it.

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
