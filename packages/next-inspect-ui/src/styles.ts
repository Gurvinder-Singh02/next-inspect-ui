import overlayCss from "./overlay-css.ts"

import {
  INSPECTOR_COLORS,
  type InspectorSettings,
} from "./lib.ts"

const STYLE_ATTR = "data-dev-inspector-style"

const OVERLAY_HOVER_TRANSITION =
  "left 75ms ease, top 75ms ease, width 75ms ease, height 75ms ease, background-color 75ms ease, border-color 75ms ease"

const TOOLTIP_HOVER_TRANSITION =
  "left 75ms ease, top 75ms ease, opacity 75ms ease"

export const ensureInspectorStyles = (doc = document) => {
  if (doc.querySelector(`style[${STYLE_ATTR}]`)) return
  const style = doc.createElement("style")
  style.setAttribute(STYLE_ATTR, "")
  style.textContent = overlayCss
  doc.head.append(style)
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
    borderRadius: `${spotlight.borderRadius}px`,
    paddingX: spotlight.paddingX,
    paddingY: spotlight.paddingY,
    transition: spotlight.animated ? OVERLAY_HOVER_TRANSITION : "none",
    tooltipTransition: spotlight.animated ? TOOLTIP_HOVER_TRANSITION : "none",
    tooltipBackground: tooltip.background,
    tooltipBorder: tooltip.border,
    tooltipText: tooltip.text,
    tooltipPadding: `${tooltip.paddingY}px ${tooltip.paddingX}px`,
    tooltipBorderRadius: `${tooltip.borderRadius}px`,
  }
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
  overlay.style.setProperty("--inspect-transition", paint.transition)
  tooltip.style.setProperty("--inspect-tooltip-bg", paint.tooltipBackground)
  tooltip.style.setProperty("--inspect-tooltip-border", paint.tooltipBorder)
  tooltip.style.setProperty("--inspect-tooltip-text", paint.tooltipText)
  tooltip.style.setProperty("--inspect-tooltip-padding", paint.tooltipPadding)
  tooltip.style.setProperty("--inspect-tooltip-radius", paint.tooltipBorderRadius)
  tooltip.style.setProperty("--inspect-tooltip-transition", paint.tooltipTransition)
}
