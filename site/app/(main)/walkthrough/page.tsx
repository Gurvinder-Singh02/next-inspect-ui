import type { Metadata } from "next"
import { CornerDownLeft, Option } from "lucide-react"
import Link from "next/link"

import { OpenExample } from "@/components/landing/open-example"
import { UsageVideo } from "@/components/landing/usage-video"
import { Kbd } from "@/components/ui/kbd"
import { contentLinkClassName } from "@/lib/content-link"
import { highlightCode } from "@/lib/highlight-code"
import { cn } from "@/lib/utils"

/** Option in ⌥ X sits high vs paragraph glyphs. */
const optionXKbdClassName = "align-middle -translate-y-px"

export const metadata: Metadata = {
  title: "Walkthrough",
  description:
    "Press Option + X to turn inspect on, hover an element, and use keyboard shortcuts to navigate. From the same hover, open where it’s defined or used.",
  alternates: { canonical: "/walkthrough" },
  openGraph: {
    url: "/walkthrough",
    title: "Walkthrough | Next Inspect UI",
  },
}

const DEFINED_EXAMPLE = {
  fileName: "components/ui/card.tsx",
  startLine: 36,
  highlightLines: [38],
  code: `function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-normal font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}`,
}

const USED_EXAMPLE = {
  fileName: "apps/nextjs/components/section-cards.tsx",
  startLine: 20,
  highlightLines: [20],
  code: `<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
  $1,950.00
</CardTitle>`,
}

export default async function WalkthroughPage() {
  const [definedHtml, usedHtml] = await Promise.all([
    highlightCode(DEFINED_EXAMPLE.code, "tsx", {
      startLine: DEFINED_EXAMPLE.startLine,
      highlightLines: DEFINED_EXAMPLE.highlightLines,
    }),
    highlightCode(USED_EXAMPLE.code, "tsx", {
      startLine: USED_EXAMPLE.startLine,
      highlightLines: USED_EXAMPLE.highlightLines,
    }),
  ])

  return (
    <>
      <header className="flex flex-col gap-5">
        <h1>Walkthrough</h1>

        <p>
          Press{" "}
          <Kbd className={optionXKbdClassName}>
            <Option />
          </Kbd>{" "}
          <Kbd className={optionXKbdClassName}>X</Kbd> to turn inspect on, hover
          over an element, and use{" "}
          <Link href="/shortcuts" className={contentLinkClassName}>
            keyboard shortcuts
          </Link>{" "}
          to navigate.
        </p>
      </header>

      <figure className="flex w-full flex-col gap-2">
        <UsageVideo className="w-full" />
        <figcaption className="text-center text-[11px] text-muted-foreground">
          Side-by-side recording of Cursor and Chrome (
          <a
            href="https://ui.shadcn.com/blocks"
            target="_blank"
            rel="noreferrer"
            className={contentLinkClassName}
          >
            shadcn/ui Dashboard 01
          </a>{" "}
          block).
        </figcaption>
      </figure>

      <div className="flex flex-col gap-5">
        <p>
          From the same hover, you can open where it’s defined or where it’s
          used in your IDE.
        </p>

        <section className="flex flex-col gap-3">
          <h2>Defined</h2>
          <p>
            Hover an element, then <Kbd>Click</Kbd> or{" "}
            <Kbd>
              Enter
              <CornerDownLeft />
            </Kbd>{" "}
            to open the definition. For a component, that’s its source file. For
            a tag like <code>&lt;div&gt;</code> or <code>&lt;h1&gt;</code>,
            that’s the line where it’s written.
          </p>
          <OpenExample
            fileName={DEFINED_EXAMPLE.fileName}
            code={DEFINED_EXAMPLE.code}
            html={definedHtml}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2>Used</h2>
          <p>
            Hover an element. If a{" "}
            <Kbd className={cn(optionXKbdClassName, "bg-blue-600 text-white")}>
              <Option />
            </Kbd>{" "}
            pill shows on the left of the tooltip, it’s a component. Hold{" "}
            <Kbd className={optionXKbdClassName}>
              <Option />
            </Kbd>{" "}
            and press <Kbd>Click</Kbd> or{" "}
            <Kbd>
              Enter
              <CornerDownLeft />
            </Kbd>{" "}
            to open where it’s used.
          </p>
          <OpenExample
            fileName={USED_EXAMPLE.fileName}
            code={USED_EXAMPLE.code}
            html={usedHtml}
          />
        </section>

        <p>
          Press <Kbd>Space</Kbd> for the info popover: component hierarchy, plus
          a lot of shortcuts to move between elements fast. See{" "}
          <Link href="/shortcuts" className={contentLinkClassName}>
            Shortcuts
          </Link>
          .
        </p>
      </div>
    </>
  )
}
