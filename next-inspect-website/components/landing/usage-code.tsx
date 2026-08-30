"use client"

import { useState } from "react"

import { CodeBlock } from "@/components/landing/code-block"
import { cn } from "@/lib/utils"

export type UsageTab = {
  id: string
  label: string
  code: string
  html: string
}

export const UsageCode = ({
  tabs,
  className,
}: {
  tabs: UsageTab[]
  className?: string
}) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "")
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]

  if (!active) return null

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        role="tablist"
        aria-label="Usage steps"
        className="flex flex-wrap items-center gap-2"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-cuelume-toggle="toggle"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 font-inter text-[13px] tracking-tight transition-colors focus-visible:outline",
                isActive
                  ? "border-transparent bg-muted text-foreground"
                  : "border-border bg-transparent text-foreground hover:bg-muted/50"
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <CodeBlock code={active.code} html={active.html} />
    </div>
  )
}
