# next-inspect-ui

Dev-only overlay for Next.js. Hover any element to see its source, click to open it.

```
packages/next-inspect-ui   published library
packages/test-cases        accuracy goldens
apps/nextjs-example        dashboard with InspectUI installed
apps/next-js-test          /test suite
site                       marketing
```

```bash
pnpm install
pnpm --filter next-inspect-ui build
pnpm dev            # site
pnpm dev:example    # dashboard
pnpm dev:test       # accuracy suite
```
