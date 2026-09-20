"use client"

import { useRef, useState } from "react"
import { PlayIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export const UsageVideo = ({
  src = "/usage/walkthrough.min.mp4",
  poster = "/usage/walkthrough.jpg",
  className,
}: {
  src?: string
  poster?: string
  className?: string
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasStarted, setHasStarted] = useState(false)

  const play = () => {
    const video = videoRef.current
    if (!video) return
    setHasStarted(true)
    void video.play()
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card outline outline-black/10 dark:outline-white/10",
        className
      )}
    >
      <video
        ref={videoRef}
        className="aspect-[1774/1152] w-full bg-card"
        src={src}
        poster={poster}
        controls={hasStarted}
        playsInline
        preload="none"
        onEnded={() => setHasStarted(false)}
      >
        Your browser does not support the video tag.
      </video>

      {!hasStarted ? (
        <button
          type="button"
          onClick={play}
          aria-label="Play walkthrough video"
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "touch-action-manipulation [-webkit-tap-highlight-color:transparent]",
            "transition-colors duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
            "hover:bg-black/10 focus-visible:bg-black/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          )}
        >
          <span
            className={cn(
              "flex size-14 items-center justify-center rounded-full",
              "bg-background/90 text-foreground shadow-xs ring-1 ring-foreground/10",
              "transition-transform duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
              "active:scale-96"
            )}
          >
            <PlayIcon
              className="size-6 fill-current pl-px"
              aria-hidden
            />
          </span>
        </button>
      ) : null}
    </div>
  )
}
