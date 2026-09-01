import overlayCss from "./overlay-css.ts"

import { getOverlayPaint, type InspectorSettings } from "./lib.ts"

const STYLE_ATTR = "data-dev-inspector-style"

export const ensureInspectorStyles = (doc = document) => {
  if (doc.querySelector(`style[${STYLE_ATTR}]`)) return
  const style = doc.createElement("style")
  style.setAttribute(STYLE_ATTR, "")
  style.textContent = overlayCss
  doc.head.append(style)
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
