import { createUsedIcon, createReactIcon } from "./icons.ts"
import type { TooltipAlign, TooltipProps, TooltipSide } from "./index.ts"
import { markInspectNode, paintUsedIcon } from "../styles/styles.ts"

export type OverlayRect = {
  left: number
  top: number
  width: number
  height: number
}

export type ViewportSize = {
  width: number
  height: number
}

export const underStackTransform = (depth: number) =>
  `translate(${29 * depth}px, calc(100% * ${depth} + ${5 * depth}px))`

const alignAlongAxis = (
  start: number,
  size: number,
  tooltipSize: number,
  align: TooltipAlign,
  alignOffset: number
) => {
  if (align === "start") return start + alignOffset
  if (align === "end") return start + size - tooltipSize + alignOffset
  return start + (size - tooltipSize) / 2 + alignOffset
}

export const getTooltipPosition = ({
  target,
  tooltipWidth,
  tooltipHeight,
  side,
  align,
  sideOffset,
  alignOffset,
  viewport,
}: {
  target: OverlayRect
  tooltipWidth: number
  tooltipHeight: number
  side: TooltipSide
  align: TooltipAlign
  sideOffset: number
  alignOffset: number
  viewport?: ViewportSize
}) => {
  const INSIDE_SIDE_EXTRA = 10
  const INSIDE_ALIGN_EXTRA = 15

  const alongX = (offset: number) =>
    alignAlongAxis(target.left, target.width, tooltipWidth, align, offset)
  const alongY = (offset: number) =>
    alignAlongAxis(target.top, target.height, tooltipHeight, align, offset)

  let left = alongX(alignOffset)
  let top = alongY(alignOffset)
  let inside = false

  if (side === "top") {
    top = target.top - tooltipHeight - sideOffset
    if (viewport && top < 0) {
      inside = true
      top = target.top + sideOffset + INSIDE_SIDE_EXTRA
    }
  } else if (side === "bottom") {
    top = target.top + target.height + sideOffset
    if (viewport && top + tooltipHeight > viewport.height) {
      inside = true
      top =
        target.top +
        target.height -
        tooltipHeight -
        sideOffset -
        INSIDE_SIDE_EXTRA
    }
  } else if (side === "left") {
    left = target.left - tooltipWidth - sideOffset
    if (viewport && left < 0) {
      inside = true
      left = target.left + sideOffset + INSIDE_SIDE_EXTRA
    }
  } else {
    left = target.left + target.width + sideOffset
    if (viewport && left + tooltipWidth > viewport.width) {
      inside = true
      left =
        target.left +
        target.width -
        tooltipWidth -
        sideOffset -
        INSIDE_SIDE_EXTRA
    }
  }

  if (inside) {
    const innerAlign = alignOffset + INSIDE_ALIGN_EXTRA
    if (side === "top" || side === "bottom") {
      left = alongX(innerAlign)
    } else {
      top = alongY(innerAlign)
    }
  }

  if (viewport) {
    left = Math.max(
      0,
      Math.min(left, Math.max(0, viewport.width - tooltipWidth))
    )
    top = Math.max(
      0,
      Math.min(top, Math.max(0, viewport.height - tooltipHeight))
    )
  }

  return { left, top }
}

export const getInfoPanelPosition = ({
  target,
  panelWidth,
  panelHeight,
  viewport,
  margin = 8,
}: {
  target: OverlayRect
  panelWidth: number
  panelHeight: number
  viewport: ViewportSize
  margin?: number
}) => {
  const left = Math.max(
    margin,
    Math.min(target.left, viewport.width - panelWidth - margin)
  )
  const below = target.top + target.height + margin
  const top =
    below + panelHeight + margin > viewport.height && target.top > panelHeight
      ? target.top - panelHeight - margin
      : below
  return { left, top }
}

