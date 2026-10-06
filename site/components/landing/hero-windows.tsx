"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { play } from "cuelume"
import {
  ArrowUp,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  GitBranch,
  Hexagon,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  Option,
  Paperclip,
  Pause,
  Play,
  ScrollText,
  Search,
  TrendingDown,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import {
  formatTooltipLabel,
  DEFAULT_INSPECTOR_SETTINGS,
} from "next-inspect-ui/lib"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  DemoCursor,
  FollowInspect,
  type InspectBox,
} from "@/components/landing/inspect-spot"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

const STEP_MS = 1800
const INSTALL_COMMAND = "npm i -D next-inspect-ui"
const AGENT_PROMPT =
  "Install next-inspect-ui (npm i -D next-inspect-ui). Use a dynamic import of next-inspect-ui inside a NODE_ENV development check in the async root layout, then add <InspectUI /> as a sibling alongside {children} in the root layout (not wrapping it), only in development."

const useOverlayLoop = (playing: boolean, length: number) => {
  const [index, setIndex] = useState(0)
  const [canLoop, setCanLoop] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setCanLoop(!media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    if (!playing || !canLoop || length < 2) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length)
    }, STEP_MS)
    return () => window.clearInterval(timer)
  }, [playing, canLoop, length])

  return [index, setIndex] as const
}

type WindowChromeProps = {
  icon: typeof Inbox
  title: string
  isPlaying: boolean
  onClose: () => void
}

const WindowChrome = ({
  icon: Icon,
  title,
  isPlaying,
  onClose,
}: WindowChromeProps) => (
  <header className="flex items-center justify-between px-3 py-2.5">
    <span className="flex items-center gap-1.5 font-inter text-[13px] text-foreground">
      <Icon className="size-3.5" aria-hidden />
      {title}
    </span>
    <span className="flex items-center gap-0.5">
      <button
        type="button"
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="size-3.5 [&_rect]:fill-current" aria-hidden />
        ) : (
          <Play className="size-3.5 [&_path]:fill-current" aria-hidden />
        )}
      </button>
      <button
        type="button"
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Close"
        onClick={onClose}
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </span>
  </header>
)

const _InstallPill = () => {
  const [hasCopied, setHasCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND)
      setHasCopied(true)
      play("success")
      window.setTimeout(() => setHasCopied(false), 1600)
    } catch {
      play("error")
    }
  }

  return (
    <div className="flex h-9 items-center gap-3 rounded-full border border-border bg-card px-3.5">
      <p className="font-azeret-mono text-[12px] text-muted-foreground">
        $ {INSTALL_COMMAND}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="flex size-6 shrink-0 items-center justify-center text-foreground transition-colors hover:text-foreground/80"
        aria-label={hasCopied ? "Copied" : "Copy install command"}
      >
        {hasCopied ? (
          <Check className="size-3.5" aria-hidden />
        ) : (
          <Copy className="size-3.5" aria-hidden />
        )}
      </button>
    </div>
  )
}

type ShortcutKey = "option" | "x"

const ShortcutGlyph = ({ name }: { name: ShortcutKey }) => {
  if (name === "option") {
    return <Option className="size-4" strokeWidth={2.2} aria-hidden />
  }

  return <span className="text-sm leading-none font-semibold">X</span>
}

const ShortcutPress = ({ keys }: { keys: ShortcutKey[] }) => {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute bottom-6 left-4 z-40 inline-flex items-center gap-1.5 rounded-md bg-background/80 px-2.5 py-1.5 text-foreground shadow-md ring-1 ring-border backdrop-blur-md"
      initial={reduceMotion ? false : { opacity: 0, scale: 1.18 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.45, bounce: 0.08 }}
    >
      {keys.map((key) => (
        <ShortcutGlyph key={key} name={key} />
      ))}
    </motion.div>
  )
}

const _CopyPrompt = () => {
  const [hasCopied, setHasCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(AGENT_PROMPT)
      setHasCopied(true)
      play("success")
      window.setTimeout(() => setHasCopied(false), 1600)
    } catch {
      play("error")
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-9 items-center justify-center rounded-full bg-foreground px-4 font-inter text-[13px] font-medium text-background transition-colors hover:bg-foreground/90"
    >
      {hasCopied ? "Copied" : "Copy prompt"}
    </button>
  )
}

