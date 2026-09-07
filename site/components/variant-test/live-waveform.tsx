"use client"

import { cn } from "@/lib/utils"

const BARS = [28, 64, 42, 88, 56, 96, 38, 72, 50, 84, 46, 90, 34, 68, 58, 80]

export const LiveWaveform = ({
  active = false,
  processing = false,
  height = 64,
  className,
}: {
  active?: boolean
  processing?: boolean
  height?: number
  className?: string
}) => (
  <div
    className={cn("flex w-full items-end gap-0.5", className)}
    style={{ height }}
    aria-hidden
  >
    {BARS.map((bar, index) => (
      <div
        key={index}
        className={cn(
          "flex-1 rounded-sm bg-foreground/50",
          active && "bg-foreground/80",
          processing && !active && "animate-pulse"
        )}
        style={{
          height: `${bar}%`,
          animationDelay: processing ? `${index * 40}ms` : undefined,
        }}
      />
    ))}
  </div>
)
