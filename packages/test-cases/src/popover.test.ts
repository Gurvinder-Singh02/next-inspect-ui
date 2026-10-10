import assert from "node:assert/strict"
import { test } from "node:test"
import {
  getElementTreeRows,
  getElementMarkup,
  getElementText,
} from "../../next-inspect-ui/src/lib/popover.ts"
import {
  getPopoverComponentAncestors,
  type ReactFiber,
  type ServerDebugInfo,
} from "../../next-inspect-ui/src/lib/engine.ts"
import { registerDom } from "./register-dom.ts"

registerDom()

test("uses available space for siblings, ancestors, and children in nested DOM order", () => {
  const parent = document.createElement("div")
  const siblings = Array.from({ length: 7 }, () =>
    document.createElement("button")
  )
  const target = siblings[3]!
  const children = [
    document.createElement("span"),
    document.createElement("svg"),
  ]
  target.append(...children)
  parent.append(...siblings)
  const rows = getElementTreeRows(target)
  assert.deepEqual(
    rows.map((row) => row.element),
    [parent, ...siblings.slice(0, 4), ...children, ...siblings.slice(4)]
  )
  assert.equal(rows.find((row) => row.element === parent)?.depth, 0)
  assert.equal(rows.find((row) => row.element === target)?.depth, 1)
  assert.equal(rows.find((row) => row.element === children[0])?.depth, 2)
})

test("caps the tree at 15 nodes and prioritizes nearest siblings over parents and children", () => {
  const parent = document.createElement("div")
  const siblings = Array.from({ length: 31 }, () =>
    document.createElement("button")
  )
  const target = siblings[15]!
  target.append(document.createElement("span"))
  parent.append(...siblings)
  const rows = getElementTreeRows(target)
  assert.equal(rows.length, 15)
  assert.deepEqual(
    rows.map((row) => row.element),
    siblings.slice(8, 23)
  )
})

test("remaining space goes to parents before children", () => {
  const ancestors = Array.from({ length: 20 }, () =>
    document.createElement("div")
  )
  ancestors.forEach((element, index) => {
    if (index) ancestors[index - 1]!.append(element)
  })
  const target = ancestors[19]!
  target.append(document.createElement("span"))
  const rows = getElementTreeRows(target)
  assert.equal(rows.length, 15)
  assert.deepEqual(
    rows.map((row) => row.element),
    ancestors.slice(5)
  )
  assert.equal(rows[14]?.depth, 14)
})

test("leaf text is included for HTML rendering", () => {
  const heading = document.createElement("h1")
  heading.textContent = " ss "
  assert.equal(getElementText(heading), "ss")
})

test("handles a standalone leaf and skips inspector chrome in the element neighborhood", () => {
  const target = document.createElement("button")
  assert.deepEqual(
    getElementTreeRows(target).map((row) => row.relation),
    ["current"]
  )
  const parent = document.createElement("div")
  const chrome = document.createElement("div")
  chrome.setAttribute("data-dev-inspector-info", "")
  const sibling = document.createElement("span")
  parent.append(target, chrome, sibling)
  assert.deepEqual(
    getElementTreeRows(target).map((row) => row.element),
    [parent, target, sibling]
  )
})

const fiber = (props: Partial<ReactFiber>): ReactFiber => ({ tag: 0, ...props })

test("component popover crosses host boundaries to show immediate parents", () => {
  const page = fiber({ type: { name: "Page" } })
  const card = fiber({ type: { name: "Card" }, return: page })
  const wrapper = fiber({ tag: 5, return: card })
  const button = fiber({
    type: { name: "Button" },
    return: wrapper,
    _debugOwner: page,
  })
  const host = fiber({ tag: 5, return: button })
  assert.deepEqual(
    getPopoverComponentAncestors(host).map((node) => node.name),
    ["Button", "Card", "Page"]
  )
})

