import { Option } from "lucide-react"
import type { Metadata } from "next"

import inspectUIPackage from "next-inspect-ui/package.json"

import { InstallSection } from "@/components/landing/install-section"
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site"
import { cn } from "@/lib/utils"

const shortcutKeyClassName = cn(
  "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground select-none [&_svg:not([class*='size-'])]:size-3"
)

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} — ${SITE_TAGLINE}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
}

export default function OverviewPage() {
  return (
    <>
      <header className="flex flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <h1 className="font-inter text-2xl leading-tight font-semibold tracking-tight">
            next-inspect-ui
          </h1>
          <span className="font-inter text-[12px] text-muted-foreground">
            v{inspectUIPackage.version}
          </span>
        </div>

        <div className="flex flex-col font-inter text-[15px] leading-relaxed text-muted-foreground">
          <span>Never Search For Next.js Components Again.</span>
          <span className="flex flex-wrap items-center gap-1">
            press{" "}
            <kbd className={shortcutKeyClassName}>
              <Option />
            </kbd>{" "}
            + <kbd className={shortcutKeyClassName}>x</kbd>, hover any element
            for its DOM tag + source, click to open it — hold{" "}
            <kbd className={shortcutKeyClassName}>
              <Option />
            </kbd>{" "}
            to climb to where the component is used,{" "}
            <kbd className={shortcutKeyClassName}>
              <Option />
            </kbd>{" "}
            + <kbd className={shortcutKeyClassName}>⇧</kbd> to climb again,{" "}
            <kbd className={shortcutKeyClassName}>I</kbd> for details.
          </span>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-inter text-[15px] font-medium tracking-tight">
          Installation
        </h2>
        <InstallSection />
      </section>
    </>
  )
}
