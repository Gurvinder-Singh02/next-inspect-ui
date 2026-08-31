/** One NODE TREE row — climb parents first, host last (same order as Inspect UI). */
export type AccuracyNode = {
  /** Tag as shown in the tree, without brackets — `button` or `Button`. */
  name: string
  /** Project-relative file, e.g. `components/ui/button.tsx`. */
  file: string
  /** Exact line when it should be pinned; omit to match file only. */
  line?: number
}

export type AccuracyCaseExpected = {
  /** Stable id — also used as `data-accuracy-case`. */
  id: string
  label: string
  /** CSS selector scoped inside the case root. */
  selector: string
  nodes: AccuracyNode[]
}

export type AccuracyRouteExpected = {
  route: string
  cases: AccuracyCaseExpected[]
}

export type FoundNode = {
  name: string
  source: string | null
}
