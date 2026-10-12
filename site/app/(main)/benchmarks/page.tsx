import type { Metadata } from "next"

import sourceBenchmark from "../../../../docs/source-benchmark-summary.json"

import { WorksWithPattern } from "@/components/landing/works-with-pattern"
import {
  WorksWithBaseUi,
  WorksWithIcons,
  WorksWithKinds,
  WorksWithLibraryHost,
  WorksWithMappedList,
  WorksWithMotion,
  WorksWithRadixSlot,
  WorksWithShadcn,
  WorksWithSvg,
} from "@/components/landing/works-with-previews"
import { WorksWithServerCard } from "@/components/landing/works-with-server"
import { WORKS_WITH_SNIPPETS } from "@/components/landing/works-with-snippets"
import { contentLinkClassName } from "@/lib/content-link"
import { highlightCode } from "@/lib/highlight-code"
import { GITHUB_REPO } from "@/lib/site"

export const metadata: Metadata = {
  title: "Benchmarks",
  description:
    "In-repo accuracy test suites across Next.js and Vite, plus source lookup results from React Grab Bench.",
  alternates: { canonical: "/benchmarks" },
  openGraph: {
    url: "/benchmarks",
    title: "Benchmarks | Next Inspect UI",
  },
}

const benchmark = sourceBenchmark.nextInspectUi

const TEST_SUITES = [
  {
    name: "test-next-js",
    stack: "Next.js 16 + React 19, Turbopack",
    cases: "20 cases",
    href: `${GITHUB_REPO}/tree/main/apps/test-next-js`,
  },
  {
    name: "test-next-js-webpack",
    stack: "Next.js 16 + React 19, Webpack",
    cases: "20 cases",
    href: `${GITHUB_REPO}/tree/main/apps/test-next-js-webpack`,
  },
  {
    name: "test-vite-react-19",
    stack: "Vite + React 19",
    cases: "17 cases",
    href: `${GITHUB_REPO}/tree/main/apps/test-vite-react-19`,
  },
  {
    name: "test-react-18",
    stack: "Vite + React 18, experimental",
    cases: "17 cases",
    href: `${GITHUB_REPO}/tree/main/apps/test-react-18`,
  },
] as const

