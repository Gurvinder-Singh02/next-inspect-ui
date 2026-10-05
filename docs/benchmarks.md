# Bundle benchmarks

Run `bun run benchmark` from the repository root. The command builds the library, measures standalone bundles, and writes [benchmark-results.json](benchmark-results.json). If the external benchmark fork is installed, the command also measures the comparison libraries. Without it, the command measures Next Inspect UI alone. Source lookup and editor navigation are measured separately in [Source benchmarks](source-benchmarks.md).

## Current sizes

| Setup | Size (gzip) |
|---|---:|
| Development component | 23,624 B (23.1 kB) |
| Development standalone script | 83,171 B (81.2 kB) |
| Production guarded import | 0 B of inspector code |
| Production static import | 133 B wrapper |

The component measurement uses minified esbuild ESM with React and ReactDOM excluded. The standalone script bundles its own React runtime. Sizes are standalone measurements, not an application build delta; the displayed kB values divide bytes by 1,024. The JSON report records the measurement time and exact byte counts.

## Guard the import

Next.js:

```tsx
const InspectUI = process.env.NODE_ENV === "development"
  ? (await import("next-inspect-ui")).InspectUI
  : null
```

Vite:

```tsx
const InspectUI = import.meta.env.DEV
  ? (await import("next-inspect-ui")).InspectUI
  : null
```

Mount `{InspectUI && <InspectUI />}` beside your app. These build-time checks remove the branch containing the import from production. The benchmark confirms that no library modules remain in the guarded production bundle.

A static import uses the library’s internal development check to disable the inspector, but can retain a small wrapper. Guarding only the rendered component does not guarantee that the whole library is excluded.

For the standalone script, keep both the serving route and script tag development-only. The example route returns 404 in production; production pages contain no inspector script tag or download. See the [script setup](../packages/next-inspect-ui/README.md#dev-only-script-like-react-grab).

## Internal resolver

The library has no additional runtime dependencies beyond its React and ReactDOM peers. The internal stack reader and source-map decoder replace `bippy/source`. Compared with the previous report, component gzip drops from 30,510 B to 23,624 B and script gzip drops from 89,516 B to 83,171 B.

React Grab still uses bippy in the comparison apps, so bippy remains in the benchmark fork as a competitor dependency. It is not imported by Next Inspect UI or included in its library bundle.
