"use client"

export type InspectorColor = "orange" | "sky" | "red" | "white"

export type InspectorStrokeStyle = "solid" | "dashed" | "dotted"

export type TooltipSide = "top" | "right" | "bottom" | "left"

export type TooltipAlign = "start" | "center" | "end"

export type TooltipProps = {
  background: string
  border: string
  text: string
  showTitle: boolean
  showPageName: boolean
  side: TooltipSide
  align: TooltipAlign
  sideOffset: number
  alignOffset: number
  paddingX: number
  paddingY: number
  borderRadius: number
}

export type DevSpotlightProps = {
  background: string
  border: string
  bgOpacity: number
  strokeOpacity: number
  strokeWidth: number
  strokeStyle: InspectorStrokeStyle
  borderRadius: number
  paddingX: number
  paddingY: number
  animated: boolean
}

export type InspectorIde =
  | "cursor"
  | "vscode"
  | "vscode-insiders"
  | "windsurf"
  | "zed"

// Direct editor deep links — opening these hands off to the OS protocol handler
// with no dev-server round-trip or process spawn, so the editor opens instantly.
export const INSPECTOR_IDES: Record<
  InspectorIde,
  { label: string; url: (filePath: string, line: number, column: number) => string }
> = {
  cursor: {
    label: "Cursor",
    url: (p, l, c) => `cursor://file${encodeURI(p)}:${l}:${c}`,
  },
  vscode: {
    label: "VS Code",
    url: (p, l, c) => `vscode://file${encodeURI(p)}:${l}:${c}`,
  },
  "vscode-insiders": {
    label: "VS Code Insiders",
    url: (p, l, c) => `vscode-insiders://file${encodeURI(p)}:${l}:${c}`,
  },
  windsurf: {
    label: "Windsurf",
    url: (p, l, c) => `windsurf://file${encodeURI(p)}:${l}:${c}`,
  },
  zed: {
    label: "Zed",
    url: (p, l, c) => `zed://file${encodeURI(p)}:${l}:${c}`,
  },
}

const isInspectorIde = (value: unknown): value is InspectorIde =>
  typeof value === "string" && value in INSPECTOR_IDES

export type InspectorSettings = {
  shortcut: string
  ide: InspectorIde
  tooltipProps: TooltipProps
  devSpotlightProps: DevSpotlightProps
}

export const INSPECTOR_COLORS: Record<
  InspectorColor,
  { stroke: string; fill: string; tooltip: string; label: string }
> = {
  orange: {
    stroke: "#f97316",
    fill: "249 115 22",
    tooltip: "#FF6100",
    label: "Orange",
  },
  sky: {
    stroke: "#0ea5e9",
    fill: "14 165 233",
    tooltip: "#00A6FF",
    label: "Sky",
  },
  red: {
    stroke: "#ef4444",
    fill: "239 68 68",
    tooltip: "#FF0000",
    label: "Red",
  },
  white: {
    stroke: "#ffffff",
    fill: "255 255 255",
    tooltip: "#ffffff",
    label: "White",
  },
}

export const STROKE_WIDTH_STEP = 0.5
export const STROKE_WIDTH_MIN = 0
export const STROKE_WIDTH_MAX = 8

const BORDER_RADIUS_STEP = 1
export const BORDER_RADIUS_MIN = 0
export const BORDER_RADIUS_MAX = 32

const PADDING_STEP = 1
export const PADDING_MIN = 0
export const PADDING_MAX = 32

export const SIDE_OFFSET_MIN = 0
export const SIDE_OFFSET_MAX = 48
export const ALIGN_OFFSET_MIN = -48
export const ALIGN_OFFSET_MAX = 48

export const TOOLTIP_PADDING_MIN = 0
export const TOOLTIP_PADDING_MAX = 24
export const TOOLTIP_RADIUS_MIN = 0
export const TOOLTIP_RADIUS_MAX = 24

export const DEFAULT_TOOLTIP_PROPS: TooltipProps = {
  background: INSPECTOR_COLORS.orange.tooltip,
  border: "transparent",
  text: "#ffffff",
  showTitle: true,
  showPageName: true,
  side: "top",
  align: "start",
  sideOffset: 6,
  alignOffset: 0,
  paddingX: 8,
  paddingY: 2,
  borderRadius: 8,
}

