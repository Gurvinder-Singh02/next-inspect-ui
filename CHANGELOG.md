# Changelog

User-visible changes are recorded here. New entries belong under **Unreleased** until a release is published.

## Unreleased

### Added

- Internal React development stack reader and source-map decoder, replacing the `bippy/source` runtime dependency.
- Component and Element tree tabs with keyboard navigation and element previews.
- Guarded usage examples for Next.js, React / Vite, React entry points, and experimental React 18 compatibility.
- Standalone development script setup.
- Shared accuracy suites for Next.js / Turbopack, Next.js / Webpack, Vite / React 19, and Vite / React 18.
- Bundle benchmark reports.
- Root MIT license and contributor setup guide.

### Changed

- Source-retrieval benchmarks live in a separate repository forked from open-source React Grab Bench, with Next Inspect UI wired in. The Works with page shows a copied summary from that repo.
- Source lookup shares pending requests, caches Fiber source results, decodes source maps once, and batches Next.js frame requests.
- Hover resolves the visible element’s source before loading parent-component details.
- Component and Element previews keep the original element pinned while opening the selected source.
- Production setup guards the dynamic import so the bundler can exclude the entire library.
- Public documentation describes the internal resolver, current controls, and benchmark scoring limits.

### Fixed

- Source recovery when React supplies an `UnknownOwner` stack.
- Author and caller locations for vendor wrappers and generated React 18 hosts.
- Source-map handling for inline maps, indexed sections, ignored sources, unmapped segments, and failed-download retries.
