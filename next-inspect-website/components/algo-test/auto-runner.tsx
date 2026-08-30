"use client"

import { useCallback, useEffect, useState } from "react"

type Verdict = {
  status: "match" | "mismatch" | "unscored" | "no-fiber"
  expected?: string
  runtime?: string | null
  reason?: string
}

type Row = Verdict & { tag: string; index: number }

/**
 * Scores every stamped element on the page automatically.
 *
 * The manual routes still matter for feel, but a page that only passes when
 * someone remembers to hover it is not a regression test. This walks the whole
 * fixture set through the same check the debug panel runs, so a break shows up
 * as a red row instead of going unnoticed.
 *
 * Depends on `window.__inspectUIVerify`, published by InspectUI only while the
 * `verify` prop is set.
 */
export const AutoRunner = () => {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [running, setRunning] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const check = () =>
      setReady(
        typeof (window as unknown as Record<string, unknown>)
          .__inspectUIVerify === "function"
      )
    check()
    const id = window.setInterval(check, 500)
    return () => window.clearInterval(id)
  }, [])

  const run = useCallback(async () => {
    const verify = (
      window as unknown as {
        __inspectUIVerify?: (el: Element) => Promise<Verdict>
      }
    ).__inspectUIVerify
    if (!verify) return

    setRunning(true)
    const elements = Array.from(
      document.querySelectorAll("[data-inspect-host]")
    ).filter((el) => !el.closest("[data-algo-runner]"))

    const results: Row[] = []
    for (const [index, el] of elements.entries()) {
      const verdict = await verify(el)
      results.push({ ...verdict, tag: el.tagName.toLowerCase(), index })
    }

    setRows(results)
    setRunning(false)
  }, [])

  const scored = rows?.filter((r) => r.status !== "unscored" && r.status !== "no-fiber") ?? []
  const matched = scored.filter((r) => r.status === "match").length
  const failures = rows?.filter((r) => r.status === "mismatch") ?? []

  return (
    <div
      data-algo-runner=""
      className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-inter text-[15px] font-medium">
            Automated check
          </span>
          <span className="font-inter text-[13px] text-muted-foreground">
            {ready
              ? "Scores every stamped element against the compiler's record."
              : "Waiting for InspectUI — needs the verify prop and withInspectUI()."}
          </span>
        </div>

        <button
          type="button"
          onClick={run}
          disabled={!ready || running}
          className="rounded-md border border-border px-3 py-1.5 font-mono text-[13px] disabled:opacity-40"
        >
          {running ? "running…" : "run"}
        </button>
      </div>

      {rows ? (
        <div className="flex flex-col gap-3">
          <div
            className={`font-mono text-[13px] ${
              failures.length ? "text-red-500" : "text-green-500"
            }`}
          >
            {matched}/{scored.length} matched
            {rows.length - scored.length > 0
              ? ` · ${rows.length - scored.length} unscored`
              : ""}
          </div>

          {failures.length > 0 && (
            <ul className="flex flex-col gap-2">
              {failures.map((row) => (
                <li
                  key={row.index}
                  className="overflow-x-auto rounded-md border border-red-500/40 bg-red-500/5 px-3 py-2 font-mono text-[12px] whitespace-nowrap"
                >
                  <span className="text-muted-foreground">
                    &lt;{row.tag}&gt;{" "}
                  </span>
                  <span className="text-red-500">
                    {row.runtime ?? "no answer"}
                  </span>
                  <span className="text-muted-foreground"> ≠ </span>
                  <span>{row.expected}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
