import type { Metadata } from "next"

import { ApiReference } from "@/components/landing/api-reference"

export const metadata: Metadata = {
  title: "API Reference",
  description:
    "InspectUI props. projectRoot is required; shortcut, editor, tooltip, and spotlight can be seeded or changed in the overlay settings panel.",
  alternates: { canonical: "/api-reference" },
}

export default function ApiReferencePage() {
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="font-inter text-2xl leading-tight font-semibold tracking-tight">
          API Reference
        </h1>
        <p className="font-inter text-[14px] leading-relaxed text-muted-foreground">
          InspectUI takes a required projectRoot. Optional shortcut, ide,
          tooltip, and spotlight props seed the overlay settings panel.
        </p>
      </header>

      <ApiReference />
    </>
  )
}
