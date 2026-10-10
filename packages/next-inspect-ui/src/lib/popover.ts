import { isInspectorChrome } from "./engine.ts"

export type ElementTreeRow = {
  element: Element
  depth: number
  relation: "parent" | "sibling" | "current" | "child"
}

/** Up to 15 actual elements: nearest siblings first, then parents, then children. */
export const getElementTreeRows = (target: Element): ElementTreeRow[] => {
  const selected = new Set<Element>([target])
  const limit = 15
  const add = (element: Element | null) => {
    if (element && selected.size < limit && !isInspectorChrome(element))
      selected.add(element)
  }
  const atBody = target.tagName.toLowerCase() === "body"
  let before = atBody ? null : target.previousElementSibling
  let after = atBody ? null : target.nextElementSibling
  while ((before || after) && selected.size < limit) {
    add(before)
    add(after)
    before = before?.previousElementSibling ?? null
    after = after?.nextElementSibling ?? null
  }
  let parent = atBody ? null : target.parentElement
  while (
    parent &&
    parent.tagName.toLowerCase() !== "html" &&
    selected.size < limit &&
    !isInspectorChrome(parent)
  ) {
    add(parent)
    if (parent.tagName.toLowerCase() === "body") break
    parent = parent.parentElement
  }
  const children = Array.from(target.children)
  for (
    let index = 0;
    index < children.length && selected.size < limit;
    index++
  ) {
    const child = children[index]!
    if (isInspectorChrome(child)) continue
    add(child)
    children.push(...Array.from(child.children))
  }
  const ancestors = new Set<Element>()
  let root = target
  while (root.parentElement && selected.has(root.parentElement)) {
    root = root.parentElement
    ancestors.add(root)
  }
  const roots = root.parentElement
    ? Array.from(root.parentElement.children).filter((element) =>
        selected.has(element)
      )
    : [root]
  const rows: ElementTreeRow[] = []
  const walk = (element: Element, depth: number) => {
    rows.push({
      element,
      depth,
      relation:
        element === target
          ? "current"
          : ancestors.has(element)
            ? "parent"
            : element.parentElement === target.parentElement
              ? "sibling"
              : "child",
    })
    for (const child of Array.from(element.children))
      if (selected.has(child)) walk(child, depth + 1)
  }
  for (const element of roots) walk(element, 0)
  return rows
}

export const getElementText = (element: Element) => {
  const text = element.childNodes
    ? Array.from(element.childNodes)
        .filter((node) => node.nodeType === 3)
        .map((node) => node.textContent ?? "")
        .join(" ")
    : element.children.length
      ? ""
      : (element.textContent ?? "")
  return text.replace(/\s+/g, " ").trim()
}

const voidTags = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
])
const escapeAttribute = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")

/** Text only: attribute values must never become inspector markup. */
export const getElementMarkup = (element: Element) => {
  const tag = element.tagName.toLowerCase()
  const attributes = element
    .getAttributeNames()
    .map(
      (name) =>
        ` ${name}="${escapeAttribute(element.getAttribute(name) ?? "")}"`
    )
    .join("")
  return {
    opening: `<${tag}${attributes}>`,
    closing: voidTags.has(tag) ? "" : `</${tag}>`,
  }
}
