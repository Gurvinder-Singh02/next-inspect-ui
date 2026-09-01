import assert from "node:assert/strict"
import { test } from "node:test"

import {
  DEFAULT_DEV_SPOTLIGHT_PROPS,
  DEFAULT_INSPECTOR_SETTINGS,
  DEFAULT_TOOLTIP_PROPS,
  expandRectWithPadding,
  formatComponentTag,
  formatDomTag,
  formatShortcutParts,
  formatTooltipLabel,
  getInfoPanelPosition,
  getOverlayPaint,
  getTooltipPosition,
  INSPECTOR_IDES,
  matchesInspectorShortcut,
  toAbsolutePath,
  toRgbChannels,
  toRgba,
} from "../../next-inspect-ui/src/lib/index.ts"

const keyEvent = (partial: {
  altKey?: boolean
  metaKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  repeat?: boolean
  key?: string
  code?: string
}) =>
  ({
    altKey: false,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    repeat: false,
    key: "x",
    code: "KeyX",
    ...partial,
  }) as KeyboardEvent

test("parses 6-digit hex into rgb channels", () => {
  assert.equal(toRgbChannels("#f97316"), "249 115 22")
  assert.equal(toRgbChannels("0ea5e9"), "14 165 233")
  assert.equal(toRgbChannels("#fff"), null)
  assert.equal(toRgbChannels("not-hex"), null)
})

test("builds rgba from hex and keeps invalid hex unchanged", () => {
  assert.equal(toRgba("#f97316", 0.09), "rgba(249 115 22 / 0.09)")
  assert.equal(toRgba("nope", 1), "nope")
})

test("paints the default orange dashed spotlight", () => {
  const paint = getOverlayPaint(DEFAULT_INSPECTOR_SETTINGS)
  assert.equal(paint.fill, "rgb(249 115 22 / 0.09)")
  assert.equal(paint.border, "1px dashed rgba(249 115 22 / 1)")
  assert.equal(paint.tooltipBackground, "#FF6100")
  assert.equal(paint.tooltipPadding, "2px 8px")
  assert.equal(paint.animated, true)
})

test("drops the spotlight border when stroke width is 0", () => {
  const paint = getOverlayPaint({
    ...DEFAULT_INSPECTOR_SETTINGS,
    devSpotlightProps: { ...DEFAULT_DEV_SPOTLIGHT_PROPS, strokeWidth: 0 },
  })
  assert.equal(paint.border, "0px none transparent")
})

test("places the tooltip above the target on the start edge", () => {
  const pos = getTooltipPosition({
    target: { left: 100, top: 100, width: 80, height: 40 },
    tooltipWidth: 120,
    tooltipHeight: 24,
    side: "top",
    align: "start",
    sideOffset: 6,
    alignOffset: 0,
  })
  assert.deepEqual(pos, { left: 100, top: 70 })
})

test("flips a clipped top tooltip inside the spotlight", () => {
  const pos = getTooltipPosition({
    target: { left: 40, top: 8, width: 80, height: 40 },
    tooltipWidth: 100,
    tooltipHeight: 28,
    side: "top",
    align: "start",
    sideOffset: 6,
    alignOffset: 0,
    viewport: { width: 400, height: 300 },
  })
  assert.equal(pos.top, 8 + 6 + 10)
  assert.equal(pos.left, 40 + 15)
})

test("clamps a right tooltip that would overflow the viewport", () => {
  const pos = getTooltipPosition({
    target: { left: 360, top: 40, width: 30, height: 20 },
    tooltipWidth: 80,
    tooltipHeight: 20,
    side: "right",
    align: "start",
    sideOffset: 6,
    alignOffset: 0,
    viewport: { width: 400, height: 200 },
  })
  assert.ok(pos.left + 80 <= 400)
  assert.ok(pos.left >= 0)
})

test("sits the info panel below the target when there is room", () => {
  assert.deepEqual(
    getInfoPanelPosition({
      target: { left: 40, top: 20, width: 80, height: 30 },
      panelWidth: 200,
      panelHeight: 80,
      viewport: { width: 400, height: 300 },
    }),
    { left: 40, top: 58 }
  )
})

test("flips the info panel above the target when it would clip the bottom", () => {
  assert.deepEqual(
    getInfoPanelPosition({
      target: { left: 40, top: 220, width: 80, height: 30 },
      panelWidth: 200,
      panelHeight: 80,
      viewport: { width: 400, height: 300 },
    }),
    { left: 40, top: 132 }
  )
})

test("expands a rect with uniform or per-side padding", () => {
  assert.deepEqual(
    expandRectWithPadding({ left: 10, top: 10, width: 20, height: 20 }, 2),
    { left: 8, top: 8, width: 24, height: 24 }
  )
  assert.deepEqual(
    expandRectWithPadding(
      { left: 10, top: 10, width: 20, height: 20 },
      { left: 4, right: 1, top: 0, bottom: 3 }
    ),
    { left: 6, top: 10, width: 25, height: 23 }
  )
})

test("formats tooltip copy for component and host tags", () => {
  assert.equal(formatComponentTag("Button"), "<Button/>")
  assert.equal(formatDomTag("button"), "<button>")
  assert.equal(
    formatTooltipLabel({
      title: "Button",
      pageName: "app/page.tsx:12",
      tooltipProps: DEFAULT_TOOLTIP_PROPS,
    }),
    "<Button/> · app/page.tsx:12"
  )
  assert.equal(
    formatTooltipLabel({
      title: "button",
      pageName: "app/page.tsx:12",
      tooltipProps: DEFAULT_TOOLTIP_PROPS,
      tagStyle: "dom",
    }),
    "<button> · app/page.tsx:12"
  )
  assert.equal(
    formatTooltipLabel({
      title: "Button",
      pageName: "app/page.tsx:12",
      tooltipProps: { ...DEFAULT_TOOLTIP_PROPS, showTitle: false },
    }),
    "app/page.tsx:12"
  )
})

test("matches Alt+X on the physical KeyX even when the glyph is not x", () => {
  assert.equal(
    matchesInspectorShortcut(keyEvent({ altKey: true, key: "≈", code: "KeyX" }), "Alt+X"),
    true
  )
  assert.equal(
    matchesInspectorShortcut(keyEvent({ altKey: true, code: "KeyX", repeat: true }), "Alt+X"),
    false
  )
  assert.equal(
    matchesInspectorShortcut(keyEvent({ altKey: false, code: "KeyX" }), "Alt+X"),
    false
  )
  assert.equal(
    matchesInspectorShortcut(keyEvent({ altKey: true, metaKey: true, code: "KeyX" }), "Alt+X"),
    false
  )
})

test("renders shortcut parts with symbols", () => {
  assert.deepEqual(formatShortcutParts("Alt+X"), ["⌥", "X"])
  assert.deepEqual(formatShortcutParts("Meta+Shift+K"), ["⌘", "⇧", "K"])
})

test("builds a Cursor deep link without a server hop", () => {
  assert.equal(
    INSPECTOR_IDES.cursor.url("/tmp/app.tsx", 10, 2),
    "cursor://file/tmp/app.tsx:10:2"
  )
})

test("resolves file URLs and project-relative sources", () => {
  assert.equal(
    toAbsolutePath("file:///Users/gxuri/app/page.tsx", "/repo"),
    "/Users/gxuri/app/page.tsx"
  )
  assert.equal(toAbsolutePath("/abs/file.tsx", "/repo"), "/abs/file.tsx")
  assert.equal(toAbsolutePath("./src/App.tsx", "/repo"), "/repo/src/App.tsx")
})
