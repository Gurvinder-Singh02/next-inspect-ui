"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { PlayIcon } from "lucide-react"

import {
  inspectWithProbe,
  listCaseTestTargets,
  pickCaseTestTarget,
} from "@/components/accuracy/inspect-probe"
import {
  formatExpectNode,
  formatFoundNode,
  scoreNodes,
  type MatchReport,
} from "@/components/accuracy/match"
import {
  openExpectedNode,
  openFoundNode,
} from "@/components/accuracy/open-source"
import {
  caseIdUnderOverlay,
  formatMapMs,
  targetIdUnderOverlay,
} from "@/components/accuracy/read-overlay"
import { SuiteCaseSource } from "@/components/accuracy/suite-case-source"
import { useSuite } from "@/components/accuracy/suite-context"
import type {
  AccuracyNode,
  AccuracyTarget,
  FoundNode,
  SuiteSourceFile,
} from "@/components/accuracy/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type TargetState = {
  report: MatchReport | null
  found: FoundNode[] | null
  mapMs: number | null
}

const toTargets = (
  nodes: AccuracyNode[] | undefined,
  targets: AccuracyTarget[] | undefined
): AccuracyTarget[] => {
  if (targets?.length) return targets
  if (nodes?.length) return [{ id: "default", label: "Default", nodes }]
  return []
}

/**
 * One suite case — title/desc outside, centered fixture, bottom status bar.
 * Left status expands expected vs result (multi-target aware) and shows map ms.
 */
