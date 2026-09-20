"use client"

import { useState, type ReactNode } from "react"
import { ChevronDownIcon } from "lucide-react"

import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

export const FaqList = ({
  items,
}: {
  items: readonly { q: string; a: ReactNode }[]
}) => {
  return (
    <div className="flex flex-col font-inter text-[14px] leading-relaxed">
      {items.map((item) => (
        <FaqItem key={item.q} q={item.q} a={item.a} />
      ))}
    </div>
  )
}

const FaqItem = ({ q, a }: { q: string; a: ReactNode }) => {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b">
      <CollapsibleTrigger className="group flex min-h-11 w-full items-center justify-between gap-2 py-3 text-left font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4">
        {q}
        <ChevronDownIcon className="pointer-events-none shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-aria-expanded:rotate-180 motion-reduce:transition-none" />
      </CollapsibleTrigger>
      <div
        inert={!open}
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pb-3 text-muted-foreground">{a}</div>
        </div>
      </div>
    </Collapsible>
  )
}
