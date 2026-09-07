"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type MutableRefObject,
  type PointerEvent,
  type ReactNode,
} from "react"

import { LiveWaveform } from "@/components/variant-test/live-waveform"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useInspectorSettings } from "@/components/inspector-toolbar"
import {
  expandRectWithPadding,
  formatComponentTag,
  formatTooltipLabel,
  getOverlayPaint,
  getTooltipPosition,
  type InspectorSettings,
} from "next-inspect-ui/lib"
import { cn } from "@/lib/utils"

type PreviewTargetDef = {
  id: string
  name: string
  pageName: string
}

const PAGE = "components/variant-test/overlay-preview.tsx"
const WAVEFORM_PAGE = "components/variant-test/live-waveform.tsx"
const FITNESS_PAGE = "components/variant-test/overlay-preview.tsx"
const CONTRIBUTORS_PAGE = "components/variant-test/overlay-preview.tsx"

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

const CONTRIBUTOR_USERNAMES = [
  "shadcn",
  "vercel",
  "nextjs",
  "tailwindlabs",
  "typescript-lang",
  "eslint",
  "prettier",
  "babel",
  "webpack",
  "rollup",
  "parcel",
  "vite",
  "react",
  "vue",
  "angular",
  "solid",
]

const METRICS = [
  { label: "Inspects today", value: "12.4k" },
  { label: "Avg hover time", value: "1.8s" },
  { label: "Open in editor", value: "3.2k" },
  { label: "Active sessions", value: "486" },
]

const TARGETS: PreviewTargetDef[] = [
  { id: "section-1", name: "Section1", pageName: PAGE },
  { id: "hero-title", name: "HeroTitle", pageName: PAGE },
  { id: "hero-desc-1", name: "HeroDescription", pageName: PAGE },
  { id: "hero-desc-2", name: "HeroDescriptionAlt", pageName: PAGE },
  { id: "section-2", name: "Section2", pageName: PAGE },
  { id: "waveform-card", name: "WaveformCard", pageName: WAVEFORM_PAGE },
  { id: "waveform-title", name: "LiveAudioWaveform", pageName: WAVEFORM_PAGE },
  {
    id: "waveform-description",
    name: "WaveformDescription",
    pageName: WAVEFORM_PAGE,
  },
  { id: "waveform-chart", name: "WaveformChart", pageName: WAVEFORM_PAGE },
  { id: "waveform-listen", name: "ListenButton", pageName: WAVEFORM_PAGE },
  { id: "fitness-card", name: "FitnessCard", pageName: FITNESS_PAGE },
  {
    id: "fitness-title",
    name: "YearlyFitnessSummary",
    pageName: FITNESS_PAGE,
  },
  {
    id: "fitness-description",
    name: "FitnessDescription",
    pageName: FITNESS_PAGE,
  },
  { id: "fitness-chart", name: "FitnessChart", pageName: FITNESS_PAGE },
  { id: "fitness-action", name: "ViewDetailsButton", pageName: FITNESS_PAGE },
  { id: "section-3", name: "Section3", pageName: PAGE },
  { id: "section-inspect-title", name: "InspectSectionTitle", pageName: PAGE },
  { id: "section-inspect-desc", name: "InspectSectionDesc", pageName: PAGE },
  { id: "metrics-row", name: "MetricsRow", pageName: PAGE },
  { id: "section-4", name: "Section4", pageName: CONTRIBUTORS_PAGE },
  {
    id: "contributors-title",
    name: "ContributorsTitle",
    pageName: CONTRIBUTORS_PAGE,
  },
  {
    id: "contributors-badge",
    name: "ContributorsBadge",
    pageName: CONTRIBUTORS_PAGE,
  },
  {
    id: "contributors-desc",
    name: "ContributorsDescription",
    pageName: CONTRIBUTORS_PAGE,
  },
  {
    id: "contributors-avatars",
    name: "ContributorAvatars",
    pageName: CONTRIBUTORS_PAGE,
  },
  {
    id: "contributors-link",
    name: "ContributorsLink",
    pageName: CONTRIBUTORS_PAGE,
  },
]

const TARGET_BY_ID = Object.fromEntries(
  TARGETS.map((target) => [target.id, target])
) as Record<string, PreviewTargetDef>

const STEP_MS = 1200

const eventElement = (target: EventTarget | null) => {
  if (target instanceof Element) return target
  if (target instanceof Text) return target.parentElement
  return null
}

const isPointInRect = (
  clientX: number,
  clientY: number,
  box: DOMRect,
  paddingX = 0,
  paddingY = 0
) =>
  clientX >= box.left - paddingX &&
  clientX <= box.right + paddingX &&
  clientY >= box.top - paddingY &&
  clientY <= box.bottom + paddingY

