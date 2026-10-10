"use client"

import * as React from "react"

export type DesignSystemParams = {
  style: string
  font: string
  fontHeading: string
  iconLibrary: "lucide"
}

const DEFAULT_PARAMS: DesignSystemParams = {
  style: "vega",
  font: "inter",
  fontHeading: "inter",
  iconLibrary: "lucide",
}

export const useDesignSystemSearchParams = () => {
  const [params] = React.useState(DEFAULT_PARAMS)
  const setParams = React.useCallback(
    (_next: Partial<DesignSystemParams>) => {},
    []
  )

  return [params, setParams] as const
}