export const DEFAULT_DEV_SPOTLIGHT_PROPS: DevSpotlightProps = {
  background: INSPECTOR_COLORS.orange.stroke,
  border: INSPECTOR_COLORS.orange.stroke,
  bgOpacity: 0.09,
  strokeOpacity: 1,
  strokeWidth: 1,
  strokeStyle: "dashed",
  borderRadius: 4,
  paddingX: 0,
  paddingY: 0,
  animated: true,
}

export const DEFAULT_INSPECTOR_SETTINGS: InspectorSettings = {
  shortcut: "Alt+X",
  ide: "cursor",
  tooltipProps: DEFAULT_TOOLTIP_PROPS,
  devSpotlightProps: DEFAULT_DEV_SPOTLIGHT_PROPS,
}

const listeners = new Set<() => void>()

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const snapStrokeWidth = (value: number) => {
  const snapped = Math.round(value / STROKE_WIDTH_STEP) * STROKE_WIDTH_STEP
  return clamp(Number(snapped.toFixed(1)), STROKE_WIDTH_MIN, STROKE_WIDTH_MAX)
}

const snapBorderRadius = (value: number) =>
  clamp(
    Math.round(value / BORDER_RADIUS_STEP) * BORDER_RADIUS_STEP,
    BORDER_RADIUS_MIN,
    BORDER_RADIUS_MAX
  )

const snapPadding = (value: number) =>
  clamp(
    Math.round(value / PADDING_STEP) * PADDING_STEP,
    PADDING_MIN,
    PADDING_MAX
  )

const isStrokeStyle = (value: unknown): value is InspectorStrokeStyle =>
  value === "solid" || value === "dashed" || value === "dotted"

const isTooltipSide = (value: unknown): value is TooltipSide =>
  value === "top" || value === "right" || value === "bottom" || value === "left"

const isTooltipAlign = (value: unknown): value is TooltipAlign =>
  value === "start" || value === "center" || value === "end"

const isInspectorColor = (value: unknown): value is InspectorColor =>
  value === "orange" || value === "sky" || value === "red" || value === "white"

const normalizeTooltipProps = (
  raw?: (Partial<TooltipProps> & { enabled?: boolean; padding?: number }) | null
): TooltipProps => {
  const { enabled: _enabled, padding: legacyPadding, ...rest } = raw ?? {}
  const fallbackPadding =
    typeof legacyPadding === "number" ? legacyPadding : null

  return {
    ...DEFAULT_TOOLTIP_PROPS,
    ...rest,
    background: rest.background ?? DEFAULT_TOOLTIP_PROPS.background,
    border: rest.border ?? DEFAULT_TOOLTIP_PROPS.border,
    text: rest.text ?? DEFAULT_TOOLTIP_PROPS.text,
    showTitle: rest.showTitle ?? DEFAULT_TOOLTIP_PROPS.showTitle,
    showPageName: rest.showPageName ?? DEFAULT_TOOLTIP_PROPS.showPageName,
    side: isTooltipSide(rest.side) ? rest.side : DEFAULT_TOOLTIP_PROPS.side,
    align: isTooltipAlign(rest.align)
      ? rest.align
      : DEFAULT_TOOLTIP_PROPS.align,
    sideOffset: clamp(
      Math.round(rest.sideOffset ?? DEFAULT_TOOLTIP_PROPS.sideOffset),
      SIDE_OFFSET_MIN,
      SIDE_OFFSET_MAX
    ),
    alignOffset: clamp(
      Math.round(rest.alignOffset ?? DEFAULT_TOOLTIP_PROPS.alignOffset),
      ALIGN_OFFSET_MIN,
      ALIGN_OFFSET_MAX
    ),
    paddingX: clamp(
      Math.round(
        rest.paddingX ?? fallbackPadding ?? DEFAULT_TOOLTIP_PROPS.paddingX
      ),
      TOOLTIP_PADDING_MIN,
      TOOLTIP_PADDING_MAX
    ),
    paddingY: clamp(
      Math.round(
        rest.paddingY ?? fallbackPadding ?? DEFAULT_TOOLTIP_PROPS.paddingY
      ),
      TOOLTIP_PADDING_MIN,
      TOOLTIP_PADDING_MAX
    ),
    borderRadius: clamp(
      Math.round(rest.borderRadius ?? DEFAULT_TOOLTIP_PROPS.borderRadius),
      TOOLTIP_RADIUS_MIN,
      TOOLTIP_RADIUS_MAX
    ),
  }
}