const isTargetDescendant = (
  childId: string,
  ancestorId: string,
  refs: Record<string, HTMLElement | null>
) => {
  const child = refs[childId]
  const ancestor = refs[ancestorId]
  return Boolean(
    child && ancestor && child !== ancestor && ancestor.contains(child)
  )
}

/** Smallest unpadded hit, sticky within the current target's padded spotlight. */
const resolvePreviewTargetAtPoint = ({
  clientX,
  clientY,
  refs,
  preferId,
  paddingX,
  paddingY,
}: {
  clientX: number
  clientY: number
  refs: Record<string, HTMLElement | null>
  preferId: string | null
  paddingX: number
  paddingY: number
}) => {
  let geometricId: string | null = null
  let bestArea = Number.POSITIVE_INFINITY

  for (const [id, el] of Object.entries(refs)) {
    if (!el) continue
    const box = el.getBoundingClientRect()
    if (!isPointInRect(clientX, clientY, box)) continue
    const area = box.width * box.height
    if (area < bestArea) {
      bestArea = area
      geometricId = id
    }
  }

  if (!preferId) return geometricId

  const preferredEl = refs[preferId]
  if (
    !preferredEl ||
    !isPointInRect(
      clientX,
      clientY,
      preferredEl.getBoundingClientRect(),
      paddingX,
      paddingY
    )
  ) {
    return geometricId
  }

  if (!geometricId || geometricId === preferId) return preferId
  if (isTargetDescendant(geometricId, preferId, refs)) return geometricId
  if (isTargetDescendant(preferId, geometricId, refs)) return preferId
  return geometricId
}

