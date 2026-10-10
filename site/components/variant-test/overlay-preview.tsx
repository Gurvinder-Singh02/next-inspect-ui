"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
} from "react"

import {
  Calendar,
  ChevronDown,
  LayoutGrid,
  Search,
  UserRound,
} from "lucide-react"

import {
  GhostCard,
  GhostCardContent,
  GhostCardDescription,
  GhostCardFooter,
  GhostCardHeader,
  GhostCardTitle,
} from "@/components/variant-test/ghost-card"
import { LiveWaveform } from "@/components/variant-test/live-waveform"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useInspectorSettings } from "@/components/inspector-toolbar"
import {
  applyOverlayPaint,
  createInspectTooltip,
  ensureInspectOverlayStyles,
  expandRectWithPadding,
  formatComponentTag,
  formatTooltipLabel,
  getTooltipPosition,
} from "next-inspect-ui/lib"
import { cn } from "@/lib/utils"

type InspectTooltip = ReturnType<typeof createInspectTooltip>

type PreviewTargetDef = {
  id: string
  name: string
  pageName: string
  tagStyle?: "dom" | "component"
  /** Show ⌥ badge when the host can Option-climb. */
  canClimb?: boolean
  measureId?: string
}

const PAGE = "components/variant-test/overlay-preview.tsx"
const GHOST_PAGE = "components/variant-test/ghost-card.tsx"
const loc = (file: string, line: number, column: number) =>
  `${file}:${line}:${column}`

const YEARLY_ACTIVITY = [
  { month: "J", load: 72 },
  { month: "F", load: 58 },
  { month: "M", load: 50 },
  { month: "A", load: 40 },
  { month: "M", load: 64 },
  { month: "J", load: 78 },
  { month: "J", load: 92 },
  { month: "A", load: 100 },
  { month: "S", load: 86 },
  { month: "O", load: 70 },
  { month: "N", load: 56 },
  { month: "D", load: 44 },
]

const AUDIT_FILTERS = [
  { id: "audit-filter-activities", icon: LayoutGrid, label: "Any activities" },
  { id: "audit-filter-author", icon: UserRound, label: "Any author" },
  { id: "audit-filter-days", icon: Calendar, label: "Last 7 days" },
] as const

const AUDIT_ROWS = [
  {
    activity: "Order #1213 marked as",
    badge: "Fulfilled",
    author: "Jason Shatam",
    initials: "JS",
    tint: "bg-emerald-500/20",
    time: "12/11/2025 09:12:44 AM",
  },
  {
    activity: "Product “Essential Hoodie” marked as",
    badge: "Active",
    author: "Amelia Smith",
    initials: "AS",
    tint: "bg-rose-500/20",
    time: "12/11/2025 08:44:12 AM",
  },
  {
    activity: "User “Jack Bowlie” updated with",
    badge: "New permissions",
    author: "Bruno Mars",
    initials: "BM",
    tint: "bg-sky-500/20",
    time: "12/10/2025 06:18:03 PM",
  },
]

const METRICS = [
  { label: "Inspects today", value: "12.4k" },
  { label: "Avg hover time", value: "1.8s" },
  { label: "Open in editor", value: "3.2k" },
  { label: "Active sessions", value: "486" },
]

const TARGETS: PreviewTargetDef[] = [
  { id: "section-1", name: "Section1", pageName: loc(PAGE, 540, 13) },
  { id: "hero-title", name: "HeroTitle", pageName: loc(PAGE, 546, 15) },
  {
    id: "hero-desc-1",
    name: "p",
    pageName: loc(PAGE, 554, 15),
    tagStyle: "dom",
  },
  {
    id: "ghost-description",
    name: "p",
    pageName: loc(GHOST_PAGE, 29, 3),
    tagStyle: "dom",
    canClimb: true,
  },
  { id: "section-3", name: "Section3", pageName: loc(PAGE, 661, 13) },
  {
    id: "section-inspect-title",
    name: "h3",
    pageName: loc(PAGE, 667, 17),
    tagStyle: "dom",
    canClimb: true,
  },
  {
    id: "metric-inspect-label",
    name: "span",
    pageName: loc(PAGE, 692, 25),
    tagStyle: "dom",
  },
  {
    id: "metric-inspect-value",
    name: "span",
    pageName: loc(PAGE, 707, 25),
    tagStyle: "dom",
  },
  {
    id: "audit-row",
    name: "div",
    pageName: loc(PAGE, 840, 21),
    tagStyle: "dom",
  },
  {
    id: "audit-activity",
    name: "p",
    pageName: loc(PAGE, 804, 25),
    tagStyle: "dom",
  },
  {
    id: "audit-author",
    name: "span",
    pageName: loc(PAGE, 815, 25),
    tagStyle: "dom",
  },
  {
    id: "audit-time",
    name: "span",
    pageName: loc(PAGE, 825, 25),
    tagStyle: "dom",
  },
]

