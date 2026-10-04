import assert from "node:assert/strict"
import { after, before, test } from "node:test"

import { registerDom } from "./register-dom.ts"

registerDom()

const {
  isInspectorChrome,
  resolveInspectElement,
} = await import("../../next-inspect-ui/src/lib/engine.ts")

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

test("keeps the exact SVG target inside a button", () => {
  const button = attachFiber(document.createElement("button"), "inline-flex")
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
  attachFiber(svg)
  attachFiber(path)
  svg.append(path)
  button.append(svg)
  document.body.append(button)

  assert.equal(resolveInspectElement(path), path)
  assert.equal(resolveInspectElement(svg), svg)
})

test("keeps an SVG target inside a link", () => {
  const link = attachFiber(document.createElement("a"), "nav-link")
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  attachFiber(svg)
  link.append(svg)
  document.body.append(link)

  assert.equal(resolveInspectElement(svg), svg)
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

 test("keeps classless and inline-styled children instead of a classed group", () => {
  const group = attachFiber(document.createElement("section"), "group")
  const button = attachFiber(document.createElement("button"), "button")
  const child = attachFiber(document.createElement("span"))
  button.append(child)
  group.append(button)
  document.body.append(group)
  assert.equal(resolveInspectElement(child), child)
  assert.equal(resolveInspectElement(button), button)
})
