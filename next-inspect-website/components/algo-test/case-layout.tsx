import Link from "next/link"
import { Undo2Icon } from "lucide-react"

import { AutoRunner } from "@/components/algo-test/auto-runner"
import { Button } from "@/components/ui/button"

/**
 * Shared chrome for a resolution fixture.
 *
 * Every case states the bug it reproduces and what a correct hover looks like,
 * so a failure is readable without going back to the commit that fixed it.
 */
export const CaseLayout = ({
  title,
  reproduces,
  expected,
  children,
  autoCheck = true,
}: {
  title: string
  reproduces: string
  expected: React.ReactNode
  children: React.ReactNode
  /** Legacy page-wide stamp sweep. Prefer per-case AccuracyCase goldens. */
  autoCheck?: boolean
}) => (
  <main className="min-h-svh bg-background text-foreground">
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10 sm:py-16">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 w-fit rounded-full pr-4! pl-3! text-xs text-muted-foreground hover:bg-muted3"
          nativeButton={false}
          render={<Link href="/test/source-open" />}
        >
          <Undo2Icon data-icon="inline-start" className="size-3!" />
          All cases
        </Button>

        <header className="flex flex-col gap-3">
          <h1 className="font-inter text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="max-w-[62ch] font-inter text-[15px] leading-relaxed text-muted-foreground">
            {reproduces}
          </p>
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 font-mono text-[13px] leading-relaxed">
            <span className="text-muted-foreground">expected · </span>
            {expected}
          </div>
        </header>
      </div>

      {autoCheck ? <AutoRunner /> : null}

      <section className="flex flex-col gap-6">{children}</section>
    </div>
  </main>
)

export const Fixture = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-2">
    <div className="font-mono text-[12px] tracking-wide text-muted-foreground uppercase">
      {label}
    </div>
    {children}
  </div>
)
