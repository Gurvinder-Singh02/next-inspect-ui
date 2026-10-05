import type { Metadata } from "next"
import Link from "next/link"
import { SourceIllustration } from "@/components/landing/source-illustration"
import benchmarks from "../../../../docs/benchmark-results.json"

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From a browser element to React Fiber, source maps, and the exact line in your editor.",
  alternates: { canonical: "/how-it-works" },
}

const externalLink = "text-foreground underline underline-offset-4"
const inspector = benchmarks.results.find(
  (row) => row.name === "Next Inspect UI"
)!
const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} kB`

export default function HowItWorksPage() {
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1>How it works</h1>
        <p>
          A development tool for React apps. Enable inspect mode, then click an
          element to jump straight to its source in your editor.
        </p>
        <p>
          It reads React Fiber internals and resolves source maps in the
          browser. No custom build plugin is required. Next.js can also use its
          built-in development endpoints for source mapping and editor opening.
        </p>
      </header>

      <section className="flex flex-col gap-3" aria-label="Features">
        <ul className="flex list-disc flex-col gap-3 pl-5">
          <li>
            Supports <code>vscode</code>, <code>vscode-insiders</code>, and{" "}
            <code>cursor</code> through{" "}
            <a
              href="https://code.visualstudio.com/docs/configure/command-line#_opening-vs-code-with-urls"
              className={externalLink}
            >
              URL handling
            </a>
            .
          </li>
          <li>
            Automatically removes the inspector engine from production builds. A
            development-only import guard lets your bundler{" "}
            <strong>tree-shake the whole library</strong>; a static import can
            leave a small wrapper.
          </li>
          <li>
            Keyboard navigation in the tree popover: <kbd>←</kbd> / <kbd>→</kbd>{" "}
            switch tabs, <kbd>↑</kbd> / <kbd>↓</kbd> move between rows,{" "}
            <kbd>⏎</kbd> selects an Element preview then opens its source, and{" "}
            <kbd>Space</kbd> toggles the popover.
          </li>
          <li>
            Press <kbd>Option / Alt + X</kbd> to toggle inspect mode, hold{" "}
            <kbd>Option / Alt</kbd> to inspect component usage, and press{" "}
            <kbd>Esc</kbd> to exit. Outside the popover, arrows move between
            siblings, <kbd>[</kbd> / <kbd>]</kbd> move to a parent / child, and{" "}
            <kbd>⌘ / Ctrl + ← / →</kbd> jump to the first / last sibling. See{" "}
            <Link href="/shortcuts" className={externalLink}>
              all shortcuts
            </Link>
            , including spotlight padding controls.
          </li>
          <li>
            See the element, its nearby HTML, and its component parents
            together. Jump to source directly without opening React DevTools and
            searching its tree.
          </li>
        </ul>
      </section>

      <SourceIllustration />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Use only in development</h2>
        <p>Guard the import itself. No props are required.</p>
        <pre className="overflow-x-auto rounded-lg border border-border p-5 text-sm">{`const InspectUI = process.env.NODE_ENV === "development"
  ? (await import("next-inspect-ui")).InspectUI
  : null

// Inside your async layout:
{InspectUI && <InspectUI />}`}</pre>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Dev-only script</h2>
        <p>
          Like React Grab, you can load a standalone script only in development.
          Serve the installed next-inspect-ui/script file at /inspect-ui.js,
          with a route that returns 404 in production. The script mounts the
          inspector automatically.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border p-5 text-sm">{`import Script from "next/script"

