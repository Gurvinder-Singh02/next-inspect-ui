import { getOverlayPaint, type InspectorSettings } from "./settings"
import { getFiber, type ReactFiber } from "./fiber"

export const CSS_SKIP = new Set(["", "normal", "none", "auto", "0px", "rgba(0, 0, 0, 0)"])

export const COLOR_PROPS = new Set(["color", "background-color", "border-color", "outline-color"])

export const resolveToRgbKey = (() => {
  let probe: HTMLDivElement | null = null
  return (value: string) => {
    if (!probe) {
      probe = document.createElement("div")
      probe.style.cssText =
        "position:absolute;left:-9999px;top:0;pointer-events:none;visibility:hidden;"
      document.documentElement.appendChild(probe)
    }
    probe.style.color = ""
    probe.style.color = value
    const raw = getComputedStyle(probe).color.trim()
    const match = raw.match(
      /rgba?\(\s*([\d.]+)\s*,?\s*([\d.]+)\s*,?\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/i
    )
    if (!match) return raw
    const r = Math.round(Number(match[1]))
    const g = Math.round(Number(match[2]))
    const b = Math.round(Number(match[3]))
    let a = 1
    if (match[4] != null) {
      a = match[4].endsWith("%")
        ? Number(match[4].slice(0, -1)) / 100
        : Number(match[4])
    }
    return `rgba(${r},${g},${b},${Number.isFinite(a) ? a : 1})`
  }
})()

export const collectDocumentCssVarNames = () => {
  const names = new Set<string>()
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule)) continue
      for (const prop of Array.from(rule.style)) {
        if (prop.startsWith("--")) names.add(prop)
      }
    }
  }
  return names
}

export const scoreCssColorVar = (name: string) => {
  let score = 0

  if (!name.startsWith("--color-")) score += 20
  if (name.includes("muted")) score += 4
  if (name.includes("foreground")) score += 2
  if (name.includes("background")) score += 2
  if (name.includes("border")) score += 1
  if (name.startsWith("--chart-")) score -= 8
  if (name.startsWith("--sidebar-")) score -= 6
  if (name.startsWith("--radius")) score -= 10
  return score
}

