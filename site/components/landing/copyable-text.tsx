"use client"

import { useState } from "react"
import { play } from "cuelume"

import { cn } from "@/lib/utils"

export const CopyableText = ({
  text,
  className,
}: {
  text: string
  className?: string
}) => {
  const [hasCopied, setHasCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setHasCopied(true)
      play("success")
      window.setTimeout(() => setHasCopied(false), 1600)
    } catch {
      play("error")
      setHasCopied(false)
    }
  }

  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-xl bg-card px-4 py-3.5",
        className
      )}
    >
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-3.5 right-4 font-inter text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline"
        aria-label={hasCopied ? "Copied" : "Copy prompt"}
      >
        {hasCopied ? "Copied" : "Copy"}
      </button>
      <div className="pr-14 font-mono text-[13px] leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">
        {text}
      </div>
    </div>
  )
}
