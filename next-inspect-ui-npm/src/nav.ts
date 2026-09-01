export const getElementFiber = <T = unknown>(element: Element): T | null => {
  const fiberKey = Object.keys(element).find((key) =>
    key.startsWith("__reactFiber$")
  )

  return fiberKey
    ? ((element as unknown as Record<string, T>)[fiberKey] ?? null)
    : null
}

export const isInspectorChrome = (element: Element) =>
  Boolean(
    element.closest(
      "[data-dev-inspector-overlay], [data-dev-inspector-tooltip], [data-dev-inspector-log], [data-dev-inspector-debug-toggle]"
    )
  )

/** Next/Suspense filler, scripts, and display:none hosts — skip for ] descent. */
export const isSkippedNavHost = (element: Element) => {
  const tag = element.tagName.toLowerCase()
  if (
    tag === "script" ||
    tag === "style" ||
    tag === "template" ||
    tag === "link" ||
    tag === "meta" ||
    tag === "noscript"
  ) {
    return true
  }

  if (!(element instanceof HTMLElement)) return false
  if (element.hidden) return true
  if (element.getAttribute("aria-hidden") === "true") return true

  // Inline styles only (avoid layout reads during hotkey spam).
  const { display, visibility } = element.style
  if (display === "none" || visibility === "hidden") return true

  return false
}

const isInspectable = (element: Element) =>
  !isInspectorChrome(element) &&
  !isSkippedNavHost(element) &&
  getElementFiber(element) !== null

export const findParentInspectable = (element: Element): Element | null => {
  let current = element.parentElement

  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    if (isInspectable(current)) return current
    current = current.parentElement
  }

  return null
}

export const findChildInspectable = (element: Element): Element | null => {
  for (const child of element.children) {
    if (isInspectorChrome(child) || isSkippedNavHost(child)) continue
    if (getElementFiber(child) !== null) return child
  }

  for (const child of element.children) {
    if (isInspectorChrome(child) || isSkippedNavHost(child)) continue
    const nested = findChildInspectable(child)
    if (nested) return nested
  }

  // Hidden wrappers may still house the real page host (Suspense / RSC shells).
  for (const child of element.children) {
    if (isInspectorChrome(child)) continue
    if (!isSkippedNavHost(child)) continue
    const nested = findChildInspectable(child)
    if (nested) return nested
  }

  return null
}

/**
 * BFS child search with an accept predicate (e.g. reject hosts that resolve
 * back to `from` after inspect remapping).
 */
export const findChildInspectableWhere = (
  element: Element,
  accept: (candidate: Element) => boolean
): Element | null => {
  const queue: Element[] = Array.from(element.children)
  const seen = new Set<Element>()

  while (queue.length > 0) {
    const child = queue.shift()!
    if (seen.has(child) || isInspectorChrome(child)) continue
    seen.add(child)

    if (!isSkippedNavHost(child) && getElementFiber(child) !== null) {
      if (accept(child)) return child
    }

    for (const nested of child.children) queue.push(nested)
  }

  return null
}

export const findSiblingInspectable = (
  element: Element,
  direction: "prev" | "next"
): Element | null => {
  let current =
    direction === "prev"
      ? element.previousElementSibling
      : element.nextElementSibling

  while (current) {
    if (isInspectable(current)) return current
    current =
      direction === "prev"
        ? current.previousElementSibling
        : current.nextElementSibling
  }

  return null
}

export const findEdgeSiblingInspectable = (
  element: Element,
  edge: "first" | "last"
): Element | null => {
  const parent = element.parentElement
  if (!parent) return null

  const children = Array.from(parent.children)
  const ordered = edge === "first" ? children : children.reverse()

  for (const child of ordered) {
    if (isInspectable(child)) return child
  }

  return null
}
