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
import { highlightCode } from "@/lib/highlight-code"

export const metadata: Metadata = {
  title: "Works with",
  description:
    "Component patterns next-inspect-ui can inspect: HTML, SVG, shadcn, Base UI, Motion, Radix Slot, forwardRef, memo, compound components, and more.",
  alternates: { canonical: "/works-with" },
}

const benchmark = sourceBenchmark.nextInspectUi
const benchmarkLink =
  "text-foreground no-underline hover:underline underline-offset-4"

export default async function WorksWithPage() {
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
      <header className="flex flex-col gap-2">
        <h1>Works with</h1>
        <p>
          Works with almost all React patterns represented in the benchmark,
          from native elements to wrapped and compound components. The fixtures
          come from{" "}
          <a
            className={benchmarkLink}
            href="https://github.com/millionco/react-grab-bench"
            target="_blank"
            rel="noopener noreferrer"
          >
            React Grab Bench
          </a>
          . Our direct source checks live in the{" "}
          <a
            className={benchmarkLink}
            href="https://github.com/Gurvinder-Singh02/next-inspect-bench"
            target="_blank"
            rel="noopener noreferrer"
          >
            Next Inspect UI benchmark repository
          </a>{" "}
          (private): a fork of that bench with Next Inspect UI wired in.
        </p>
      </header>

      <section className="flex flex-col gap-3" aria-label="Benchmark results">
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
          editor launch time. Numbers are copied from the private benchmark
          repo after a run there.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>More patterns in the benchmark</h2>
        <ul className="grid list-disc gap-x-8 gap-y-2 pl-5 font-inter text-[15px] leading-relaxed text-muted-foreground sm:grid-cols-2">
          <li>Higher-order components and render adapters</li>
          <li>Aliased imports and re-exported components</li>
          <li>Styled components and polymorphic hosts</li>
          <li>Deeply nested compound components</li>
        </ul>
      </section>

      <div className="flex flex-col gap-12">
        <p>
          In addition to the benchmark patterns, Next Inspect UI works
          especially well with shadcn, Base UI, Motion, and SVG.
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
    </>
  )
}