export const expandRectWithPadding = (
  rect: OverlayRect,
  padding:
    | { left?: number; right?: number; top?: number; bottom?: number }
    | number
) => {
  const left = typeof padding === "number" ? padding : (padding.left ?? 0)
  const right = typeof padding === "number" ? padding : (padding.right ?? 0)
  const top = typeof padding === "number" ? padding : (padding.top ?? 0)
  const bottom = typeof padding === "number" ? padding : (padding.bottom ?? 0)

  return {
    left: rect.left - left,
    top: rect.top - top,
    width: rect.width + left + right,
    height: rect.height + top + bottom,
  }
}

export const formatComponentTag = (name: string) => `<${name}/>`

export const formatDomTag = (name: string) => `<${name}>`

export const formatTooltipLabel = ({
  title,
  pageName,
  tooltipProps,
  tagStyle = "component",
}: {
  title?: string | null
  pageName?: string | null
  tooltipProps: TooltipProps
  tagStyle?: "dom" | "component"
}) => {
  const parts: string[] = []
  if (tooltipProps.showTitle && title) {
    parts.push(
      tagStyle === "dom" ? formatDomTag(title) : formatComponentTag(title)
    )
  }
  if (pageName) parts.push(tooltipProps.showFullUrl ? pageName : pageName.split(/[\\/]/).pop()!)
  return parts.join(" · ")
}

const attr = (el: HTMLElement, name: string) => markInspectNode(el, name)

export const createInspectTooltip = () => {
  const root = attr(document.createElement("div"), "data-dev-inspector-tooltip")
  root.setAttribute("aria-hidden", "true")

  const front = attr(
    document.createElement("div"),
    "data-dev-inspector-tooltip-front"
  )
  const iconWrap = attr(
    document.createElement("span"),
    "data-dev-inspector-tooltip-icon"
  )
  iconWrap.setAttribute("aria-hidden", "true")
  iconWrap.append(createUsedIcon())
  const labelEl = attr(
    document.createElement("span"),
    "data-dev-inspector-tooltip-label"
  )
  front.append(iconWrap, labelEl)
  root.append(front)

  const underLayers: HTMLDivElement[] = []

  const layoutStack = () => {
    const total = underLayers.length
    underLayers.forEach((layer, index) => {
      const n = total - index
      layer.style.left = "0"
      layer.style.bottom = "0"
      layer.style.zIndex = String(2 - n)
      layer.style.transform = underStackTransform(n)
      layer.style.opacity = "0.92"
    })
  }

  const setLabel = (text: string) => {
    labelEl.textContent = text
  }

  const showUsedIcon = (show: boolean) => {
    paintUsedIcon(iconWrap, show)
  }

  const clearStack = () => {
    underLayers.splice(0).forEach((layer) => layer.remove())
    root
      .querySelectorAll("[data-dev-inspector-tooltip-under]")
      .forEach((el) => el.remove())
  }

  const pushUnder = (text: string) => {
    if (!text) return
    const chip = attr(
      document.createElement("div"),
      "data-dev-inspector-tooltip-under"
    ) as HTMLDivElement
    chip.textContent = text
    root.append(chip)
    underLayers.push(chip)
    layoutStack()
  }

  const place = (target: OverlayRect, tooltipProps: TooltipProps) => {
    const pos = getTooltipPosition({
      target,
      tooltipWidth: front.offsetWidth,
      tooltipHeight: front.offsetHeight,
      side: tooltipProps.side,
      align: tooltipProps.align,
      sideOffset: tooltipProps.sideOffset,
      alignOffset: tooltipProps.alignOffset,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    })
    root.style.left = `${pos.left}px`
    root.style.top = `${pos.top}px`
  }

  const show = () => {
    root.style.display = "flex"
  }

  const hide = () => {
    root.style.display = "none"
  }

  const isOpen = () => root.style.display !== "none"

  return {
    root,
    get label() {
      return labelEl.textContent ?? ""
    },
    setLabel,
    showUsedIcon,
    showSourceIcon: (used: boolean, canClimb: boolean) => {
      iconWrap.replaceChildren(used ? createUsedIcon() : createReactIcon())
      paintUsedIcon(iconWrap, used || canClimb)
    },
    pushUnder,
    clearStack,
    place,
    show,
    hide,
    isOpen,
  }
}
