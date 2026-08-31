# Spec — Production-readiness audit before publishing `next-inspect-ui` + website

## Problem Statement

The package and the website were about to ship with three questions answered
only by intent, never by a test:

1. **How many bytes does a consumer's production bundle gain** by wiring the
   library the way the README says to?
2. **Does a production build behave correctly** for a dev-only package — no
   overlay, no stamps, no leaked paths, no crash?
3. **Which known issues block publish**, and which leftovers should go?

The design *claimed* zero production cost (`sideEffects: false`, the README's
`NODE_ENV` gate, the plugin's production no-op). Measurement said otherwise —
see Findings.

## The Harness

The production-cost fixture that produced the numbers below has been removed.
Keep the measured table as the last recorded baseline. Tarball-level checks
are still run by hand:

| # | case | what it proves |
|---|---|---|
| P5 | `npm pack` → install into a fresh app **outside** the workspace → build + dev | no `workspace:*` symlink blind spot; exports map works from a real install |
| P6 | `require()` of `next-inspect-ui-debug`, `next-inspect-ui-debug/babel-stamp`, and `next-inspect-ui` from plain Node | the CJS `next.config.js` consumer path |
| P7 | `npm pack --dry-run` audit | what users actually download |

Former fixture scenarios (P0–P4) covered baseline, gated README, ungated
worst case, gated + debug plugin, and gated + `/lib`.

## Findings

**F1 — The zero-cost claim was false.** With the original flat bundle, even
the correctly-gated README pattern shipped **+13.0 KB raw / +4.9 KB gzip of
client JS on every page**, plus ~325 KB of dead weight in `.next/server`.
Turbopack registers a `"use client"` module's exports before dead-code
elimination, so the consumer-side `NODE_ENV` guard removes the *element* but
not the *module*, and every export of the entry survives into the client
bundle.

**F2 — `InspectUI` had no internal production gate.** An ungated render would
have shipped the full overlay (~50 KB gzip), attached global listeners, and
run in production.

**F3 — Ungated usage leaks the author's filesystem path, and the library
cannot prevent it.** `projectRoot` is serialized into the RSC payload before
the client component gets any say — an internal gate stops the *code* from
running but not the *prop* from appearing in HTML. Confirmed by P2 after all
fixes: code inert, path still present. The README's `NODE_ENV` guard is
therefore mandatory, not advisory, and is documented as such.

**F4 — `dist/` was stale** (built Aug 18, source edited Aug 30): everything
tested through the website exercised an old build while `prepublishOnly`
would have published a new one.

**F5 — The website shipped its test harness.** Route groups are cosmetic:
`(dev)/test/**`, `(dev)/variant-test`, `/dashboard` all built and deployed,
and the landing footer linked to them.

**F6 — The website's production build didn't compile.** Two pre-existing type
errors failed `next build` outright: a Base UI close-reason compared against
`"triggerPress"` (the union is kebab-case `"trigger-press"`, so the comparison
was dead code even before it broke the build), and a `variant="primary"` that
doesn't exist on the shadcn Button.

**F7 — Packaging gaps.** No LICENSE file (package.json declared MIT), no
`repository`/`homepage`/`bugs` fields, version 0.2.1 already taken on npm,
and the test script only ran on Nodes with default type stripping.

**F8 — The sync/async resolve race from build.md is closed.** The current
click path awaits full resolution before `openInEditor`, warms resolution on
pointer-down, shows pending labels, and when nothing resolves it offers an
explicitly-labelled nearest-ancestor or refuses — it never opens a guessed
file. No code change needed; noted here because build.md still lists it open.

## Fixes shipped in this branch

1. **Lazy shim (fixes F1).** `InspectUI` is now a ~500-byte component that
   `React.lazy()`-loads the overlay as a split chunk in development and
   renders null in production — the overlay chunk is never created in a
   production build, let alone downloaded. Helper exports moved off the main
   entry to `next-inspect-ui/lib` so they cannot ride along (bundlers retain
   every export of a `"use client"` entry).
2. **Internal production gate (fixes F2).** The overlay component returns
   null outside development — a safety net behind the shim's own gate.
3. **README (mitigates F3).** Both snippets now carry the `NODE_ENV` guard,
   with the reason stated. The stamper is `next-inspect-ui-debug`, Node-only.
4. **Fresh dist + tests + typecheck (fixes F4)**, and the fixture routes
   re-checked in dev against the fresh build (stamps confirmed in served
   HTML).
5. **Website gating (fixes F5).** `(dev)/layout.tsx` returns `notFound()` in
   production — fixture matrix stays for development, 404s when deployed.
   `/dashboard` moved into the group (route groups don't change URLs). Footer
   dev links render only in development; version read from the package
   instead of a stale hardcode.
6. **Type errors fixed (F6)**, `next build` green, 24/24 routes.
7. **Packaging (fixes F7).** LICENSE, repo/homepage/bugs fields, version
   0.3.0, `./package.json` export, test script runs on Node ≥ 22.6.

## Measured Results

Fixture: bare one-page Next 16.2.6 app, Turbopack production build.

### Before (flat bundle, no internal gate — what 0.2.1 ships)

| case | client raw Δ | client gzip Δ | server raw Δ | sentinels in client | path leak |
|---|---|---|---|---|---|
| P1 gated (README) | +13.0 KB | +4.9 KB | +324.7 KB | stamp attrs | no |
| P2 ungated | +13.0 KB | +4.9 KB | +326.1 KB | stamp attrs | **yes** |

### After (lazy shim + `/lib` split — what 0.3.0 ships)

| case | client raw Δ | client gzip Δ | server raw Δ | sentinels anywhere | path leak |
|---|---|---|---|---|---|
| P1 gated (README) | **+0.2 KB** | **+0.2 KB** | +8.5 KB | none | no |
| P2 ungated | +0.2 KB | +0.2 KB | +10.3 KB | none | **yes** (RSC prop — unfixable library-side) |
| P3 gated + plugin | +0.2 KB | +0.2 KB | +8.5 KB | none | no |
| P4 gated + `/lib` | +0.3 KB | +0.2 KB | +48.1 KB | `data-inspect-host` | no |

The server delta is build-directory disk, not network transfer. The client
delta is the shim: a component that renders null in production.

### Tarball and consumer checks

- **P7**: 91 KB tarball; contents are exactly `dist/`, README, LICENSE,
  `package.json` — no source, no tests, no `.DS_Store`.
- **P5**: fresh app outside the workspace, tarball installed with npm.
  Production build passes. `next dev` without the babel peers surfaces the
  directed install error; with them, stamps appear in served dev HTML at
  exact `file:line:column`.
- **P6**: `require("next-inspect-ui")`, `require("next-inspect-ui-debug")`,
  and `require("next-inspect-ui-debug/babel-stamp")` load from plain Node.
- **Website**: production build green; zero library sentinels in any chunk
  referenced by a public page (the only chunks containing library code belong
  to the gated fixture routes, which serve 404 in production); no stamps and
  no absolute paths in any prerendered HTML.

## Known limitations shipping as-is (from build.md's open items)

- Owner-stamp not yet wired into the ⌥ climb step — climb falls back to
  runtime inference (degraded, not wrong).
- No mode indicator / upgrade prompt when running unstamped.
- Verify-mode extras (stamp-integrity check, JSON export,
  confident-but-unverifiable scoring) — maintainer tooling, invisible to
  consumers.
- Log-line running percentage is computed before async recoveries are
  counted — cosmetic, maintainer-only.

## Package split (follow-up)

`next-inspect-ui` is runtime-only. Compile-time tracing lives in a second
published package, `next-inspect-ui-debug`. Users install the first as a
dev dependency. Exact hover needs `InspectUI` from
`next-inspect-ui-debug/inspect`, plus `withInspectUI()`. Public `InspectUI`
ignores stamp attributes. Keep both on the same minor version. The stamp
attribute names are a shared contract.

Publish `next-inspect-ui@0.3.0` first, then `next-inspect-ui-debug@0.3.0`
with `pnpm publish` so `workspace:` is rewritten.

## Before publish. The short list

1. `pnpm --filter next-inspect-ui build && pnpm --filter next-inspect-ui test
   && pnpm --filter next-inspect-ui typecheck`.
2. `pnpm --filter next-inspect-ui-debug build && pnpm --filter
   next-inspect-ui-debug test && pnpm --filter next-inspect-ui-debug typecheck`.
3. One manual dev walk of `/test/source-open/*` with `verify` on. The lazy
   chunk load is the one thing this branch could not exercise headlessly.
4. `npm publish` from `next-inspect-ui-npm/` (`prepublishOnly` rebuilds).
5. `pnpm publish` from `next-inspect-ui-debug/` after `node
   scripts/check-debug-tarball.mjs` is green. Do not use `npm publish` for
   debug while the dep is a workspace protocol.
6. Deploy the website. Confirm `/test` 404s in production.
