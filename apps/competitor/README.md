# competitor

Run `bun run dev:competitor` at the repository root, then open http://localhost:3104.

Next.js 16.2.6, React 19.2.4, Turbopack. No custom Babel/Vite plugin. The sample includes nested client and server components, child buttons/badges/avatars, SVG, mapped lists, a searchable/filterable/sortable table, row details, and a native dialog that adds projects. Sample changes last until reload.

The top **Library** selector enables one inspector at a time. Switching writes the `competitor-inspector` cookie and reloads the document so global listeners and React instrumentation from the previous library are cleared. **Off** loads none. All inspector integration is development-only.

| Inspector | Version | Setup | Try |
|---|---|---|---|
| Next Inspect UI | Workspace package | `<InspectUI projectRoot={...} />` | Option + X; hover; Space |
| Show Component | 2.3.0 | `<ShowComponent sourceRoot={...} />` | Option + right-click; add Shift for tree |
| React Grab | 0.2.0 | Local installed `index.global.js`, before React | Hover; ⌘C / Ctrl+C |
| Click to React Component | 1.1.3 | `<ClickToComponent editor="cursor" />` | Option + click / right-click |

React Grab is served from the installed npm package at `/react-grab.js`, using Next.js’s documented `beforeInteractive` script setup. No CDN, agent integration, or custom build transform is added. Its normal element/context-copy UI remains intact.

Click to React Component relies on `_debugSource`. React 19 removed that field, so it may show a highlight without resolving a source. It is installed and selectable to expose that difference, rather than simulating support. Compare server-rendered and client-rendered content separately.

## Read the implementations

- Selection and mounting: `components/inspector-switch.tsx` and `app/layout.tsx`.
- React Grab script delivery: `app/react-grab.js/route.ts`.
- Next Inspect UI: `../../packages/next-inspect-ui/src/lib/engine.ts` and `src/inspector.tsx`.
- Show Component: `node_modules/show-component/dist/` (debug stacks, owner chain, source maps).
- React Grab: `node_modules/react-grab/dist/` (React instrumentation, source/context extraction, selection UI).
- Click to React Component: `node_modules/click-to-react-component/src/` (fiber traversal and `_debugSource`).

Upstream docs: [Show Component](https://github.com/sidorares/show-component), [React Grab](https://github.com/aidenybai/react-grab), [Click to React Component](https://github.com/ericclemmons/click-to-component).

Checks: `bun run typecheck:competitor` and `bun run build:competitor`.
