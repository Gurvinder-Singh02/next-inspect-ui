import type { CSSProperties } from "react"

/**
 * Split a Shiki HTML string at a plain-text character offset so a prefix can
 * animate (e.g. TextMorph) while the remainder keeps token spans.
 */
export const splitShikiHtml = (html: string, splitAt: number) => {
  const preOpenMatch = html.match(/^(<pre\b[^>]*>)/)
  const codeOpenMatch = html.match(/<code\b[^>]*>/)
  const hasLine = /<span class="line">/.test(html)

  const preOpen = preOpenMatch?.[1] ?? '<pre class="shiki">'
  const codeOpen = codeOpenMatch?.[0] ?? "<code>"
  const lineOpen = hasLine ? '<span class="line">' : ""
  const lineClose = hasLine ? "</span>" : ""

  const innerMatch = html.match(
    /<code\b[^>]*>(?:<span class="line">)?([\s\S]*?)(?:<\/span>)?<\/code>/
  )
  const inner = innerMatch?.[1] ?? ""

  const tokens = inner.match(/<span\b[^>]*>[\s\S]*?<\/span>|[^<]+/g) ?? [inner]

  let seen = 0
  let prefixInner = ""
  let restInner = ""
  let prefixStyle = ""
  let splitDone = false

  for (const token of tokens) {
    const spanMatch = token.match(/^(<span\b[^>]*>)([\s\S]*?)(<\/span>)$/)
    if (!spanMatch) {
      const text = token
      if (splitDone) {
        restInner += text
        continue
      }
      if (seen + text.length <= splitAt) {
        prefixInner += text
        seen += text.length
      } else {
        const cut = splitAt - seen
        prefixInner += text.slice(0, cut)
        restInner += text.slice(cut)
        seen = splitAt
        splitDone = true
      }
      continue
    }

    const [, open, text, close] = spanMatch
    if (!prefixStyle && text.trim()) {
      const styleMatch = open.match(/style="([^"]*)"/)
      prefixStyle = styleMatch?.[1] ?? ""
    }

    if (splitDone) {
      restInner += token
      continue
    }

    if (seen + text.length <= splitAt) {
      prefixInner += token
      seen += text.length
    } else {
      const cut = splitAt - seen
      const left = text.slice(0, cut)
      const right = text.slice(cut)
      if (left) prefixInner += `${open}${left}${close}`
      if (right) restInner += `${open}${right}${close}`
      seen = splitAt
      splitDone = true
    }
  }

  return {
    preOpen,
    codeOpen,
    lineOpen,
    lineClose,
    prefixInner,
    restInner,
    prefixStyle,
    preClose: "</code></pre>",
  }
}

export const styleAttrToReact = (styleAttr: string): CSSProperties => {
  const style: Record<string, string> = {}
  for (const part of styleAttr.split(";")) {
    const [rawKey, ...rawValue] = part.split(":")
    const key = rawKey?.trim()
    const value = rawValue.join(":").trim()
    if (!key || !value) continue
    style[key] = value
  }
  return style as CSSProperties
}
