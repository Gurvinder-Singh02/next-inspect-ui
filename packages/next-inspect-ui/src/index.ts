"use client"

import { Suspense, createElement, lazy, type ComponentType } from "react"

import type { InspectUIProps } from "./lib/index.ts"

export type {
  DevSpotlightProps,
  InspectUIProps,
  InspectorIde,
  TooltipProps,
} from "./lib/index.ts"

const LazyDevInspector =
  process.env.NODE_ENV === "development"
    ? lazy(() =>
        import("./inspector.tsx").then((module) => ({
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