export const SuiteCase = ({
  id,
  title,
  description,
  nodes,
  targets: targetsProp,
  sources: sourcesProp,
  children,
}: {
  id: string
  title: string
  description: string
  /** Kept for suite meta grouping; not rendered on the card. */
  group: string
  nodes?: AccuracyNode[]
  /** Multi-fixture expected maps — one per hover target. */
  targets?: AccuracyTarget[]
  /** Full source files for the Show source panel (Defined in / Used in). */
  sources?: SuiteSourceFile[]
  children: React.ReactNode
}) => {
  const { setCaseState, registerRunner, unregisterRunner, sourcesByCase } =
    useSuite()
  const sources = sourcesProp ?? sourcesByCase[id]
  const caseRef = useRef<HTMLElement | null>(null)
  const runningRef = useRef(false)
  const targets = useMemo(
    () => toTargets(nodes, targetsProp),
    [nodes, targetsProp]
  )
  const isMulti = (targetsProp?.length ?? 0) > 1

  const [active, setActive] = useState(false)
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null)
  const [openDetail, setOpenDetail] = useState(false)
  const [logsCopied, setLogsCopied] = useState(false)
  const [testing, setTesting] = useState(false)
  const [byTarget, setByTarget] = useState<Record<string, TargetState>>({})
  const [loneState, setLoneState] = useState<TargetState>({
    report: null,
    found: null,
    mapMs: null,
  })

  const publishMultiStatus = useCallback(
    (next: Record<string, TargetState>) => {
      const scored = targets.filter((entry) => entry.nodes?.length)
      const reports = scored.map((entry) => next[entry.id]?.report)
      const allScored = scored.length > 0 && reports.every(Boolean)
      const allPass = allScored && reports.every((r) => r?.ok)
      const anyFail = reports.some((r) => r && !r.ok)
      setCaseState(id, {
        status: allPass ? "pass" : anyFail ? "fail" : "idle",
        detail: allPass
          ? `100% · ${scored.length} targets`
          : anyFail
            ? `${reports.filter((r) => r?.ok).length}/${scored.length}`
            : undefined,
      })
    },
    [id, setCaseState, targets]
  )

  /** Same resolve path as Inspect UI hover — via window.__inspectUI.inspect. */
  const runProbeTest = useCallback(async () => {
    const root = caseRef.current
    if (!root || runningRef.current) return

    runningRef.current = true
    setTesting(true)
    setOpenDetail(true)

    try {
      if (isMulti) {
        const listed = listCaseTestTargets(root)
        if (listed.length === 0) {
          console.info(
            `[accuracy:${id}] no data-accuracy-target fixtures found`
          )
          return
        }

        const next: Record<string, TargetState> = {}
        for (const entry of listed) {
          const t0 = performance.now()
          const result = await inspectWithProbe(entry.element)
          const mapMs = performance.now() - t0
          if (!result?.nodes.length) {
            console.info(
              `[accuracy:${id}] __inspectUI.inspect returned no nodes for ${entry.id}`
            )
            next[entry.id] = { report: null, found: null, mapMs }
            continue
          }

          const target = targets.find((item) => item.id === entry.id)
          const report = target?.nodes?.length
            ? scoreNodes(target.nodes, result.nodes)
            : null
          next[entry.id] = { report, found: result.nodes, mapMs }
        }

        setByTarget(next)
        setActiveTargetId(listed[0]?.id ?? null)
        publishMultiStatus(next)
        return
      }

      const preferred = targetIdUnderOverlay()
      const pick = pickCaseTestTarget(root, preferred)
      if (!pick) {
        console.info(
          `[accuracy:${id}] nothing to inspect — hover a fixture first`
        )
        return
      }

      const t0 = performance.now()
      const result = await inspectWithProbe(pick)
      const mapMs = performance.now() - t0
      if (!result?.nodes.length) {
        console.info(`[accuracy:${id}] __inspectUI.inspect returned no nodes`)
        return
      }

      const expect = targets[0]?.nodes
      const report = expect?.length ? scoreNodes(expect, result.nodes) : null
      setLoneState({ report, found: result.nodes, mapMs })
      if (report) {
        setCaseState(id, {
          status: report.ok ? "pass" : "fail",
          detail: report.ok
            ? `100% · ${report.expectedCount} nodes`
            : `${report.rate}% · ${report.matched}/${report.expectedCount}`,
        })
      }
    } finally {
      runningRef.current = false
      setTesting(false)
    }
  }, [id, isMulti, publishMultiStatus, setCaseState, targets])

  const runProbeTestRef = useRef(runProbeTest)
  runProbeTestRef.current = runProbeTest

  useEffect(() => {
    const run = () => runProbeTestRef.current()
    registerRunner(id, run)
    return () => unregisterRunner(id)
  }, [id, registerRunner, unregisterRunner])

  useEffect(() => {
    let frame = 0

    const tick = () => {
      const under = caseIdUnderOverlay()
      const isThis = under === id
      setActive(isThis)
      if (isThis) setActiveTargetId(targetIdUnderOverlay())
      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [id])

  const activeKey = isMulti
    ? (activeTargetId ?? targets[0]?.id ?? null)
    : "default"
  const live = isMulti ? (activeKey ? byTarget[activeKey] : null) : loneState

  const multiReports = isMulti
    ? targets.filter((t) => t.nodes?.length).map((t) => byTarget[t.id]?.report)
    : []
  const multiAllScored =
    isMulti && multiReports.length > 0 && multiReports.every(Boolean)
  const multiAllPass = multiAllScored && multiReports.every((r) => r?.ok)
  const multiAnyFail = multiReports.some((r) => r && !r.ok)

  const report = isMulti ? (live?.report ?? null) : (live?.report ?? null)
  const totalMapMs = isMulti
    ? targets.reduce((sum, t) => {
        const ms = byTarget[t.id]?.mapMs
        return ms != null ? sum + ms : sum
      }, 0)
    : null
  const mapMsLabel = isMulti
    ? totalMapMs != null && totalMapMs > 0
      ? formatMapMs(totalMapMs)
      : null
    : live?.mapMs != null
      ? formatMapMs(live.mapMs)
      : null

  const status = isMulti
    ? multiAllPass
      ? "pass"
      : multiAnyFail
        ? "fail"
        : "idle"
    : report
      ? report.ok
        ? "pass"
        : "fail"
      : "idle"

  const scoreLabel = isMulti
    ? multiAllPass
      ? "100%"
      : multiAnyFail
        ? `${multiReports.filter((r) => r?.ok).length}/${multiReports.length}`
        : null
    : report?.ok
      ? "100%"
      : report
        ? `${report.matched}/${report.expectedCount}`
        : null

  const nodesPerTarget =
    targets[0]?.nodes?.length ??
    report?.foundCount ??
    report?.expectedCount ??
    null

  const statusLabel =
    status === "pass" ? "Pass" : status === "fail" ? "Fail" : "Idle"

  const toggleLogs = () => {
    setOpenDetail((value) => !value)
  }

  const copyLogs = async () => {
    const lines: string[] = [
      `# ${title}`,
      `id: ${id}`,
      `status: ${statusLabel}`,
      mapMsLabel ? `map: ${mapMsLabel}` : "map: —",
    ]

    if (isMulti) {
      for (const target of targets) {
        const state = byTarget[target.id]
        lines.push("", `## ${target.label} (${target.id})`)
        if (target.nodes?.length) {
          lines.push("expected:")
          for (const node of target.nodes) {
            lines.push(`  ${formatExpectNode(node)}`)
          }
        } else {
          lines.push("expected: (none — edit app/(dev)/test/cases.ts)")
        }
        if (state?.report) {
          lines.push("result:")
          for (const row of state.report.rows) {
            lines.push(
              row.found
                ? `  ${row.match ? "✓" : "✕"} ${formatFoundNode(row.found)}`
                : `  ✕ ${formatExpectNode(row.expect)} · missing`
            )
          }
          if (state.mapMs != null) {
            lines.push(`map: ${formatMapMs(state.mapMs)}`)
          }
        } else if (state?.found?.length) {
          lines.push("result:")
          for (const node of state.found) {
            lines.push(`  ${formatFoundNode(node)}`)
          }
        } else {
          lines.push("result: unscored")
        }
      }
    } else {
      const expect = targets[0]?.nodes
      if (expect?.length) {
        lines.push("", "expected:")
        for (const node of expect) lines.push(`  ${formatExpectNode(node)}`)
      }
      if (report) {
        lines.push("", "result:")
        for (const row of report.rows) {
          lines.push(
            row.found
              ? `  ${row.match ? "✓" : "✕"} ${formatFoundNode(row.found)}`
              : `  ✕ ${formatExpectNode(row.expect)} · missing`
          )
        }
      } else if (loneState.found?.length) {
        lines.push("", "result:")
        for (const node of loneState.found) {
          lines.push(`  ${formatFoundNode(node)}`)
        }
      }
    }

    const text = lines.join("\n")
    await navigator.clipboard?.writeText(text)
    console.info(`[accuracy:${id}] copied logs\n${text}`)
    setLogsCopied(true)
    window.setTimeout(() => setLogsCopied(false), 1200)
  }

  return (
    <section
      ref={caseRef}
      id={id}
      data-accuracy-case={id}
      className="flex scroll-mt-[calc(var(--suite-header-height,4.5rem)+1rem)] flex-col gap-3"
    >
      <div className="flex flex-col gap-1 px-1">
        <h3 className="text-[15px] font-medium tracking-tight">{title}</h3>
        <p className="max-w-[56ch] font-inter text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {sources?.length ? <SuiteCaseSource sources={sources} /> : null}

      <div
        className={cn(
          "overflow-hidden rounded-xl bg-card shadow-[0_0_0_1px_hsl(var(--border)/0.55)]",
          active && "shadow-[0_0_0_1px_rgb(56_189_248_/_0.45)]"
        )}
      >
        <div
          data-accuracy-stage=""
          className="flex min-h-36 items-center justify-center px-6 py-10"
        >
          {children}
        </div>

        <div className="border-t border-border/70">
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {isMulti ? (
                <StatusPill tone="meta">
                  {targets.length} Target{targets.length === 1 ? "" : "s"}
                </StatusPill>
              ) : null}
              <StatusPill tone="meta">
                {nodesPerTarget != null
                  ? `${nodesPerTarget} Nodes`
                  : testing
                    ? "…"
                    : "Visual"}
              </StatusPill>
              <StatusPill
                tone={
                  status === "pass"
                    ? "pass"
                    : status === "fail"
                      ? "fail"
                      : "idle"
                }
              >
                {statusLabel}
              </StatusPill>
              {scoreLabel ? (
                <StatusPill tone={status === "fail" ? "fail" : "pass"}>
                  {scoreLabel}
                </StatusPill>
              ) : null}
              {mapMsLabel ? (
                <StatusPill tone="time">{mapMsLabel}</StatusPill>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={toggleLogs}
                aria-expanded={openDetail}
                className={cn(
                  "inline-flex min-h-8 items-center rounded-md border border-border px-2.5 py-1 font-mono text-[10px] tracking-wide uppercase",
                  "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  openDetail && "bg-muted text-foreground"
                )}
                title="Show expected vs result details"
              >
                Logs
              </button>
              <button
                type="button"
                onClick={() => void runProbeTest()}
                disabled={testing}
                className={cn(
                  "inline-flex min-h-8 items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-mono text-[10px] tracking-wide uppercase",
                  "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  "disabled:pointer-events-none disabled:opacity-50"
                )}
                title="Call window.__inspectUI.inspect — same resolve as hover/info"
              >
                <PlayIcon className="size-2.5 fill-current" aria-hidden />
                {testing ? "Testing…" : "Test"}
              </button>
            </div>
          </div>

          {openDetail ? (
            <div className="border-t border-border/70 px-3 font-mono text-[12px] leading-relaxed">
              {isMulti ? (
                <div className="flex flex-col divide-y divide-border/70">
                  {targets.map((target) => {
                    const state = byTarget[target.id]
                    const isHot = active && activeTargetId === target.id
                    return (
                      <div
                        key={target.id}
                        className={cn("py-3", isHot && "bg-sky-500/5")}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2 px-3">
                          <span className="text-[11px] font-medium tracking-wide text-foreground uppercase">
                            {target.label}
                          </span>
                          <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
                            {state?.report
                              ? state.report.ok
                                ? "Pass"
                                : "Fail"
                              : target.nodes?.length
                                ? "Idle"
                                : "No golden"}
                            {state?.mapMs != null
                              ? ` · ${formatMapMs(state.mapMs)}`
                              : ""}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-border/70">
                          <ExpectedList nodes={target.nodes} />
                          <ResultList state={state} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 divide-x divide-border/70 py-3">
                  <ExpectedList nodes={targets[0]?.nodes} />
                  <ResultList state={loneState} />
                </div>
              )}

              <div className="flex justify-end border-t border-border/60 py-2">
                <button
                  type="button"
                  onClick={copyLogs}
                  className={cn(
                    "inline-flex min-h-8 items-center rounded-md border border-border px-2.5 py-1 font-mono text-[10px] tracking-wide uppercase",
                    "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  )}
                  title="Copy expected + result logs for this case"
                >
                  {logsCopied ? "Copied!" : "Copy logs"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
const StatusPill = ({
  tone,
  children,
}: {
  tone: "meta" | "idle" | "pass" | "fail" | "time"
  children: React.ReactNode
}) => (
  <Badge
    variant={
      tone === "fail"
        ? "destructive"
        : tone === "idle"
          ? "secondary"
          : "outline"
    }
    className={cn(
      "font-mono text-[10px] tracking-wide uppercase",
      tone === "pass" &&
        "border-transparent bg-emerald-500/15 text-emerald-400",
      tone === "time" &&
        "font-variant-numeric text-muted-foreground normal-case tabular-nums"
    )}
  >
    {children}
  </Badge>
)

const SourceRow = ({
  label,
  className,
  onOpen,
}: {
  label: string
  className?: string
  onOpen?: () => void
}) => {
  if (!onOpen) {
    return (
      <span className={cn("inline-block w-max whitespace-nowrap", className)}>
        {label}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      title={`Open ${label}`}
      className={cn(
        "inline-block w-max whitespace-nowrap text-left underline-offset-2 transition-colors hover:underline",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className
      )}
    >
      {label}
    </button>
  )
}

const ListPane = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <div className="min-w-0 px-3">
    <div className="mb-1.5 text-[10px] tracking-wide text-muted-foreground uppercase">
      {title}
    </div>
    <div className="scrollbar-none max-h-36 overflow-auto">{children}</div>
  </div>
)

const ExpectedList = ({ nodes }: { nodes?: AccuracyNode[] }) => {
  const { projectRoot } = useSuite()

  return (
    <ListPane title={`Expected${nodes?.length ? ` · ${nodes.length}` : ""}`}>
      {nodes?.length ? (
        <ul className="flex flex-col gap-1 text-muted-foreground">
          {nodes.map((node, index) => (
            <li key={`${node.name}-${node.file}-${index}`}>
              <SourceRow
                label={formatExpectNode(node)}
                onOpen={() => openExpectedNode(projectRoot, node)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="whitespace-nowrap text-muted-foreground/70">
          No golden yet — add nodes in cases.ts
        </p>
      )}
    </ListPane>
  )
}

const ResultList = ({ state }: { state?: TargetState | null }) => {
  const { projectRoot } = useSuite()

  return (
    <ListPane
      title={`Result${state?.report ? ` · ${state.report.foundCount}` : ""}`}
    >
      {state?.report ? (
        <ul className="flex flex-col gap-1">
          {state.report.rows.map((row, index) => {
            const found = row.found
            if (found) {
              return (
                <li key={`${row.expect.name}-${index}`}>
                  <SourceRow
                    label={formatFoundNode(found)}
                    onOpen={
                      found.source
                        ? () => openFoundNode(projectRoot, found)
                        : undefined
                    }
                    className={row.match ? "text-emerald-400" : "text-red-400"}
                  />
                </li>
              )
            }

            return (
              <li key={`${row.expect.name}-${index}`}>
                <SourceRow
                  label={`${formatExpectNode(row.expect)} · missing`}
                  onOpen={() => openExpectedNode(projectRoot, row.expect)}
                  className="text-red-400"
                />
              </li>
            )
          })}
        </ul>
      ) : state?.found?.length ? (
        <ul className="flex flex-col gap-1 text-muted-foreground">
          {state.found.map((node: FoundNode, index: number) => (
            <li key={`${node.name}-${index}`}>
              <SourceRow
                label={formatFoundNode(node)}
                onOpen={
                  node.source
                    ? () => openFoundNode(projectRoot, node)
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="whitespace-nowrap text-muted-foreground/70">
          Hover this target and press I to score.
        </p>
      )}
    </ListPane>
  )
}
