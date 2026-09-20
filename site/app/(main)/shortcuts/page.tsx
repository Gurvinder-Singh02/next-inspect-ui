import type { Metadata } from "next"

import { ShortcutsReference } from "@/components/landing/shortcuts-reference"

export const metadata: Metadata = {
  title: "Shortcuts",
  description:
    "Keyboard and pointer controls for next-inspect-ui while inspect mode is active: hover, click, Option-climb, and the info panel.",
  alternates: { canonical: "/shortcuts" },
}

export default function ShortcutsPage() {
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1>
          Shortcuts
        </h1>
        <p>
          Keyboard and pointer controls while inspect mode is active.
        </p>
      </header>

      <ShortcutsReference />
    </>
  )
}
