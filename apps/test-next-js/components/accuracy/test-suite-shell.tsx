"use client";

import { Suspense } from "react";

import { SuiteHeader, type SuiteCaseMeta } from "@/components/accuracy/suite-header";
import { SuiteProvider } from "@/components/accuracy/suite-context";
import type { SuiteSourceFile } from "@/components/accuracy/types";

export const TestSuiteShell = ({
  cases,
  projectRoot,
  sourcesByCase,
  children,
}: {
  cases: SuiteCaseMeta[];
  projectRoot: string;
  sourcesByCase?: Record<string, SuiteSourceFile[]>;
  children: React.ReactNode;
}) => (
  <Suspense
    fallback={
      <main className="min-h-svh bg-background text-foreground">
        <div className="mx-auto w-full max-w-5xl px-6 py-10 font-mono text-[13px] text-muted-foreground">
          Loading suite…
        </div>
      </main>
    }
  >
    <SuiteProvider projectRoot={projectRoot} sourcesByCase={sourcesByCase}>
      <main className="min-h-svh bg-background text-foreground">
        <SuiteHeader cases={cases} />
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-0 px-6 py-10 pb-24">
          {children}
        </div>
      </main>
    </SuiteProvider>
  </Suspense>
);
