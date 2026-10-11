# Pre-public checklist

Things to worry about before making this repo public, publishing `next-inspect-ui` to npm, and putting the marketing site live.

This is a review checklist, not a change log. Numbers below were measured on the monorepo at the time of writing.

---

## Verdict

**Safe to open-source** if you treat the library as **dev-only** and finish the publish / site checklist below.

No hardcoded API keys or `.env` secrets were found in the tree.

---

## 1. npm library (`next-inspect-ui`)

| Item | Status | Notes |
| --- | --- | --- |
| Package name / version | OK | `next-inspect-ui@0.3.1` |
| License | OK | MIT (`LICENSE` in package + root) |
| Publish access | OK | `publishConfig.access: "public"` |
| Runtime dependencies | Excellent | **None** — only `peerDependencies`: `react` / `react-dom` `>=19` |
| Published files | OK | `files: ["dist"]` + LICENSE + README; `npm pack` ~**177 KB** packed / **~676 KB** unpacked |
| Entry points | OK | `.`, `./lib`, `./script` (`index.global.js` IIFE) |
| Prod tree-shake / gate | OK | `InspectUI` is `null` when `NODE_ENV !== "development"` and lazy-loads the inspector only in dev |

### Speed / size (what users feel)

| Artifact | Approx size | Concern |
| --- | --- | --- |
| ESM entry `dist/index.js` | ~0.5 KB | Tiny; production apps that import `InspectUI` correctly should keep this small |
| Lazy inspector chunk | ~146–157 KB | Loaded **only in development** via `lazy()` |
| `./script` IIFE | ~258 KB | Full browser script bundle; fine for `<script>` / demos, not for prod app bundles |
| Packed tarball | ~177 KB | Normal for a UI overlay with source-map logic |

**Worry about:** consumers who import the inspector (or `./script`) into a **production** client bundle. Docs already say use a `NODE_ENV` / `import.meta.env.DEV` guard — keep that loud on the site and README.

**Peer range:** `react` / `react-dom` `>=19`. You have a React 18 test app in-repo; either document “19+ only” clearly or widen peers before marketing React 18 support.

**Missing (nice-to-have):** `engines` field (Node version), explicit `peerDependenciesMeta` if anything becomes optional later.

---

## 2. Security

### Library (what npm consumers install)

Fallow security (workspace `next-inspect-ui`) reported **5 medium candidates**, all in `packages/next-inspect-ui/src/lib/engine.ts`:

| Kind | Why it shows up | Real risk if used as intended |
| --- | --- | --- |
| SSRF-style `fetch` | Loads bundle / source-map URLs from the **local dev app** | Low for a local/dev tool; do **not** run this overlay against untrusted remote apps in a privileged browser context |
| Open-redirect style | `openInEditor` → IDE URL / Next launch-editor endpoints | Expected: opens the user’s editor. Not a website open-redirect for end users |

These are **candidates**, not confirmed CVEs. They match the product: a browser overlay that fetches source maps and launches editors.

**Must communicate publicly:**

1. Install as a **devDependency**.
2. Mount only under development checks.
3. Never enable in production builds or public staging that real users hit.

### Monorepo / site / test apps (not published to npm)

- `dangerouslySetInnerHTML` for Shiki / demo code on site + test suites — normal for syntax highlighting demos.
- Test-suite “open in editor” helpers look like open-redirects to static analysis — intentional local tooling.
- `pnpm audit` on the **whole monorepo** reports many Next/shadcn/`undici` issues in **apps**, not in the published library’s runtime dependency set (the library has zero runtime deps). Fix app audits separately; they do not ship inside `next-inspect-ui`’s tarball.

### Secrets / privacy before flipping the repo public

| Check | Status |
| --- | --- |
| `.env` / credentials in tree | None found |
| Real API keys / tokens | None found |
| Absolute local home paths in `docs/*benchmark*.json` | **Were present** (`/Users/gxuri/...`) — redact or regenerate before public (see open-source prep PR if not merged yet) |
| Author identity on marketing site | Intentional (`Gxuri`, GitHub avatar) — confirm you want that public |
| Agent folders (`.cursor/`, `.claude/`, `.agents/`) | Will be public with the repo — fine for most OSS; remove if you consider them private |

---

## 3. License & copyright

| Item | Action |
| --- | --- |
| Root + package MIT | Keep; copyright “Gurvinder Singh” / 2026 |
| Third-party UI (shadcn / Radix / Base UI / Lucide) | Used in site & apps; keep their notices; do not claim ownership of their design systems |
| Broader source-retrieval bench | Lives in the separate `next-inspect-bench` repository — do not vendor its fixtures here |
| Demo cards / preview UI in `apps/nextjs` | Confirm none are copied from proprietary/customer projects you cannot relicense under MIT |
| Images / fonts on the site | Confirm licenses allow OSS + commercial use on the live domain |

---

## 4. Package working / publish readiness

Before first public `npm publish`:

1. `pnpm --filter next-inspect-ui build` (clean CI)
2. `npm pack` in `packages/next-inspect-ui` and inspect the tarball (only `dist` + LICENSE + README + package.json)
3. Install the packed tarball into a **fresh** Next app and a Vite app; confirm overlay works and production build does **not** include the inspector chunk
4. Confirm npm account 2FA and package name availability (`next-inspect-ui`)
5. Decide version strategy (`0.3.1` vs `1.0.0`) and changelog / GitHub Release
6. Optional: npm provenance / Trusted Publishing from CI

Monorepo root and apps stay `"private": true` — only publish `packages/next-inspect-ui`.

---

## 5. Website live

| Concern | What to do |
| --- | --- |
| Vercel deploy failures | Fix or ignore for preview; production deploy must succeed before launch |
| InspectUI on production site | Confirm production never mounts it (dev-only layout pattern) |
| Env vars in Vercel | No secrets in client-exposed `NEXT_PUBLIC_*` that you would not put in a public repo |
| Domain / SEO | `site/lib/site.ts` GitHub + author URLs should match the public repo |
| Analytics / cookies | Add only if you want them; disclose if required |
| Broken links | Confirm marketing and README links resolve for public visitors |

---

## 6. Repo hygiene when going public

- [ ] Merge open-source prep (path redaction / `.gitignore` for `.env`, keys, `.vercel/`)
- [ ] Flip GitHub → Public
- [ ] Enable Dependabot or similar for the **library** (even with zero runtime deps, lockfile/dev tooling still moves)
- [ ] Add SECURITY.md (how to report issues; state “dev-only tool”)
- [ ] Confirm Issues / Discussions settings
- [ ] Strip or keep agent skill folders consciously
- [ ] Re-run accuracy suite (`apps/test-next-js` `/test` → Test all) on `main` before tagging a release

---

## 7. What you do **not** need to panic about

- Monorepo `pnpm audit` criticals in demo Next apps — they are not inside the published npm tarball.
- Unused demo files / fallow warn backlog — quality debt, not a launch blocker.
- Circular deps inside the library package — clean up when you can; not a public-safety issue by itself.
- SSRF/open-redirect findings in the inspector engine — expected for this class of tool if scoped to local development.

---

## Quick “day of launch” order

1. Redact local paths in docs (if not already on `main`)
2. Merge remaining prep PRs
3. Tag / publish `next-inspect-ui` to npm
4. Deploy `site` to production
5. Make GitHub repo public
6. Smoke-test: `npm i -D next-inspect-ui` in a clean project
7. Announce with clear **devDependency + development-only** messaging
