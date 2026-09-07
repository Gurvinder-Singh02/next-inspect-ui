"use client"

import { useState } from "react"

import { CodeBlock } from "@/components/landing/code-block"
import { cn } from "@/lib/utils"

const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const

export type PackageManager = (typeof PACKAGE_MANAGERS)[number]

export type InstallCommandTab = {
  manager: PackageManager
  code: string
  html: string
}

export const InstallCommand = ({
  tabs,
  className,
}: {
  tabs: InstallCommandTab[]
  className?: string
}) => {
  const [packageManager, setPackageManager] = useState<PackageManager>("npm")
  const active = tabs.find((tab) => tab.manager === packageManager) ?? tabs[0]

  if (!active) return null

  // Runner prefix changes per tab; `shadcn@…` stays put.
  const mark = "shadcn@"
  const markIndex = active.code.indexOf(mark)
  const morphPrefix =
    markIndex > 0 ? active.code.slice(0, markIndex) : undefined

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        role="tablist"
        aria-label="Package manager"
        className="flex items-center gap-4"
      >
        {PACKAGE_MANAGERS.map((manager) => {
          const isActive = packageManager === manager

          return (
            <button
              key={manager}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-cuelume-toggle="tick"
              onClick={() => setPackageManager(manager)}
              className={cn(
                "font-inter text-[13px] tracking-tight transition-colors focus-visible:outline",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {manager}
            </button>
          )
        })}
      </div>

      <CodeBlock
        code={active.code}
        html={active.html}
        morph
        morphPrefix={morphPrefix}
      />
    </div>
  )
}
