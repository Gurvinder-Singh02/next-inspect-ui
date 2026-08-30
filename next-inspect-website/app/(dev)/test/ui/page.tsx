import Link from "next/link"
import { FlaskConicalIcon, Undo2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function UiTestPage() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10 sm:py-16">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 w-fit rounded-full pr-4! pl-3! text-xs text-muted-foreground hover:bg-muted3"
          nativeButton={false}
          render={<Link href="/test" />}
        >
          <Undo2Icon data-icon="inline-start" className="size-3!" />
          All tests
        </Button>

        <h1 className="font-inter text-2xl font-semibold tracking-tight">
          UI test
        </h1>

        <Empty className="min-h-80 border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FlaskConicalIcon />
            </EmptyMedia>
            <EmptyTitle>Nothing here yet</EmptyTitle>
            <EmptyDescription>
              We will decide what to show after.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </main>
  )
}