export const toCssColorVar = (computedColor: string) => {
  const target = resolveToRgbKey(computedColor)
  if (!target || target === "rgba(0,0,0,0)") return null

  const rootStyles = getComputedStyle(document.documentElement)
  let best: { name: string; score: number } | null = null

  for (const name of collectDocumentCssVarNames()) {
    const raw = rootStyles.getPropertyValue(name).trim()
    if (!raw) continue

    if (
      !/^(#|rgb|hsl|oklch|oklab|lab|lch|color|var\()/i.test(raw) &&
      !/^[\d.]+\s+[\d.]+\s+[\d.]+/.test(raw)
    ) {
      continue
    }

    const resolved = resolveToRgbKey(`var(${name})`)
    if (resolved !== target) continue

    const score = scoreCssColorVar(name)
    if (!best || score > best.score) best = { name, score }
  }

  return best ? `var(${best.name})` : null
}

export type CssDeclaration = {
  prop: string

  value: string

  swatch?: string
}

export const getCssDeclarations = (element: Element) => {
  const computed = window.getComputedStyle(element)
  const pick = (prop: string) => computed.getPropertyValue(prop).trim()
  const entries: CssDeclaration[] = []
  const add = (prop: string, value = pick(prop)) => {
    if (CSS_SKIP.has(value)) return

    if (COLOR_PROPS.has(prop) && isColorValue(value)) {
      const token = toCssColorVar(value)
      if (token) {
        entries.push({ prop, value: token, swatch: value })
        return
      }
    }

    entries.push({ prop, value })
  }

  add("display")
  add("color")
  add("background-color")
  add("font-size")
  if (pick("font-weight") !== "400") add("font-weight")
  add("line-height")
  add("padding")
  add("border-radius")
  add("gap")

  return { tag: element.tagName.toLowerCase(), entries }
}

export const isColorValue = (value: string) =>
  /^(#|rgb|hsl|oklch|oklab|lab|lch|color\(|var\(--)/i.test(value)

export const cssSpan = (text: string, color?: string) => {
  const span = document.createElement("span")
  span.textContent = text
  if (color) span.style.color = color
  return span
}

export const createCodeSurface = () => {
  const wrap = document.createElement("div")
  wrap.style.cssText =
    "margin-top:12px;overflow:auto;border-radius:8px;background:#0b0b0c;padding:10px 12px;"
  const pre = document.createElement("pre")
  pre.style.cssText =
    "margin:0;white-space:pre-wrap;word-break:break-word;font:11px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;"
  wrap.appendChild(pre)
  return { wrap, pre }
}

export const classNameFromProps = (props: ReactFiber["memoizedProps"]) => {
  if (!props) return ""
  const raw = props.className ?? props.class
  if (typeof raw === "string") return raw.trim()
  if (Array.isArray(raw)) {
    return raw
      .filter((part): part is string => typeof part === "string" && part.length > 0)
      .join(" ")
      .trim()
  }
  return ""
}

export const getElementClassName = (element: Element) => {
  let fiber: ReactFiber | null = getFiber(element)
  for (let depth = 0; fiber && depth < 12; depth += 1) {
    if (fiber.stateNode === element) {
      const fromProps = classNameFromProps(fiber.memoizedProps)
      if (fromProps) return fromProps
      break
    }
    fiber = fiber.return ?? null
  }

  if (typeof (element as HTMLElement).className === "string") {
    return (element as HTMLElement).className.trim()
  }

  return (element.getAttribute("class") ?? "").trim()
}

export const isPreferredInspectHost = (element: Element) => {
  const tag = element.tagName.toLowerCase()
  if (tag === "button" || tag === "a") return true
  const role = element.getAttribute("role")
  if (role === "button" || role === "link" || role === "menuitem") return true
  const slot = element.getAttribute("data-slot") ?? ""
  return (
    slot.includes("trigger") ||
    slot.includes("button") ||
    slot.endsWith("-link")
  )
}

export const isNestedMediaHit = (element: Element) => {
  const tag = element.tagName.toLowerCase()
  if (
    tag === "svg" ||
    tag === "path" ||
    tag === "img" ||
    tag === "picture" ||
    tag === "canvas" ||
    tag === "video"
  ) {
    return true
  }
  if (element.getAttribute("aria-hidden") === "true") return true
  if (element.hasAttribute("data-icon")) return true
  return false
}

export const resolveInspectElement = (hit: Element): Element => {
  if (isNestedMediaHit(hit) || !isPreferredInspectHost(hit)) {
    let current: Element | null = hit.parentElement
    while (
      current &&
      current !== document.body &&
      current !== document.documentElement
    ) {
      if (getFiber(current) && isPreferredInspectHost(current)) {
        return current
      }
      current = current.parentElement
    }
  }

  if (getElementClassName(hit) && getFiber(hit)) return hit

  let current: Element | null = hit.parentElement
  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    if (getFiber(current) && getElementClassName(current)) return current
    current = current.parentElement
  }

  return hit
}

export const isPointInRect = (
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number }
) =>
  clientX >= rect.left &&
  clientX <= rect.left + rect.width &&
  clientY >= rect.top &&
  clientY <= rect.top + rect.height

export const createCssBlock = (element: Element) => {
  const { tag, entries } = getCssDeclarations(element)
  const { wrap, pre } = createCodeSurface()
  wrap.style.marginTop = "0"

  pre.append(cssSpan(tag, "#7ee787"), cssSpan(" {\n", "#8b949e"))
  for (const { prop, value, swatch } of entries) {
    const colorForSwatch = swatch ?? (isColorValue(value) ? value : null)
    pre.append(cssSpan(`  ${prop}`, "#79c0ff"), cssSpan(": ", "#8b949e"))
    if (colorForSwatch) {
      const swatchEl = document.createElement("span")
      swatchEl.style.cssText = `display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px;vertical-align:middle;border:1px solid rgb(255 255 255 / 25%);background:${colorForSwatch};`
      pre.append(swatchEl)
    }
    pre.append(
      cssSpan(value, colorForSwatch ? "#a5d6ff" : "#c9d1d9"),
      cssSpan(";\n", "#8b949e")
    )
  }
  pre.append(cssSpan("}", "#8b949e"))
  return wrap
}

export const createTailwindBlock = (element: Element) => {
  const { wrap, pre } = createCodeSurface()
  wrap.style.marginTop = "0"
  const classes = getElementClassName(element)
  const tag = element.tagName.toLowerCase()

  pre.append(
    cssSpan(`<${tag} `, "#8b949e"),
    cssSpan("className", "#79c0ff"),
    cssSpan("=", "#8b949e"),
    cssSpan('"', "#a5d6ff"),
    cssSpan(classes || "/* no className */", classes ? "#c9d1d9" : "#8b949e"),
    cssSpan('"', "#a5d6ff"),
    cssSpan(" />", "#8b949e")
  )
  return wrap
}

