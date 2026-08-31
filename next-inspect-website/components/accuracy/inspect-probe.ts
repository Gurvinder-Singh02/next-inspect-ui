import type { FoundNode } from "@/components/accuracy/types"

/** Same payload `window.__inspectUI.inspect` returns (hover / info path). */
export type InspectUIProbeResult = {
  element: Element
  host: {
    name: string
    source: string | null
    filePath: string | null
    line: number | null
    column: number | null
  }
  /** NODE TREE order — climb parents first, host last. */
  nodes: FoundNode[]
}

type InspectUIProbe = {
  projectRoot: string
  inspect: (
    target: Element | string
  ) => Promise<InspectUIProbeResult | null>
}

declare global {
  interface Window {
    __inspectUI?: InspectUIProbe
  }
}

export const getInspectUIProbe = () => {
  if (typeof window === "undefined") return null
  return window.__inspectUI ?? null
}

/**
 * Call the same resolve path Inspect UI uses on hover.
 * `target` may be an Element or a CSS selector / id (`#foo`, `[data-accuracy-target=default]`).
 */
export const inspectWithProbe = async (target: Element | string) => {
  const probe = getInspectUIProbe()
  if (!probe) {
    console.info(
      "[accuracy] __inspectUI probe missing — is <InspectUI /> mounted?"
    )
    return null
  }
  return probe.inspect(target)
}

/** Every `[data-accuracy-target]` fixture inside a multi case, in DOM order. */
export const listCaseTestTargets = (
  caseRoot: HTMLElement
): Array<{ id: string; element: Element }> => {
  const wraps = caseRoot.querySelectorAll("[data-accuracy-target]")
  const listed: Array<{ id: string; element: Element }> = []

  for (const wrap of wraps) {
    if (!(wrap instanceof HTMLElement)) continue
    const id = wrap.getAttribute("data-accuracy-target")
    const element = wrap.firstElementChild
    if (!id || !element) continue
    listed.push({ id, element })
  }

  return listed
}

/** Prefer the element under the overlay spotlight; else a selector inside the case. */
export const pickCaseTestTarget = (
  caseRoot: HTMLElement,
  preferredTargetId?: string | null
): Element | string | null => {
  const overlay = document.querySelector(
    "[data-dev-inspector-overlay]"
  ) as HTMLElement | null
  if (overlay && getComputedStyle(overlay).display !== "none") {
    const rect = overlay.getBoundingClientRect()
    if (rect.width >= 1 && rect.height >= 1) {
      const hit = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      )
      if (hit instanceof Element && caseRoot.contains(hit)) return hit
    }
  }

  if (preferredTargetId) {
    const wrap = caseRoot.querySelector(
      `[data-accuracy-target="${preferredTargetId}"]`
    )
    const child = wrap?.firstElementChild
    if (child) return child
  }

  const listed = listCaseTestTargets(caseRoot)
  if (listed[0]) return listed[0].element

  const stage = caseRoot.querySelector("[data-accuracy-stage]")
  if (!stage) return null

  // Prefer real hosts in priority order. A single comma-list is wrong here:
  // querySelector returns the first match in *document* order, so a wrapping
  // Card `<div>` would win over the nested `<button>` (button-inside-card).
  const preferred = [
    "button",
    "a",
    "input",
    "textarea",
    "select",
    "[role='button']",
    "[data-slot='button']",
    "h1",
    "rect",
    "svg",
    "[data-slot='badge']",
    "[data-slot='card'] button",
  ]
  for (const selector of preferred) {
    const hit = stage.querySelector(selector)
    if (hit) return hit
  }

  // Last resort: first element child of the stage (the fixture root).
  return stage.firstElementChild
}
