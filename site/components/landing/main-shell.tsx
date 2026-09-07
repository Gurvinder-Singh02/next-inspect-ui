"use client"

import { usePathname } from "next/navigation"

import { HeroWindows } from "@/components/landing/hero-windows"
import { SiteNav } from "@/components/landing/site-nav"

export const MainShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const showHero = pathname === "/"

  return (
    <div className="flex flex-col bg-background text-foreground">
      {showHero ? <HeroWindows className="mt-12 sm:mt-24" /> : null}
      <div className="mx-auto flex w-full max-w-6xl py-12 ">
        <SiteNav />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6">
          {children}
        </main>
      </div>
    </div>
  )
}
