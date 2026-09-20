import type { Metadata } from "next"

import { InspectorSettingsControls } from "@/components/inspector-toolbar"
import { OverlayPreview } from "@/components/variant-test/overlay-preview"

export const metadata: Metadata = {
  title: "Lab",
  robots: { index: false, follow: false },
}

export default function LabPage() {
  return (
    <main className="flex h-svh max-h-svh flex-col overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-3 px-6 py-8">
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
