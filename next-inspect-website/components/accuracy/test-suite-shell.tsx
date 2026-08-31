"use client"

import { SuiteHeader, type SuiteCaseMeta } from "@/components/accuracy/suite-header"
import { SuiteProvider } from "@/components/accuracy/suite-context"

export const TestSuiteShell = ({
  cases,
  children,
}: {
  cases: SuiteCaseMeta[]
  children: React.ReactNode
}) => (
  <SuiteProvider>
    <main className="min-h-svh bg-background text-foreground">
      <SuiteHeader cases={cases} />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10 pb-24">
        {children}
      </div>
    </main>
  </SuiteProvider>
)