export default async function BenchmarksPage() {
  const highlighted = Object.fromEntries(
    await Promise.all(
      Object.entries(WORKS_WITH_SNIPPETS).map(async ([key, code]) => [
        key,
        await highlightCode(code),
      ])
    )
  ) as Record<keyof typeof WORKS_WITH_SNIPPETS, string>

  return (
    <>
      <header className="flex flex-col gap-3">
        <h1>Benchmarks</h1>
        <p>
          Accuracy is checked in four test apps in this repo. Next.js runs 20
          cases including Server Components; Vite runs the same 17 browser
          cases. Open{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-azeret-mono text-[12px] text-muted-foreground">
            /test
          </code>{" "}
          in any suite.
        </p>
      </header>

      <section className="flex flex-col gap-3" aria-label="Test suites">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              In-repo Next Inspect UI accuracy test suites
            </caption>
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                {["Suite", "Stack", "Cases"].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="py-2 pr-6 font-normal whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TEST_SUITES.map((suite) => (
                <tr key={suite.name} className="border-b border-border/60">
                  <td className="py-3 pr-6 font-mono whitespace-nowrap">
                    <a
                      className={contentLinkClassName}
                      href={suite.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {suite.name}
                    </a>
                  </td>
                  <td className="py-3 pr-6 whitespace-nowrap">{suite.stack}</td>
                  <td className="py-3 pr-6 font-mono whitespace-nowrap">
                    {suite.cases}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-col gap-12">
        <p>
          The suites cover shadcn, Base UI, Motion, SVG, and the other patterns
          below.
        </p>
        <WorksWithPattern
          title="shadcn"
          description="Button, variants, and a Button nested in Card."
          preview={<WorksWithShadcn />}
          code={WORKS_WITH_SNIPPETS.shadcn}
          html={highlighted.shadcn}
        />
        <WorksWithPattern
          title="Base UI"
          description="useRender hosts like Badge, and nested compound children: Root with Trigger and Panel."
          preview={<WorksWithBaseUi />}
          code={WORKS_WITH_SNIPPETS.baseui}
          html={highlighted.baseui}
        />
        <WorksWithPattern
          title="Motion"
          description="motion.div as a return root, nested motion.div, and motion.rect."
          preview={<WorksWithMotion />}
          code={WORKS_WITH_SNIPPETS.motion}
          html={highlighted.motion}
        />
        <WorksWithPattern
          title="SVG"
          description="svg and nested hosts like rect."
          preview={<WorksWithSvg />}
          code={WORKS_WITH_SNIPPETS.svg}
          html={highlighted.svg}
        />
        <WorksWithPattern
          title="Library host"
          description="DOM built with createElement instead of JSX the caller wrote."
          preview={<WorksWithLibraryHost />}
          code={WORKS_WITH_SNIPPETS.library}
          html={highlighted.library}
        />
        <WorksWithPattern
          title="Radix Slot"
          description="asChild merges onto the child host instead of rendering its own."
          preview={<WorksWithRadixSlot />}
          code={WORKS_WITH_SNIPPETS.radix}
          html={highlighted.radix}
        />
        <WorksWithPattern
          title="forwardRef, memo, compound"
          description="Different fiber shapes: forwardRef, memo, and Panel.Header."
          preview={<WorksWithKinds />}
          code={WORKS_WITH_SNIPPETS.kinds}
          html={highlighted.kinds}
        />
        <WorksWithPattern
          title="Mapped lists"
          description="Elements created in .map() still open the authoring file."
          preview={<WorksWithMappedList />}
          code={WORKS_WITH_SNIPPETS.map}
          html={highlighted.map}
        />
        <WorksWithPattern
          title="Icons"
          description="Third-party SVG such as Lucide. Climb goes to this call site, not node_modules."
          preview={<WorksWithIcons />}
          code={WORKS_WITH_SNIPPETS.icons}
          html={highlighted.icons}
        />
        <WorksWithPattern
          title="Server Component"
          description="Find the source of HTML rendered by a React Server Component."
          preview={<WorksWithServerCard title="Direct" />}
          code={WORKS_WITH_SNIPPETS.server}
          html={highlighted.server}
        />
      </div>

      <section className="flex flex-col gap-3" aria-label="React Grab Bench">
        <h2>React Grab Bench</h2>
        <p>
          In addition, we run the{" "}
          <a
            className={contentLinkClassName}
            href="https://github.com/millionco/react-grab-bench"
            target="_blank"
            rel="noopener noreferrer"
          >
            React Grab Bench
          </a>{" "}
          fixtures in a private fork,{" "}
          <a
            className={contentLinkClassName}
            href="https://github.com/Gurvinder-Singh02/next-inspect-bench"
            target="_blank"
            rel="noopener noreferrer"
          >
            next-inspect-bench
          </a>
          , with Next Inspect UI wired in.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Next Inspect UI source lookup benchmark
            </caption>
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                {["Definition files", "In component tree", "Median", "p95"].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="py-2 pr-6 font-normal whitespace-nowrap"
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr>
                <td className="py-3 pr-6 whitespace-nowrap">
                  {benchmark.exactFile}/{benchmark.total}
                </td>
                <td className="py-3 pr-6 whitespace-nowrap">
                  {benchmark.chainContainsFile}/{benchmark.total}
                </td>
                <td className="py-3 pr-6 whitespace-nowrap">
                  {benchmark.medianMs.toFixed(1)} ms
                </td>
                <td className="py-3 pr-6 whitespace-nowrap">
                  {benchmark.p95Ms.toFixed(1)} ms
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          Direct definition-file lookup across {benchmark.total} fixtures, with{" "}
          {benchmark.missing} missing targets and {benchmark.errors} lookup
          errors. Timing includes source lookup and component context, not
          editor launch time. Numbers are copied from the private benchmark repo
          after a run there.
        </p>
        <ul className="grid list-disc gap-x-8 gap-y-2 pl-5 font-inter text-[15px] leading-relaxed text-muted-foreground sm:grid-cols-2">
          <li>Higher-order components and render adapters</li>
          <li>Aliased imports and re-exported components</li>
          <li>Styled components and polymorphic hosts</li>
          <li>Deeply nested compound components</li>
        </ul>
      </section>
    </>
  )
}
