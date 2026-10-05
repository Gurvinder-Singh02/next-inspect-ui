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

const FrameworkIcon = ({ id }: { id: string }) =>
  id === "nextjs" ? (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 shrink-0 fill-current"
    >
      <circle cx="12" cy="12" r="11" />
      <path
        d="M7 17V7h2l8 12M16 7v7"
        fill="none"
        className="stroke-background"
        strokeWidth="1.5"
      />
    </svg>
  ) : id === "vite" ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0">
      <path d="m2 3 10 19L22 3l-10 3Z" fill="#8B5CF6" />
      <path d="m13 1-5 12h4l-1 8 7-13h-5l2-7Z" fill="#FACC15" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 shrink-0 fill-none stroke-[#61DAFB]"
      strokeWidth="1.2"
    >
      <ellipse cx="12" cy="12" rx="11" ry="4.2" />
      <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(120 12 12)" />
      <circle cx="12" cy="12" r="2" fill="#61DAFB" stroke="none" />
    </svg>
  )

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
        className="flex flex-wrap items-center gap-2"
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
              "inline-flex min-h-11 items-center gap-2.5 rounded-xl border px-4 py-2.5 font-inter text-sm tracking-tight transition-colors",
              selected === index
                ? "border-muted bg-muted text-foreground"
                : "border-border bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <FrameworkIcon id={tab.id} />
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
          <p>Tell your agent to set it up:</p>
          <CopyableText text={active.prompt} />
        </div>
        <div className="my-3 flex items-center gap-4" aria-label="Or">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">OR</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <p>
          Do it manually. Add this to <code>{entryFile}</code>. {details}
        </p>
        <CodeBlock code={active.code} html={active.html} />
      </div>
    </div>
  )
}
