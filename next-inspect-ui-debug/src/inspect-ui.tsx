"use client"

import { useLayoutEffect } from "react"
import { InspectUI as InspectUIRuntime } from "next-inspect-ui"
import { setInspectDebugFlags } from "next-inspect-ui/lib"

export type InspectUIProps = {
  projectRoot: string
  debug?: boolean
  verify?: boolean
}

export const InspectUI = ({
  projectRoot,
  debug = false,
  verify = false,
}: InspectUIProps) => {
  setInspectDebugFlags({ debug, verify })

  useLayoutEffect(() => {
    setInspectDebugFlags({ debug, verify })
    return () => setInspectDebugFlags({ debug: false, verify: false })
  }, [debug, verify])

  return <InspectUIRuntime projectRoot={projectRoot} />
}
