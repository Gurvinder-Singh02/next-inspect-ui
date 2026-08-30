import Link from "next/link"
import { Undo2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"

const SUITES = [
  {
    href: "/test/ui",
    title: "UI test",
    blurb: "Overlay look and feel. Empty for now — cases go here next.",
  },
  {
    href: "/test/source-open",
    title: "Source-open test",
    blurb:
      "Every source-resolution fixture. Hover with ⌥X; the debug panel scores each stamp against the compiler record.",
  },
  {
    href: "/playtest",
    title: "Playwright playtest",
    blurb:
      "Learning playground: click, type, and hover fixtures with a real Playwright example you can run.",
  },
]

export default function TestIndexPage() {
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
              Test
            </h1>
            <p className="max-w-[62ch] font-inter text-[15px] leading-relaxed text-muted-foreground">
              Two suites. Source-open is the live resolution check; UI is a
              placeholder until we pick what to put there.
            </p>
          </header>
        </div>

        <ul className="flex flex-col gap-3">
          {SUITES.map((entry) => (
            <li key={entry.href}>
              <Link
                href={entry.href}
                className="flex flex-col gap-1.5 rounded-xl border border-border p-5 transition-colors hover:bg-muted/40"
              >
                <span className="font-inter text-[15px] font-medium">
                  {entry.title}
                </span>
                <span className="font-inter text-[14px] leading-relaxed text-muted-foreground">
                  {entry.blurb}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