{process.env.NODE_ENV === "development" && (
  <Script src="/inspect-ui.js" strategy="afterInteractive" />
)}`}</pre>
        <p>
          Production visitors get no inspector script tag or download. Do not
          mount the component alongside the script.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Inspired by</h2>
        <p>
          Inspired by{" "}
          <a
            href="https://github.com/sidorares/react-show-in-atom"
            className={externalLink}
          >
            react-show-in-atom
          </a>
          ,{" "}
          <a
            href="https://github.com/ericclemmons/click-to-component"
            className={externalLink}
          >
            click-to-component
          </a>
          , and{" "}
          <a
            href="https://github.com/aidenybai/react-grab"
            className={externalLink}
          >
            React Grab
          </a>
          : pick something on the page and find the code behind it.
        </p>
        <p>
          Next Inspect UI adds a popover with Component and Element tabs. Browse
          immediate component parents, preview nearby HTML with the keyboard,
          and choose whether to open a shared component’s implementation or its
          usage in your page. This makes shadcn/ui and compound components
          easier to navigate.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Bundle size</h2>
        <p>
          Inspector code size, measured{" "}
          {new Date(benchmarks.measuredAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "Asia/Kolkata",
          })}
          . Minified standalone bundles with React and ReactDOM excluded; these
          are not the total size of your app.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="py-3 pr-4">Delivery</th>
                <th className="py-3 pr-4">Minified</th>
                <th className="py-3">Gzip</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="py-3 pr-4">Development component</td>
                <td className="py-3 pr-4">{kb(inspector.development.raw)}</td>
                <td className="py-3">{kb(inspector.development.gzip)}</td>
              </tr>
              <tr className="border-t border-border">
                <td className="py-3 pr-4">Development global script</td>
                <td className="py-3 pr-4">
                  {kb(benchmarks.inspectUiScript.raw)}
                </td>
                <td className="py-3">{kb(benchmarks.inspectUiScript.gzip)}</td>
              </tr>
              <tr className="border-t border-border">
                <td className="py-3 pr-4">Production static import</td>
                <td className="py-3 pr-4">{inspector.production.raw} B</td>
                <td className="py-3">{inspector.production.gzip} B</td>
              </tr>
              <tr className="border-t border-border">
                <td className="py-3 pr-4">Production guarded import</td>
                <td colSpan={2} className="py-3">
                  Library excluded
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Run <code>bun run benchmark</code> to repeat the measurement. The
          global script includes its runtime and must be served only in
          development.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Background</h2>
        <p>
          Tools such as{" "}
          <a
            href="https://github.com/ericclemmons/click-to-component"
            className={externalLink}
          >
            click-to-component
          </a>
          ,{" "}
          <a
            href="https://github.com/zthxxx/react-dev-inspector"
            className={externalLink}
          >
            react-dev-inspector
          </a>
          , and{" "}
          <a
            href="https://github.com/infi-pc/locatorjs"
            className={externalLink}
          >
            LocatorJS
          </a>{" "}
          helped establish click-to-source navigation. Earlier implementations
          commonly used <code>_debugSource</code>, populated by the development
          JSX source transform.
        </p>
        <p>
          React 19{" "}
          <a
            href="https://github.com/facebook/react/pull/28265"
            className={externalLink}
          >
            removed _debugSource
          </a>
          , disrupting tools that depended on it. The impact is discussed in{" "}
          <a
            href="https://github.com/facebook/react/issues/32574"
            className={externalLink}
          >
            React issue #32574
          </a>
          .
        </p>
        <p>
          Next Inspect UI reads development stack metadata such as{" "}
          <code>_debugStack</code> and server component information, then maps
          generated positions back to source. It also uses{" "}
          <code>bippy/source</code>, the resolver used by React Grab, to recover
          component stacks when direct metadata is missing.
        </p>
        <ul className="flex list-disc flex-col gap-3 pl-5">
          <li>
            <strong>No custom build plugin</strong> — uses development metadata
            and your bundler’s source maps or built-in mapping endpoints.
          </li>
          <li>
            <strong>
              No additional Babel JSX source transform for React 19
            </strong>{" "}
            — source recovery uses stack information.
          </li>
          <li>
            <strong>React 19+ support</strong> — with experimental React 18
            compatibility that retains <code>_debugSource</code> when available.
            Source accuracy depends on the framework and metadata.
          </li>
        </ul>
        <p>
          Read the{" "}
          <Link href="/walkthrough" className={externalLink}>
            walkthrough
          </Link>{" "}
          for the complete interaction flow.
        </p>
      </section>
    </>
  )
}
