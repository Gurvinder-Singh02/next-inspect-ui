/** One NODE TREE row — climb parents first, host last (same order as Inspect UI). */
export type AccuracyNode = {
  /** Tag as shown in the tree, without brackets — `button` or `Button`. */
  name: string
  /** Project-relative file, e.g. `components/ui/button.tsx`. */
  file: string
  /** Exact line when it should be pinned; omit to match file only. */
  line?: number
}

/** One hover target inside a multi-fixture case (e.g. Default / Secondary badge). */
export type AccuracyTarget = {
  /** Stable key — also used as `data-accuracy-target`. */
  id: string
  label: string
  nodes?: AccuracyNode[]
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

/** One short example shown in the case “Show source” panel. */
export type SuiteSourceFile = {
  /** e.g. `Defined in` / `Used in` */
  label: string
  /** Project-relative path (for the title only) */
  file: string
  /** Short example snippet */
  code: string
  /** Shiki HTML for the colored code block */
  html: string
}
