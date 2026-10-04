import {
  INSPECTOR_COLORS,
  type InspectorSettings,
} from "../lib/index.ts"

const STYLE_ATTR = "data-dev-inspector-style"
const HOOK_PREFIX = "data-dev-inspector-"
const CLASS_PREFIX = "next-inspect-ui-"

export const INSTANT_CLASS = "next-inspect-ui-instant"

export const inspectClass = (hook: string) =>
  hook.startsWith(HOOK_PREFIX)
    ? `${CLASS_PREFIX}${hook.slice(HOOK_PREFIX.length)}`
    : hook

export const markInspectNode = <T extends HTMLElement>(el: T, hook: string) => {
  el.setAttribute(hook, "")
  el.className = inspectClass(hook)
  return el
}

export const ensureInspectorStyles = (css: string, doc = document) => {
  if (doc.querySelector(`style[${STYLE_ATTR}]`)) return
  const style = doc.createElement("style")
  style.setAttribute(STYLE_ATTR, "")
  style.textContent = css
  doc.head.append(style)
}

export const paintUsedIcon = (el: HTMLElement, open: boolean) => {
  el.style.width = open ? "12px" : "0"
  el.style.marginRight = open ? "3px" : "0"
}

export const paintTreeRow = (el: HTMLElement, active: boolean) => {
  el.style.background = active ? "rgb(255 255 255 / 8%)" : ""
  el.style.color = active
    ? "var(--inspect-fg, var(--foreground, #e4e4e7))"
    : ""
}

export const paintTwisty = (el: HTMLElement, open: boolean) => {
  el.style.cursor = open ? "pointer" : ""
  el.style.opacity = open ? "0.65" : ""
}

export const paintTreePath = (el: HTMLElement, state: "open" | "empty") => {
  el.style.cursor = state === "open" ? "pointer" : ""
  el.style.opacity = state === "empty" ? "0.4" : ""
}

export const paintStyleTab = (el: HTMLElement, active: boolean) => {
  el.style.opacity = active ? "1" : ""
}

export const toRgbChannels = (hex: string) => {
  const value = hex.replace("#", "")
  if (value.length < 6) return null
  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null
  return `${r} ${g} ${b}`
}

export const toRgba = (hex: string, alpha: number) => {
  const channels = toRgbChannels(hex)
  if (!channels) return hex
  return `rgba(${channels} / ${alpha})`
}

export const getOverlayPaint = (settings: InspectorSettings) => {
  const spotlight = settings.devSpotlightProps
  const tooltip = settings.tooltipProps
  const channels =
    toRgbChannels(spotlight.background) ?? INSPECTOR_COLORS.orange.fill
  const stroke = toRgba(spotlight.border, spotlight.strokeOpacity)
  const fill = `rgb(${channels} / ${spotlight.bgOpacity})`

  return {
    stroke,
    fill,
    border:
      spotlight.strokeWidth <= 0
        ? "0px none transparent"
        : `${spotlight.strokeWidth}px ${spotlight.strokeStyle} ${stroke}`,
    borderRadius: "0px",
    paddingX: 0,
    paddingY: 0,
    animated: spotlight.animated,
    tooltipBackground: tooltip.background,
    tooltipBorder: "transparent",
    tooltipText: tooltip.text,
    tooltipPadding: `${tooltip.paddingY}px ${tooltip.paddingX}px`,
    tooltipBorderRadius: `${tooltip.borderRadius}px`,
  }
}

export const setInspectMotion = (
  overlay: HTMLElement,
  tooltip: HTMLElement,
  enabled: boolean
) => {
  overlay.classList.toggle(INSTANT_CLASS, !enabled)
  tooltip.classList.toggle(INSTANT_CLASS, !enabled)
}

export const applyOverlayPaint = (
  overlay: HTMLElement,
  tooltip: HTMLElement,
  settings: InspectorSettings
) => {
  const paint = getOverlayPaint(settings)
  overlay.style.setProperty("--inspect-fill", paint.fill)
  overlay.style.setProperty("--inspect-border", paint.border)
  overlay.style.setProperty("--inspect-radius", paint.borderRadius)
  tooltip.style.setProperty("--inspect-tooltip-bg", paint.tooltipBackground)
  tooltip.style.setProperty("--inspect-tooltip-border", paint.tooltipBorder)
  tooltip.style.setProperty("--inspect-tooltip-text", paint.tooltipText)
  tooltip.style.setProperty("--inspect-tooltip-padding", paint.tooltipPadding)
  tooltip.style.setProperty("--inspect-tooltip-radius", paint.tooltipBorderRadius)
  setInspectMotion(overlay, tooltip, paint.animated)
}
