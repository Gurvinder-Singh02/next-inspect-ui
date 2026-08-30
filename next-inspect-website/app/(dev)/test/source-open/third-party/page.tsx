import Link from "next/link"
import { ArrowRightIcon, CircleIcon, SparklesIcon } from "lucide-react"

import { CaseLayout, Fixture } from "@/components/algo-test/case-layout"

export default function ThirdPartyCase() {
  return (
    <CaseLayout
      title="Third-party components"
      reproduces="Components whose hosts are built inside node_modules. There is no project file containing the <svg> a lucide icon renders, so the honest answer is the call site — reached through the owner chain, never by climbing the render tree to the nearest page."
      expected={
        <>
          hover an icon or link → <code>this file</code>
          <br />
          <span className="text-muted-foreground">
            never a node_modules path, never a page that merely contains it
          </span>
        </>
      }
    >
      <Fixture label="lucide icons — svg built in node_modules">
        <div className="flex items-center gap-4">
          <SparklesIcon className="size-5" />
          <CircleIcon className="size-5" />
          <ArrowRightIcon className="size-5" />
        </div>
      </Fixture>

      <Fixture label="next/link">
        <Link
          href="/test/source-open"
          className="font-inter text-[14px] underline underline-offset-4"
        >
          Back to the case index
        </Link>
      </Fixture>

      <Fixture label="icon nested inside a link">
        <Link
          href="/test/source-open"
          className="inline-flex items-center gap-2 font-inter text-[14px]"
        >
          With an icon
          <ArrowRightIcon className="size-4" />
        </Link>
      </Fixture>
    </CaseLayout>
  )
}
