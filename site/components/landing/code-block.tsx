"use client"

import { useMemo, useState } from "react"
import { play } from "cuelume"
import { TextMorph } from "torph/react"

import { splitShikiHtml, styleAttrToReact } from "@/lib/split-shiki-html"
import { cn } from "@/lib/utils"

export const CodeBlock = ({
  code,
  html,
  morph = false,
  morphPrefix,
  className,
}: {
  code: string
  html: string
  morph?: boolean
  /** When set with `morph`, only this prefix animates; the rest stays Shiki. */
  morphPrefix?: string
  className?: string
}) => {
  const [hasCopied, setHasCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setHasCopied(true)
      play("success")
      window.setTimeout(() => setHasCopied(false), 1600)
    } catch {
      play("error")
      setHasCopied(false)
    }
  }

  const prefix =
    morph && morphPrefix && code.startsWith(morphPrefix) ? morphPrefix : null

  const shikiSplit = useMemo(() => {
    if (!prefix) return null
    return splitShikiHtml(html, prefix.length)
  }, [html, prefix])

  const preClassName = useMemo(() => {
    if (!shikiSplit) return ""
    return shikiSplit.preOpen.match(/class="([^"]*)"/)?.[1] ?? "shiki"
  }, [shikiSplit])

  const preStyle = useMemo(() => {
    if (!shikiSplit) return undefined
    const raw = shikiSplit.preOpen.match(/style="([^"]*)"/)?.[1]
    return raw ? styleAttrToReact(raw) : undefined
  }, [shikiSplit])

  const prefixStyle = useMemo(() => {
    if (!shikiSplit?.prefixStyle) return undefined
    return styleAttrToReact(shikiSplit.prefixStyle)
  }, [shikiSplit])

  return (
    <div
      className={cn(
        "landing-code relative rounded-xl bg-card px-4 py-3.5",
        className
      )}
    >
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-3.5 right-4 z-10 font-inter text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline"
        aria-label={hasCopied ? "Copied" : "Copy code"}
      >
        <TextMorph className="transform-gpu">
          {hasCopied ? "Copied" : "Copy"}
        </TextMorph>
      </button>
      <div className="overflow-x-auto pr-14">
        {prefix && shikiSplit ? (
          <pre className={preClassName} style={preStyle} tabIndex={0}>
            <code>
              <span className="line">
                <TextMorph
                  as="span"
                  className="transform-gpu"
                  style={prefixStyle}
                >
                  {prefix}
                </TextMorph>
                <span
                  dangerouslySetInnerHTML={{ __html: shikiSplit.restInner }}
                />
              </span>
            </code>
          </pre>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </div>
  )
}
