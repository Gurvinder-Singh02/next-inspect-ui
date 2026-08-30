import Link from "next/link"
import { Undo2Icon } from "lucide-react"

import { InspectorTestRunner } from "@/components/inspector-test/test-runner"
import { ServerCompFixture } from "@/components/inspector-test/server-comp-fixture"
import { Button } from "@/components/ui/button"

export default function InspectorTestPage() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 sm:py-16">
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
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <h1 className="font-inter text-2xl font-semibold tracking-tight">
                Inspector test suite
              </h1>
              <span className="font-mono text-[11px] text-muted-foreground">
                v0.1.1
              </span>
            </div>
            <p className="max-w-[54ch] font-inter text-[15px] leading-relaxed text-muted-foreground">
              Unit suites cover tooltip labels (DOM vs climb), ⌥+⇧ depth,
              rendered by vs source, RSC paths, and chrome. Live fixtures below
              exercise hover → ⌥ climb → ⇧ → <kbd className="font-mono text-[12px]">I</kbd>{" "}
              by hand (⌥X to activate InspectUI).
            </p>
          </header>
        </div>

        <ServerCompFixture />
        <InspectorTestRunner />
      </div>
    </main>
  )
}