const normalizeDevSpotlightProps = (
  raw?:
    | (Partial<DevSpotlightProps> & {
        color?: InspectorColor
        padding?: number
        paddingLeft?: number
        paddingRight?: number
      })
    | null
): DevSpotlightProps => {
  const presetColor = isInspectorColor(raw?.color) ? raw.color : null
  const preset = presetColor ? INSPECTOR_COLORS[presetColor] : null
  const {
    color: _color,
    padding: legacyPadding,
    paddingLeft: legacyPaddingLeft,
    paddingRight: legacyPaddingRight,
    ...rest
  } = raw ?? {}
  const fallbackPadding =
    typeof legacyPadding === "number" ? legacyPadding : null
  const fallbackPaddingX =
    typeof legacyPaddingLeft === "number" ||
    typeof legacyPaddingRight === "number"
      ? Math.max(legacyPaddingLeft ?? 0, legacyPaddingRight ?? 0)
      : fallbackPadding

  return {
    ...DEFAULT_DEV_SPOTLIGHT_PROPS,
    ...rest,
    background:
      rest.background ??
      preset?.stroke ??
      DEFAULT_DEV_SPOTLIGHT_PROPS.background,
    border: rest.border ?? preset?.stroke ?? DEFAULT_DEV_SPOTLIGHT_PROPS.border,
    bgOpacity: clamp(
      rest.bgOpacity ?? DEFAULT_DEV_SPOTLIGHT_PROPS.bgOpacity,
      0,
      1
    ),
    strokeOpacity: clamp(
      rest.strokeOpacity ?? DEFAULT_DEV_SPOTLIGHT_PROPS.strokeOpacity,
      0,
      1
    ),
    strokeWidth: snapStrokeWidth(
      rest.strokeWidth ?? DEFAULT_DEV_SPOTLIGHT_PROPS.strokeWidth
    ),
    strokeStyle: isStrokeStyle(rest.strokeStyle)
      ? rest.strokeStyle
      : DEFAULT_DEV_SPOTLIGHT_PROPS.strokeStyle,
    borderRadius: snapBorderRadius(
      rest.borderRadius ?? DEFAULT_DEV_SPOTLIGHT_PROPS.borderRadius
    ),
    paddingX: snapPadding(
      rest.paddingX ?? fallbackPaddingX ?? DEFAULT_DEV_SPOTLIGHT_PROPS.paddingX
    ),
    paddingY: snapPadding(
      rest.paddingY ?? fallbackPadding ?? DEFAULT_DEV_SPOTLIGHT_PROPS.paddingY
    ),
    animated: rest.animated ?? DEFAULT_DEV_SPOTLIGHT_PROPS.animated,
  }
}

const normalizeSettings = (
  raw: Partial<InspectorSettings>
): InspectorSettings => ({
  shortcut:
    typeof raw.shortcut === "string" && raw.shortcut.trim()
      ? raw.shortcut.trim()
      : DEFAULT_INSPECTOR_SETTINGS.shortcut,
  ide: isInspectorIde(raw.ide) ? raw.ide : DEFAULT_INSPECTOR_SETTINGS.ide,
  tooltipProps: normalizeTooltipProps(raw.tooltipProps),
  devSpotlightProps: normalizeDevSpotlightProps(raw.devSpotlightProps),
})

export {
  toRgbChannels,
  toRgba,
  getOverlayPaint,
} from "../styles/styles.ts"

export {
  expandRectWithPadding,
  formatComponentTag,
  formatDomTag,
  formatTooltipLabel,
  getInfoPanelPosition,
  getTooltipPosition,
  underStackTransform,
} from "./tooltip.ts"

export const matchesInspectorShortcut = (
  event: KeyboardEvent,
  shortcut: string
) => {
  const parts = shortcut
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 0) return false

  const key = parts.at(-1) ?? ""
  const wantsAlt = parts.includes("alt") || parts.includes("option")
  const wantsMeta =
    parts.includes("meta") || parts.includes("cmd") || parts.includes("command")
  const wantsCtrl = parts.includes("ctrl") || parts.includes("control")
  const wantsShift = parts.includes("shift")

  if (event.altKey !== wantsAlt) return false
  if (event.metaKey !== wantsMeta) return false
  if (event.ctrlKey !== wantsCtrl) return false
  if (event.shiftKey !== wantsShift) return false
  if (event.repeat) return false

  const eventKey = normalizeShortcutKey(event)
  if (!eventKey) return false

  return eventKey.toLowerCase() === key
}

