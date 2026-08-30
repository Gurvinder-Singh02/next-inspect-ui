"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  ListOrdered,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react"

import {
  findChildInspectable,
  findEdgeSiblingInspectable,
  findParentInspectable,
  findSiblingInspectable,
  formatShortcutFromEvent,
  formatShortcutParts,
  matchesInspectorShortcut,
  formatTooltipLabel,
  getOverlayPaint,
  getTooltipPosition,
  DEFAULT_INSPECTOR_SETTINGS,
  DEFAULT_TOOLTIP_PROPS,
} from "next-inspect-ui"
import { cn } from "@/lib/utils"

import { OptionChainFixture } from "./option-chain-fixture"
import {
  TEST_CASES,
  type CheckResult,
  type PreviewSpec,
  type Rect,
  type TestCase,
  type TestOutcome,
} from "./test-cases"

// A run slower than this (averaged) is flagged as a perf regression.
const PERF_BUDGET_MS = 0.15
// Iterations used to average out timer noise for each suite.
const PERF_SAMPLES = 500

type RunState = { outcome: TestOutcome; durationMs: number }

const runOnce = (run: () => TestOutcome): RunState => {
  const start = performance.now()
  let outcome = run()
  for (let i = 1; i < PERF_SAMPLES; i += 1) outcome = run()
  return { outcome, durationMs: (performance.now() - start) / PERF_SAMPLES }
}

const fmtMs = (ms: number) => {
  if (ms < 0.001) return "<0.001ms"
  if (ms < 1) return `${ms.toFixed(3)}ms`
  return `${ms.toFixed(2)}ms`
}

const statusOf = (state?: RunState) =>
  !state
    ? "idle"
    : !state.outcome.pass
      ? "fail"
      : state.durationMs > PERF_BUDGET_MS
        ? "perf"
        : "pass"

const suiteAnchorId = (testId: string) => `suite-${testId}`

const formatSuiteError = (test: TestCase, state: RunState) => {
  const failed = state.outcome.checks.filter((c) => !c.pass)
  const head = `✗ ${test.name} (${fmtMs(state.durationMs)})`
  if (failed.length === 0) {
    return `${head}\n    (perf: ${fmtMs(state.durationMs)} > ${PERF_BUDGET_MS}ms budget)`
  }
  return [
    head,
    ...failed.map(
      (c) => `    ✗ ${c.label}\n      want: ${c.expected}\n      got:  ${c.actual}`
    ),
  ].join("\n")
}

const formatCheckError = (suiteName: string, check: CheckResult) =>
  `✗ ${suiteName} · ${check.label}\n  want: ${check.expected}\n  got:  ${check.actual}`

