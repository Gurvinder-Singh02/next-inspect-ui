import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { ApiReference } from "@/components/landing/api-reference"

export const metadata: Metadata = {
  title: "API Reference",
  description:
    "InspectUI props. projectRoot is optional; shortcut, editor, tooltip, and spotlight props seed the overlay settings panel.",
  alternates: { canonical: "/api-reference" },
}

export default function ApiReferencePage() {
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1>API Reference</h1>
        <p>
          InspectUI works without required props. projectRoot is optional.
          Optional shortcut, ide, tooltip, and spotlight props seed the overlay
          settings panel. Update live in the{" "}
          <Link
            href="/lab"
            rel="nofollow"
            className="inline-flex items-center gap-1 align-middle text-foreground no-underline hover:text-foreground/80"
          >
            Playground
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </p>
      </header>

      <ApiReference />
    </>
  )
}
