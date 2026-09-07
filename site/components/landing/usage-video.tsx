import { PlayIcon } from "lucide-react"

import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

/** Big video slot — drop a file in later via `src`. */
export const UsageVideo = ({
  src,
  className,
}: {
  src?: string
  className?: string
}) => {
  if (src) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border bg-card",
          className
        )}
      >
        <video
          className="aspect-video w-full"
          src={src}
          controls
          playsInline
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-card",
        className
      )}
      role="img"
      aria-label="Usage video placeholder"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.06) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-4 px-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-card">
          <PlayIcon
            className="size-6 fill-current text-foreground"
            aria-hidden
          />
        </span>
        <div className="space-y-1.5">
          <p className="font-inter text-[15px] font-medium text-foreground">
            Usage video
          </p>
          <p className="font-inter text-[13px] text-muted-foreground">
            Placeholder — video goes here
          </p>
          <p className="flex flex-wrap items-center justify-center gap-1 pt-1 font-inter text-[13px] text-muted-foreground">
            Press <Kbd>⌥</Kbd> + <Kbd>x</Kbd> to open the inspector
          </p>
        </div>
      </div>
    </div>
  )
}
