import assert from "node:assert/strict"
import { after, before, test } from "node:test"

import { registerDom } from "./register-dom.ts"

registerDom()

const {
  isInspectorChrome,
  resolveInspectElement,
} = await import("../../next-inspect-ui/src/engine.ts")

const attachFiber = (element: Element, className?: string) => {
  Object.assign(element, {
    __reactFiber$test: {
      tag: 5,
      stateNode: element,
      memoizedProps: className ? { className } : null,
    },
  })
  if (className) element.setAttribute("class", className)
  return element
}

before(() => {
  document.body.replaceChildren()
})

after(() => {
  document.body.replaceChildren()
})

test("climbs from an svg path to the button that owns it", () => {
  const button = attachFiber(document.createElement("button"), "inline-flex")
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
  attachFiber(svg)
  attachFiber(path)
  svg.append(path)
  button.append(svg)
  document.body.append(button)

  assert.equal(resolveInspectElement(path), button)
  assert.equal(resolveInspectElement(svg), button)
})

test("does not treat a lone svg as the host when a link wraps it", () => {
  const link = attachFiber(document.createElement("a"), "nav-link")
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  attachFiber(svg)
  link.append(svg)
  document.body.append(link)

  assert.equal(resolveInspectElement(svg), link)
})

test("skips inspector chrome so the overlay cannot inspect itself", () => {
  const overlay = document.createElement("div")
  overlay.setAttribute("data-dev-inspector-overlay", "")
  const hit = document.createElement("span")
  overlay.append(hit)
  document.body.append(overlay)

  assert.equal(isInspectorChrome(hit), true)
  assert.equal(isInspectorChrome(document.createElement("button")), false)
})

test("treats the info panel as chrome, not a page host", () => {
  const info = document.createElement("div")
  info.setAttribute("data-dev-inspector-info", "")
  const row = document.createElement("button")
  info.append(row)
  document.body.append(info)

  assert.equal(isInspectorChrome(row), true)
})
