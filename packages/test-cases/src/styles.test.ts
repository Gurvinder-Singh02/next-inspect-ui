import assert from "node:assert/strict"
import { test } from "node:test"

import { registerDom } from "./register-dom.ts"

registerDom()

const { DEFAULT_DEV_SPOTLIGHT_PROPS, DEFAULT_INSPECTOR_SETTINGS } =
  await import("../../next-inspect-ui/src/lib/index.ts")
const {
  applyOverlayPaint,
  ensureInspectorStyles,
  INSTANT_CLASS,
  inspectClass,
  markInspectNode,
  paintUsedIcon,
} = await import("../../next-inspect-ui/src/styles/styles.ts")
const { createUsedIcon } =
  await import("../../next-inspect-ui/src/lib/icons.ts")

test("maps inspect hooks to class names", () => {
  assert.equal(
    inspectClass("data-dev-inspector-overlay"),
    "next-inspect-ui-overlay"
  )
  assert.equal(
    inspectClass("data-dev-inspector-tooltip"),
    "next-inspect-ui-tooltip"
  )
})

test("injects the overlay sheet once", () => {
  document.head
    .querySelectorAll("style[data-dev-inspector-style]")
    .forEach((node) => {
      node.remove()
    })
  const css = ".next-inspect-ui-overlay { --inspect-fill: orange; }"
  ensureInspectorStyles(css, document)
  ensureInspectorStyles(css, document)
  const sheets = document.head.querySelectorAll(
    "style[data-dev-inspector-style]"
  )
  assert.equal(sheets.length, 1)
  assert.match(sheets[0]?.textContent ?? "", /\.next-inspect-ui-overlay/)
  assert.match(sheets[0]?.textContent ?? "", /--inspect-fill/)
})

test("paints overlay and tooltip through CSS variables", () => {
  const overlay = document.createElement("div")
  const tooltip = document.createElement("div")
  applyOverlayPaint(overlay, tooltip, DEFAULT_INSPECTOR_SETTINGS)
  assert.equal(
    overlay.style.getPropertyValue("--inspect-fill"),
    "rgb(0 110 254 / 0.1)"
  )
  assert.equal(
    overlay.style.getPropertyValue("--inspect-border"),
    "0.5px solid rgba(0 110 254 / 1)"
  )
  assert.equal(
    tooltip.style.getPropertyValue("--inspect-tooltip-bg"),
    "#006efe"
  )
  assert.equal(overlay.classList.contains(INSTANT_CLASS), false)
})

test("turns motion off with a class, not a transition string", () => {
  const overlay = document.createElement("div")
  const tooltip = document.createElement("div")
  applyOverlayPaint(overlay, tooltip, {
    ...DEFAULT_INSPECTOR_SETTINGS,
    devSpotlightProps: { ...DEFAULT_DEV_SPOTLIGHT_PROPS, animated: false },
  })
  assert.equal(overlay.classList.contains(INSTANT_CLASS), true)
  assert.equal(tooltip.classList.contains(INSTANT_CLASS), true)
  assert.equal(overlay.style.getPropertyValue("--inspect-transition"), "")
})

test("used icon is a real svg node, not innerHTML", () => {
  const icon = createUsedIcon()
  assert.equal(icon.namespaceURI, "http://www.w3.org/2000/svg")
  assert.equal(icon.tagName.toLowerCase(), "svg")
  assert.equal(icon.querySelectorAll("path").length, 2)
  assert.equal(icon.outerHTML.includes("innerHTML"), false)
})

test("builds a tooltip with a text-only under chip", async () => {
  const { createInspectTooltip, underStackTransform } =
    await import("../../next-inspect-ui/src/lib/tooltip.ts")
  const tooltip = createInspectTooltip()
  tooltip.setLabel("<Button/>")
  tooltip.pushUnder("<Card/>")
  tooltip.showUsedIcon(true)
  const under = tooltip.root.querySelector("[data-dev-inspector-tooltip-under]")
  const icon = tooltip.root.querySelector(
    "[data-dev-inspector-tooltip-icon]"
  ) as HTMLElement | null
  assert.equal(tooltip.root.className, "next-inspect-ui-tooltip")
  assert.equal(tooltip.label, "<Button/>")
  assert.equal(under?.textContent, "<Card/>")
  assert.equal(under?.className, "next-inspect-ui-tooltip-under")
  assert.equal(under?.querySelector("svg"), null)
  assert.equal(
    (under as HTMLElement | null)?.style.transform,
    underStackTransform(1)
  )
  assert.equal(icon?.style.width, "20px")
  assert.equal(icon?.hasAttribute("data-open"), false)
})

test("opens the used icon with inline styles, not a data-open rule", () => {
  const icon = markInspectNode(
    document.createElement("span"),
    "data-dev-inspector-tooltip-icon"
  )
  paintUsedIcon(icon, true)
  assert.equal(icon.style.width, "20px")
  assert.equal(icon.style.marginRight, "2px")
  paintUsedIcon(icon, false)
  assert.equal(icon.style.width, "0")
})

test("under chips stay text-only so the used icon never stacks twice", () => {
  const under = markInspectNode(
    document.createElement("div"),
    "data-dev-inspector-tooltip-under"
  )
  under.textContent = "<Button/>"
  assert.equal(under.querySelector("svg"), null)
  assert.equal(under.childElementCount, 0)
})