test("server ancestors follow their rendered position rather than their creation owner", () => {
  const pageInfo: ServerDebugInfo = { name: "TestSuitePage" }
  const buttonInfo: ServerDebugInfo = { name: "Button", owner: pageInfo }
  const cardInfo: ServerDebugInfo = { name: "Card", owner: pageInfo }
  const shell = fiber({ type: { name: "Shell" }, _debugInfo: [pageInfo] })
  const card = fiber({ tag: 5, _debugInfo: [cardInfo], return: shell })
  const button = fiber({
    type: { name: "Button" },
    _debugInfo: [buttonInfo],
    return: card,
  })
  const host = fiber({ tag: 5, return: button })
  assert.deepEqual(
    getPopoverComponentAncestors(host).map((node) => node.name),
    ["Button", "Card", "Shell", "TestSuitePage"]
  )
})

test("component popover retains repeated component instances and avoids framework internals and cycles", () => {
  const router = fiber({ type: { name: "AppRouter" } })
  const outer = fiber({ type: { name: "Card" }, return: router })
  const inner = fiber({ type: { name: "Card" }, return: outer })
  router.return = inner
  assert.deepEqual(
    getPopoverComponentAncestors(inner).map((node) => node.fiber),
    [inner, outer]
  )
})

test("element markup preserves actual attributes safely and closes non-void tags", () => {
  const element = document.createElement("div")
  element.setAttribute("class", "a b")
  element.setAttribute("id", 'a"<>&')
  assert.deepEqual(getElementMarkup(element), {
    opening: '<div class="a b" id="a&quot;&lt;&gt;&amp;">',
    closing: "</div>",
  })
  assert.deepEqual(getElementMarkup(document.createElement("input")), {
    opening: "<input>",
    closing: "",
  })
})

test("development layout and focus handlers are absent from component navigation", () => {
  const layout = fiber({ type: { name: "DevLayout" } })
  const focus = fiber({
    type: { name: "ScrollAndMaybeFocusHandler" },
    return: layout,
  })
  const card = fiber({ type: { name: "Card" }, return: focus })
  assert.deepEqual(
    getPopoverComponentAncestors(card).map((node) => node.name),
    ["Card"]
  )
})

test("component popover stops before the nearest layout instead of filtering provider names", () => {
  const root = fiber({ type: { name: "Root" } })
  const layout = fiber({ type: { name: "DashboardLayout" }, return: root })
  const custom = fiber({ type: { name: "CustomContext" }, return: layout })
  const button = fiber({ type: { name: "Button" }, return: custom })
  assert.deepEqual(
    getPopoverComponentAncestors(button).map((node) => node.name),
    ["Button", "CustomContext"]
  )
})

test("page boundary excludes surrounding app providers while preserving local providers", () => {
  const app = fiber({ type: { name: "AnythingAtAll" } })
  const page = fiber({ type: { name: "ProductPage" }, return: app })
  const local = fiber({ type: { name: "LocalProvider" }, return: page })
  assert.deepEqual(
    getPopoverComponentAncestors(local).map((node) => node.name),
    ["LocalProvider", "ProductPage"]
  )
})

test("server metadata stops at page and layout boundaries on the same fiber", () => {
  const host = fiber({
    tag: 5,
    _debugInfo: [{ name: "RootLayout" }, { name: "Page" }, { name: "Card" }],
  })
  assert.deepEqual(
    getPopoverComponentAncestors(host).map((node) => node.name),
    ["Card", "Page"]
  )
  const layout = fiber({
    tag: 5,
    _debugInfo: [
      { name: "OuterProvider" },
      { name: "Layout" },
      { name: "Card" },
    ],
  })
  assert.deepEqual(
    getPopoverComponentAncestors(layout).map((node) => node.name),
    ["Card"]
  )
})

test("element ancestry stops at body and body selection excludes head and html", () => {
  const html = document.createElement("html")
  const head = document.createElement("head")
  const body = document.createElement("body")
  const div = document.createElement("div")
  const heading = document.createElement("h1")
  html.append(head, body)
  body.append(div)
  div.append(heading)
  assert.deepEqual(
    getElementTreeRows(heading).map((row) => row.element),
    [body, div, heading]
  )
  assert.deepEqual(
    getElementTreeRows(body).map((row) => row.element),
    [body, div, heading]
  )
})
