"use client"

import { createElement, forwardRef, memo, type ReactNode } from "react"
import { Slot } from "@radix-ui/react-slot"
import { ArrowRightIcon, CircleIcon, SparklesIcon } from "lucide-react"
import { motion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const WorksWithHtml = () => (
  <p className="text-xl font-medium tracking-tight">title</p>
)

export const WorksWithSvg = () => (
  <svg
    width={140}
    height={40}
    role="img"
    aria-label="bars"
    className="overflow-visible border"
  >
    <rect
      x={5}
      y={5}
      width={28}
      height={28}
      rx={6}
      className="fill-muted-foreground/30"
    />
    <rect
      x={39}
      y={5}
      width={28}
      height={28}
      rx={6}
      className="fill-muted-foreground/30"
    />
  </svg>
)

export const WorksWithShadcn = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="flex flex-wrap justify-center gap-3">
      <Button>Send code</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Nested</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline">Inside a card</Button>
      </CardContent>
    </Card>
  </div>
)

export const WorksWithBaseUi = () => (
  <div className="flex w-full max-w-sm flex-col items-stretch gap-4">
    <div className="flex flex-wrap justify-center gap-3">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
    </div>
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="flex min-h-11 w-full items-center justify-between gap-2 py-2 text-left font-inter text-[14px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        Details
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-1 font-inter text-[14px] text-muted-foreground">
        Nested children still resolve.
      </CollapsibleContent>
    </Collapsible>
  </div>
)

const motionBoxClass = "size-12 rounded-lg bg-muted-foreground/20"

export const WorksWithMotion = () => (
  <div className="flex flex-col items-center gap-6">
    <div className="flex items-start gap-6">
      <motion.div
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        className={motionBoxClass}
      />
      <div className="rounded-lg border border-border p-2">
        <div className="p-2">
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className={motionBoxClass}
          />
        </div>
      </div>
    </div>
    <svg width={140} height={40} role="img" aria-label="animated bars">
      {[0, 1, 2, 3].map((index) => (
        <motion.rect
          key={index}
          x={index * 34}
          y={4}
          width={28}
          height={28}
          rx={6}
          className="fill-muted-foreground/30"
          initial={{ scaleY: 0.6 }}
          animate={{ scaleY: 1 }}
        />
      ))}
    </svg>
  </div>
)

export const WorksWithLibraryHost = () => {
  const children = [0, 1, 2].map((index) =>
    createElement("rect", {
      key: index,
      x: index * 34,
      y: 4,
      width: 28,
      height: 28,
      rx: 6,
      className: "fill-muted-foreground/30",
    })
  )

  return createElement(
    "svg",
    {
      width: 100,
      height: 36,
      role: "img",
      "aria-label": "library host",
      className: "overflow-visible",
    },
    children
  )
}

const Clickable = ({
  asChild,
  children,
  ...props
}: {
  asChild?: boolean
  children: ReactNode
}) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className="rounded-md border border-border px-3 py-1.5 font-mono text-[13px]"
      {...props}
    >
      {children}
    </Comp>
  )
}

export const WorksWithRadixSlot = () => (
  <div className="flex flex-wrap items-center justify-center gap-3">
    <Clickable>Renders its own button</Clickable>
    <Clickable asChild>
      <a href="#slot" className="no-underline">
        Slot renders this anchor
      </a>
    </Clickable>
  </div>
)

const WorksWithForwardedInput = forwardRef<HTMLInputElement, { hint: string }>(
  function WorksWithForwardedInput({ hint, ...props }, ref) {
    return (
      <input
        ref={ref}
        placeholder={hint}
        className="rounded-md border border-border px-3 py-1.5 font-mono text-[13px]"
        {...props}
      />
    )
  }
)

const WorksWithMemoPill = memo(function WorksWithMemoPill({
  label,
}: {
  label: string
}) {
  return (
    <span className="rounded-full border border-border px-3 py-1 font-mono text-[12px]">
      {label}
    </span>
  )
})

const PanelRoot = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg border border-border">{children}</div>
)

const Panel = Object.assign(PanelRoot, {
  Header: ({ children }: { children: ReactNode }) => (
    <div className="border-b border-border px-4 py-2 font-inter text-[14px] font-medium">
      {children}
    </div>
  ),
  Body: ({ children }: { children: ReactNode }) => (
    <div className="px-4 py-3 font-inter text-[14px]">{children}</div>
  ),
})

const WorksWithCompound = () => (
  <Panel>
    <Panel.Header>Header</Panel.Header>
    <Panel.Body>Body</Panel.Body>
  </Panel>
)

export const WorksWithKinds = () => (
  <div className="flex flex-col items-center gap-3">
    <WorksWithForwardedInput hint="forwardRef" />
    <WorksWithMemoPill label="memo" />
    <WorksWithCompound />
  </div>
)

export const WorksWithMappedList = () => (
  <div className="flex flex-wrap justify-center gap-2">
    {["alpha", "beta", "gamma"].map((item) => (
      <span
        key={item}
        className="rounded-md border border-border px-3 py-1.5 font-mono text-[13px]"
      >
        {item}
      </span>
    ))}
  </div>
)

export const WorksWithIcons = () => (
  <div className="flex items-center justify-center gap-4">
    <SparklesIcon className="size-5" />
    <CircleIcon className="size-5" />
    <ArrowRightIcon className="size-5" />
  </div>
)