export const formatShortcutFromEvent = (event: KeyboardEvent) => {
  const key = normalizeShortcutKey(event)
  if (!key) return null

  const parts: string[] = []
  if (event.altKey) parts.push("Alt")
  if (event.metaKey) parts.push("Meta")
  if (event.ctrlKey) parts.push("Ctrl")
  if (event.shiftKey) parts.push("Shift")
  parts.push(key)

  return parts.join("+")
}

const SHORTCUT_SYMBOLS: Record<string, string> = {
  alt: "⌥",
  option: "⌥",
  meta: "⌘",
  cmd: "⌘",
  command: "⌘",
  ctrl: "⌃",
  control: "⌃",
  shift: "⇧",
}

export const formatShortcutParts = (shortcut: string) =>
  shortcut
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const symbol = SHORTCUT_SYMBOLS[part.toLowerCase()]
      if (symbol) return symbol
      if (part.length === 1) return part.toUpperCase()
      return part
    })

const normalizeShortcutKey = (event: KeyboardEvent) => {
  const { key, code } = event

  if (
    key === "Alt" ||
    key === "Control" ||
    key === "Meta" ||
    key === "Shift" ||
    key === "Dead"
  ) {
    return null
  }

  // Prefer physical key codes so Alt/Option layouts still match (Alt+X → KeyX).
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit[0-9]$/.test(code)) return code.slice(5)

  if (key === " ") return "Space"
  if (key === "Escape") return "Esc"
  if (key.startsWith("Arrow")) return key.slice("Arrow".length)
  if (key.length === 1) return key.toUpperCase()

  return key
}

export const tooltipDefaultsForColor = (
  color: InspectorColor
): Pick<TooltipProps, "background" | "text" | "border"> => {
  const palette = INSPECTOR_COLORS[color]
  return {
    background: palette.tooltip,
    border: "transparent",
    text: color === "white" ? "#121212" : "#ffffff",
  }
}

export const spotlightDefaultsForColor = (
  color: InspectorColor
): Pick<DevSpotlightProps, "background" | "border"> => {
  const palette = INSPECTOR_COLORS[color]
  return {
    background: palette.stroke,
    border: palette.stroke,
  }
}

export const formatInspectorComponentSnippet = (
  settings: InspectorSettings
) => `<InspectUI
  projectRoot={process.cwd()}
  shortcut=${JSON.stringify(settings.shortcut)}
  tooltipProps={${JSON.stringify(settings.tooltipProps, null, 2)}}
  devSpotlightProps={${JSON.stringify(settings.devSpotlightProps, null, 2)}}
/>`

let settings = DEFAULT_INSPECTOR_SETTINGS

const emit = () => {
  listeners.forEach((listener) => listener())
}

export const getInspectorSettings = () => settings

export const setInspectorSettings = (
  patch: Omit<Partial<InspectorSettings>, "tooltipProps" | "devSpotlightProps"> & {
    tooltipProps?: Partial<TooltipProps>
    devSpotlightProps?: Partial<DevSpotlightProps>
  }
) => {
  settings = normalizeSettings({
    ...settings,
    ...patch,
    tooltipProps: {
      ...settings.tooltipProps,
      ...patch.tooltipProps,
    },
    devSpotlightProps: {
      ...settings.devSpotlightProps,
      ...patch.devSpotlightProps,
    },
  })
  emit()
}

export const setTooltipProps = (patch: Partial<TooltipProps>) => {
  setInspectorSettings({ tooltipProps: patch })
}

export const setDevSpotlightProps = (patch: Partial<DevSpotlightProps>) => {
  setInspectorSettings({ devSpotlightProps: patch })
}

export const resetInspectorSettings = () => {
  settings = DEFAULT_INSPECTOR_SETTINGS
  emit()
}

export const subscribeInspectorSettings = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Session-only settings — nothing is written to localStorage. */
export const initInspectorSettings = () => {
  emit()
  return settings
}

export const toAbsolutePath = (filePath: string, projectRoot: string) => {
  if (filePath.startsWith("file://")) {
    return decodeURIComponent(new URL(filePath).pathname)
  }
  if (filePath.startsWith("/")) return filePath
  return `${projectRoot.replace(/\/$/, "")}/${filePath.replace(/^\.\//, "")}`
}