const TARGET_BY_ID = Object.fromEntries(
  TARGETS.map((target) => [target.id, target])
) as Record<string, PreviewTargetDef>

const STEP_MS = 1200

export const OverlayPreview = ({ className }: { className?: string }) => {
  const settings = useInspectorSettings()
  const stageRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const targetRefs = useRef<Record<string, HTMLElement | null>>({})
  const chromeRef = useRef<{
    overlay: HTMLDivElement
    tooltip: InspectTooltip
  } | null>(null)
  const settingsRef = useRef(settings)
  const measureRef = useRef<() => void>(() => {})
  const playIdRef = useRef(TARGETS[0]?.id ?? "section-1")
  settingsRef.current = settings
  const [playId, setPlayId] = useState(TARGETS[0]?.id ?? "section-1")
  const [mode, setMode] = useState<"autoplay" | "none">("autoplay")
  const [isPlaying, setIsPlaying] = useState(true)
  const [waveformActive, setWaveformActive] = useState(false)
  const [waveformProcessing, setWaveformProcessing] = useState(true)

  const visibleId = mode === "none" ? null : playId
  const paddingX = 0
  const paddingY = 0
  const activeIndex = TARGETS.findIndex((item) => item.id === playId)

  const stepBy = useCallback((delta: number) => {
    setPlayId((current) => {
      const index = TARGETS.findIndex((item) => item.id === current)
      const nextIndex = (index + delta + TARGETS.length) % TARGETS.length
      const next = TARGETS[nextIndex]?.id ?? TARGETS[0].id
      playIdRef.current = next
      return next
    })
  }, [])

  const measure = useCallback(() => {
    const stage = stageRef.current
    const chrome = chromeRef.current
    if (!stage || !chrome) return

    const id = playIdRef.current
    const target = id ? TARGET_BY_ID[id] : null
    const el = id
      ? targetRefs.current[target?.measureId ?? id] || targetRefs.current[id]
      : null

    if (!id || !el || !target) {
      chrome.overlay.style.display = "none"
      chrome.tooltip.hide()
      return
    }

    const stageBox = stage.getBoundingClientRect()
    const box = el.getBoundingClientRect()
    const rect = expandRectWithPadding(
      {
        left: box.left - stageBox.left,
        top: box.top - stageBox.top,
        width: box.width,
        height: box.height,
      },
      {
        left: paddingX,
        right: paddingX,
        top: paddingY,
        bottom: paddingY,
      }
    )

    const corners = getComputedStyle(el)
    chrome.overlay.style.borderRadius = corners.borderRadius
    chrome.overlay.style.setProperty(
      "corner-shape",
      corners.getPropertyValue("corner-shape")
    )
    chrome.overlay.style.display = "block"
    chrome.overlay.style.left = `${rect.left}px`
    chrome.overlay.style.top = `${rect.top}px`
    chrome.overlay.style.width = `${rect.width}px`
    chrome.overlay.style.height = `${rect.height}px`

    const label =
      formatTooltipLabel({
        title: target.name,
        pageName: target.pageName,
        tooltipProps: settings.tooltipProps,
        tagStyle: target.tagStyle ?? "component",
      }) || formatComponentTag("Component")

    chrome.tooltip.setLabel(label)
    chrome.tooltip.showSourceIcon(false, Boolean(target.canClimb))
    chrome.tooltip.show()

    const front = chrome.tooltip.root.querySelector(
      ".next-inspect-ui-tooltip-front"
    ) as HTMLElement | null
    const { tooltipProps } = settings
    const pos = getTooltipPosition({
      target: rect,
      tooltipWidth: front?.offsetWidth || chrome.tooltip.root.offsetWidth,
      tooltipHeight: front?.offsetHeight || chrome.tooltip.root.offsetHeight,
      side: tooltipProps.side,
      align: tooltipProps.align,
      sideOffset: tooltipProps.sideOffset,
      alignOffset: tooltipProps.alignOffset,
      viewport: {
        width: stageBox.width,
        height: stageBox.height,
      },
    })
    chrome.tooltip.root.style.left = `${pos.left}px`
    chrome.tooltip.root.style.top = `${pos.top}px`
  }, [mode, paddingX, paddingY, settings])

  useEffect(() => {
    ensureInspectOverlayStyles()
    const stage = stageRef.current
    if (!stage) return

    const overlay = document.createElement("div")
    overlay.className = "next-inspect-ui-overlay"
    overlay.setAttribute("data-dev-inspector-overlay", "")
    overlay.setAttribute("aria-hidden", "true")
    overlay.style.position = "absolute"
    overlay.style.zIndex = "20"
    overlay.style.display = "none"

    const tooltip = createInspectTooltip()
    tooltip.root.style.position = "absolute"
    tooltip.root.style.zIndex = "30"

    stage.append(overlay, tooltip.root)
    chromeRef.current = { overlay, tooltip }
    applyOverlayPaint(overlay, tooltip.root, settingsRef.current)
    measureRef.current()

    return () => {
      overlay.remove()
      tooltip.root.remove()
      chromeRef.current = null
    }
  }, [])

  useEffect(() => {
    measureRef.current = measure
  }, [measure])

  useEffect(() => {
    const chrome = chromeRef.current
    if (!chrome) return
    applyOverlayPaint(chrome.overlay, chrome.tooltip.root, settings)
    measure()
  }, [settings, measure])

  useLayoutEffect(() => {
    playIdRef.current = playId
    if (!visibleId) {
      const chrome = chromeRef.current
      if (chrome) {
        chrome.overlay.style.display = "none"
        chrome.tooltip.hide()
      }
      return
    }
    measure()
  }, [playId, visibleId, measure])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const viewport = stage.querySelector<HTMLElement>(
      "[data-slot='scroll-area-viewport']"
    )
    let frame = 0
    const track = () => {
      measure()
      frame = window.requestAnimationFrame(track)
    }
    frame = window.requestAnimationFrame(track)

    const observer = new ResizeObserver(() => measure())
    observer.observe(stage)
    window.addEventListener("resize", measure)
    viewport?.addEventListener("scroll", measure, { passive: true })
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("resize", measure)
      viewport?.removeEventListener("scroll", measure)
    }
  }, [measure])

  useEffect(() => {
    if (mode !== "autoplay" || !isPlaying) return
    const timer = window.setInterval(() => stepBy(1), STEP_MS)
    return () => window.clearInterval(timer)
  }, [mode, isPlaying, stepBy])

  useEffect(() => {
    if (mode !== "autoplay") return
    const target = TARGET_BY_ID[playId]
    const el =
      targetRefs.current[target?.measureId ?? playId] ||
      targetRefs.current[playId]
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [mode, playId])

  const setTarget = (id: string) => (node: HTMLElement | null) => {
    targetRefs.current[id] = node
  }

  const onModeChange = (value: string | number | null) => {
    const next =
      value === "none" ? "none" : "autoplay"
    setMode(next)
    setIsPlaying(next === "autoplay")
  }

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div
        ref={stageRef}
        className="relative flex min-h-0 flex-1 flex-col items-stretch justify-between rounded-2xl border border-border"
      >
        <ScrollArea className="min-h-0 flex-1">
          <div
            ref={contentRef}
            className="relative z-10 flex flex-col gap-12 p-6 md:p-8"
          >
            <PreviewTarget
              targetId="section-1"
              targetRefs={targetRefs}
              className="flex flex-col gap-3"
            >
              <PreviewTarget
                targetId="hero-title"
                targetRefs={targetRefs}
                className="w-fit"
              >
                <h2 className="font-heading text-xl font-medium tracking-tight">
                  next-inspect-ui
                </h2>
              </PreviewTarget>
              <PreviewTarget
                targetId="hero-desc-1"
                targetRefs={targetRefs}
                className="max-w-[56ch]"
              >
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Hover any node in your app, read its source path, and jump
                  into the editor without leaving the browser.
                </p>
              </PreviewTarget>
              <PreviewTarget
                targetId="hero-desc-2"
                targetRefs={targetRefs}
                className="max-w-[56ch]"
              >
                <p className="text-sm leading-relaxed text-muted-foreground">
                  This stage mirrors a real page layout so you can judge fill,
                  stroke weight, and tooltip density on dense content.
                </p>
              </PreviewTarget>
            </PreviewTarget>

            <PreviewTarget
              targetId="section-2"
              targetRefs={targetRefs}
              className="grid grid-cols-1 items-stretch gap-10 md:grid-cols-2"
            >
              <GhostCard ref={setTarget("ghost-card")}>
                <GhostCardHeader ref={setTarget("ghost-header")}>
                  <GhostCardTitle ref={setTarget("ghost-title")}>
                    Live Audio Waveform
                  </GhostCardTitle>
                  <GhostCardDescription ref={setTarget("ghost-description")}>
                    Real-time microphone input visualization with audio
                    reactivity.
                  </GhostCardDescription>
                </GhostCardHeader>
                <GhostCardContent ref={setTarget("ghost-chart")}>
                  <LiveWaveform
                    active={waveformActive}
                    processing={waveformProcessing}
                    height={116}
                    barWidth={3}
                    barGap={2}
                    fadeEdges
                    barColor="gray"
                    historySize={120}
                  />
                </GhostCardContent>
                <GhostCardFooter ref={setTarget("ghost-listen")}>
                  <Button
                    size="sm"
                    variant={waveformActive ? "default" : "outline"}
                    onClick={() => {
                      setWaveformActive((value) => {
                        const next = !value
                        if (next) setWaveformProcessing(false)
                        return next
                      })
                    }}
                  >
                    {waveformActive ? "Stop" : "Start"} Listening
                  </Button>
                </GhostCardFooter>
              </GhostCard>

              <GhostCard ref={setTarget("fitness-card")}>
                <GhostCardHeader ref={setTarget("fitness-header")}>
                  <GhostCardTitle ref={setTarget("fitness-title")}>
                    Yearly Fitness Summary
                  </GhostCardTitle>
                  <GhostCardDescription ref={setTarget("fitness-description")}>
                    Calories and workout load by month across the last year.
                  </GhostCardDescription>
                </GhostCardHeader>
                <GhostCardContent ref={setTarget("fitness-chart")}>
                  <div className="grid grid-cols-12 gap-1.5">
                    {YEARLY_ACTIVITY.map((month, index) => (
                      <div
                        key={`fitness-month-${index}`}
                        className="flex flex-col gap-1 text-center"
                      >
                        <div className="text-[11px] text-muted-foreground">
                          {month.month}
                        </div>
                        <div className="relative h-24 overflow-hidden rounded-sm bg-muted">
                          <div
                            className="absolute inset-x-0 bottom-0 rounded-sm bg-chart-3"
                            style={
                              {
                                height: `${month.load}%`,
                              } as CSSProperties
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </GhostCardContent>
                <GhostCardFooter ref={setTarget("fitness-action")}>
                  <Button size="sm" variant="outline">
                    View details
                  </Button>
                </GhostCardFooter>
              </GhostCard>
            </PreviewTarget>

            <PreviewTarget
              targetId="section-3"
              targetRefs={targetRefs}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <PreviewTarget
                  targetId="section-inspect-title"
                  targetRefs={targetRefs}
                  className="w-fit"
                >
                  <h3 className="font-heading text-base font-medium">
                    Inspection activity
                  </h3>
                </PreviewTarget>
                <PreviewTarget
                  targetId="section-inspect-desc"
                  targetRefs={targetRefs}
                  className="max-w-[48ch]"
                >
                  <p className="text-sm text-muted-foreground">
                    Snapshot metrics from a typical local session, useful for
                    checking overlay contrast on small labels.
                  </p>
                </PreviewTarget>
              </div>
              <PreviewTarget targetId="metrics-row" targetRefs={targetRefs}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-6 sm:grid-cols-4">
                  {METRICS.map((metric, index) => (
                    <div key={metric.label} className="flex flex-col gap-0.5">
                      {index === 0 ? (
                        <PreviewTarget
                          targetId="metric-inspect-label"
                          targetRefs={targetRefs}
                          className="w-fit"
                        >
                          <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                            {metric.label}
                          </span>
                        </PreviewTarget>
                      ) : (
                        <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                          {metric.label}
                        </span>
                      )}
                      {index === 0 ? (
                        <PreviewTarget
                          targetId="metric-inspect-value"
                          targetRefs={targetRefs}
                          className="w-fit"
                        >
                          <span className="font-heading text-xl font-medium tracking-tight">
                            {metric.value}
                          </span>
                        </PreviewTarget>
                      ) : (
                        <span className="font-heading text-xl font-medium tracking-tight">
                          {metric.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </PreviewTarget>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {AUDIT_FILTERS.map(({ id, icon: Icon, label }) => (
                    <PreviewTarget
                      key={id}
                      targetId={id}
                      targetRefs={targetRefs}
                      className="w-fit"
                    >
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-inter text-[11px]">
                        <Icon
                          className="size-3 text-muted-foreground"
                          aria-hidden
                        />
                        {label}
                        <ChevronDown
                          className="size-3 text-muted-foreground"
                          aria-hidden
                        />
                      </span>
                    </PreviewTarget>
                  ))}
                </div>
                <PreviewTarget
                  targetId="audit-search"
                  targetRefs={targetRefs}
                  className="w-fit"
                >
                  <span className="inline-flex min-w-48 items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-inter text-[11px] text-muted-foreground">
                    <Search className="size-3" aria-hidden />
                    Search by activity name, author…
                  </span>
                </PreviewTarget>
              </div>
              <div className="flex flex-col">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_9rem_11rem] items-center gap-3 border-b border-border py-2 font-inter text-[11px] text-muted-foreground">
                  <span
                    className="size-3.5 rounded-sm border border-border"
                    aria-hidden
                  />
                  <span>Activity</span>
                  <span>Author</span>
                  <span className="text-right">Timestamp</span>
                </div>
                {AUDIT_ROWS.map((row, index) => {
                  const isFirst = index === 0
                  const activity = (
                    <p className="flex min-w-0 flex-wrap items-center gap-1.5 font-inter text-[12px]">
                      <span className="truncate">{row.activity}</span>
                      <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">
                        {row.badge}
                      </span>
                    </p>
                  )
                  const author = (
                    <span className="flex items-center gap-1.5 font-inter text-[12px]">
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full font-inter text-[9px]",
                          row.tint
                        )}
                      >
                        {row.initials}
                      </span>
                      <span className="truncate">{row.author}</span>
                    </span>
                  )
                  const time = (
                    <span className="text-right font-inter text-[11px] text-muted-foreground tabular-nums">
                      {row.time}
                    </span>
                  )
                  const rowBody = (
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_9rem_11rem] items-center gap-3 border-b border-border/70 py-2">
                      <span
                        className="size-3.5 rounded-sm border border-border"
                        aria-hidden
                      />
                      {isFirst ? (
                        <PreviewTarget
                          targetId="audit-activity"
                          targetRefs={targetRefs}
                          className="min-w-0"
                        >
                          {activity}
                        </PreviewTarget>
                      ) : (
                        activity
                      )}
                      {isFirst ? (
                        <PreviewTarget
                          targetId="audit-author"
                          targetRefs={targetRefs}
                        >
                          {author}
                        </PreviewTarget>
                      ) : (
                        author
                      )}
                      {isFirst ? (
                        <PreviewTarget
                          targetId="audit-time"
                          targetRefs={targetRefs}
                        >
                          {time}
                        </PreviewTarget>
                      ) : (
                        time
                      )}
                    </div>
                  )

                  if (!isFirst) return <div key={row.time}>{rowBody}</div>

                  return (
                    <PreviewTarget
                      key={row.time}
                      targetId="audit-row"
                      targetRefs={targetRefs}
                    >
                      {rowBody}
                    </PreviewTarget>
                  )
                })}
              </div>
            </PreviewTarget>
          </div>
        </ScrollArea>

        <Tabs value={mode} onValueChange={onModeChange}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 p-3">
            <TabsList>
              <TabsTrigger value="autoplay">Autoplay</TabsTrigger>
              <TabsTrigger value="none">None</TabsTrigger>
            </TabsList>

            <TabsContent value="autoplay" className="mt-0 flex-none">
              <div className="flex items-center gap-1.5">
                <p className="mr-2 text-[12px] text-muted-foreground tabular-nums">
                  {activeIndex + 1} / {TARGETS.length}
                  {isPlaying ? " · looping" : " · paused"}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Previous target"
                  disabled={isPlaying}
                  onClick={() => stepBy(-1)}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={isPlaying ? "Pause autoplay" : "Resume autoplay"}
                  onClick={() => setIsPlaying((value) => !value)}
                >
                  {isPlaying ? "Pause" : "Resume"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Next target"
                  disabled={isPlaying}
                  onClick={() => stepBy(1)}
                >
                  Next
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="none" className="mt-0 flex-none" />
          </div>
        </Tabs>
      </div>
    </div>
  )
}

const PreviewTarget = ({
  targetId,
  targetRefs,
  className,
  children,
}: {
  targetId: string
  targetRefs: MutableRefObject<Record<string, HTMLElement | null>>
  className?: string
  children: ReactNode
}) => (
  <div
    data-preview-target={targetId}
    ref={(node) => {
      targetRefs.current[targetId] = node
    }}
    className={className}
  >
    {children}
  </div>
)
