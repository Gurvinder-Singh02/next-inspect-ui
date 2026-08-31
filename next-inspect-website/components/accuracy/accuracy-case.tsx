"use client"

import { useEffect, useMemo, useState } from "react"

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
import type { AccuracyNode } from "@/components/accuracy/types"
import { cn } from "@/lib/utils"

/**
 * Declares expected NODE TREE for a fixture and live-scores against the
 * Inspect UI overlay when that fixture is under the spotlight with info open.
 *
 * Does not call next-inspect-ui-debug verify/probe APIs — it only reads the
 * public overlay DOM the inspector already paints.
 */
export const AccuracyCase = ({
  id,
  nodes,
  children,
  className,
}: {
  id: string
  nodes: AccuracyNode[]
  children: React.ReactNode
  className?: string
}) => {
  const [report, setReport] = useState<MatchReport | null>(null)
  const [active, setActive] = useState(false)

  const expectedLabel = useMemo(
    () => nodes.map((node) => formatExpectNode(node)),
    [nodes]
  )

  useEffect(() => {
    let frame = 0

    const tick = () => {
      const under = caseIdUnderOverlay()
      const isThis = under === id
      setActive(isThis)

      if (!isThis) {
        frame = window.requestAnimationFrame(tick)
        return
      }

      const found = readOwnerTreeFromOverlay()
      if (found) setReport(scoreNodes(nodes, found))

      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [id, nodes])

  const snapshot = () => {
    const found = readOwnerTreeFromOverlay()
    if (!found) {
      console.info(
        `[accuracy:${id}] open Inspect UI info (I) on this case first`
      )
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
    setReport(scoreNodes(nodes, found))
  }

  return (
    <div
      data-accuracy-case={id}
      className={cn(
        "rounded-xl border border-border p-5",
        active && "ring-1 ring-sky-500/50",
        className
      )}
    >
      {children}

      <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 font-mono text-[12px] leading-relaxed">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div>
              <span className="text-muted-foreground">expected · </span>
              <span>{nodes.length} nodes</span>
            </div>
            <ul className="flex flex-col gap-0.5 text-muted-foreground">
              {expectedLabel.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={snapshot}
            className="h-8 rounded-md border border-border px-2.5 text-[12px] hover:bg-muted"
            title="Copy current Inspect NODE TREE as JSON for this case"
          >
            snapshot
          </button>
        </div>

        {report ? (
          <div className="flex flex-col gap-1.5">
            <div>
              <span className="text-muted-foreground">found · </span>
              <span>{report.foundCount} nodes</span>
            </div>
            <ul className="flex flex-col gap-0.5">
              {report.rows.map((row, index) => (
                <li
                  key={`${row.expect.name}-${index}`}
                  className={row.match ? "text-green-500" : "text-red-500"}
                >
                  {row.found
                    ? formatFoundNode(row.found)
                    : `${formatExpectNode(row.expect)} · missing`}
                </li>
              ))}
            </ul>
            <div
              className={cn(
                "font-medium",
                report.ok ? "text-green-500" : "text-red-500"
              )}
            >
              {report.ok
                ? `100% match · ${report.expectedCount} nodes`
                : `${report.rate}% match · ${report.matched}/${report.expectedCount} nodes`}
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">
            Hover this case with Inspect UI and press I — scores against expected
            automatically.
          </div>
        )}
      </div>
    </div>
  )
}
