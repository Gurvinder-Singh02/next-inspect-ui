import assert from "node:assert/strict"
import { test } from "node:test"

import { registerDom } from "./register-dom.ts"

registerDom()

const { DEFAULT_INSPECTOR_SETTINGS } = await import(
  "../../next-inspect-ui/src/lib.ts"
)
const { applyOverlayPaint, ensureInspectorStyles } = await import(
  "../../next-inspect-ui/src/styles.ts"
)
const { createUsedIcon } = await import("../../next-inspect-ui/src/icons.ts")

test("injects overlay.css once", () => {
  document.head.querySelectorAll("style[data-dev-inspector-style]").forEach((node) => {
    node.remove()
  })
  ensureInspectorStyles(document)
  ensureInspectorStyles(document)
  const sheets = document.head.querySelectorAll("style[data-dev-inspector-style]")
  assert.equal(sheets.length, 1)
  assert.match(sheets[0]?.textContent ?? "", /\[data-dev-inspector-overlay\]/)
  assert.match(sheets[0]?.textContent ?? "", /--inspect-fill/)
})

test("paints overlay and tooltip through CSS variables", () => {
  const overlay = document.createElement("div")
  const tooltip = document.createElement("div")
  applyOverlayPaint(overlay, tooltip, DEFAULT_INSPECTOR_SETTINGS)
  assert.equal(overlay.style.getPropertyValue("--inspect-fill"), "rgb(249 115 22 / 0.09)")
  assert.equal(
    overlay.style.getPropertyValue("--inspect-border"),
    "1px dashed rgba(249 115 22 / 1)"
  )
  assert.equal(tooltip.style.getPropertyValue("--inspect-tooltip-bg"), "#FF6100")
})

test("used icon is a real svg node, not innerHTML", () => {
  const icon = createUsedIcon()
  assert.equal(icon.namespaceURI, "http://www.w3.org/2000/svg")
  assert.equal(icon.tagName.toLowerCase(), "svg")
  assert.equal(icon.querySelectorAll("path").length, 2)
  assert.equal(icon.outerHTML.includes("innerHTML"), false)
})

test("builds a tooltip with a text-only under chip", async () => {
  const { createInspectTooltip, underStackTransform } = await import(
    "../../next-inspect-ui/src/tooltip.ts"
  )
  const tooltip = createInspectTooltip()
  tooltip.setLabel("<Button/>")
  tooltip.pushUnder("<Card/>")
  tooltip.showUsedIcon(true)
  const under = tooltip.root.querySelector("[data-dev-inspector-tooltip-under]")
  assert.equal(tooltip.label, "<Button/>")
  assert.equal(under?.textContent, "<Card/>")
  assert.equal(under?.querySelector("svg"), null)
  assert.equal(
    (under as HTMLElement | null)?.style.transform,
    underStackTransform(1)
  )
  assert.equal(
    tooltip.root
      .querySelector("[data-dev-inspector-tooltip-icon]")
      ?.hasAttribute("data-open"),
    true
  )
})

test("under chips stay text-only so the used icon never stacks twice", () => {
  const under = document.createElement("div")
  under.setAttribute("data-dev-inspector-tooltip-under", "")
  under.textContent = "<Button/>"
  assert.equal(under.querySelector("svg"), null)
  assert.equal(under.childElementCount, 0)
})
