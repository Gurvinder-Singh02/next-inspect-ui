import type { Metadata } from "next"

import { ShortcutsReference } from "@/components/landing/shortcuts-reference"

export const metadata: Metadata = {
  title: "Shortcuts",
  description:
    "Keyboard and pointer controls for next-inspect-ui while inspect mode is active.",
  alternates: { canonical: "/shortcuts" },
}

export default function ShortcutsPage() {
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="font-inter text-2xl leading-tight font-semibold tracking-tight">
          Shortcuts
        </h1>
        <p className="font-inter text-[14px] leading-relaxed text-muted-foreground">
          Keyboard and pointer controls while inspect mode is active.
        </p>
      </header>

      <ShortcutsReference />
    </>
  )
}
