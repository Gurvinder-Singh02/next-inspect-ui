import { Option } from "lucide-react"

import { InstallSection } from "@/components/landing/install-section"
import { UsageCodeSection } from "@/components/landing/usage-code-section"
import { Kbd } from "@/components/ui/kbd"

export default function OverviewPage() {
  return (
    <>
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <h1 className="font-inter text-2xl leading-tight font-semibold tracking-tight">
            next-inspect-ui
          </h1>
          <span className="font-inter text-[12px] text-muted-foreground">
            v0.1.1 · react
          </span>
        </div>

        <div className="flex flex-col font-inter text-[15px] leading-relaxed text-muted-foreground">
          <span>Never Search For Next.js Components Again.</span>
          <span className="flex flex-wrap items-center gap-1">
            press{" "}
            <Kbd>
              <Option />
            </Kbd>{" "}
            + <Kbd>x</Kbd>, hover any element for its DOM tag + source, click to
            open it — hold{" "}
            <Kbd>
              <Option />
            </Kbd>{" "}
            to climb to where the component is used,{" "}
            <Kbd>
              <Option />
            </Kbd>{" "}
            + <Kbd>⇧</Kbd> to climb again, <Kbd>I</Kbd> for details.
          </span>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-inter text-[15px] font-medium tracking-tight">
          What it does
        </h2>
        <p className="font-inter text-[14px] leading-relaxed text-muted-foreground">
          A development-only overlay for Next.js. Hover shows the exact DOM tag
          and author line; hold ⌥ to climb to the nearest component&apos;s usage
          site when it&apos;s a direct child (HTML wrappers shake + stay).
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-5 font-inter text-[14px] leading-relaxed text-muted-foreground">
          <li>Default tooltip = DOM tag + author source; click opens that line</li>
          <li>⌥ climbs to usage; ⌥+⇧ repeats; release ⌥ resets</li>
          <li>I opens used / defined / 2-node tree + Tailwind/CSS</li>
          <li>Configurable spotlight and tooltip styling</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-inter text-[15px] font-medium tracking-tight">
          Installation
        </h2>
        <InstallSection />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-inter text-[15px] font-medium tracking-tight">
          Usage
        </h2>
        <UsageCodeSection />
      </section>

      <footer className="border-t border-border pt-8 text-[12px] text-muted-foreground">
        <div className="flex flex-wrap gap-4">
          <a
            href="/components"
            className="transition-colors hover:text-foreground"
          >
            Try the live demo →
          </a>
          <a
            href="/variant-test"
            className="transition-colors hover:text-foreground"
          >
            Overlay variant test →
          </a>
          <a
            href="/inspector-test"
            className="transition-colors hover:text-foreground"
          >
            Inspector test suite →
          </a>
          <a
            href="/algo-test"
            className="transition-colors hover:text-foreground"
          >
            Resolution cases →
          </a>
          <a
            href="/dashboard"
            className="transition-colors hover:text-foreground"
          >
            Dashboard →
          </a>
        </div>
      </footer>
    </>
  )
}
