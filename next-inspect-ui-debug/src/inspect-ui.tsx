"use client"

import { Suspense, createElement, lazy, type ComponentType } from "react"

export type InspectUIProps = {
  projectRoot: string
  debug?: boolean
  verify?: boolean
}

const LazyDebugInspector =
  process.env.NODE_ENV === "development"
    ? lazy(() =>
        import("./debug-inspector").then((module) => ({
          default: module.InspectUI as ComponentType<InspectUIProps>,
        }))
      )
    : null

export const InspectUI = (props: InspectUIProps) => {
  if (!LazyDebugInspector) return null
  return createElement(
    Suspense,
    { fallback: null },
    createElement(LazyDebugInspector, props)
  )
}
