"use client"

import { Suspense } from "react"

import {
  SuiteHeader,
  type SuiteCaseMeta,
} from "@/components/accuracy/suite-header"
import { SuiteProvider } from "@/components/accuracy/suite-context"
import type { SuiteSourceFile } from "@/components/accuracy/types"

export const TestSuiteShell = ({
  cases,
  projectRoot,
  sourcesByCase,
  children,
}: {
  cases: SuiteCaseMeta[]
  projectRoot: string
  sourcesByCase?: Record<string, SuiteSourceFile[]>
  children: React.ReactNode
}) => (
  <Suspense
    fallback={
      <main className="bg-background text-foreground min-h-svh">
        <div className="text-muted-foreground mx-auto w-full max-w-5xl px-6 py-10 font-mono text-[13px]">
          Loading suite…
        </div>
      </main>
    }
  >
    <SuiteProvider projectRoot={projectRoot} sourcesByCase={sourcesByCase}>
      <main className="bg-background text-foreground min-h-svh">
        <SuiteHeader cases={cases} />
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-0 px-6 py-10 pb-24">
          {children}
        </div>
      </main>
    </SuiteProvider>
  </Suspense>
)
