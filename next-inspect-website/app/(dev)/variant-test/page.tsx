import Link from "next/link"
import { ArrowLeft, Undo2Icon, UndoIcon } from "lucide-react"

import { InspectorSettingsControls } from "@/components/inspector-toolbar"
import { OverlayPreview } from "@/components/variant-test/overlay-preview"
import { Button } from "@/components/ui/button"

export default function VariantTestPage() {
  return (
    <main className="flex h-svh max-h-svh flex-col overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-3 px-6 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="ml-1 w-fit rounded-full pr-4! pl-3! text-xs text-muted-foreground hover:bg-muted3"
          nativeButton={false}
          render={<Link href="/" />}
        >
          <Undo2Icon data-icon="inline-start" className="size-3!" />
          Back to docs
        </Button>

        <div className="flex min-h-0 flex-1 flex-row gap-8 lg:gap-10">
          <aside className="flex min-h-0 w-62 shrink-0 flex-col">
            <InspectorSettingsControls className="h-full" />
          </aside>
          <OverlayPreview className="min-h-0 min-w-0 flex-[1.2]" />
        </div>
      </div>
    </main>
  )
}
