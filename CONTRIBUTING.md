# Contributing

Bug reports, documentation fixes, and code contributions are welcome. For a bug report, include your React version, framework or bundler, a small reproduction, and the expected and actual source file and line.

## Set up the repository

Install Node.js, pnpm, and Bun. The unit test runner requires a Node.js version that supports `--experimental-strip-types`.

From the repository root:

```bash
pnpm install
bun run build
```

The library builds into `packages/next-inspect-ui/dist`. Apps use the local workspace package.

## Choose a development app

| Command | App | URL |
|---|---|---|
| `bun run dev` | Documentation site | http://localhost:3000 |
| `bun run dev:example` | Dashboard example | http://localhost:3102 |
| `bun run dev:test-next-js` | Next.js / Turbopack source suite | http://localhost:3001/test |
| `bun run dev:test-next-js-webpack` | Next.js / Webpack source suite | http://localhost:3002/test |
| `bun run dev:test-vite-react-19` | Vite / React 19 source suite | http://localhost:5173/test |
| `bun run dev:test-react-18` | Vite / React 18 source suite | http://localhost:5174/test |

`bun run dev:test` starts all four source suites. Their ports must be free; Ctrl+C stops the apps together. React 18 compatibility remains experimental.

Use `bun run dev:lib` to watch the component library while editing it. Run `bun run build` after changing the standalone script so its bundled output is refreshed.

## Find the relevant code

- `packages/next-inspect-ui/src/inspector.tsx`: overlay, hover, keyboard controls, and editor-opening interactions.
- `packages/next-inspect-ui/src/lib/engine.ts`: Fiber navigation, source locations, source maps, and editor links.
- `packages/next-inspect-ui/src/lib/fiber-stack.ts` and `component-frame.ts`: internal stack reading and component-frame recovery.
- `packages/test-cases/src`: library unit tests.
- `apps/test-next-js`: canonical test-suite UI and Next.js fixtures.
- `site`: public documentation and usage examples.

## Follow the project rules

Read [flow.md](flow.md) before changing source resolution, editor opening, inspector interactions, keyboard shortcuts, or component navigation. Update it in the same change when behavior changes, including its diagrams and control table.

Keep every test app’s suite UI identical to `apps/test-next-js`. After changing its shared accuracy components, UI primitives, theme, or styles, run:

```bash
bun run sync:test-ui
```

Keep fixtures and exact source expectations local to each app. Server Component cases run only in Next.js. Do not change expected file locations just to make a failing resolver test pass.

Preserve the development-only dynamic import guard. The inspector must remain excluded from production when installed with that guard. Keep standalone-script routes and script tags development-only too.

Keep third-party license and attribution files with their copied fixtures and source helpers.

## Verify your change

For library or application code changes:

```bash
bun run test
bun run typecheck
bun run typecheck:compat
bun run build
```

For source-resolution or interaction changes, open the relevant `/test` apps and press **Run all**. Check **Logs** for exact expected and actual names, files, lines, and node counts. Verify normal click, Option / Alt climbing, and Component / Element keyboard navigation when those paths change.

For performance or bundle changes:

```bash
bun run benchmark
```

See [bundle measurements](docs/benchmarks.md). Source-retrieval comparisons against [React Grab Bench](https://github.com/millionco/react-grab-bench) live in the private fork [next-inspect-bench](https://github.com/Gurvinder-Singh02/next-inspect-bench). After a run there, copy the `next-inspect-ui` summary into `docs/source-benchmark-summary.json` for the Benchmarks page.

Documentation-only changes need working links and examples; they do not require rerunning every browser check.

## Submit a change

Create a branch in your fork, keep the change focused, and open a pull request. Explain the problem, the resulting behavior, and the checks you ran. Include before/after evidence for UI changes and exact expected/actual locations for source-resolution fixes.

Add user-visible changes to the **Unreleased** section of [CHANGELOG.md](CHANGELOG.md). Leave generated build output and local evidence files out of the pull request unless they are tracked reports needed to review the change.

## License

The project uses the [MIT license](LICENSE). Preserve the copyright and license notices, including the separate licenses for third-party material.
