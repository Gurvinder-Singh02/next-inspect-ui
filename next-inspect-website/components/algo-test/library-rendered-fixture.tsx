"use client"

import { createElement } from "react"

/**
 * Stands in for framer-motion / recharts: builds host DOM via createElement
 * instead of returning JSX the caller wrote.
 */
export const RendersOwnHost = ({ label }: { label: string }) => {
  const children = [0, 1, 2].map((index) =>
    createElement("rect", {
      key: index,
      x: index * 34,
      y: 4,
      width: 28,
      height: 28,
      rx: 6,
      className: "fill-muted-foreground/30",
    })
  )

  return createElement(
    "svg",
    {
      width: 100,
      height: 36,
      role: "img",
      "aria-label": label,
      className: "overflow-visible",
    },
    children
  )
}
