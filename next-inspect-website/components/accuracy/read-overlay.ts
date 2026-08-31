import type { FoundNode } from "./types"

const stripTag = (raw: string) =>
  raw.replace(/^</, "").replace(/\/>$/, "").replace(/>$/, "").trim()

/**
 * Read the Inspect UI info panel NODE TREE.
 * Public overlay only — no debug verify / probe APIs.
 */
export const readOwnerTreeFromOverlay = (): FoundNode[] | null => {
  const section = document.querySelector("[data-dev-inspector-owner-tree]")
  if (!section) return null

  // section > heading + treeRoot; rows live in the last child.
  const treeRoot = section.querySelector(":scope > div:last-child")
  if (!treeRoot) return null

  const found: FoundNode[] = []
  for (const row of Array.from(treeRoot.children)) {
    if (!(row instanceof HTMLElement)) continue

    let name: string | null = null
    for (const span of row.querySelectorAll("span")) {
      const text = (span.textContent || "").trim()
      if (text.startsWith("<") && text.includes(">")) {
        name = stripTag(text)
        break
      }
    }

    const pathBtn = Array.from(row.querySelectorAll("button")).find((button) => {
      const label = (button.getAttribute("title") || button.textContent || "").trim()
      return (
        label.includes(".tsx") ||
        label.includes(".ts") ||
        label.includes(".jsx") ||
        label.includes(".js") ||
        label === "…"
      )
    })

    const sourceRaw =
      pathBtn?.getAttribute("title")?.trim() ||
      (pathBtn?.textContent || "").trim() ||
      null
    const source = sourceRaw === "…" ? null : sourceRaw

    if (name) found.push({ name, source })
  }

  return found.length > 0 ? found : null
}

/** Which accuracy case (if any) is under the Inspect overlay spotlight. */
export const caseIdUnderOverlay = (): string | null => {
  const overlay = document.querySelector(
    "[data-dev-inspector-overlay]"
  ) as HTMLElement | null
  if (!overlay) return null
  if (getComputedStyle(overlay).display === "none") return null

  const rect = overlay.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return null

  const el = document.elementFromPoint(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2
  )
  const root = el?.closest("[data-accuracy-case]") as HTMLElement | null
  return root?.getAttribute("data-accuracy-case") ?? null
}
