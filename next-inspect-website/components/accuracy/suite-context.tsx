"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type SuiteCaseStatus = "idle" | "pass" | "fail"

type SuiteCaseState = {
  status: SuiteCaseStatus
  detail?: string
}

type SuiteContextValue = {
  states: Record<string, SuiteCaseState>
  setCaseState: (id: string, state: SuiteCaseState) => void
  reset: () => void
}

const SuiteContext = createContext<SuiteContextValue | null>(null)

export const SuiteProvider = ({ children }: { children: ReactNode }) => {
  const [states, setStates] = useState<Record<string, SuiteCaseState>>({})

  const setCaseState = useCallback((id: string, state: SuiteCaseState) => {
    setStates((prev) => {
      const current = prev[id]
      if (
        current?.status === state.status &&
        current?.detail === state.detail
      ) {
        return prev
      }
      return { ...prev, [id]: state }
    })
  }, [])

  const reset = useCallback(() => setStates({}), [])

  const value = useMemo(
    () => ({ states, setCaseState, reset }),
    [states, setCaseState, reset]
  )

  return (
    <SuiteContext.Provider value={value}>{children}</SuiteContext.Provider>
  )
}

export const useSuite = () => {
  const ctx = useContext(SuiteContext)
  if (!ctx) throw new Error("useSuite must be used within SuiteProvider")
  return ctx
}
