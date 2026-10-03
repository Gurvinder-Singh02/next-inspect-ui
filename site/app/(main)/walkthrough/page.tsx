import type { Metadata } from "next"
import { CornerDownLeft, Option } from "lucide-react"
import Link from "next/link"

import { UsageVideo } from "@/components/landing/usage-video"
import { Kbd } from "@/components/ui/kbd"

export const metadata: Metadata = {
  title: "Walkthrough",
  description:
    "Hover any node to see the component name. Click or Enter opens the code where it’s defined. Hold Option to select the owning component. Press Space to browse the trees. Learn more in Shortcuts.",
  alternates: { canonical: "/walkthrough" },
}

export default function WalkthroughPage() {
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1>Walkthrough</h1>
        <div className="flex flex-col gap-2">
          <p>Hover any node to see the component name.</p>
          <p>
            <Kbd className="align-middle">Click</Kbd> or{" "}
            <Kbd className="align-middle">
              Enter
              <CornerDownLeft />
            </Kbd>{" "}
            opens the code where it’s defined.
          </p>
          <p>
            Hold{" "}
            <Kbd className="align-middle">
              <Option />
            </Kbd>{" "}
            on a compound component to see where it’s used. Open the tree
            popover with <Kbd className="align-middle">Space</Kbd> to select
            other ancestors.
          </p>
          <p>
            Press <Kbd className="align-middle">[</Kbd> to go to the parent
            node. Press <Kbd className="align-middle">]</Kbd> to go to a child.
          </p>
          <p>
            Learn more in{" "}
            <Link
              href="/shortcuts"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Shortcuts
            </Link>
            .
          </p>
        </div>
      </header>

      <figure className="flex w-full flex-col gap-2">
        <UsageVideo className="w-full" />
        <figcaption className="text-center text-[11px] text-muted-foreground">
          Side-by-side recording of Cursor and Chrome (
          <a
            href="https://ui.shadcn.com/blocks"
            target="_blank"
            rel="noreferrer"
            className="text-foreground/90 hover:text-foreground/80"
          >
            shadcn/ui Dashboard 01
          </a>{" "}
          block).
        </figcaption>
      </figure>
    </>
  )
}
