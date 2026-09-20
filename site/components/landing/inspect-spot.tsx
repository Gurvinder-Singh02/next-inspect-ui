"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { ArrowUpRight, MousePointer2 } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import {
  DEFAULT_INSPECTOR_SETTINGS,
  formatTooltipLabel,
  getOverlayPaint,
} from "next-inspect-ui/lib"

import { cn } from "@/lib/utils"

const paint = getOverlayPaint(DEFAULT_INSPECTOR_SETTINGS)
const FOLLOW_EASE = [0.22, 1, 0.36, 1] as const
const FOLLOW_S = 0.16
const STACK_SHIFT_X = 29
const STACK_GAP_Y = 5

const tooltipChipStyle = {
  background: paint.tooltipBackground,
  border: `1px solid ${paint.tooltipBorder}`,
  color: paint.tooltipText,
  padding: paint.tooltipPadding,
  borderRadius: paint.tooltipBorderRadius,
  boxShadow: "0 4px 12px rgb(0 0 0 / 30%)",
  font: '12px / 1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  maxWidth: "min(36rem, calc(100vw - 16px))",
} as const

export type InspectBox = {
  left: number
  top: number
  width: number
  height: number
}

const UsedSiteIcon = ({ open }: { open: boolean }) => {
  const reduceMotion = useReducedMotion()

  return (
    <motion.span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center overflow-hidden"
      initial={false}
      animate={{ width: open ? 12 : 0, marginRight: open ? 3 : 0 }}
      transition={{ duration: reduceMotion ? 0 : FOLLOW_S, ease: "easeInOut" }}
    >
      <ArrowUpRight size={12} strokeWidth={2.4} />
    </motion.span>
  )
}

const UnderChip = ({
  text,
  depth,
  duration,
}: {
  text: string
  depth: number
  duration: number
}) => {
  const ref = useRef<HTMLSpanElement>(null)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const sync = () => setHeight(node.offsetHeight)
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(node)
    return () => observer.disconnect()
  }, [text])

  return (
    <motion.span
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute right-auto bottom-0 left-0 overflow-hidden text-ellipsis whitespace-nowrap"
      initial={{ x: 0, y: 0, opacity: 0.92 }}
      animate={{
        x: STACK_SHIFT_X * depth,
        y: height * depth + STACK_GAP_Y * depth,
        opacity: 0.92,
      }}
      transition={{ duration, ease: FOLLOW_EASE }}
      style={{
        ...tooltipChipStyle,
        zIndex: 2 - depth,
      }}
    >
      {text}
    </motion.span>
  )
}

const tooltipProps = DEFAULT_INSPECTOR_SETTINGS.tooltipProps

const TooltipFront = ({ label, used }: { label: string; used: boolean }) => (
  <span
    className="relative z-2 flex w-fit items-center overflow-hidden"
    style={tooltipChipStyle}
  >
    <UsedSiteIcon open={used} />
    <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
      {label}
    </span>
  </span>
)

export const DemoCursor = ({
  variant,
  left,
  top,
}: {
  variant: "arrow" | "plus"
  left: number
  top: number
}) => {
  const reduceMotion = useReducedMotion()

  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute z-40 size-6"
      initial={false}
      animate={{ left, top }}
      transition={{ duration: reduceMotion ? 0 : FOLLOW_S, ease: FOLLOW_EASE }}
    >
      {variant === "plus" ? (
        <>
          <span className="absolute top-1/2 right-0.5 left-0.5 h-0.5 -translate-y-1/2 rounded-full bg-foreground shadow-[0_0_0_1px_var(--background)]" />
          <span className="absolute top-0.5 bottom-0.5 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-foreground shadow-[0_0_0_1px_var(--background)]" />
        </>
      ) : (
        <MousePointer2
          className="size-5 fill-foreground text-foreground drop-shadow-sm"
          aria-hidden
        />
      )}
    </motion.span>
  )
}

export const FollowInspect = ({
  box,
  visible,
  tag,
  pageName,
  stack = [],
  used = false,
  tagStyle = "dom",
}: {
  box: InspectBox | null
  visible: boolean
  tag: string
  pageName: string
  stack?: string[]
  used?: boolean
  tagStyle?: "dom" | "component"
}) => {
  const reduceMotion = useReducedMotion()
  const label = formatTooltipLabel({
    title: tag,
    pageName,
    tooltipProps: DEFAULT_INSPECTOR_SETTINGS.tooltipProps,
    tagStyle,
  })
  const duration = reduceMotion ? 0 : FOLLOW_S

  if (!box) return null

  return (
    <>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute z-20"
        initial={false}
        animate={{
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
          opacity: visible ? 1 : 0,
        }}
        transition={{ duration, ease: FOLLOW_EASE }}
        style={{
          backgroundColor: paint.fill,
          border: paint.border,
          borderRadius: paint.borderRadius,
        }}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute z-30 overflow-visible"
        initial={false}
        animate={{
          left: box.left + tooltipProps.alignOffset,
          top: box.top,
          opacity: visible ? 1 : 0,
        }}
        transition={{ duration, ease: FOLLOW_EASE }}
      >
        <span
          className="absolute left-0 w-fit"
          style={{
            bottom: "100%",
            marginBottom: tooltipProps.sideOffset,
          }}
        >
          {stack.map((under, index) => (
            <UnderChip
              key={under}
              text={under}
              depth={stack.length - index}
              duration={duration}
            />
          ))}
          <TooltipFront label={label} used={used} />
        </span>
      </motion.span>
    </>
  )
}

export const InspectSpot = ({
  active,
  tag,
  pageName,
  className,
  children,
  stack,
  used = false,
  tagStyle = "dom",
}: {
  active: boolean
  tag: string
  pageName: string
  className?: string
  children: React.ReactNode
  stack?: string
  used?: boolean
  tagStyle?: "dom" | "component"
}) => {
  const reduceMotion = useReducedMotion()
  const label = formatTooltipLabel({
    title: tag,
    pageName,
    tooltipProps: DEFAULT_INSPECTOR_SETTINGS.tooltipProps,
    tagStyle,
  })

  return (
    <div className={cn("relative w-fit", className)}>
      {children}
      {active ? (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              backgroundColor: paint.fill,
              border: paint.border,
              borderRadius: paint.borderRadius,
            }}
          />
          <span
            aria-hidden
            className="absolute bottom-full left-0 z-20 overflow-visible"
            style={{ marginBottom: tooltipProps.sideOffset }}
          >
            {stack ? (
              <UnderChip
                text={stack}
                depth={1}
                duration={reduceMotion ? 0 : FOLLOW_S}
              />
            ) : null}
            <TooltipFront label={label} used={used} />
          </span>
        </>
      ) : null}
    </div>
  )
}
