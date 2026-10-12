"use client"

import { useState, type ReactNode } from "react"
import { PlayIcon } from "lucide-react"

import { CodeBlock } from "@/components/landing/code-block"
import {
  Collapsible,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

export const OpenExample = ({
  fileName,
  code,
  html,
  children,
}: {
  /** File name shown in the code block header. */
  fileName: string
  code: string
  html: string
  /** Custom label after “Example:”. Defaults to “it will open”. */
  children?: ReactNode
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-2">
      <CollapsibleTrigger
        className={cn(
          "inline-flex max-w-full text-muted-foreground hover:text-foreground items-center gap-1.5 text-left outline-none",
          "focus-visible:ring-3 focus-visible:ring-ring/50",
          "touch-action-manipulation [-webkit-tap-highlight-color:transparent]"
        )}
      >
        <PlayIcon
          className={cn(
            "size-2.5 shrink-0 fill-current  transition-transform duration-200 ease-out motion-reduce:transition-none",
            open && "rotate-90"
          )}
          aria-hidden
        />
        <span className="min-w-0 font-inter text-[13px] ">
          Example: {children ?? "it will open"}
        </span>
      </CollapsibleTrigger>
      <div
        inert={!open}
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <CodeBlock
            code={code}
            html={html}
            fileName={fileName}
            showCopy={false}
          />
        </div>
      </div>
    </Collapsible>
  )
}
