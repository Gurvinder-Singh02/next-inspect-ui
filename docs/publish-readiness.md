# Publish readiness

Reviewed October 11, 2026 after the privacy and dependency fixes.

The local production website passes the checks below. Complete the deployment
checks before announcing the live site. This review is not a guarantee that every
possible vulnerability has been found.

## Fixed and verified

| Check | Result |
| --- | --- |
| Production dependency audit | 0 advisories |
| Unit tests | 87 passed, 0 failed |
| Root and compatibility typechecks | Passed |
| Library and production website builds | Passed |
| React 19 Vite and React 18 test app builds | Passed |
| Production security headers | Verified on the local production server |
| Development editor endpoints and standalone script URL | 404 in production |
| Inspector mounted on production overview | No inspector root found |
| Visitor font and avatar requests | Self-hosted assets; external font CSS imports removed |
| Production browser checks | Framework tabs work; homepage and Lab render without captured console errors |
| npm package contents | 14 files: dist, README, LICENSE, package.json |

Next.js was updated to 16.3.8 in the website and Next.js apps. Build-time shadcn
CLIs are now development dependencies. Scoped overrides select published patched
versions of vulnerable transitive tooling dependencies. Node tests now load the
actual overlay CSS and include its TypeScript declaration.

Production responses set CSP, X-Content-Type-Options, Referrer-Policy,
X-Frame-Options, Permissions-Policy, and HSTS, and omit X-Powered-By. The CSP
restricts resources and connections to this origin and disables objects and
framing. It permits inline scripts for Next.js hydration and theme initialization,
and inline styles for interactive demos. It is not a strict nonce-based CSP.

The Lab microphone is disabled until the visitor presses Start Listening and
approves the browser permission prompt. Audio is processed in the browser.
Pending permission requests now stop their streams if the visitor has already
pressed Stop or left the page. Only /lab permits same-origin microphone access;
other routes disable it. Font license notices are in site/public/fonts/licenses.

No application analytics, background clipboard reading, or source-code upload
service was found. Theme preference storage remains. Source resolution in a
consumer's development app can request bundler source maps and development
endpoints; a referenced source map can be on another origin. The standalone
script must be served and loaded only in development.

## Remaining development-tool advisory

The full workspace audit reports one high-severity advisory in `braces@3.0.3`,
used by development CLI/lint globbing dependencies. The audit lists 3.0.4 as the
fix, but the npm registry's latest published version was still 3.0.3 when checked.
It concerns stack exhaustion from deeply nested glob patterns. It is not in the
website production dependency graph or the published inspector package.
Avoid untrusted glob patterns in those tools and update when a fix is published.
Do not describe the full workspace audit as clean.

[braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)

## Deployment checks still required

Set NEXT_PUBLIC_SITE_URL to the actual public HTTPS origin, or use Vercel's
VERCEL_PROJECT_PRODUCTION_URL, and rebuild. Production builds now reject missing
or invalid origins instead of publishing localhost metadata. The local verification
build used https://example.com only as a test value; it must not be deployed.

Verify the live site's TLS, response headers, sitemap, and browser requests after
building with the real domain. Hosting-provider request logs and any platform
analytics must be reviewed in the hosting account; these are outside this
repository audit. Never deploy a development server or test apps publicly.

The source-accuracy browser suites and benchmarks were not rerun in this security
fix. Their previously published measurements remain dated historical results.