const INBOX_THREADS = [
  { id: "INS-104", title: "Reset tooltip", time: "now", unread: true },
  { id: "INS-91", title: "Overlay fade", time: "2h", unread: false },
  { id: "INS-88", title: "Climb usage", time: "1d", unread: false },
  { id: "INS-76", title: "Spotlight radius", time: "2d", unread: false },
  { id: "INS-52", title: "Open in editor", time: "3d", unread: false },
]

const INBOX_HOVER_START = 2
const INBOX_HOVERS = [
  { id: "stage", tag: "div", pageName: "app/inbox/page.tsx:8" },
  { id: "list", tag: "nav", pageName: "app/inbox/page.tsx:12" },
  { id: "thread", tag: "div", pageName: "app/inbox/page.tsx:16" },
  { id: "thread-id", tag: "span", pageName: "app/inbox/page.tsx:18" },
  { id: "message", tag: "div", pageName: "app/inbox/page.tsx:28" },
  { id: "para", tag: "p", pageName: "app/inbox/page.tsx:30" },
  { id: "timer", tag: "span", pageName: "app/inbox/page.tsx:42" },
  { id: "assigned", tag: "span", pageName: "app/inbox/page.tsx:46" },
  { id: "files", tag: "div", pageName: "app/inbox/page.tsx:52" },
  { id: "file", tag: "p", pageName: "app/inbox/page.tsx:58" },
  { id: "reply", tag: "footer", pageName: "app/inbox/page.tsx:68" },
] as const
const INBOX_STEPS = INBOX_HOVER_START + INBOX_HOVERS.length

