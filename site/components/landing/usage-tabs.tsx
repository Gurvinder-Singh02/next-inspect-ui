"use client"

import { useId, useState } from "react"

import { CodeBlock } from "@/components/landing/code-block"
import { CopyableText } from "@/components/landing/copyable-text"
import { cn } from "@/lib/utils"

export type UsageTab = {
  id: string
  label: string
  description: string
  code: string
  html: string
  prompt: string
}

export const UsageTabs = ({ tabs }: { tabs: UsageTab[] }) => {
  const [selected, setSelected] = useState(0)
  const id = useId()
  const active = tabs[selected]
  if (!active) return null
  const entryFile =
    active.id === "nextjs"
      ? "app/layout.tsx"
      : active.id === "react"
        ? "src/index.js"
        : "src/main.tsx"
  const details = active.description
    .replace(`Add this to ${entryFile}. `, "")
    .replace("For Create React App, update src/index.js. ", "")

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Framework"
        className="flex items-center gap-4"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`${id}-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected === index}
            aria-controls={`${id}-panel`}
            tabIndex={selected === index ? 0 : -1}
            data-cuelume-toggle="tick"
            onClick={() => setSelected(index)}
            onKeyDown={(event) => {
              let next = index
              if (event.key === "ArrowRight") next = (index + 1) % tabs.length
              else if (event.key === "ArrowLeft")
                next = (index + tabs.length - 1) % tabs.length
              else if (event.key === "Home") next = 0
              else if (event.key === "End") next = tabs.length - 1
              else return
              event.preventDefault()
              setSelected(next)
              document.getElementById(`${id}-${tabs[next].id}`)?.focus()
            }}
            className={cn(
              "font-inter text-[13px] tracking-tight transition-colors",
              selected === index
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-${active.id}`}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-3">
          <p>Tell your agent</p>
          <CopyableText text={active.prompt} />
        </div>
        <div className="my-3 flex items-center gap-4" aria-label="Or">
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">OR</span>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </div>
        <p>
          Do it manually. Add this to <code>{entryFile}</code>. {details}
        </p>
        <CodeBlock code={active.code} html={active.html} />
      </div>
    </div>
  )
}
