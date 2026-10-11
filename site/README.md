# site

Marketing site for next-inspect-ui.

## Production configuration

Set `NEXT_PUBLIC_SITE_URL` to the website's public HTTPS origin before running
`bun run build:site`. Production defaults to `https://niu.gxuri.me` when that
env var is unset. Explicit `NEXT_PUBLIC_SITE_URL` always wins. Production
builds reject localhost, credentials, paths, and query parameters. Rebuild
after changing the origin; metadata and the sitemap are generated at build time.

Fonts and the author avatar are served from this website. Google font files are
downloaded at build time by `next/font`, not by visitors. There is no application
analytics or source-code upload service. Theme preferences use browser storage;
copy buttons write to the clipboard only when clicked. The Lab microphone demo
requests permission after Start Listening and processes audio in the browser.
The hosting provider may still retain ordinary HTTP request logs.

Production responses include a same-origin Content Security Policy, frame
protection, `nosniff`, no-referrer, Permissions Policy, and HSTS. The policy
allows inline scripts for Next.js hydration and the theme script, and inline
styles for the demos. It is a baseline policy, not a nonce-based strict CSP.
Verify HTTPS and these headers on the real deployment before announcing it.

```bash
pnpm --filter site dev
```

Usage lives on the overview page, with guarded imports for Next.js, React/Vite, and React entry points. React 18 is experimental. How it works describes the internal stack reader, source-map decoder, editor links, keyboard navigation, and production guard.

The bundle-size table reads `docs/benchmark-results.json`. Run `bun run benchmark` from the repository root to refresh it. The Benchmarks page reads `docs/source-benchmark-summary.json`. Refresh that by running the private [next-inspect-bench](https://github.com/Gurvinder-Singh02/next-inspect-bench) fork and copying the `next-inspect-ui` summary. Keep published explanations aligned with [App flow](../flow.md) and [bundle measurements](../docs/benchmarks.md).
