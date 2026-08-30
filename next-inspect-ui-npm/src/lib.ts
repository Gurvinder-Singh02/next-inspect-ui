/**
 * `next-inspect-ui/lib` — the inspector's pure helpers (settings, stamp
 * parsing, source resolution, DOM navigation).
 *
 * Kept off the main entry on purpose: bundlers retain every export of a
 * `"use client"` entry module in the client bundle, so shipping these from
 * the root would put ~13 KB of helper code on every production page of any
 * app that merely imports `InspectUI`. Import from here only in tooling and
 * test surfaces, never from a public production page.
 */

export {
  ALIGN_OFFSET_MAX,
  ALIGN_OFFSET_MIN,
  BORDER_RADIUS_MAX,
  BORDER_RADIUS_MIN,
  BORDER_RADIUS_STEP,
  DEFAULT_DEV_SPOTLIGHT_PROPS,
  DEFAULT_INSPECTOR_SETTINGS,
  DEFAULT_TOOLTIP_PROPS,
  INSPECTOR_COLORS,
  INSPECTOR_IDES,
  OVERLAY_HOVER_TRANSITION,
  PADDING_MAX,
  PADDING_MIN,
  PADDING_STEP,
  SIDE_OFFSET_MAX,
  SIDE_OFFSET_MIN,
  STROKE_WIDTH_MAX,
  STROKE_WIDTH_MIN,
  STROKE_WIDTH_STEP,
  TOOLTIP_HOVER_TRANSITION,
  TOOLTIP_PADDING_MAX,
  TOOLTIP_PADDING_MIN,
  TOOLTIP_RADIUS_MAX,
  TOOLTIP_RADIUS_MIN,
  expandRectWithPadding,
  formatComponentTag,
  formatDomTag,
  formatInspectorComponentSnippet,
  formatShortcutDisplay,
  formatShortcutFromEvent,
  formatShortcutParts,
  formatTooltipLabel,
  getInspectorSettings,
  getOverlayPaint,
  getTooltipPosition,
  initInspectorSettings,
  isInspectorIde,
  matchesInspectorShortcut,
  normalizeSettings,
  resetInspectorSettings,
  setDevSpotlightProps,
  setInspectorSettings,
  setTooltipProps,
  spotlightDefaultsForColor,
  subscribeInspectorSettings,
  toRgbChannels,
  toRgba,
  tooltipDefaultsForColor,
  type DevSpotlightProps,
  type InspectorColor,
  type InspectorIde,
  type InspectorSettings,
  type InspectorStrokeStyle,
  type TooltipAlign,
  type TooltipProps,
  type TooltipSide,
} from "./lib/inspector-settings"

export {
  getInspectDebugFlags,
  setInspectDebugFlags,
  type InspectDebugFlags,
} from "./debug-flags"

export {
  HOST_STAMP_ATTR,
  OWNER_STAMP_ATTR,
  documentHasStamps,
  findNearestHostStamp,
  parseStampValue,
  readHostStamp,
  readOwnerStamp,
} from "./lib/inspector-stamp"

export {
  findChildInspectable,
  findChildInspectableWhere,
  findEdgeSiblingInspectable,
  findParentInspectable,
  findSiblingInspectable,
  getElementFiber,
  isInspectorChrome,
  isSkippedNavHost,
} from "./lib/inspector-nav"

export {
  formatPageLabel,
  getClimbInfoHostSource,
  getClimbOpenSource,
  getClimbStepDisplaySource,
  isBundledOrExternalPath,
  isDistinctUsedSource,
  isSameSourceLine,
  isLikelySourceFile,
  nextOwnerChainDepth,
  normalizeSourceLocation,
  pickDefinedSource,
  pickOpenSource,
  pickPreferredStackSource,
  sourceFromFiberDebugSource,
  toAbsolutePath,
  underStackTransform,
  type ClimbSourcePair,
  type FiberDebugSource,
  type NamedSourceFrame,
  type SourceLocation,
} from "./lib/inspector-source"
