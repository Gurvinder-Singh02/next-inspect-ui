"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDownIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import inspectUiPackage from "next-inspect-ui/package.json"

import { useSuite } from "@/components/accuracy/suite-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type SuiteCaseMeta = {
  id: string
  title: string
  group: string
}

export const SuiteHeader = ({
  cases,
  version = inspectUiPackage.version,
}: {
  cases: SuiteCaseMeta[]
  version?: string
}) => {
  const {
    states,
    runSuite,
    isRunningSuite,
    suiteProgress,
    onlyGroup,
    isGroupVisible,
    toggleGroupVisible,
    showOnlyGroup,
    showAllGroups,
  } = useSuite()
  const [copiedFails, setCopiedFails] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)
  const [groupsOpen, setGroupsOpen] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    const publish = () => {
      document.documentElement.style.setProperty(
        "--suite-header-height",
        `${el.offsetHeight}px`
      )
    }

    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(el)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty("--suite-header-height")
    }
  }, [isRunningSuite, suiteProgress, groupsOpen, onlyGroup])

  const groups = useMemo(() => {
    const order: string[] = []
    const byGroup = new Map<string, SuiteCaseMeta[]>()
    for (const entry of cases) {
      const list = byGroup.get(entry.group)
      if (list) list.push(entry)
      else {
        byGroup.set(entry.group, [entry])
        order.push(entry.group)
      }
    }
    return order.map((group) => ({
      group,
      cases: byGroup.get(group) ?? [],
    }))
  }, [cases])

  const visibleCases = useMemo(
    () => cases.filter((entry) => isGroupVisible(entry.group)),
    [cases, isGroupVisible]
  )

  const summary = useMemo(() => {
    let pass = 0
    let fail = 0
    let idle = 0
    const failures: SuiteCaseMeta[] = []
    const all: Array<{
      entry: SuiteCaseMeta
      status: string
      detail?: string
    }> = []

    for (const entry of visibleCases) {
      const state = states[entry.id]
      const status = state?.status ?? "idle"
      if (status === "pass") pass += 1
      else if (status === "fail") {
        fail += 1
        failures.push(entry)
      } else idle += 1
      all.push({ entry, status, detail: state?.detail })
    }

    return {
      pass,
      fail,
      idle,
      total: visibleCases.length,
      failures,
      all,
    }
  }, [visibleCases, states])

  const progress =
    isRunningSuite && suiteProgress
      ? suiteProgress.current / Math.max(suiteProgress.total, 1)
      : summary.total === 0
        ? 0
        : (summary.pass + summary.fail) / summary.total

  const visibleIds = useMemo(
    () => visibleCases.map((entry) => entry.id),
    [visibleCases]
  )

  const isFiltered = onlyGroup != null || groups.some((g) => !isGroupVisible(g.group))
  const hiddenCount = groups.filter((g) => !isGroupVisible(g.group)).length

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
        : "No failing cases yet — run the suite first."
    await navigator.clipboard?.writeText(text)
    setCopiedFails(true)
    window.setTimeout(() => setCopiedFails(false), 1500)
  }

  const copyAll = async () => {
    const lines = summary.all.map(({ entry, status, detail }) =>
      detail
        ? `${status} · ${entry.group} / ${entry.title} — ${detail}`
        : `${status} · ${entry.group} / ${entry.title}`
    )
    await navigator.clipboard?.writeText(lines.join("\n"))
    setCopiedAll(true)
    window.setTimeout(() => setCopiedAll(false), 1500)
  }

  const runAll = () => {
    void runSuite(visibleIds, { delayMs: 0, scroll: false })
  }

  return (
    <div
      ref={headerRef}
      className="sticky top-0 z-40 mx-auto max-w-5xl bg-background/80 px-3 backdrop-blur-md"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2.5 border-b border-border/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-2 font-mono text-[13px]">
            {isRunningSuite && suiteProgress ? (
              <span>
                Running… {suiteProgress.current}/{suiteProgress.total}
              </span>
            ) : (
              <span>next-inspect-ui</span>
            )}
            <span className="text-muted-foreground">v{version}</span>
          </div>

          <div
            className="flex max-w-34 flex-wrap justify-start gap-1"
            aria-label="Case status dots"
          >
            {visibleCases.map((entry) => {
              const status = states[entry.id]?.status ?? "idle"
              return (
                <button
                  key={entry.id}
                  type="button"
                  title={`${entry.title}: ${status}`}
                  aria-label={`Scroll to ${entry.title}`}
                  onClick={() => {
                    document.getElementById(entry.id)?.scrollIntoView({
                      block: "start",
                      behavior: "smooth",
                    })
                  }}
                  className={cn(
                    "size-2.5 min-h-0 min-w-0 rounded-full p-0",
                    "transition-opacity hover:opacity-80",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    status === "pass" && "bg-emerald-400",
                    status === "fail" && "bg-red-400",
                    status === "idle" && "bg-muted-foreground/25",
                    isRunningSuite &&
                      suiteProgress?.id === entry.id &&
                      "ring-2 ring-amber-400/70"
                  )}
                />
              )
            })}
          </div>
        </div>

        <div
          className="h-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Suite progress"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300 ease-out",
              isRunningSuite ? "bg-amber-400" : "bg-emerald-400/80"
            )}
            style={{
              width: `${Math.max(progress * 100, progress > 0 ? 2 : 0)}%`,
            }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="secondary"
              className="font-mono text-[10px] tracking-wide uppercase"
            >
              {summary.idle} idle
            </Badge>
            <Badge
              variant={summary.fail > 0 ? "destructive" : "outline"}
              className="font-mono text-[10px] tracking-wide uppercase"
            >
              {summary.fail} fail
            </Badge>
            <Badge
              variant={summary.pass > 0 ? "default" : "outline"}
              className={cn(
                "font-mono text-[10px] tracking-wide uppercase",
                summary.pass > 0 &&
                  "border-transparent bg-emerald-500/15 text-emerald-400"
              )}
            >
              {summary.pass} pass
            </Badge>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setGroupsOpen((value) => !value)}
              aria-expanded={groupsOpen}
              className="font-mono text-[10px] tracking-wide uppercase"
            >
              Groups
              {isFiltered ? (
                <span className="text-amber-400">
                  · {groups.length - hiddenCount}/{groups.length}
                </span>
              ) : null}
              <ChevronDownIcon
                className={cn(
                  "size-3 transition-transform",
                  groupsOpen && "rotate-180"
                )}
                aria-hidden
              />
            </Button>
            {isFiltered ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={showAllGroups}
                className="font-mono text-[10px] tracking-wide uppercase"
              >
                Show all
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyFails}
              className="font-mono text-[10px] tracking-wide uppercase"
            >
              {copiedFails ? "Copied!" : "Copy failed"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyAll}
              className="font-mono text-[10px] tracking-wide uppercase"
            >
              {copiedAll ? "Copied!" : "Copy all"}
            </Button>
            <Button
              type="button"
              variant="orange"
              size="sm"
              onClick={runAll}
              disabled={isRunningSuite || visibleIds.length === 0}
              className="font-mono text-[10px] tracking-wide uppercase"
            >
              {isRunningSuite ? "Running…" : "Run all"}
            </Button>
          </div>
        </div>

        {groupsOpen ? (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2">
              <span className="font-mono text-[11px] tracking-wide text-foreground uppercase">
                {groups.length} groups
              </span>
              <button
                type="button"
                onClick={() => setGroupsOpen(false)}
                className={cn(
                  "font-mono text-[10px] tracking-wide text-muted-foreground uppercase",
                  "transition-colors hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                Close
              </button>
            </div>

            <ul className="divide-y divide-border/50">
              {groups.map(({ group, cases: groupCases }) => {
                const visible = isGroupVisible(group)
                const isOnly = onlyGroup === group
                let pass = 0
                let fail = 0
                for (const entry of groupCases) {
                  const status = states[entry.id]?.status ?? "idle"
                  if (status === "pass") pass += 1
                  if (status === "fail") fail += 1
                }

                return (
                  <li
                    key={group}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5",
                      !visible && "opacity-45"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroupVisible(group)}
                      title={visible ? `Hide ${group}` : `Show ${group}`}
                      aria-label={
                        visible ? `Hide ${group} group` : `Show ${group} group`
                      }
                      aria-pressed={visible}
                      className={cn(
                        "inline-flex size-8 shrink-0 items-center justify-center rounded-md",
                        "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        visible && "text-foreground"
                      )}
                    >
                      {visible ? (
                        <EyeIcon className="size-3.5" aria-hidden />
                      ) : (
                        <EyeOffIcon className="size-3.5" aria-hidden />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!visible) {
                          if (onlyGroup) showOnlyGroup(group)
                          else toggleGroupVisible(group)
                        }
                        window.requestAnimationFrame(() => {
                          document
                            .querySelector(`[data-suite-group="${group}"]`)
                            ?.scrollIntoView({
                              block: "start",
                              behavior: "smooth",
                            })
                        })
                      }}
                      className={cn(
                        "min-w-0 flex-1 truncate text-left font-mono text-[12px] capitalize",
                        "text-foreground transition-colors hover:text-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      )}
                    >
                      {group}
                      <span className="ml-2 text-muted-foreground">
                        {groupCases.length}
                        {fail > 0 ? ` · ${fail} fail` : ""}
                        {pass > 0 ? ` · ${pass} pass` : ""}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        isOnly ? showAllGroups() : showOnlyGroup(group)
                      }
                      className={cn(
                        "inline-flex min-h-7 shrink-0 items-center rounded-md border px-2 py-0.5",
                        "font-mono text-[10px] tracking-wide uppercase",
                        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isOnly
                          ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {isOnly ? "All" : "Only"}
                    </button>
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
