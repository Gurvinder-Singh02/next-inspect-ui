"use client"

import { Suspense, createElement, lazy, type ComponentType } from "react"

export type InspectUIProps = {
  /** Absolute path your source is under — see the README for exact mode. */
  projectRoot: string
  /** Keep the bottom-left event log open for the session. Default: `false`. */
  debug?: boolean
  /**
   * Score the runtime resolver against the build-time stamps and paint the
   * hover outline green on agreement, red on disagreement. Maintainer
   * harness, off by default; requires `next-inspect-ui-trace` in `next.config`.
   */
  verify?: boolean
}

/**
 * The overlay is ~50 KB gzipped, and a `"use client"` module keeps every
 * export in the client bundle even when the consumer's own NODE_ENV guard
 * makes the JSX unreachable. Loading it through a development-only dynamic
 * import means production builds ship this shim (a few hundred bytes that
 * render null) and never create, let alone download, the overlay chunk.
 */
const LazyDevInspector =
  process.env.NODE_ENV === "development"
    ? lazy(() =>
        import("./dev-inspector").then((module) => ({
          default: module.InspectUI as ComponentType<InspectUIProps>,
        }))
      )
    : null

export const InspectUI = (props: InspectUIProps) => {
  if (!LazyDevInspector) return null
  return createElement(
    Suspense,
    { fallback: null },
    createElement(LazyDevInspector, props)
  )
}
