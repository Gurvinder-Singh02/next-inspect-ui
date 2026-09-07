# next-inspect-ui

Dev-only overlay for Next.js. Hover any element to see its source, click to open it.

```
packages/next-inspect-ui              published library
packages/test-cases                   library unit tests
apps/next-js-example                  /test suite and cases
apps/shadcn-dashboard-001-example     dashboard with InspectUI installed
site                                  marketing
```

```bash
pnpm install
pnpm --filter next-inspect-ui build
pnpm test           # library unit tests
pnpm dev            # site
pnpm dev:example    # /test suite
pnpm dev:dashboard  # dashboard
```
