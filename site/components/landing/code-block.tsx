"use client"

import { useEffect, useMemo, useState } from "react"
import { play } from "cuelume"
import { TextMorph, useTextMorph } from "torph/react"

import { splitShikiHtml, styleAttrToReact } from "@/lib/split-shiki-html"
import { cn } from "@/lib/utils"

const decodeToken = (text: string) =>
  text.replace(
    /&(#x[0-9a-f]+|#\d+|lt|gt|amp|quot|apos);/gi,
    (match, entity: string) => {
      if (entity.startsWith("#"))
        return String.fromCodePoint(
          parseInt(
            entity.slice(entity[1].toLowerCase() === "x" ? 2 : 1),
            entity[1].toLowerCase() === "x" ? 16 : 10
          )
        )
      return (
        { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" }[
          entity.toLowerCase()
        ] ?? match
      )
    }
  )

const MorphToken = ({
  text,
  style,
}: {
  text: string
  style: React.CSSProperties
}) => {
  const { ref, update } = useTextMorph({})
  useEffect(() => {
    update(text)
  }, [text, update])
  return (
    <span ref={ref} style={style}>
      {text}
    </span>
  )
}

const MorphCode = ({ html }: { html: string }) => {
  const lines = [
    ...html.matchAll(/<span class="line">([\s\S]*?)<\/span>(?=\n|<\/code>)/g),
  ]
  return (
    <>
      {lines.map((line, index) => {
        const tokens = [
          ...line[1].matchAll(
            /<span\b[^>]*style="([^"]*)"[^>]*>([\s\S]*?)<\/span>|([^<]+)/g
          ),
        ].map((token) => ({
          text: decodeToken(token[2] ?? token[3]),
          style: styleAttrToReact(token[1] ?? ""),
        }))
        const indent =
          tokens
            .map((token) => token.text)
            .join("")
            .match(/^ */)?.[0].length ?? 0
        let remaining = indent
        return (
          <span
            className="line"
            style={{
              display: "block",
              minHeight: "1lh",
              paddingLeft: `${indent}ch`,
            }}
            key={index}
          >
            {tokens.map((token, tokenIndex) => {
              const cut = Math.min(remaining, token.text.length)
              remaining -= cut
              const text = token.text.slice(cut)
              return /^\s*$/.test(text) ? (
                <span key={tokenIndex} style={{ whiteSpace: "pre" }}>
                  {text}
                </span>
              ) : (
                <MorphToken key={tokenIndex} text={text} style={token.style} />
              )
            })}
          </span>
        )
      })}
    </>
  )
}

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
        ) : morph ? (
          <pre
            className={html.match(/class="([^"]*)"/)?.[1] ?? "shiki"}
            style={styleAttrToReact(
              html.match(/^<pre\b[^>]*style="([^"]*)"/)?.[1] ?? ""
            )}
            tabIndex={0}
          >
            <code>
              <MorphCode html={html} />
            </code>
          </pre>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </div>
  )
}
