"use client"

import { useEffect, useMemo, useState } from "react"
import { EyeIcon } from "lucide-react"

import {
  formatExpectNode,
  formatFoundNode,
  scoreNodes,
  type MatchReport,
} from "@/components/accuracy/match"
import {
  caseIdUnderOverlay,
  readOwnerTreeFromOverlay,
} from "@/components/accuracy/read-overlay"
import { useSuite } from "@/components/accuracy/suite-context"
import type { AccuracyNode } from "@/components/accuracy/types"
import { cn } from "@/lib/utils"

/**
 * One suite section — description, fixture stage, status chips.
 * Snapshot stays; live-scores by reading the Inspect overlay NODE TREE.
 */
export const SuiteCase = ({
  id,
  title,
  description,
  group,
  nodes,
  children,
}: {
  id: string
  title: string
  description: string
  group: string
  nodes?: AccuracyNode[]
  children: React.ReactNode
}) => {
  const { setCaseState } = useSuite()
  const [report, setReport] = useState<MatchReport | null>(null)
  const [active, setActive] = useState(false)
  const [showExpected, setShowExpected] = useState(false)

  const expectedLabel = useMemo(
    () => (nodes ? nodes.map((node) => formatExpectNode(node)) : []),
    [nodes]
  )

  useEffect(() => {
    let frame = 0

    const tick = () => {
      const under = caseIdUnderOverlay()
      const isThis = under === id
      setActive(isThis)

      if (isThis && nodes?.length) {
        const found = readOwnerTreeFromOverlay()
        if (found) {
          const next = scoreNodes(nodes, found)
          setReport(next)
          setCaseState(id, {
            status: next.ok ? "pass" : "fail",
            detail: next.ok
              ? `100% · ${next.expectedCount} nodes`
              : `${next.rate}% · ${next.matched}/${next.expectedCount}`,
          })
        }
      }

      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [id, nodes, setCaseState])

  const snapshot = () => {
    const found = readOwnerTreeFromOverlay()
    if (!found) {
      console.info(`[accuracy:${id}] open Inspect UI info (I) on this case first`)
      return
    }

    const payload = {
      id,
      nodes: found.map((node) => {
        const source = node.source ?? ""
        const lastColon = source.lastIndexOf(":")
        const line =
          lastColon > 0 ? Number(source.slice(lastColon + 1)) : undefined
        const file =
          lastColon > 0 && Number.isFinite(line)
            ? source.slice(0, lastColon)
            : source
        return {
          name: node.name,
          file,
          ...(Number.isFinite(line) ? { line } : {}),
        }
      }),
    }

    const text = JSON.stringify(payload, null, 2)
    void navigator.clipboard?.writeText(text)
    console.info(`[accuracy:${id}] copied expected snapshot\n${text}`)
    if (nodes?.length) setReport(scoreNodes(nodes, found))
  }

  const status = report ? (report.ok ? "pass" : "fail") : "idle"

  return (
    <section
      id={id}
      data-accuracy-case={id}
      className={cn(
        "flex flex-col gap-6 rounded-2xl border border-border/80 bg-card/30 px-5 py-6 sm:px-8 sm:py-8",
        active && "ring-1 ring-sky-500/40"
      )}
    >
      <p className="mx-auto max-w-[54ch] text-center font-inter text-[14px] leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div className="flex min-h-28 items-center justify-center py-4">
        {children}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] tracking-wide uppercase">
          {status === "pass" ? (
            <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-emerald-400">
              Pass
            </span>
          ) : status === "fail" ? (
            <span className="rounded-md bg-red-500/15 px-2 py-1 text-red-400">
              Fail
            </span>
          ) : (
            <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
              Idle
            </span>
          )}

          {nodes?.length ? (
            <span className="rounded-md border border-border px-2 py-1 text-muted-foreground">
              {nodes.length}N
            </span>
          ) : (
            <span className="rounded-md border border-border px-2 py-1 text-muted-foreground">
              Visual
            </span>
          )}

          {report ? (
            <span
              className={cn(
                "rounded-md border px-2 py-1",
                report.ok
                  ? "border-emerald-500/30 text-emerald-400"
                  : "border-red-500/30 text-red-400"
              )}
            >
              {report.ok
                ? `100% · ${report.expectedCount} nodes`
                : `${report.rate}% · ${report.matched}/${report.expectedCount}`}
            </span>
          ) : null}

          <span className="text-muted-foreground/70">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            {group}
          </span>
          <button
            type="button"
            onClick={snapshot}
            className="rounded-md border border-border px-2 py-1 font-mono text-[10px] tracking-wide uppercase hover:bg-muted"
            title="Copy current Inspect NODE TREE as JSON"
          >
            Snapshot
          </button>
          {nodes?.length ? (
            <button
              type="button"
              onClick={() => setShowExpected((value) => !value)}
              className="inline-flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={showExpected ? "Hide expected" : "Show expected"}
            >
              <EyeIcon className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {showExpected && nodes?.length ? (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 font-mono text-[12px] leading-relaxed">
          <div className="mb-1 text-muted-foreground">
            expected · {nodes.length} nodes
          </div>
          <ul className="flex flex-col gap-0.5 text-muted-foreground">
            {expectedLabel.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {report ? (
            <ul className="mt-2 flex flex-col gap-0.5 border-t border-border pt-2">
              {report.rows.map((row, index) => (
                <li
                  key={`${row.expect.name}-${index}`}
                  className={row.match ? "text-emerald-400" : "text-red-400"}
                >
                  {row.found
                    ? formatFoundNode(row.found)
                    : `${formatExpectNode(row.expect)} · missing`}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
