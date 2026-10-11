"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CircleArrowOutUpLeft, Command as CommandIcon } from "lucide-react"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

const PAGES = [
  { href: "/", label: "Overview" },
  { href: "/walkthrough", label: "Walkthrough" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/works-with", label: "Works with" },
  { href: "/api-reference", label: "API Reference" },
  { href: "/shortcuts", label: "Shortcuts" },
] as const

const actionClassName = cn(
  "relative flex cursor-pointer items-center gap-2 text-[15px] text-foreground active:scale-95"
)

const iconButtonClassName = cn(
  "flex size-8 items-center justify-center rounded-full bg-muted4 text-foreground"
)

export const NotFoundView = () => {
  const router = useRouter()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") {
        return
      }
      event.preventDefault()
      setIsSearchOpen((open) => !open)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }
    router.push("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center  px-6">
      <div className="space-y-6 text-center">
        <h3 className="docs-h3-s">404 page not found</h3>
        <div className="docs-p mt-4 flex flex-col items-center gap-2 text-muted-foreground">
          <p>Bruh you&apos;re looking for something that doesn&apos;t exist</p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={goBack} className={actionClassName}>
              <span className={iconButtonClassName} aria-hidden>
                <CircleArrowOutUpLeft className="size-4" />
              </span>
              Go back
            </button>
            <Link href="/" className={actionClassName}>
              <span className={iconButtonClassName} aria-hidden>
                <div className="size-6 rounded-full bg-accent" />
              </span>
              Home
            </Link>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className={actionClassName}
            >
              <span className={iconButtonClassName} aria-hidden>
                <CommandIcon className="size-4" />
              </span>
              Search
            </button>
          </div>
        </div>
      </div>

      <CommandDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        title="Command Palette"
        description="Search for a command to run…"
      >
        <Command>
          <CommandInput placeholder="Search pages…" />
          <CommandList>
            <CommandEmpty>No pages found.</CommandEmpty>
            <CommandGroup heading="Pages">
              {PAGES.map((page) => (
                <CommandItem
                  key={page.href}
                  value={page.label}
                  onSelect={() => {
                    setIsSearchOpen(false)
                    router.push(page.href)
                  }}
                >
                  {page.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  )
}
