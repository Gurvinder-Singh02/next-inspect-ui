"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/usage", label: "Usage" },
  { href: "/source", label: "Source Code" },
  { href: "/api-reference", label: "API Reference" },
  { href: "/shortcuts", label: "Shortcuts" },
] as const

export const SiteNav = ({ className }: { className?: string }) => {
  const pathname = usePathname()

  return (
    <nav className={cn("sticky top-24 z-40 h-fit", className)}>
      <div className="absolute top-0 -left-20">
      <div className="mx-auto  flex h-12 whitespace-nowrap flex-col gap-0 px-6">
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
              "rounded-md px-2.5 py-1.5 font-inter text-sm transition-colors",
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
