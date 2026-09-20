"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/walkthrough", label: "Walkthrough" },
  { href: "/works-with", label: "Works with" },
  { href: "/api-reference", label: "API Reference" },
  { href: "/shortcuts", label: "Shortcuts" },
] as const

export const SiteNav = ({ className }: { className?: string }) => {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Site"
      className={cn(
        "sticky top-0 z-40 h-fit border-b border-border/60 bg-background/90 backdrop-blur-sm lg:top-12 lg:border-0 lg:bg-transparent lg:backdrop-blur-none",
        className
      )}
    >
      <div className="flex justify-center lg:absolute lg:top-0 lg:left-0 xl:-left-20">
        <div className="flex w-full max-w-3xl no-scrollbar flex-row overflow-scroll px-4 lg:flex-col whitespace-nowrap">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                data-cuelume-press="tick"
                className={cn(
                  "inline-flex min-h-11 [touch-action:manipulation] items-center rounded-md px-2.5 font-inter text-sm transition-colors lg:min-h-0 lg:py-1.5",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
