"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/usage", label: "Usage" },
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
      <div className="lg:absolute lg:top-0 lg:-left-20">
        <div className="flex flex-row flex-wrap px-4 sm:px-6 lg:flex-col lg:whitespace-nowrap">
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
                  "inline-flex min-h-11 items-center rounded-md px-2.5 font-inter text-sm transition-colors [touch-action:manipulation] lg:min-h-0 lg:py-1.5",
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