export const createStylesSection = (element: Element, onLayout: () => void) => {
  const root = document.createElement("div")
  root.style.cssText =
    "margin-top:14px;display:flex;flex-direction:column;gap:12px;"

  const toggle = document.createElement("div")
  toggle.setAttribute("role", "tablist")
  toggle.setAttribute("aria-label", "Styles format")
  toggle.style.cssText =
    "position:relative;display:inline-flex;align-items:center;gap:1px;padding:2px;border-radius:6px;background:var(--muted,#27272a);width:fit-content;"

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches
  const pill = document.createElement("div")
  pill.setAttribute("aria-hidden", "true")
  pill.style.cssText = prefersReducedMotion
    ? "position:absolute;top:2px;left:2px;height:calc(100% - 4px);border-radius:4px;background:var(--background,#18181b);pointer-events:none;"
    : "position:absolute;top:2px;left:2px;height:calc(100% - 4px);border-radius:4px;background:var(--background,#18181b);pointer-events:none;transition:transform 180ms ease,width 180ms ease;will-change:transform,width;"

  type StylesMode = "tailwind" | "css"

  const makeTab = (mode: StylesMode, text: string) => {
    const tab = document.createElement("button")
    tab.type = "button"
    tab.setAttribute("role", "tab")
    tab.dataset.mode = mode
    tab.textContent = text
    tab.style.cssText =
      "all:unset;position:relative;z-index:1;box-sizing:border-box;cursor:pointer;padding:2px 7px;border-radius:4px;font-size:10px;letter-spacing:0.04em;text-transform:uppercase;transition:color 180ms ease;"
    return tab
  }

  const twTab = makeTab("tailwind", "Tailwind")
  const cssTab = makeTab("css", "CSS")
  toggle.append(pill, twTab, cssTab)

  const body = document.createElement("div")
  body.style.cssText = prefersReducedMotion
    ? "min-width:0;overflow:hidden;"
    : "min-width:0;overflow:hidden;transition:width 220ms ease;"
  let mode: StylesMode = "tailwind"
  let bodyWidthReady = false

  const movePill = (tab: HTMLButtonElement, animate: boolean) => {
    const toggleBox = toggle.getBoundingClientRect()
    const tabBox = tab.getBoundingClientRect()
    const x = tabBox.left - toggleBox.left - 2
    const width = tabBox.width
    if (!animate || prefersReducedMotion) pill.style.transition = "none"
    pill.style.width = `${width}px`
    pill.style.transform = `translateX(${x}px)`
    if (!animate && !prefersReducedMotion) {
      void pill.offsetWidth
      pill.style.transition = "transform 180ms ease,width 180ms ease"
    }
  }

  const paint = (animate = true) => {
    const active = mode === "tailwind" ? twTab : cssTab
    const idle = mode === "tailwind" ? cssTab : twTab
    active.style.color = "var(--foreground,#e4e4e7)"
    idle.style.color = "var(--muted-foreground,#8b949e)"
    active.setAttribute("aria-selected", "true")
    idle.setAttribute("aria-selected", "false")
    movePill(active, animate)

    const block =
      mode === "tailwind" ? createTailwindBlock(element) : createCssBlock(element)
    block.style.marginTop = "0"
    body.replaceChildren(block)

    const nextWidth = Math.ceil(block.scrollWidth)
    if (!bodyWidthReady || prefersReducedMotion || !animate) {
      body.style.transition = "none"
      body.style.width = `${nextWidth}px`
      if (!prefersReducedMotion) {
        void body.offsetWidth
        body.style.transition = "width 220ms ease"
      }
      bodyWidthReady = true
    } else {
      body.style.width = `${nextWidth}px`
    }

    onLayout()
  }

  twTab.onclick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (mode === "tailwind") return
    mode = "tailwind"
    paint(true)
  }
  cssTab.onclick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (mode === "css") return
    mode = "css"
    paint(true)
  }

  root.append(toggle, body)

  requestAnimationFrame(() => paint(false))
  return root
}

export const applyOverlayStyles = (
  overlay: HTMLDivElement,
  tooltip: HTMLDivElement,
  settings: InspectorSettings
) => {
  const paint = getOverlayPaint(settings)

  overlay.style.backgroundColor = paint.fill
  overlay.style.backgroundImage = "none"
  overlay.style.animation = "none"
  overlay.style.border = paint.border
  overlay.style.borderRadius = paint.borderRadius
  overlay.style.transition = paint.transition

  tooltip.style.background = paint.tooltipBackground
  tooltip.style.border = `1px solid ${paint.tooltipBorder}`
  tooltip.style.color = paint.tooltipText
  tooltip.style.padding = paint.tooltipPadding
  tooltip.style.borderRadius = paint.tooltipBorderRadius
  tooltip.style.transition = paint.tooltipTransition
}

export const ARROW_UP_RIGHT_ICON =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>'