const InboxScene = ({ step }: { step: number }) => {
  const stageRef = useRef<HTMLDivElement>(null)
  const targetRefs = useRef<Record<string, HTMLElement | null>>({})
  const [box, setBox] = useState<InspectBox | null>(null)
  const [cursor, setCursor] = useState({ left: 0, top: 0 })
  const hover = INBOX_HOVERS[step - INBOX_HOVER_START]
  const setTargetRef = (id: string) => (node: HTMLElement | null) => {
    targetRefs.current[id] = node
  }

  const measure = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const stageBox = stage.getBoundingClientRect()
    const target =
      hover?.id === "stage"
        ? stage
        : hover
          ? targetRefs.current[hover.id]
          : null

    if (!target) {
      setBox({
        left: stageBox.width * 0.35,
        top: stageBox.height * 0.35,
        width: stageBox.width * 0.3,
        height: stageBox.height * 0.3,
      })
      setCursor({
        left: stageBox.width / 2 - 12,
        top: stageBox.height * 0.42,
      })
      return
    }

    const nextBox = target.getBoundingClientRect()
    const next = {
      left: nextBox.left - stageBox.left,
      top: nextBox.top - stageBox.top,
      width: nextBox.width,
      height: nextBox.height,
    }
    setBox(next)
    setCursor({
      left: next.left + next.width - 18,
      top: next.top + next.height - 18,
    })
  }, [hover])

  useLayoutEffect(() => {
    measure()
  }, [measure, step])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [measure])

  return (
    <div
      ref={stageRef}
      className="relative grid h-full gap-4 sm:grid-cols-[13rem_1fr]"
    >
      {step >= 0 ? (
        <DemoCursor
          variant={step <= 1 ? "arrow" : "plus"}
          left={cursor.left}
          top={cursor.top}
        />
      ) : null}
      <FollowInspect
        box={box}
        visible={Boolean(hover)}
        tag={hover?.tag ?? "div"}
        pageName={hover?.pageName ?? "app/inbox/page.tsx:8"}
      />
      <div ref={setTargetRef("list")} className="flex flex-col gap-1">
        {INBOX_THREADS.map((thread, index) => (
          <div
            key={thread.id}
            ref={index === 0 ? setTargetRef("thread") : undefined}
            className={cn(
              "flex flex-col gap-0.5 rounded-lg px-2.5 py-2",
              thread.unread ? "bg-muted" : "bg-transparent"
            )}
          >
            <p className="flex items-center justify-between font-inter text-[12px]">
              <span
                ref={index === 0 ? setTargetRef("thread-id") : undefined}
                className="font-medium"
              >
                {thread.id}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {thread.time}
              </span>
            </p>
            <p className="font-inter text-[11px] text-muted-foreground">
              {thread.title}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <div
          ref={setTargetRef("message")}
          className="rounded-lg bg-muted px-3 py-2.5"
        >
          <p
            ref={setTargetRef("para")}
            className="font-inter text-[13px] leading-relaxed"
          >
            Hover any node and open its source.
          </p>
          <p className="mt-1.5 font-inter text-[13px] leading-relaxed text-muted-foreground">
            Hold ⌥ to climb to the usage site, then click to jump in the editor.
          </p>
          <p className="mt-1.5 font-inter text-[12px] leading-relaxed text-muted-foreground">
            Tooltip should stay on the author line, not the wrapper.
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 font-inter text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-orange-500" />
            INS-104 added to context
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-inter text-[12px] text-muted-foreground">
          <span
            ref={setTargetRef("timer")}
            className="inline-flex items-center gap-1.5"
          >
            Worked for 10 sec
            <Play className="size-3 fill-current" />
          </span>
          <span ref={setTargetRef("assigned")}>Assigned to Gxuri</span>
          <span>Priority high</span>
        </div>
        <div
          ref={setTargetRef("files")}
          className="flex flex-col gap-1.5 rounded-lg border border-border px-3 py-2"
        >
          <p className="font-inter text-[12px]">
            Changed 3 files <span className="text-emerald-500">+41</span>{" "}
            <span className="text-red-500">-16</span>
          </p>
          <p className="flex items-center gap-1.5 font-inter text-[12px]">
            <GitBranch className="size-3 text-muted-foreground" />
            Draft Reset tooltip
          </p>
          <p
            ref={setTargetRef("file")}
            className="font-inter text-[11px] text-muted-foreground"
          >
            site/components/landing/inspect-spot.tsx
          </p>
          <p className="font-inter text-[11px] text-muted-foreground">
            packages/next-inspect-ui/src/inspector.tsx
          </p>
          <p className="font-inter text-[11px] text-muted-foreground">
            site/components/landing/hero-windows.tsx
          </p>
        </div>
        <footer
          ref={setTargetRef("reply")}
          className="flex items-center gap-2 pt-1"
        >
          <span className="min-w-0 flex-1 font-inter text-[13px] text-muted-foreground">
            Reply…
          </span>
          <span
            className="flex items-center gap-2 text-muted-foreground"
            aria-hidden
          >
            <Hexagon className="size-3" />
            <Paperclip className="size-3.5" />
            <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-background">
              <ArrowUp className="size-3" />
            </span>
          </span>
        </footer>
      </div>
    </div>
  )
}

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
  {
    activity: "App “Klaviyo” marked as",
    badge: "Installed",
    author: "Jason Shatam",
    initials: "JS",
    tint: "bg-emerald-500/20",
    time: "12/10/2025 11:27:51 AM",
  },
]

const AUDIT_FILTERS = [
  { icon: LayoutGrid, label: "Any activities" },
  { icon: UserRound, label: "Any author" },
  { icon: Calendar, label: "Last 7 days" },
] as const

const AUDIT_HOVER_START = 2
const AUDIT_HOVERS = [
  { id: "stage", tag: "div", pageName: "app/audit/page.tsx:8" },
  { id: "header", tag: "header", pageName: "app/audit/page.tsx:12" },
  { id: "title", tag: "h3", pageName: "app/audit/page.tsx:14" },
  { id: "export", tag: "button", pageName: "app/audit/page.tsx:18" },
  { id: "subtitle", tag: "p", pageName: "app/audit/page.tsx:16" },
  { id: "filter-activities", tag: "button", pageName: "app/audit/page.tsx:22" },
  { id: "filter-author", tag: "button", pageName: "app/audit/page.tsx:26" },
  { id: "filter-days", tag: "button", pageName: "app/audit/page.tsx:30" },
  { id: "search", tag: "input", pageName: "app/audit/page.tsx:34" },
  { id: "row", tag: "div", pageName: "app/audit/page.tsx:46" },
  { id: "activity", tag: "p", pageName: "app/audit/page.tsx:48" },
  { id: "author", tag: "span", pageName: "app/audit/page.tsx:52" },
] as const
const AUDIT_STEPS = AUDIT_HOVER_START + AUDIT_HOVERS.length

const FILTER_HOVER_IDS = [
  "filter-activities",
  "filter-author",
  "filter-days",
] as const

const AuditScene = ({ step }: { step: number }) => {
  const stageRef = useRef<HTMLDivElement>(null)
  const targetRefs = useRef<Record<string, HTMLElement | null>>({})
  const [box, setBox] = useState<InspectBox | null>(null)
  const [cursor, setCursor] = useState({ left: 0, top: 0 })
  const hover = AUDIT_HOVERS[step - AUDIT_HOVER_START]
  const setTargetRef = (id: string) => (node: HTMLElement | null) => {
    targetRefs.current[id] = node
  }

  const measure = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const stageBox = stage.getBoundingClientRect()
    const target =
      hover?.id === "stage"
        ? stage
        : hover
          ? targetRefs.current[hover.id]
          : null

    if (!target) {
      setBox({
        left: stageBox.width * 0.35,
        top: stageBox.height * 0.35,
        width: stageBox.width * 0.3,
        height: stageBox.height * 0.3,
      })
      setCursor({
        left: stageBox.width / 2 - 12,
        top: stageBox.height * 0.42,
      })
      return
    }

    const nextBox = target.getBoundingClientRect()
    const next = {
      left: nextBox.left - stageBox.left,
      top: nextBox.top - stageBox.top,
      width: nextBox.width,
      height: nextBox.height,
    }
    setBox(next)
    setCursor({
      left: next.left + next.width - 18,
      top: next.top + next.height - 18,
    })
  }, [hover])

  useLayoutEffect(() => {
    measure()
  }, [measure, step])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [measure])

  return (
    <div ref={stageRef} className="relative flex flex-col gap-4">
      {step >= 0 ? (
        <DemoCursor
          variant={step <= 1 ? "arrow" : "plus"}
          left={cursor.left}
          top={cursor.top}
        />
      ) : null}
      <FollowInspect
        box={box}
        visible={Boolean(hover)}
        tag={hover?.tag ?? "div"}
        pageName={hover?.pageName ?? "app/audit/page.tsx:8"}
      />
      <div
        ref={setTargetRef("header")}
        className="flex items-start justify-between gap-3"
      >
        <div className="flex flex-col gap-0.5">
          <h3
            ref={setTargetRef("title")}
            className="font-inter text-[15px] font-medium tracking-tight"
          >
            Audit log
          </h3>
          <p
            ref={setTargetRef("subtitle")}
            className="font-inter text-[12px] text-muted-foreground"
          >
            A timeline of all your store activities.
          </p>
        </div>
        <span
          ref={setTargetRef("export")}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-inter text-[11px]"
        >
          <Download className="size-3" aria-hidden />
          Export as CSV
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {AUDIT_FILTERS.map(({ icon: Icon, label }, index) => (
            <span
              key={label}
              ref={setTargetRef(FILTER_HOVER_IDS[index])}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-inter text-[11px]"
            >
              <Icon className="size-3 text-muted-foreground" aria-hidden />
              {label}
              <ChevronDown
                className="size-3 text-muted-foreground"
                aria-hidden
              />
            </span>
          ))}
        </div>
        <span
          ref={setTargetRef("search")}
          className="inline-flex min-w-48 items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-inter text-[11px] text-muted-foreground"
        >
          <Search className="size-3" aria-hidden />
          Search by activity name, author…
        </span>
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
        {AUDIT_ROWS.map((row, index) => (
          <div
            key={`${row.activity}-${row.time}`}
            ref={index === 0 ? setTargetRef("row") : undefined}
            className="grid grid-cols-[auto_minmax(0,1fr)_9rem_11rem] items-center gap-3 border-b border-border/70 py-2"
          >
            <span
              className="size-3.5 rounded-sm border border-border"
              aria-hidden
            />
            <p
              ref={index === 0 ? setTargetRef("activity") : undefined}
              className="flex min-w-0 flex-wrap items-center gap-1.5 font-inter text-[12px]"
            >
              <span className="truncate">{row.activity}</span>
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">
                {row.badge}
              </span>
            </p>
            <span
              ref={index === 0 ? setTargetRef("author") : undefined}
              className="flex items-center gap-1.5 font-inter text-[12px]"
            >
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
            <span className="text-right font-inter text-[11px] text-muted-foreground tabular-nums">
              {row.time}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 font-inter text-[11px] text-muted-foreground">
        <span>Viewing 1 to 15 of 145 activities</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="flex size-6 items-center justify-center rounded-md border border-border">
              <ChevronLeft className="size-3" aria-hidden />
            </span>
            {["1", "2", "3", "4", "5"].map((page) => (
              <span
                key={page}
                className={cn(
                  "flex size-6 items-center justify-center rounded-md border tabular-nums",
                  page === "1"
                    ? "border-orange-500 text-foreground"
                    : "border-border"
                )}
              >
                {page}
              </span>
            ))}
            <span className="flex size-6 items-center justify-center rounded-md border border-border">
              <ChevronRight className="size-3" aria-hidden />
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            Items per page
            <span className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-foreground">
              15
              <ChevronDown
                className="size-3 text-muted-foreground"
                aria-hidden
              />
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

const DASHBOARD_METRICS = [
  {
    label: "Total Revenue",
    value: "$1,250.00",
    delta: "+12.5%",
    note: "Trending up this month",
    hint: "Visitors for the last 6 months",
    up: true,
  },
  {
    label: "New Customers",
    value: "1,234",
    delta: "-20%",
    note: "Down 20% this period",
    hint: "Acquisition needs attention",
    up: false,
  },
  {
    label: "Active Accounts",
    value: "45,678",
    delta: "+12.5%",
    note: "Strong user retention",
    hint: "Engagement exceed targets",
    up: true,
  },
] as const

const DASHBOARD_CHART = [
  { date: "2024-04-01", desktop: 222, mobile: 150 },
  { date: "2024-04-08", desktop: 409, mobile: 320 },
  { date: "2024-04-15", desktop: 120, mobile: 170 },
  { date: "2024-04-22", desktop: 224, mobile: 170 },
  { date: "2024-04-29", desktop: 315, mobile: 240 },
  { date: "2024-05-06", desktop: 498, mobile: 520 },
  { date: "2024-05-13", desktop: 197, mobile: 160 },
  { date: "2024-05-20", desktop: 177, mobile: 230 },
  { date: "2024-05-27", desktop: 420, mobile: 460 },
  { date: "2024-06-03", desktop: 103, mobile: 160 },
  { date: "2024-06-10", desktop: 155, mobile: 200 },
  { date: "2024-06-17", desktop: 475, mobile: 520 },
  { date: "2024-06-24", desktop: 132, mobile: 180 },
  { date: "2024-06-30", desktop: 446, mobile: 400 },
]

const DASHBOARD_CHART_CONFIG = {
  desktop: { label: "Desktop", color: "var(--primary)" },
  mobile: { label: "Mobile", color: "var(--primary)" },
} satisfies ChartConfig

const CHART_RANGES = ["Last 3 months", "Last 30 days", "Last 7 days"] as const

const DASHBOARD_CLIMB = [
  {
    id: "title",
    tag: "div",
    pageName: "components/section-cards.tsx:21",
    tagStyle: "dom" as const,
  },
  {
    id: "title",
    tag: "CardTitle",
    pageName: "components/ui/card.tsx:37",
    tagStyle: "component" as const,
  },
  {
    id: "header",
    tag: "CardHeader",
    pageName: "components/ui/card.tsx:23",
    tagStyle: "component" as const,
  },
  {
    id: "card",
    tag: "Card",
    pageName: "components/ui/card.tsx:5",
    tagStyle: "component" as const,
  },
  {
    id: "grid",
    tag: "SectionCards",
    pageName: "app/dashboard/page.tsx:26",
    tagStyle: "component" as const,
  },
] as const

const DashboardScene = ({ step }: { step: number }) => {
  const stageRef = useRef<HTMLDivElement>(null)
  const targetRefs = useRef<Record<string, HTMLElement | null>>({})
  const [box, setBox] = useState<InspectBox | null>(null)
  const [cursor, setCursor] = useState({ left: 0, top: 0 })
  const climb = step >= 0 ? DASHBOARD_CLIMB[step] : undefined
  const setTargetRef = (id: string) => (node: HTMLElement | null) => {
    targetRefs.current[id] = node
  }

  const measure = useCallback(() => {
    const stage = stageRef.current
    if (!stage || !climb) return
    const stageBox = stage.getBoundingClientRect()
    const target = targetRefs.current[climb.id]
    if (!target) return
    const nextBox = target.getBoundingClientRect()
    const next = {
      left: nextBox.left - stageBox.left,
      top: nextBox.top - stageBox.top,
      width: nextBox.width,
      height: nextBox.height,
    }
    setBox(next)
    setCursor({
      left: next.left + next.width - 18,
      top: next.top + next.height - 18,
    })
  }, [climb])

  useLayoutEffect(() => {
    measure()
  }, [measure, step])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [measure])

  return (
    <div ref={stageRef} className="relative h-full">
      {step >= 0 && climb ? (
        <>
          <DemoCursor variant="plus" left={cursor.left} top={cursor.top} />
          <FollowInspect
            box={box}
            visible
            tag={climb.tag}
            pageName={climb.pageName}
            tagStyle={climb.tagStyle}
            used={step >= 1}
          />
        </>
      ) : null}
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div
          ref={setTargetRef("grid")}
          className="grid grid-cols-3 items-stretch gap-3"
        >
          {DASHBOARD_METRICS.map((metric, index) => {
            const Trend = metric.up ? TrendingUp : TrendingDown

            return (
              <Card
                key={metric.label}
                size="sm"
                ref={index === 0 ? setTargetRef("card") : undefined}
                className="h-full bg-linear-to-t from-primary/5 to-card shadow-xs"
              >
                <CardHeader
                  ref={index === 0 ? setTargetRef("header") : undefined}
                >
                  <CardDescription>{metric.label}</CardDescription>
                  <CardTitle
                    ref={index === 0 ? setTargetRef("title") : undefined}
                    className="text-xl! font-semibold tracking-tighter tabular-nums"
                  >
                    {metric.value}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <Trend />
                      {metric.delta}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="mt-auto flex-col items-start gap-1 text-[11px]">
                  <p className="flex items-center gap-1.5 font-medium">
                    {metric.note}
                    <Trend className="size-3.5" aria-hidden />
                  </p>
                  <p className="text-muted-foreground">{metric.hint}</p>
                </CardFooter>
              </Card>
            )
          })}
        </div>
        <Card size="sm" className="@container/card min-h-0 flex-1">
          <CardHeader>
            <CardTitle>Total Visitors</CardTitle>
            <CardDescription>Total for the last 3 months</CardDescription>
            <CardAction>
              <div className="hidden items-center overflow-hidden rounded-lg border border-border @[540px]/card:flex">
                {CHART_RANGES.map((range, index) => (
                  <span
                    key={range}
                    className={cn(
                      "px-2.5 py-1 font-inter text-[11px]",
                      index === 0
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {range}
                  </span>
                ))}
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 px-2 pt-1 sm:px-4">
            <ChartContainer
              config={DASHBOARD_CHART_CONFIG}
              className="aspect-auto h-full min-h-0 w-full"
            >
              <AreaChart data={DASHBOARD_CHART}>
                <defs>
                  <linearGradient
                    id="heroFillDesktop"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-desktop)"
                      stopOpacity={1}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-desktop)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="heroFillMobile"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-mobile)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-mobile)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <Area
                  dataKey="mobile"
                  type="natural"
                  fill="url(#heroFillMobile)"
                  stroke="var(--color-mobile)"
                  stackId="a"
                />
                <Area
                  dataKey="desktop"
                  type="natural"
                  fill="url(#heroFillDesktop)"
                  stroke="var(--color-desktop)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const SCENES = [
  { title: "Inbox", icon: Inbox, Scene: InboxScene, steps: INBOX_STEPS },
  {
    title: "Audit log",
    icon: ScrollText,
    Scene: AuditScene,
    steps: AUDIT_STEPS,
  },
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    Scene: DashboardScene,
    steps: 2,
  },
] as const

const shortcutForScene = (
  title: (typeof SCENES)[number]["title"],
  step: number
): ShortcutKey[] | null => {
  if (title === "Dashboard") {
    if (step === 1) return ["option"]
    return null
  }
  return step >= 1 ? ["option", "x"] : null
}

const HeroWindow = ({ title, icon, Scene, steps }: (typeof SCENES)[number]) => {
  const [isOpen, setIsOpen] = useState(true)
  const [step] = useOverlayLoop(true, steps)
  const keys = shortcutForScene(title, step)

  if (!isOpen) return null

  return (
    <div className="relative">
      <article className="flex h-100 flex-col overflow-visible rounded-xl border border-border bg-card">
        <WindowChrome
          icon={icon}
          title={title}
          isPlaying
          onClose={() => setIsOpen(false)}
        />
        <div className="min-h-0 flex-1 px-3 pt-3 pb-3">
          <Scene step={step} />
        </div>
      </article>
      {keys ? <ShortcutPress keys={keys} /> : null}
    </div>
  )
}

export const HeroWindows = ({ className }: { className?: string }) => (
  <section className={cn("mx-auto flex w-full flex-col gap-8", className)}>
    {SCENES.map((scene) => (
      <HeroWindow key={scene.title} {...scene} />
    ))}
  </section>
)
