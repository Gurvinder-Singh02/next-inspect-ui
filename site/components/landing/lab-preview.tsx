"use client"

import {
  DEFAULT_INSPECTOR_SETTINGS,
  formatTooltipLabel,
  getOverlayPaint,
} from "next-inspect-ui/lib"

import { cn } from "@/lib/utils"

const paint = getOverlayPaint(DEFAULT_INSPECTOR_SETTINGS)
const label = formatTooltipLabel({
  title: "h1",
  pageName: "app/(main)/page.tsx:16",
  tooltipProps: DEFAULT_INSPECTOR_SETTINGS.tooltipProps,
  tagStyle: "dom",
})

export const LabPreview = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => (
  <div className={cn("relative w-fit", className)}>
    <span
      aria-hidden
      className="absolute bottom-full left-0 mb-1.5 max-w-72 truncate font-azeret-mono text-xs leading-snug shadow-md"
      style={{
        background: paint.tooltipBackground,
        border: `1px solid ${paint.tooltipBorder}`,
        color: paint.tooltipText,
        padding: paint.tooltipPadding,
        borderRadius: paint.tooltipBorderRadius,
      }}
    >
      {label}
    </span>
    <div
      className="px-1.5 py-0.5"
      style={{
        backgroundColor: paint.fill,
        border: paint.border,
        borderRadius: paint.borderRadius,
      }}
    >
      {children}
    </div>
  </div>
)
