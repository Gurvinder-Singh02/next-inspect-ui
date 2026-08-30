import Link from "next/link"
import { Undo2Icon } from "lucide-react"

import { PlaytestPlayground } from "@/components/playtest/playtest-playground"
import { Button } from "@/components/ui/button"
import {
  PLAYTEST_EXAMPLE,
  PLAYTEST_RUN_HINTS,
} from "@/lib/playtest-examples"

export default function PlaytestPage() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10 sm:py-16">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 w-fit rounded-full pr-4! pl-3! text-xs text-muted-foreground hover:bg-muted3"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <Undo2Icon data-icon="inline-start" className="size-3!" />
            Back to docs
          </Button>

          <header className="flex flex-col gap-3">
            <h1 className="font-inter text-2xl font-semibold tracking-tight">
              Playtest
            </h1>
            <p className="max-w-[62ch] font-inter text-[15px] leading-relaxed text-muted-foreground">
              A tiny playground for learning Playwright. The fixtures below are
              what the real e2e file drives. Run the suite while this page is
              up, or let Playwright start the dev server for you.
            </p>
          </header>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-inter text-[15px] font-medium tracking-tight">
            How to run
          </h2>
          <ul className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-4 font-mono text-[12px] leading-relaxed">
            {PLAYTEST_RUN_HINTS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="font-inter text-[13px] text-muted-foreground">
            Spec file:{" "}
            <code className="font-mono text-[12px]">
              next-inspect-website/e2e/playtest.spec.ts
            </code>
          </p>
        </section>

        <PlaytestPlayground />

        <section className="flex flex-col gap-3">
          <h2 className="font-inter text-[15px] font-medium tracking-tight">
            Example Playwright test
          </h2>
          <p className="font-inter text-[14px] text-muted-foreground">
            Same assertions as the runnable file.{" "}
            <code className="font-mono text-[12px]">getByTestId</code> finds
            the fixtures above;{" "}
            <code className="font-mono text-[12px]">expect</code> fails the
            test when the UI does not match.
          </p>
          <pre
            data-testid="example-source"
            className="overflow-x-auto rounded-xl border border-border bg-card p-4 font-mono text-[11px] leading-relaxed text-foreground/90"
          >
            <code>{PLAYTEST_EXAMPLE}</code>
          </pre>
        </section>
      </div>
    </main>
  )
}
