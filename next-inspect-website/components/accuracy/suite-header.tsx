"use client"

import { useMemo, useState } from "react"

import { useSuite } from "@/components/accuracy/suite-context"
import { cn } from "@/lib/utils"

export type SuiteCaseMeta = {
  id: string
  title: string
  group: string
}

export const SuiteHeader = ({
  cases,
  version = "v0.1.0",
}: {
  cases: SuiteCaseMeta[]
  version?: string
}) => {
  const { states } = useSuite()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const summary = useMemo(() => {
    let pass = 0
    let fail = 0
    let idle = 0
    const failures: SuiteCaseMeta[] = []

    for (const entry of cases) {
      const status = states[entry.id]?.status ?? "idle"
      if (status === "pass") pass += 1
      else if (status === "fail") {
        fail += 1
        failures.push(entry)
      } else idle += 1
    }

    return { pass, fail, idle, total: cases.length, failures }
  }, [cases, states])

  const copyFails = async () => {
    const lines = summary.failures.map((entry) => {
      const detail = states[entry.id]?.detail
      return detail
        ? `${entry.group} / ${entry.title} — ${detail}`
        : `${entry.group} / ${entry.title}`
    })
    const text =
      lines.length > 0
        ? lines.join("\n")
        : "No failing cases yet — hover a case and press I to score."
    await navigator.clipboard?.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
    if (summary.failures.length > 0) setOpen(true)
  }

  const scored = summary.pass + summary.fail

  return (
    <div className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex min-w-0 flex-col items-start gap-1 text-left"
          >
            <div className="flex flex-wrap items-baseline gap-2 font-mono text-[13px]">
              <span>
                {summary.pass}/{summary.total} passed
              </span>
              {summary.fail > 0 ? (
                <span className="text-red-400">· {summary.fail} FAIL</span>
              ) : scored === 0 ? (
                <span className="text-muted-foreground">· unscored</span>
              ) : null}
              <span className="text-muted-foreground">{version}</span>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {summary.idle} idle · hover a case · press I to score
            </div>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex max-w-56 flex-wrap justify-end gap-1" aria-hidden>
              {cases.map((entry) => {
                const status = states[entry.id]?.status ?? "idle"
                return (
                  <span
                    key={entry.id}
                    title={`${entry.title}: ${status}`}
                    className={cn(
                      "size-2 rounded-full",
                      status === "pass" && "bg-emerald-400",
                      status === "fail" && "bg-red-400",
                      status === "idle" && "bg-muted-foreground/25"
                    )}
                  />
                )
              })}
            </div>

            <button
              type="button"
              onClick={copyFails}
              className="rounded-md border border-border px-2.5 py-1.5 font-mono text-[11px] tracking-wide uppercase hover:bg-muted"
            >
              {copied ? "Copied!" : "Copy fails"}
            </button>
          </div>
        </div>

        {open ? (
          <div className="rounded-xl border border-border bg-card/80 p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="font-inter text-[14px] font-medium">
                {summary.fail > 0
                  ? `${summary.fail} issue${summary.fail === 1 ? "" : "s"} found`
                  : scored === 0
                    ? "No scores yet"
                    : "All scored cases passing"}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="font-mono text-[12px] text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {cases.map((entry) => {
                const status = states[entry.id]?.status ?? "idle"
                return (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 font-mono text-[12px]"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn(
                          status === "pass" && "text-emerald-400",
                          status === "fail" && "text-red-400",
                          status === "idle" && "text-muted-foreground"
                        )}
                      >
                        {status === "pass"
                          ? "✓"
                          : status === "fail"
                            ? "✕"
                            : "·"}
                      </span>
                      <span
                        className={cn(
                          "truncate",
                          status === "idle" && "text-muted-foreground"
                        )}
                      >
                        {entry.title}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] tracking-wide text-muted-foreground uppercase">
                      {entry.group}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
