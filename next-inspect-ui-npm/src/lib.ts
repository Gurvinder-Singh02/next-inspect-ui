/**
 * `next-inspect-ui/lib` — settings and path helpers for the website toolbar.
 *
 * Kept off the main entry so bundlers do not ship this with `InspectUI`.
 */

export {
  ALIGN_OFFSET_MAX,
  ALIGN_OFFSET_MIN,
  BORDER_RADIUS_MAX,
  BORDER_RADIUS_MIN,
  PADDING_MAX,
  PADDING_MIN,
  SIDE_OFFSET_MAX,
  SIDE_OFFSET_MIN,
  STROKE_WIDTH_MAX,
  STROKE_WIDTH_MIN,
  STROKE_WIDTH_STEP,
  TOOLTIP_PADDING_MAX,
  TOOLTIP_PADDING_MIN,
  TOOLTIP_RADIUS_MAX,
  TOOLTIP_RADIUS_MIN,
  expandRectWithPadding,
  formatComponentTag,
  formatInspectorComponentSnippet,
  formatShortcutFromEvent,
  formatShortcutParts,
  formatTooltipLabel,
  getInspectorSettings,
  getOverlayPaint,
  getTooltipPosition,
  initInspectorSettings,
  INSPECTOR_COLORS,
  INSPECTOR_IDES,
  resetInspectorSettings,
  setDevSpotlightProps,
  setInspectorSettings,
  setTooltipProps,
  spotlightDefaultsForColor,
  subscribeInspectorSettings,
  tooltipDefaultsForColor,
  type InspectorColor,
  type InspectorIde,
  type InspectorSettings,
  type InspectorStrokeStyle,
  type TooltipAlign,
  type TooltipSide,
} from "./settings"

export { toAbsolutePath } from "./source"