export const OverlayPreview = ({ className }: { className?: string }) => {
  const settings = useInspectorSettings()
  const stageRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const targetRefs = useRef<Record<string, HTMLElement | null>>({})
  const overlayBoxRef = useRef<HTMLDivElement>(null)
  const tooltipBoxRef = useRef<HTMLDivElement>(null)
  const playIdRef = useRef(TARGETS[0]?.id ?? "section-1")
  const hoverIdRef = useRef<string | null>(null)
  const [playId, setPlayId] = useState(TARGETS[0]?.id ?? "section-1")
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [mode, setMode] = useState<"autoplay" | "mouse" | "none">("autoplay")
  const [isPlaying, setIsPlaying] = useState(true)
  const [labelMeta, setLabelMeta] = useState({
    name: TARGETS[0]?.name ?? "Component",
    pageName: TARGETS[0]?.pageName ?? "page.tsx",
  })
  const [waveformActive, setWaveformActive] = useState(false)
  const [waveformProcessing, setWaveformProcessing] = useState(true)

  const isMouseMode = mode === "mouse"
  const visibleId = mode === "none" ? null : isMouseMode ? hoverId : playId
  const showOverlay = Boolean(visibleId)
  const paddingX = settings.devSpotlightProps.paddingX
  const paddingY = settings.devSpotlightProps.paddingY

  const stepBy = useCallback((delta: number) => {
    setPlayId((current) => {
      const index = TARGETS.findIndex((item) => item.id === current)
      const nextIndex = (index + delta + TARGETS.length) % TARGETS.length
      const next = TARGETS[nextIndex]?.id ?? TARGETS[0].id
      playIdRef.current = next
      return next
    })
  }, [])

  const resolveTargetAtPoint = useCallback(
    (clientX: number, clientY: number, preferId: string | null) =>
      resolvePreviewTargetAtPoint({
        clientX,
        clientY,
        refs: targetRefs.current,
        preferId,
        paddingX,
        paddingY,
      }),
    [paddingX, paddingY]
  )

  const measure = useCallback(() => {
    const stage = stageRef.current
    const id = mode === "mouse" ? hoverIdRef.current : playIdRef.current
    const el = id ? targetRefs.current[id] : null
    const boxEl = overlayBoxRef.current
    if (!stage || !el || !boxEl) return

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

    boxEl.style.left = `${rect.left}px`
    boxEl.style.top = `${rect.top}px`
    boxEl.style.width = `${rect.width}px`
    boxEl.style.height = `${rect.height}px`

    const tooltipEl = tooltipBoxRef.current
    if (tooltipEl) {
      const { tooltipProps } = settings
      const pos = getTooltipPosition({
        target: rect,
        tooltipWidth: tooltipEl.offsetWidth,
        tooltipHeight: tooltipEl.offsetHeight,
        side: tooltipProps.side,
        align: tooltipProps.align,
        sideOffset: tooltipProps.sideOffset,
        alignOffset: tooltipProps.alignOffset,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      })
      tooltipEl.style.left = `${pos.left}px`
      tooltipEl.style.top = `${pos.top}px`
    }
  }, [mode, paddingX, paddingY, settings])

  useLayoutEffect(() => {
    playIdRef.current = playId
    hoverIdRef.current = hoverId
    if (!visibleId) return
    const target = TARGET_BY_ID[visibleId]
    setLabelMeta({
      name: target?.name ?? "Component",
      pageName: target?.pageName ?? "page.tsx",
    })
    measure()
  }, [playId, hoverId, visibleId, measure, settings])

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

    const timer = window.setInterval(() => {
      stepBy(1)
    }, STEP_MS)

    return () => window.clearInterval(timer)
  }, [mode, isPlaying, stepBy])

  useEffect(() => {
    if (mode !== "autoplay") return
    targetRefs.current[playId]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    })
  }, [mode, playId])

  const onContentPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (mode !== "mouse") return
    const id = resolveTargetAtPoint(
      event.clientX,
      event.clientY,
      hoverIdRef.current
    )
    if (id === hoverIdRef.current) return
    hoverIdRef.current = id
    setHoverId(id)
  }

  const onContentPointerLeave = () => {
    if (mode !== "mouse") return
    hoverIdRef.current = null
    setHoverId(null)
  }

  const onContentClick = (event: MouseEvent<HTMLDivElement>) => {
    if (mode !== "mouse") return
    if (eventElement(event.target)?.closest("button, a")) return

    // Resolve from click coords (not event.target) so padded spotlight + nested
    // wrappers stay in sync with what the overlay is showing.
    const id = resolveTargetAtPoint(
      event.clientX,
      event.clientY,
      hoverIdRef.current
    )
    if (!id) return

    const target = TARGET_BY_ID[id]
    if (!target) return

    window.alert(`${target.name}\n${target.pageName}`)
  }

  const activeIndex = TARGETS.findIndex((item) => item.id === playId)

  const onModeChange = (value: string | number | null) => {
    const next =
      value === "mouse" ? "mouse" : value === "none" ? "none" : "autoplay"
    setMode(next)
    hoverIdRef.current = null
    setHoverId(null)
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
          onPointerMove={onContentPointerMove}
          onPointerLeave={onContentPointerLeave}
          onClick={onContentClick}
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
                Hover any node in your app, read its source path, and jump into
                the editor without leaving the browser.
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
            className="grid grid-cols-1 gap-10 md:grid-cols-2"
          >
            <PreviewTarget
              targetId="waveform-card"
              targetRefs={targetRefs}
              className="flex flex-col gap-3"
            >
              <PreviewTarget
                targetId="waveform-title"
                targetRefs={targetRefs}
                className="w-fit"
              >
                <h3 className="font-heading text-base font-medium">
                  Live Audio Waveform
                </h3>
              </PreviewTarget>
              <PreviewTarget
                targetId="waveform-description"
                targetRefs={targetRefs}
              >
                <p className="text-sm text-muted-foreground">
                  Real-time microphone input visualization with audio
                  reactivity.
                </p>
              </PreviewTarget>
              <PreviewTarget targetId="waveform-chart" targetRefs={targetRefs}>
                <LiveWaveform
                  active={waveformActive}
                  processing={waveformProcessing}
                  height={116}
                />
              </PreviewTarget>
              <PreviewTarget
                targetId="waveform-listen"
                targetRefs={targetRefs}
                className="w-fit"
              >
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
              </PreviewTarget>
            </PreviewTarget>

            <PreviewTarget
              targetId="fitness-card"
              targetRefs={targetRefs}
              className="flex flex-col gap-3"
            >
              <PreviewTarget
                targetId="fitness-title"
                targetRefs={targetRefs}
                className="w-fit"
              >
                <h3 className="font-heading text-base font-medium">
                  Yearly Fitness Summary
                </h3>
              </PreviewTarget>
              <PreviewTarget
                targetId="fitness-description"
                targetRefs={targetRefs}
              >
                <p className="text-sm text-muted-foreground">
                  Calories and workout load by month across the last year.
                </p>
              </PreviewTarget>
              <PreviewTarget targetId="fitness-chart" targetRefs={targetRefs}>
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
              </PreviewTarget>
              <PreviewTarget
                targetId="fitness-action"
                targetRefs={targetRefs}
                className="w-fit"
              >
                <Button size="sm" variant="outline">
                  View details
                </Button>
              </PreviewTarget>
            </PreviewTarget>
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
                  Snapshot metrics from a typical local session — useful for
                  checking overlay contrast on small labels.
                </p>
              </PreviewTarget>
            </div>
            <PreviewTarget targetId="metrics-row" targetRefs={targetRefs}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                {METRICS.map((metric) => (
                  <div key={metric.label} className="flex flex-col gap-0.5">
                    <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                      {metric.label}
                    </span>
                    <span className="font-heading text-xl tracking-tight font-medium">
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
            </PreviewTarget>
          </PreviewTarget>

          <PreviewTarget
            targetId="section-4"
            targetRefs={targetRefs}
            className="flex flex-col gap-4 pb-2"
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <PreviewTarget
                  targetId="contributors-title"
                  targetRefs={targetRefs}
                  className="w-fit"
                >
                  <h3 className="font-heading text-base font-medium">
                    Contributors
                  </h3>
                </PreviewTarget>
                <PreviewTarget
                  targetId="contributors-badge"
                  targetRefs={targetRefs}
                  className="w-fit"
                >
                  <Badge variant="secondary">312</Badge>
                </PreviewTarget>
              </div>
              <PreviewTarget
                targetId="contributors-desc"
                targetRefs={targetRefs}
                className="max-w-[48ch]"
              >
                <p className="text-sm text-muted-foreground">
                  People shipping the inspector - avatars highlight as one
                  group.
                </p>
              </PreviewTarget>
            </div>
            <PreviewTarget
              targetId="contributors-avatars"
              targetRefs={targetRefs}
            >
              <div className="flex flex-wrap gap-2">
                {CONTRIBUTOR_USERNAMES.map((username) => (
                  <Avatar key={username} className="grayscale">
                    <AvatarImage
                      src={`https://github.com/${username}.png`}
                      alt={username}
                    />
                    <AvatarFallback>{username.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </PreviewTarget>
            <PreviewTarget
              targetId="contributors-link"
              targetRefs={targetRefs}
              className="w-fit"
            >
              <span className="text-sm underline underline-offset-4">
                + 810 contributors
              </span>
            </PreviewTarget>
          </PreviewTarget>
        </div>
        </ScrollArea>

        {showOverlay ? (
          <PreviewOverlay
            overlayBoxRef={overlayBoxRef}
            tooltipBoxRef={tooltipBoxRef}
            name={labelMeta.name}
            pageName={labelMeta.pageName}
            settings={settings}
          />
        ) : null}

        <Tabs value={mode} onValueChange={onModeChange}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 p-3">
            <TabsList>
              <TabsTrigger value="autoplay">Autoplay</TabsTrigger>
              <TabsTrigger value="mouse">Trigger mouse</TabsTrigger>
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

            <TabsContent value="mouse" className="mt-0 flex-none">
              <p className="font-mono text-[12px] text-muted-foreground">
                {hoverId
                  ? formatComponentTag(labelMeta.name)
                  : "Hover an element…"}
              </p>
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

const PreviewOverlay = ({
  overlayBoxRef,
  tooltipBoxRef,
  name,
  pageName,
  settings,
}: {
  overlayBoxRef: MutableRefObject<HTMLDivElement | null>
  tooltipBoxRef: MutableRefObject<HTMLDivElement | null>
  name: string
  pageName: string
  settings: InspectorSettings
}) => {
  const paint = getOverlayPaint(settings)
  const follow = paint.animated
    ? "left 160ms cubic-bezier(0.22, 1, 0.36, 1), top 160ms cubic-bezier(0.22, 1, 0.36, 1), width 160ms cubic-bezier(0.22, 1, 0.36, 1), height 160ms cubic-bezier(0.22, 1, 0.36, 1)"
    : "none"
  const label =
    formatTooltipLabel({
      title: name,
      pageName,
      tooltipProps: settings.tooltipProps,
    }) || formatComponentTag("Component")

  return (
    <>
      <div
        ref={overlayBoxRef}
        aria-hidden
        className="pointer-events-none absolute z-20 box-border"
        style={{
          backgroundColor: paint.fill,
          border: paint.border,
          borderRadius: paint.borderRadius,
          transition: follow,
        }}
      />
      {label ? (
        <div
          ref={tooltipBoxRef}
          aria-hidden
          className="pointer-events-none absolute z-30 max-w-[18rem] truncate text-[12px] leading-[1.4] shadow-md"
          style={{
            background: paint.tooltipBackground,
            border: `1px solid ${paint.tooltipBorder}`,
            color: paint.tooltipText,
            padding: paint.tooltipPadding,
            borderRadius: paint.tooltipBorderRadius,
            transition: follow,
          }}
        >
          {label}
        </div>
      ) : null}
    </>
  )
}