const scrollToSuite = (
  testId: string,
  tone: "fail" | "run" = "fail"
) => {
  const el = document.getElementById(suiteAnchorId(testId))
  if (!el) return
  el.scrollIntoView({ behavior: "smooth", block: "start" })
  const ring =
    tone === "run" ? "ring-2 ring-sky-500/50" : "ring-2 ring-red-500/50"
  for (const cls of ring.split(" ")) el.classList.add(cls)
  window.setTimeout(() => {
    for (const cls of ring.split(" ")) el.classList.remove(cls)
  }, 900)
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function InspectorTestRunner() {
  const [results, setResults] = useState<Record<string, RunState>>({})
  // Remembered per-suite check counts; survives a reset so totals stay accurate.
  const [checkCounts, setCheckCounts] = useState<Record<string, number>>({})
  const [running, setRunning] = useState(false)
  const [activeSuiteId, setActiveSuiteId] = useState<string | null>(null)
  const [seqIndex, setSeqIndex] = useState(0)
  const [showIssues, setShowIssues] = useState(true)
  const seqTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const record = useCallback((test: TestCase, state: RunState) => {
    setResults((prev) => ({ ...prev, [test.id]: state }))
    setCheckCounts((prev) => ({
      ...prev,
      [test.id]: state.outcome.checks.length,
    }))
  }, [])

  const runAll = useCallback(() => {
    if (seqTimer.current) clearTimeout(seqTimer.current)
    setRunning(true)
    setActiveSuiteId(null)
    setSeqIndex(0)
    const next: Record<string, RunState> = {}
    const counts: Record<string, number> = {}
    for (const test of TEST_CASES) {
      const state = runOnce(test.run)
      next[test.id] = state
      counts[test.id] = state.outcome.checks.length
    }
    setResults(next)
    setCheckCounts((prev) => ({ ...prev, ...counts }))
    setRunning(false)
  }, [])

  const runSeq = useCallback(() => {
    if (seqTimer.current) clearTimeout(seqTimer.current)
    setRunning(true)
    setResults({})
    setActiveSuiteId(null)
    setSeqIndex(0)
    let index = 0

    const step = () => {
      if (index >= TEST_CASES.length) {
        setRunning(false)
        setActiveSuiteId(null)
        setSeqIndex(TEST_CASES.length)
        return
      }

      const test = TEST_CASES[index]
      setSeqIndex(index + 1)
      setActiveSuiteId(test.id)
      scrollToSuite(test.id, "run")

      // Let the “running” paint + scroll land before the heavy runOnce work.
      seqTimer.current = setTimeout(() => {
        record(test, runOnce(test.run))
        index += 1
        seqTimer.current = setTimeout(step, 280)
      }, 60)
    }

    step()
  }, [record])

  const runOne = useCallback(
    (test: TestCase) => {
      if (running) return
      setActiveSuiteId(test.id)
      scrollToSuite(test.id, "run")
      // Defer so the card can show running state before sync work blocks.
      window.requestAnimationFrame(() => {
        record(test, runOnce(test.run))
        setActiveSuiteId(null)
      })
    },
    [record, running]
  )

  const reset = useCallback(() => {
    if (seqTimer.current) clearTimeout(seqTimer.current)
    setResults({})
    setRunning(false)
    setActiveSuiteId(null)
    setSeqIndex(0)
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(() => runAll())
    return () => {
      cancelAnimationFrame(frame)
      if (seqTimer.current) clearTimeout(seqTimer.current)
    }
  }, [runAll])

  const perfCount = TEST_CASES.filter(
    (t) => statusOf(results[t.id]) === "perf"
  ).length
  const failCount = TEST_CASES.filter(
    (t) => statusOf(results[t.id]) === "fail"
  ).length
  const issueCount = failCount + perfCount
  const activeTest = activeSuiteId
    ? TEST_CASES.find((t) => t.id === activeSuiteId)
    : null

  return (
    <div className="flex w-full flex-col gap-4">
      <SummaryBar
        perfCount={perfCount}
        results={results}
        checkCounts={checkCounts}
      />

      {showIssues && (
        <OverviewPanel
          results={results}
          checkCounts={checkCounts}
          issueCount={issueCount}
          running={running}
          activeSuiteId={activeSuiteId}
          onRun={runOne}
          onClose={() => setShowIssues(false)}
        />
      )}

      <div
        className={cn(
          "sticky top-20 z-20 -mx-1 flex flex-wrap items-center gap-2  px-1 py-2 ",
          running && "border-sky-500/20"
        )}
      >
        <ToolbarButton onClick={runAll} disabled={running} primary>
          <Play className="size-3" /> Run all
        </ToolbarButton>
        <ToolbarButton onClick={runSeq} disabled={running}>
          <ListOrdered className="size-3" /> Run seq
        </ToolbarButton>
        <ToolbarButton onClick={reset} disabled={running}>
          <RotateCcw className="size-3" /> Reset
        </ToolbarButton>
        {!showIssues && (
          <ToolbarButton onClick={() => setShowIssues(true)} disabled={running}>
            Show overview
          </ToolbarButton>
        )}
        {running && activeTest ? (
          <span className="ml-1 inline-flex items-center gap-1.5 font-mono text-[11px] text-sky-500">
            <Loader2 className="size-3 animate-spin" />
            {seqIndex}/{TEST_CASES.length} · {activeTest.name}…
          </span>
        ) : null}
      </div>

      <div className="grid gap-3">
        {TEST_CASES.map((test) => (
          <TestCard
            key={test.id}
            test={test}
            state={results[test.id]}
            isRunning={activeSuiteId === test.id}
            disabled={running}
            onRun={() => runOne(test)}
          />
        ))}
      </div>

      <OptionChainFixture />
      <NavSandbox />
      <Sandbox />
    </div>
  )
}

function SummaryBar({
  perfCount,
  results,
  checkCounts,
}: {
  perfCount: number
  results: Record<string, RunState>
  checkCounts: Record<string, number>
}) {
  const [copied, setCopied] = useState<"all" | "fails" | null>(null)

  const evaluated = TEST_CASES.filter((t) => results[t.id])
  const totalChecks = TEST_CASES.reduce(
    (sum, t) => sum + (checkCounts[t.id] ?? 0),
    0
  )
  const passedChecks = evaluated.reduce(
    (sum, t) => sum + results[t.id].outcome.checks.filter((c) => c.pass).length,
    0
  )
  const avgMs =
    evaluated.length > 0
      ? evaluated.reduce((sum, t) => sum + results[t.id].durationMs, 0) /
        evaluated.length
      : 0

  // Idle → gray · all checks pass → green · otherwise → red
  const scoreTone =
    evaluated.length === 0
      ? "text-muted-foreground"
      : passedChecks === totalChecks
        ? "text-emerald-500"
        : "text-red-500"

  const copy = async (which: "all" | "fails") => {
    const lines = TEST_CASES.filter((t) => results[t.id])
      .filter((t) => {
        if (which === "all") return true
        const status = statusOf(results[t.id])
        return status === "fail" || status === "perf"
      })
      .map((t) => {
        const r = results[t.id]
        if (!r.outcome.pass || r.durationMs > PERF_BUDGET_MS) {
          return formatSuiteError(t, r)
        }
        return `✓ ${t.name} (${fmtMs(r.durationMs)})`
      })
    const ok = await copyText(lines.join("\n\n") || "No results yet")
    if (!ok) return
    setCopied(which)
    window.setTimeout(() => setCopied(null), 1200)
  }

  return (
    <div className="sticky top-0 z-20 -mx-6 flex items-end justify-between border-b border-border/60 bg-background/80 px-6 py-3 backdrop-blur">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2.5">
            <span
              className={cn(
                "font-mono text-2xl font-semibold tracking-tight",
                scoreTone
              )}
            >
              {passedChecks}/{totalChecks}
            </span>
            {perfCount > 0 && (
              <span className="font-mono text-[11px] font-semibold text-red-500">
                · {perfCount} PERF
              </span>
            )}
            <span className="font-mono text-[11px] text-muted-foreground">
              v0.1.1
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="font-mono text-xs text-muted-foreground">
            <span className={scoreTone}>{TEST_CASES.length}</span> suites ·{" "}
            <span className={scoreTone}>{totalChecks}</span> checks ·{" "}
            <span className={scoreTone}>{fmtMs(avgMs)}</span> avg
          </p>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <button
              onClick={() => copy("fails")}
              className="flex items-center gap-1 tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              {copied === "fails" ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
              Copy fails
            </button>
            <button
              onClick={() => copy("all")}
              className="flex items-center gap-1 tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              {copied === "all" ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
              Copy all
            </button>
          </div>
        </div>
      </div>
      <DotGrid results={results} checkCounts={checkCounts} />
    </div>
  )
}

function DotGrid({
  results,
  checkCounts,
}: {
  results: Record<string, RunState>
  checkCounts: Record<string, number>
}) {
  // One dot per individual check across all suites; falls back to remembered
  // counts (idle dots) when results have been cleared.
  const dots: {
    key: string
    testId: string
    title: string
    status: string
  }[] = []
  for (const test of TEST_CASES) {
    const state = results[test.id]
    if (!state) {
      const count = checkCounts[test.id] ?? 0
      for (let i = 0; i < count; i += 1) {
        dots.push({
          key: `${test.id}-${i}`,
          testId: test.id,
          title: test.name,
          status: "idle",
        })
      }
      continue
    }
    const perf = state.durationMs > PERF_BUDGET_MS
    state.outcome.checks.forEach((check, i) => {
      dots.push({
        key: `${test.id}-${i}`,
        testId: test.id,
        title: `${test.name} · ${check.label}`,
        status: !check.pass ? "fail" : perf ? "perf" : "pass",
      })
    })
  }

  return (
    <div className="grid max-w-[220px] grid-flow-row grid-cols-18 justify-items-end gap-1">
      {dots.map((dot) => (
        <button
          key={dot.key}
          type="button"
          title={dot.title}
          aria-label={`Go to ${dot.title}`}
          onClick={() => scrollToSuite(dot.testId)}
          className={cn(
            "size-2 rounded-full transition-colors",
            dot.status === "idle" && "bg-muted3",
            dot.status === "pass" && "bg-emerald-500",
            dot.status === "perf" && "bg-amber-500 hover:ring-2 hover:ring-amber-500/40",
            dot.status === "fail" && "bg-red-500 hover:ring-2 hover:ring-red-500/40"
          )}
        />
      ))}
    </div>
  )
}

function OverviewPanel({
  results,
  checkCounts,
  issueCount,
  running,
  activeSuiteId,
  onRun,
  onClose,
}: {
  results: Record<string, RunState>
  checkCounts: Record<string, number>
  issueCount: number
  running: boolean
  activeSuiteId: string | null
  onRun: (test: TestCase) => void
  onClose: () => void
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const evaluated = TEST_CASES.filter((t) => results[t.id])
  const totalChecks = TEST_CASES.reduce(
    (sum, t) => sum + (checkCounts[t.id] ?? 0),
    0
  )
  const passedChecks = evaluated.reduce(
    (sum, t) => sum + results[t.id].outcome.checks.filter((c) => c.pass).length,
    0
  )

  const copySuite = async (test: TestCase, state: RunState) => {
    const ok = await copyText(formatSuiteError(test, state))
    if (!ok) return
    setCopiedId(test.id)
    window.setTimeout(() => setCopiedId(null), 1200)
  }

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[12px] font-medium">
          {issueCount > 0 ? (
            <span className="text-red-500">
              {issueCount} issue{issueCount === 1 ? "" : "s"} found
            </span>
          ) : evaluated.length === 0 ? (
            <span>Overview · not run</span>
          ) : (
            <span>Overview · all suites passing</span>
          )}
          <span className="ml-2 text-muted-foreground">
            {passedChecks}/{totalChecks} checks
          </span>
        </span>
        <button
          onClick={onClose}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Hide overview"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {[...TEST_CASES]
          .sort((a, b) => {
            const rank = (id: string) => {
              const s = statusOf(results[id])
              if (s === "fail") return 0
              if (s === "perf") return 1
              if (s === "idle") return 2
              return 3
            }
            return rank(a.id) - rank(b.id)
          })
          .map((test) => {
          const state = results[test.id]
          const status = statusOf(state)
          const isIssue = status === "fail" || status === "perf"
          const isActive = activeSuiteId === test.id
          const checkCount =
            state?.outcome.checks.length ?? checkCounts[test.id] ?? 0
          const passCount =
            state?.outcome.checks.filter((c) => c.pass).length ?? 0
          const failedChecks =
            state?.outcome.checks.filter((c) => !c.pass) ?? []
          return (
            <li
              key={test.id}
              className={cn(
                "group rounded px-2 py-1.5 font-mono text-[12px]",
                isActive && "bg-sky-500/10 ring-1 ring-sky-500/30",
                !isActive && isIssue && "bg-red-500/5",
                !isActive && !isIssue && status !== "idle" && "opacity-55",
                running && !isActive && "opacity-40"
              )}
            >
              <div className="flex items-center gap-2">
                {isActive ? (
                  <Loader2 className="size-3 shrink-0 animate-spin text-sky-500" />
                ) : status === "fail" ? (
                  <span className="text-red-500">✕</span>
                ) : status === "idle" ? (
                  <span className="text-muted-foreground">·</span>
                ) : status === "perf" ? (
                  <span className="text-amber-500">!</span>
                ) : (
                  <span className="text-emerald-500">✓</span>
                )}
                <button
                  type="button"
                  onClick={() => scrollToSuite(test.id)}
                  className={cn(
                    "min-w-0 flex-1 truncate text-left transition-colors hover:text-foreground",
                    isActive
                      ? "text-sky-500"
                      : isIssue
                        ? "text-red-500 hover:underline"
                        : "text-foreground"
                  )}
                >
                  {test.name}
                  {isActive ? " · running…" : ""}
                </button>
                <span className="text-[10px] text-muted-foreground">
                  {isActive ? "…" : `${passCount}/${checkCount}`}
                </span>
                <span className="ml-auto flex items-center gap-1.5">
                  {status === "perf" && !isActive && (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-500 uppercase">
                      perf
                    </span>
                  )}
                  {status === "fail" && !isActive && (
                    <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-500 uppercase">
                      fail
                    </span>
                  )}
                  {isIssue && state && !isActive ? (
                    <button
                      type="button"
                      onClick={() => copySuite(test, state)}
                      aria-label={`Copy error for ${test.name}`}
                      title="Copy error"
                      className="flex items-center gap-1 text-[10px] tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
                    >
                      {copiedId === test.id ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      Copy
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onRun(test)}
                    disabled={running}
                    aria-label={`Re-run ${test.name}`}
                    title="Re-run"
                    className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                  >
                    <RefreshCw className="size-3" />
                  </button>
                </span>
              </div>
              {failedChecks.length > 0 ? (
                <button
                  type="button"
                  onClick={() => scrollToSuite(test.id)}
                  className="mt-1.5 w-full rounded-md border border-red-500/20 bg-background/60 px-2.5 py-2 text-left transition-colors hover:border-red-500/40"
                >
                  <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-red-500/90">
                    {failedChecks
                      .map(
                        (c) =>
                          `✗ ${c.label}\n  want: ${c.expected}\n  got:  ${c.actual}`
                      )
                      .join("\n\n")}
                  </pre>
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function TestCard({
  test,
  state,
  isRunning,
  disabled,
  onRun,
}: {
  test: TestCase
  state?: RunState
  isRunning?: boolean
  disabled?: boolean
  onRun: () => void
}) {
  const [showPreview, setShowPreview] = useState(true)
  const [copied, setCopied] = useState(false)
  const status = statusOf(state)
  const isIssue = status === "fail" || status === "perf"

  return (
    <div
      id={suiteAnchorId(test.id)}
      aria-busy={isRunning || undefined}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-xl border bg-card transition-shadow",
        isRunning
          ? "border-sky-500/50 ring-2 ring-sky-500/30"
          : status === "fail"
            ? "border-red-500/40"
            : status === "perf"
              ? "border-amber-500/40"
              : "border-border",
        disabled && !isRunning && "opacity-55"
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[13px] font-medium tracking-wide uppercase">
            {test.name}
          </span>
          <p className="max-w-[58ch] text-[13px] leading-relaxed text-muted-foreground">
            {test.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isRunning ? (
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 font-mono text-[10px] tracking-wide text-sky-500 uppercase">
              <Loader2 className="size-3 animate-spin" />
              Running…
            </span>
          ) : null}
          {isIssue && state && !isRunning ? (
            <button
              type="button"
              onClick={async () => {
                const ok = await copyText(formatSuiteError(test, state))
                if (!ok) return
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1200)
              }}
              className="inline-flex h-6 items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 font-mono text-[10px] tracking-wide text-red-500 uppercase transition-colors hover:bg-red-500/15"
            >
              {copied ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-3" />
              )}
              Copy error
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRun}
            disabled={disabled || isRunning}
            aria-label={`Re-run ${test.name}`}
            title="Re-run test"
            className={cn(
              "inline-flex h-6 items-center gap-1.5 rounded-md border border-border bg-card px-2 font-mono text-[10px] tracking-wide text-muted-foreground uppercase transition-colors hover:bg-muted3 hover:text-foreground",
              "disabled:pointer-events-none disabled:opacity-40"
            )}
          >
            <RefreshCw
              className={cn("size-3", isRunning && "animate-spin")}
            />
            Re-run
          </button>
          <StatusBadge status={isRunning ? "idle" : status} />
        </div>
      </div>

      {showPreview && (
        <div className="p-4">
          <CardPreview spec={test.preview} />
        </div>
      )}

      {state && (
        <ul className="mx-4 mb-4 flex flex-col gap-px overflow-hidden rounded-lg border border-border/60">
          {state.outcome.checks.map((check, i) => (
            <CheckRow key={i} check={check} suiteName={test.name} />
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2 border-t border-border/60 px-4 py-2.5 font-mono text-[10px] text-muted-foreground">
        <StatusBadge status={status} compact />
        <Chip>
          {state
            ? `${state.outcome.checks.filter((c) => c.pass).length}/${state.outcome.checks.length} checks`
            : "— checks"}
        </Chip>
        <Chip className={cn(status === "perf" && "text-amber-500")}>
          {state ? fmtMs(state.durationMs) : "—"}
        </Chip>
        <span className="ml-auto flex items-center gap-2">
          <span className="hidden sm:inline">
            {PERF_SAMPLES.toLocaleString()} runs
          </span>
          <IconButton
            onClick={() => setShowPreview((v) => !v)}
            label={showPreview ? "Hide preview" : "Show preview"}
          >
            {showPreview ? (
              <Eye className="size-3" />
            ) : (
              <EyeOff className="size-3" />
            )}
          </IconButton>
        </span>
      </div>
    </div>
  )
}

function CheckRow({
  check,
  suiteName,
}: {
  check: CheckResult
  suiteName: string
}) {
  const [copied, setCopied] = useState(false)

  return (
    <li
      className={cn(
        "flex flex-col gap-1 px-3 py-2 font-mono text-[11px]",
        check.pass ? "bg-muted3/30" : "bg-red-500/5"
      )}
    >
      <div className="flex items-center gap-2">
        {check.pass ? (
          <span className="text-emerald-500">✓</span>
        ) : (
          <span className="text-red-500">✕</span>
        )}
        <span
          className={cn(
            "min-w-0 flex-1",
            check.pass ? "text-foreground" : "text-red-500"
          )}
        >
          {check.label}
        </span>
        {!check.pass ? (
          <button
            type="button"
            onClick={async () => {
              const ok = await copyText(formatCheckError(suiteName, check))
              if (!ok) return
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1200)
            }}
            aria-label={`Copy error for ${check.label}`}
            title="Copy error"
            className="flex shrink-0 items-center gap-1 text-[10px] tracking-wide text-muted-foreground uppercase transition-colors hover:text-red-500"
          >
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3" />
            )}
            Copy
          </button>
        ) : null}
      </div>
      {!check.pass && (
        <div className="grid gap-0.5 pl-5 text-[10px]">
          <span className="break-all text-emerald-500">
            want {check.expected}
          </span>
          <span className="break-all text-red-500">got {check.actual}</span>
        </div>
      )}
    </li>
  )
}

function Chip({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "rounded bg-muted3/70 px-1.5 py-0.5 tracking-wide uppercase",
        className
      )}
    >
      {children}
    </span>
  )
}

function IconButton({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-6 place-items-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted3 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function StatusBadge({
  status,
  compact,
}: {
  status: "idle" | "pass" | "perf" | "fail"
  compact?: boolean
}) {
  const map = {
    idle: { label: "idle", cls: "bg-muted3 text-muted-foreground" },
    pass: { label: "pass", cls: "bg-emerald-500/15 text-emerald-500" },
    perf: { label: "perf", cls: "bg-amber-500/15 text-amber-500" },
    fail: { label: "fail", cls: "bg-red-500/15 text-red-500" },
  } as const
  const { label, cls } = map[status]
  return (
    <span
      className={cn(
        "shrink-0 rounded font-mono text-[10px] font-semibold tracking-wide uppercase",
        compact ? "px-1.5 py-0.5" : "px-2 py-1",
        cls
      )}
    >
      {label}
    </span>
  )
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-medium tracking-wide uppercase transition-colors disabled:opacity-50",
        primary
          ? "bg-foreground text-background hover:bg-foreground/90"
          : "border border-border bg-card hover:bg-muted3"
      )}
    >
      {children}
    </button>
  )
}

// ── Card previews ──────────────────────────────────────────────────────────

function CardPreview({ spec }: { spec: PreviewSpec }) {
  switch (spec.kind) {
    case "overlay":
      return <OverlayPreview spec={spec} />
    case "keys":
      return <KeysPreview spec={spec} />
    case "label":
      return <LabelPreview text={spec.text} />
    case "rect":
      return <RectPreview before={spec.before} after={spec.after} />
    case "swatch":
      return (
        <SwatchPreview hex={spec.hex} output={spec.output} valid={spec.valid} />
      )
    case "value":
      return <ValuePreview rows={spec.rows} />
  }
}

const PREVIEW_BG =
  "repeating-linear-gradient(0deg,transparent,transparent 15px,rgba(255,255,255,0.03) 15px,rgba(255,255,255,0.03) 16px),repeating-linear-gradient(90deg,transparent,transparent 15px,rgba(255,255,255,0.03) 15px,rgba(255,255,255,0.03) 16px)"

function OverlayPreview({
  spec,
}: {
  spec: Extract<PreviewSpec, { kind: "overlay" }>
}) {
  const paint = getOverlayPaint(spec.settings)
  const target = { left: 108, top: 52, width: 84, height: 30 }
  const tooltipWidth = Math.min(220, spec.label.length * 6.4 + 16)
  const tooltipHeight = 20
  const pos = getTooltipPosition({
    target,
    tooltipWidth,
    tooltipHeight,
    side: spec.side,
    align: spec.align,
    sideOffset: spec.sideOffset,
    alignOffset: spec.alignOffset,
  })

  return (
    <div className="flex justify-center overflow-hidden rounded-lg bg-[#0b0b0c]">
      <div className="relative h-36 w-[300px]">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: PREVIEW_BG }}
        />
        <div
          className="absolute grid place-items-center rounded-md bg-muted3 font-mono text-[11px] text-muted-foreground"
          style={{
            left: target.left,
            top: target.top,
            width: target.width,
            height: target.height,
          }}
        >
          Button
        </div>
        <div
          className="absolute"
          style={{
            left: target.left - paint.paddingX,
            top: target.top - paint.paddingY,
            width: target.width + paint.paddingX * 2,
            height: target.height + paint.paddingY * 2,
            border: paint.border,
            background: paint.fill,
            borderRadius: paint.borderRadius,
          }}
        />
        <div
          className="absolute font-mono text-[10px] leading-none whitespace-nowrap"
          style={{
            left: pos.left,
            top: pos.top,
            background: paint.tooltipBackground,
            color: paint.tooltipText,
            border: `1px solid ${paint.tooltipBorder}`,
            padding: paint.tooltipPadding,
            borderRadius: paint.tooltipBorderRadius,
          }}
        >
          {spec.label}
        </div>
        <span className="absolute top-2 right-2 font-mono text-[9px] text-muted-foreground/70 uppercase">
          {spec.side} / {spec.align}
        </span>
      </div>
    </div>
  )
}

function KeyCap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="grid min-w-6 place-items-center rounded-md border border-border bg-muted3 px-1.5 py-1 font-mono text-[12px] text-foreground shadow-[0_1px_0_rgba(0,0,0,0.4)]">
      {children}
    </kbd>
  )
}

function KeysPreview({
  spec,
}: {
  spec: Extract<PreviewSpec, { kind: "keys" }>
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-[#0b0b0c] p-4">
      <div className="flex items-center gap-2">
        <span className="w-16 shrink-0 font-mono text-[10px] text-muted-foreground uppercase">
          shortcut
        </span>
        <div className="flex items-center gap-1">
          {formatShortcutParts(spec.combo).map((part, i) => (
            <KeyCap key={i}>{part}</KeyCap>
          ))}
        </div>
      </div>
      {spec.pressed && (
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 font-mono text-[10px] text-muted-foreground uppercase">
            pressed
          </span>
          <div className="flex items-center gap-1">
            {spec.pressed.split("+").map((part, i) => (
              <KeyCap key={i}>{part.trim()}</KeyCap>
            ))}
          </div>
        </div>
      )}
      {spec.match !== undefined && (
        <span
          className={cn(
            "font-mono text-[11px]",
            spec.match ? "text-emerald-500" : "text-red-500"
          )}
        >
          {spec.match
            ? "✓ matches — toggles inspector"
            : "✕ no match — ignored"}
        </span>
      )}
    </div>
  )
}

function LabelPreview({ text }: { text: string }) {
  const paint = getOverlayPaint(DEFAULT_INSPECTOR_SETTINGS)
  return (
    <div className="flex h-24 items-center justify-center rounded-lg bg-[#0b0b0c]">
      {text ? (
        <span
          className="font-mono text-[12px] leading-none whitespace-nowrap"
          style={{
            background: paint.tooltipBackground,
            color: paint.tooltipText,
            padding: paint.tooltipPadding,
            borderRadius: paint.tooltipBorderRadius,
          }}
        >
          {text}
        </span>
      ) : (
        <span className="font-mono text-[12px] text-muted-foreground">
          (empty — tooltip hidden)
        </span>
      )}
    </div>
  )
}

function RectPreview({ before, after }: { before: Rect; after: Rect }) {
  return (
    <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-lg bg-[#0b0b0c]">
      <div
        className="absolute inset-0"
        style={{ backgroundImage: PREVIEW_BG }}
      />
      <div
        className="relative"
        style={{ width: after.width + 40, height: after.height + 40 }}
      >
        <div
          className="absolute rounded border-2 border-emerald-500/70 bg-emerald-500/10"
          style={{
            left: 20 + (after.left - before.left),
            top: 20 + (after.top - before.top),
            width: after.width,
            height: after.height,
          }}
        />
        <div
          className="absolute rounded border border-dashed border-muted-foreground/60"
          style={{
            left: 20,
            top: 20,
            width: before.width,
            height: before.height,
          }}
        />
        <span className="absolute -bottom-1 left-0 font-mono text-[9px] text-muted-foreground">
          {before.width}×{before.height} → {after.width}×{after.height}
        </span>
      </div>
    </div>
  )
}

function SwatchPreview({
  hex,
  output,
  valid,
}: {
  hex: string
  output: string
  valid: boolean
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-[#0b0b0c] p-4">
      <div
        className={cn(
          "size-16 shrink-0 rounded-lg border border-border",
          !valid && "grid place-items-center"
        )}
        style={valid ? { background: hex } : undefined}
      >
        {!valid && (
          <span className="font-mono text-[10px] text-muted-foreground">
            n/a
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1 font-mono text-[12px]">
        <span className="text-muted-foreground">{hex}</span>
        <span className={valid ? "text-emerald-500" : "text-red-500"}>
          → {output}
        </span>
      </div>
    </div>
  )
}

function ValuePreview({ rows }: { rows: { input: string; output: string }[] }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-[#0b0b0c] p-4 font-mono text-[12px]">
      {rows.map((row, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <code className="rounded bg-muted3/70 px-2 py-1 text-muted-foreground">
            {row.input}
          </code>
          <span className="text-muted-foreground">→</span>
          <code className="rounded bg-emerald-500/15 px-2 py-1 text-emerald-500">
            {row.output}
          </code>
        </div>
      ))}
    </div>
  )
}

// ── Navigation sandbox ─────────────────────────────────────────────────────
// A real nested React tree driven with the SAME traversal helpers the live
// inspector uses, so ←/→/↑/↓ and ⌘↑/⌘↓ can be exercised end to end.

const NAV_KEYS: { keys: string; label: string }[] = [
  { keys: "←", label: "parent" },
  { keys: "→", label: "child" },
  { keys: "↑", label: "prev peer" },
  { keys: "↓", label: "next peer" },
  { keys: "⌘↑", label: "first peer" },
  { keys: "⌘↓", label: "last peer" },
]

function NavSandbox() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const [currentKey, setCurrentKey] = useState<string | null>(null)

  const elementFor = (nav: string | null) =>
    nav
      ? (rootRef.current?.querySelector<HTMLElement>(`[data-nav="${nav}"]`) ??
        null)
      : null

  // Paint the active outline only while the sandbox is running.
  useEffect(() => {
    if (!active || !currentKey) return
    const el = elementFor(currentKey)
    if (!el) return
    el.style.outline = "2px solid #f97316"
    el.style.outlineOffset = "2px"
    return () => {
      el.style.outline = ""
      el.style.outlineOffset = ""
    }
  }, [active, currentKey])

  const move = (resolve: (el: Element) => Element | null) => {
    const el = elementFor(currentKey)
    if (!el) return
    const next = resolve(el)
    if (
      next instanceof HTMLElement &&
      next.dataset.nav &&
      rootRef.current?.contains(next) &&
      next !== rootRef.current
    ) {
      setCurrentKey(next.dataset.nav)
    }
  }

  const startSandbox = () => {
    setActive(true)
    setCurrentKey("page")
    window.requestAnimationFrame(() => rootRef.current?.focus())
  }

  const resetNav = () => {
    setActive(false)
    setCurrentKey(null)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!active) return

    if (event.key === "Escape") {
      event.preventDefault()
      resetNav()
      return
    }

    const { key } = event
    if (!key.startsWith("Arrow")) return
    event.preventDefault()

    if (key === "ArrowLeft") move(findParentInspectable)
    else if (key === "ArrowRight") move(findChildInspectable)
    else if (key === "ArrowUp")
      move((el) =>
        event.metaKey
          ? findEdgeSiblingInspectable(el, "first")
          : findSiblingInspectable(el, "prev")
      )
    else
      move((el) =>
        event.metaKey
          ? findEdgeSiblingInspectable(el, "last")
          : findSiblingInspectable(el, "next")
      )
  }

  // Every element in the tree carries data-nav — no untagged wrappers — so the
  // traversal helpers only ever land on a labelled box.
  const box =
    "flex flex-col gap-2 rounded-md border border-border/70 bg-muted3/30 p-2 font-mono text-[10px] text-muted-foreground"

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Navigation sandbox
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Start the sandbox to walk the tree with arrow keys — same traversal
            the live inspector uses. Esc or Reset exits.
          </p>
        </div>
        {active ? (
          <IconButton onClick={resetNav} label="Reset sandbox">
            <RotateCcw className="size-3" />
          </IconButton>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {NAV_KEYS.map((n) => (
          <span
            key={n.label}
            className="flex items-center gap-1 rounded bg-muted3/70 px-2 py-1 font-mono text-[10px] text-muted-foreground"
          >
            <span className="text-foreground">{n.keys}</span> {n.label}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 font-mono text-[11px]">
        <span className="text-muted-foreground">current</span>
        <code className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-500">
          {active ? (currentKey ?? "—") : "idle"}
        </code>
      </div>

      <div className="relative">
        {!active ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/40 backdrop-blur-[1px]">
            <button
              type="button"
              onClick={startSandbox}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 font-mono text-[12px] text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <Play className="size-3" />
              Start sandbox
            </button>
          </div>
        ) : null}

        <div
          ref={rootRef}
          tabIndex={active ? 0 : -1}
          onKeyDown={onKeyDown}
          onBlur={(event) => {
            // Leaving the tree (e.g. click elsewhere) ends the session so the
            // rest of the page is interactive again without a stuck outline.
            if (!active) return
            if (event.currentTarget.contains(event.relatedTarget as Node))
              return
            resetNav()
          }}
          className={cn(
            "rounded-lg bg-[#0b0b0c] p-3 ring-border transition-opacity outline-none focus-visible:ring-1",
            active ? "opacity-100" : "pointer-events-none opacity-40"
          )}
        >
          <div data-nav="page" className={box}>
            page
            <div data-nav="header" className={box}>
              header
              <div data-nav="title" className={box}>
                title
              </div>
              <div data-nav="subtitle" className={box}>
                subtitle
              </div>
            </div>
            <div data-nav="grid" className={cn(box, "sm:flex-row")}>
              grid
              <div data-nav="card-1" className={cn(box, "flex-1")}>
                card-1
                <div data-nav="card-1-body" className={box}>
                  body
                </div>
              </div>
              <div data-nav="card-2" className={cn(box, "flex-1")}>
                card-2
              </div>
              <div data-nav="card-3" className={cn(box, "flex-1")}>
                card-3
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Function sandbox ───────────────────────────────────────────────────────

function Sandbox() {
  const [shortcut, setShortcut] = useState("Alt+X")
  const [captured, setCaptured] = useState<string | null>(null)
  const [matched, setMatched] = useState<boolean | null>(null)

  const [title, setTitle] = useState("Button")
  const [pageName, setPageName] = useState("app/page.tsx:5")
  const [showTitle, setShowTitle] = useState(true)
  const [showPageName, setShowPageName] = useState(true)

  const label = useMemo(
    () =>
      formatTooltipLabel({
        title,
        pageName,
        tooltipProps: { ...DEFAULT_TOOLTIP_PROPS, showTitle, showPageName },
      }),
    [title, pageName, showTitle, showPageName]
  )

  const onCapture = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (["Alt", "Control", "Meta", "Shift"].includes(event.key)) return
    event.preventDefault()
    const native = event.nativeEvent
    setCaptured(formatShortcutFromEvent(native))
    setMatched(matchesInspectorShortcut(native, shortcut))
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          Function sandbox
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Drive the inspector primitives with your own input.
        </p>
      </div>

      <div className="grid gap-2 rounded-lg bg-muted3/50 p-3">
        <label className="font-mono text-[11px] text-muted-foreground">
          shortcut string
        </label>
        <input
          value={shortcut}
          onChange={(e) => {
            setShortcut(e.target.value)
            setCaptured(null)
            setMatched(null)
          }}
          spellCheck={false}
          className="rounded-md border border-border bg-background px-2 py-1.5 font-mono text-[12px] outline-none focus:border-foreground/40"
        />
        <div
          tabIndex={0}
          onKeyDown={onCapture}
          className="flex cursor-text items-center justify-center rounded-md border border-dashed border-border bg-background px-2 py-3 font-mono text-[12px] text-muted-foreground outline-none focus:border-foreground/40"
        >
          {captured ? (
            <span className="text-foreground">pressed: {captured}</span>
          ) : (
            "click here, then press a key combo"
          )}
        </div>
        {matched !== null && (
          <span
            className={cn(
              "font-mono text-[12px]",
              matched ? "text-emerald-500" : "text-red-500"
            )}
          >
            {matched ? "✓ matches shortcut" : "✕ does not match"}
          </span>
        )}
      </div>

      <div className="grid gap-2 rounded-lg bg-muted3/50 p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-1">
            <label className="font-mono text-[11px] text-muted-foreground">
              title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              spellCheck={false}
              className="rounded-md border border-border bg-background px-2 py-1.5 font-mono text-[12px] outline-none focus:border-foreground/40"
            />
          </div>
          <div className="grid gap-1">
            <label className="font-mono text-[11px] text-muted-foreground">
              pageName
            </label>
            <input
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              spellCheck={false}
              className="rounded-md border border-border bg-background px-2 py-1.5 font-mono text-[12px] outline-none focus:border-foreground/40"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <Toggle
            label="showTitle"
            checked={showTitle}
            onChange={setShowTitle}
          />
          <Toggle
            label="showPageName"
            checked={showPageName}
            onChange={setShowPageName}
          />
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">
            label
          </span>
          <code className="rounded bg-background px-2 py-1 font-mono text-[12px]">
            {label || <span className="text-muted-foreground">(empty)</span>}
          </code>
        </div>
      </div>
    </section>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 font-mono text-[11px]"
    >
      <span
        className={cn(
          "flex h-4 w-7 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-emerald-500" : "bg-muted3"
        )}
      >
        <span
          className={cn(
            "size-3 rounded-full bg-background transition-transform",
            checked && "translate-x-3"
          )}
        />
      </span>
      <span className={checked ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </button>
  )
}
