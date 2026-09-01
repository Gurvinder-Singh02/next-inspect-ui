"use client"

import { Suspense, createElement, lazy, type ComponentType } from "react"

export type InspectUIProps = {
  projectRoot: string
}

const LazyDevInspector =
  process.env.NODE_ENV === "development"
    ? lazy(() =>
        import("./inspector").then((module) => ({
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
