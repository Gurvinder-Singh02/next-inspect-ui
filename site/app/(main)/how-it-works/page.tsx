import type { Metadata } from "next"
import Link from "next/link"
import benchmarks from "../../../../docs/benchmark-results.json"

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From a browser element to React Fiber, source maps, and the exact line in your editor.",
  alternates: { canonical: "/how-it-works" },
}

const steps = [
  {
    title: "Find the element",
    text: "In inspect mode, hover a button, heading, or icon. The tool finds the DOM element under your pointer and draws a highlight around it. DOM means the elements your browser displays.",
  },
  {
    title: "Read React Fiber",
    text: "React attaches an internal Fiber reference to the element. Fiber holds information about what React rendered. Its links help the tool find the component that made the element and where that component was used.",
  },
  {
    title: "Read the source clues",
    text: "In development, React can provide a source location or stack trace through its _debugSource, _debugStack, and _debugInfo fields. A stack trace lists the code calls that led to the element. These are internal React fields, so what is available can vary.",
  },
  {
    title: "Find the original file",
    text: "Next.js turns TSX into JavaScript for the browser. A source map is a separate file that links that JavaScript back to the original TSX. The tool uses it when needed to find the file, line, and column. For server code, Next.js’s dev endpoint can help map the stack trace.",
  },
  {
    title: "Open your editor",
    text: "Click or press Enter to open the source. An absolute path opens through an editor link. A relative path goes to the local dev server, which opens its configured editor. If that endpoint is unavailable, the tool falls back to an editor link. Mount <InspectUI /> without required props.",
  },
] as const

export default function HowItWorksPage() {
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1>How it works</h1>
        <p>Pick an element in your browser. Jump to the code that made it.</p>
      </header>

      <pre
        className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-5 text-sm leading-relaxed"
        aria-label="Path from a browser click to your editor"
      >
        {`Browser click
     ↓
DOM element
     ↓
React Fiber
     ↓
Fiber debug metadata
     ↓
Source maps (when needed)
     ↓
file.tsx:42:8
     ↓
Editor link / dev server
     ↓
Cursor / VS Code`}
      </pre>

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
        <p>Like React Grab, you can load a standalone script only in development. Serve the installed next-inspect-ui/script file at /inspect-ui.js, with a route that returns 404 in production. The script mounts the inspector automatically.</p>
        <pre className="overflow-x-auto rounded-lg border border-border p-5 text-sm">{`import Script from "next/script"

{process.env.NODE_ENV === "development" && (
  <Script src="/inspect-ui.js" strategy="afterInteractive" />
)}`}</pre>
        <p>Production visitors get no inspector script tag or download. Do not mount the component alongside the script.</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Bundle benchmarks</h2>
        <p>Measured October 4, 2026. Minified standalone bundles, gzip bytes, with React excluded. These measure code size, not runtime speed or an app’s exact build increase.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr><th className="p-2">Inspector</th><th className="p-2">Dev</th><th className="p-2">Production static import</th><th className="p-2">Production guarded import</th></tr></thead>
            <tbody>{benchmarks.results.map(row => <tr key={row.name}><td className="p-2">{row.name}</td><td className="p-2">{row.development.gzip.toLocaleString("en-US")} B</td><td className="p-2">{row.production.gzip.toLocaleString("en-US")} B</td><td className="p-2">Library excluded by dev guard</td></tr>)}
              <tr><td className="p-2">Next Inspect UI global script</td><td className="p-2">{benchmarks.inspectUiScript.gzip.toLocaleString("en-US")} B</td><td className="p-2">Depends on script inclusion</td><td className="p-2">Excluded with dev-only script guard</td></tr>
              <tr><td className="p-2">React Grab 0.2.0 global script</td><td className="p-2">{benchmarks.reactGrab.gzip.toLocaleString("en-US")} B</td><td className="p-2">Depends on script inclusion</td><td className="p-2">Excluded with dev-only script guard</td></tr>
            </tbody>
          </table>
        </div>
        <p>All three guarded component imports exclude the library from the bundle. React Grab’s global script is a different delivery format. Run <code>bun run benchmark</code> to repeat the comparison.</p>
      </section>

      <ol className="flex list-decimal flex-col gap-6 pl-5">
        {steps.map((step) => (
          <li key={step.title} className="pl-1">
            <h2 className="mb-2 text-lg font-medium">{step.title}</h2>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>

      <section
        className="flex flex-col gap-3"
        aria-labelledby="inspect-controls"
      >
        <h2 id="inspect-controls" className="text-lg font-medium">
          Choose what to inspect
        </h2>
        <p>Press Alt + X to turn inspect mode on or off.</p>
        <p>
          Click to open the element’s source. For a shared Button, this can be
          the button implementation.
        </p>
        <p>
          Hold Option / Alt to climb to its component usage, such as &lt;Button
          /&gt; in your page.
        </p>
        <p>
          Press Space to toggle the tree popover. Component shows the full
          ancestor chain; Element shows nearby HTML elements. Left / Right
          switches tabs, and Up / Down selects rows. Press Escape to leave
          inspect mode.
        </p>
        <p>
          See the{" "}
          <Link
            href="/walkthrough"
            className="text-foreground underline underline-offset-4"
          >
            walkthrough
          </Link>{" "}
          or the full{" "}
          <Link
            href="/shortcuts"
            className="text-foreground underline underline-offset-4"
          >
            shortcut list
          </Link>
          .
        </p>
      </section>
    </>
  )
}
