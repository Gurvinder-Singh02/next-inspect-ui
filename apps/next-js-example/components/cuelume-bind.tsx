"use client"

import { useEffect } from "react"
import { bind } from "cuelume"

/** Call `bind()` once so `data-cuelume-*` attributes work app-wide. */
export const CuelumeBind = () => {
  useEffect(() => {
    bind()
  }, [])

  return null
}
