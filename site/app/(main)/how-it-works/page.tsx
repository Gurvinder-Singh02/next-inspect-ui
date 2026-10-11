import type { Metadata } from "next"
import Link from "next/link"
import { SourceIllustration } from "@/components/landing/source-illustration"
import { contentLinkClassName } from "@/lib/content-link"
import benchmarks from "../../../../docs/benchmark-results.json"

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From a browser element to React Fiber, source maps, and the exact line in your editor.",
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    url: "/how-it-works",
    title: "How it works | Next Inspect UI",
  },
}
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
      </header>

      <section className="flex flex-col gap-3">
        <h2>Inspiration</h2>
        <p>
          Inspired by{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/ericclemmons/click-to-component"
            className={contentLinkClassName}
          >
            click-to-component
          </a>
          ,{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/zthxxx/react-dev-inspector"
            className={contentLinkClassName}
          >
            react-dev-inspector
          </a>
          , and{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/aidenybai/react-grab"
            className={contentLinkClassName}
          >
            React Grab
          </a>
          .
        </p>
        <p>
          Next Inspect UI adds Component and Element tabs for browsing component
          parents and nearby HTML. Use the keyboard to navigate shadcn/ui and
          compound components, then open an implementation or its usage in your
          page.
        </p>
      </section>

      <SourceIllustration />

      <section className="flex flex-col gap-3">
        <h2>No custom build plugin</h2>
        <p>
          Next Inspect UI uses React’s internal component tree to find the code
          behind an element. Source maps connect the bundled JavaScript to your
          original files, without a custom build plugin. In Next.js, the
          inspector also uses the built-in development endpoints to resolve
          source locations and open your editor.
        </p>
        <p>
          Stack parsing and source-map decoding are built in. React and ReactDOM
          are peer dependencies; no additional source-resolution library is
          required.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>IDE support through URL handling</h2>
        <p>
          Open source files in VS Code, VS Code Insiders, or Cursor. The
          inspector creates an editor URL with the file path, line, and column.
          Your operating system opens that location in the installed editor.
        </p>
        <p>
          Choose your editor in the inspector settings. See{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://code.visualstudio.com/docs/configure/command-line#_opening-vs-code-with-urls"
            className={contentLinkClassName}
          >
            VS Code’s URL handling documentation
          </a>{" "}
          for the URL format.
        </p>
        <p>
          For example, <code>cursor://file/path/to/component.tsx:42:8</code>
          opens the file in Cursor at line 42, column 8.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Shortcuts</h2>
        <p>
          Press Option / Alt + X to enable inspect mode. Press Space to open the
          tree, use the arrow keys to navigate, and press Enter to open the
          selected source.
        </p>
        <p>
          See{" "}
          <Link href="/shortcuts" className={contentLinkClassName}>
            all keyboard shortcuts
          </Link>
          .
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Keep the inspector out of production</h2>
        <p>
          A development-only import guard lets your bundler{" "}
          <strong>tree-shake the whole library</strong>, leaving 0 B of
          inspector code in production. A static import turns off the inspector
          but may retain a small wrapper.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="py-3 pr-4">Build</th>
                <th className="py-3">Size (gzip)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="py-3 pr-4">Development component</td>
                <td className="py-3">{kb(inspector.development.gzip)}</td>
              </tr>
              <tr className="border-t border-border">
                <td className="py-3 pr-4">Development script</td>
                <td className="py-3">{kb(benchmarks.inspectUiScript.gzip)}</td>
              </tr>
              <tr className="border-t border-border">
                <td className="py-3 pr-4">Production guarded import</td>
                <td className="py-3">0 B (library excluded)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          Follow the development-only setup in{" "}
          <Link href="/#overview-usage" className={contentLinkClassName}>
            Usage
          </Link>
          . For the standalone script, keep both its route and script tag
          development-only.
        </p>
      </section>
    </>
  )
}
