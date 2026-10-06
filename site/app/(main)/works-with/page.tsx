import type { Metadata } from "next"

import { WorksWithPattern } from "@/components/landing/works-with-pattern"
import {
  WorksWithBaseUi,
  WorksWithHtml,
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
          Works with almost every pattern you use in React today: HTML, SVG,
          shadcn, Base UI, Motion, Slot, compound components, and the rest of
          the usual stack. Hover a preview in inspect mode to jump to the
          source. Async Server Components are not inspectable yet.
        </p>
      </header>

      <div className="flex flex-col gap-12">
        <WorksWithPattern
          title="HTML"
          description="Native markup authored on the page."
          preview={<WorksWithHtml />}
          code={WORKS_WITH_SNIPPETS.html}
          html={highlighted.html}
        />
        <WorksWithPattern
          title="SVG"
          description="svg and nested hosts like rect."
          preview={<WorksWithSvg />}
          code={WORKS_WITH_SNIPPETS.svg}
          html={highlighted.svg}
        />
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
          title="Server host"
          description="A sync server component that emits DOM. Async Server Components are not inspectable yet."
          preview={<WorksWithServerCard title="Direct" />}
          code={WORKS_WITH_SNIPPETS.server}
          html={highlighted.server}
        />
      </div>
    </>
  )
}
