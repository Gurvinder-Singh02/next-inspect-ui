"use client"

import { Minus, Plus } from "lucide-react"
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  formatInspectorComponentSnippet,
  formatShortcutFromEvent,
  formatShortcutParts,
  getInspectorSettings,
  initInspectorSettings,
  INSPECTOR_COLORS,
  resetInspectorSettings,
  setDevSpotlightProps,
  setInspectorSettings,
  setTooltipProps,
  spotlightDefaultsForColor,
  ALIGN_OFFSET_MAX,
  ALIGN_OFFSET_MIN,
  BORDER_RADIUS_MAX,
  BORDER_RADIUS_MIN,
  PADDING_MAX,
  PADDING_MIN,
  SIDE_OFFSET_MAX,
  SIDE_OFFSET_MIN,
  STROKE_WIDTH_MAX,
  STROKE_WIDTH_MIN,
  STROKE_WIDTH_STEP,
  TOOLTIP_PADDING_MAX,
  TOOLTIP_PADDING_MIN,
  TOOLTIP_RADIUS_MAX,
  TOOLTIP_RADIUS_MIN,
  subscribeInspectorSettings,
  tooltipDefaultsForColor,
  type InspectorColor,
  type InspectorIde,
  type InspectorStrokeStyle,
  type TooltipAlign,
  type TooltipSide,
} from "next-inspect-ui"
import { cn } from "@/lib/utils"

const normalizeHex = (value: string) => {
  const raw = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase()
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase()
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase()
  }
  return "#000000"
}

const hexToRgb = (hex: string) => {
  const normalized = normalizeHex(hex).slice(1)
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

const hexToHsv = (hex: string) => {
  const { r, g, b } = hexToRgb(hex)
  const rN = r / 255
  const gN = g / 255
  const bN = b / 255
  const max = Math.max(rN, gN, bN)
  const min = Math.min(rN, gN, bN)
  const delta = max - min
  const v = max
  const s = max === 0 ? 0 : delta / max
  let h = 0

  if (delta !== 0) {
    if (max === rN) h = ((gN - bN) / delta + (gN < bN ? 6 : 0)) / 6
    else if (max === gN) h = ((bN - rN) / delta + 2) / 6
    else h = ((rN - gN) / delta + 4) / 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  }
}

const hsvToHex = (h: number, s: number, v: number) => {
  const sN = s / 100
  const vN = v / 100
  const c = vN * sN
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = vN - c
  let r = 0
  let g = 0
  let b = 0

  if (h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }

  const toHex = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, "0")

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const COLOR_OPTIONS = Object.keys(INSPECTOR_COLORS) as InspectorColor[]

const IDE_OPTIONS: { value: InspectorIde; label: string }[] = [
  { value: "cursor", label: "Cursor" },
  { value: "vscode", label: "VS Code" },
  { value: "vscode-insiders", label: "VS Code Insiders" },
  { value: "windsurf", label: "Windsurf" },
  { value: "zed", label: "Zed" },
]

const STROKE_STYLES: { value: InspectorStrokeStyle; label: string }[] = [
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
  { value: "solid", label: "Solid" },
]

const TOOLTIP_SIDES: { value: TooltipSide; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "right", label: "Right" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
]

const TOOLTIP_ALIGNS: { value: TooltipAlign; label: string }[] = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
]

export const useInspectorSettings = () =>
  useSyncExternalStore(
    subscribeInspectorSettings,
    getInspectorSettings,
    getInspectorSettings
  )

const KitSection = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <section>
    <div className="px-4 py-2.5 pt-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
      {title}
    </div>
    <div className="flex flex-col gap-1 px-3 pb-3">{children}</div>
  </section>
)

const KitDivider = () => <div className="mx-3 h-px bg-border" />

const KitSlider = ({
  label,
  value,
  min,
  max,
  suffix = "",
  step = 1,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  suffix?: string
  step?: number
  onChange: (value: number) => void
}) => {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="relative h-10 select-none">
      <div className="absolute inset-0 overflow-hidden rounded-[10px] bg-secondary">
        <div
          className="absolute inset-y-0 left-0 rounded-l-[10px] bg-foreground/15"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="absolute inset-0 z-10 m-0 h-full w-full cursor-ew-resize appearance-none opacity-0"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-[14px]">
        <span className="text-[13px] font-medium text-muted-foreground">
          {label}
        </span>
        <span className="text-[13px] font-medium text-foreground/70 tabular-nums">
          {Number.isInteger(step) ? value : value.toFixed(1)}
          {suffix}
        </span>
      </div>
    </div>
  )
}

const KitColorArea = ({
  color,
  onColorChange,
}: {
  color: string
  onColorChange: (color: string) => void
}) => {
  const [dragging, setDragging] = useState(false)
  const [localHsv, setLocalHsv] = useState(() => hexToHsv(color))
  const hsv = dragging ? localHsv : hexToHsv(color)
  const hsvRef = useRef(hsv)
  const areaRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)

  const applyAreaPoint = (clientX: number, clientY: number) => {
    const rect = areaRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    const next = {
      h: hsvRef.current.h,
      s: Math.round(x * 100),
      v: Math.round((1 - y) * 100),
    }
    hsvRef.current = next
    setLocalHsv(next)
    onColorChange(hsvToHex(next.h, next.s, next.v))
  }

  const applyHuePoint = (clientX: number) => {
    const rect = hueRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const next = {
      h: Math.round(x * 360),
      s: hsvRef.current.s,
      v: hsvRef.current.v,
    }
    hsvRef.current = next
    setLocalHsv(next)
    onColorChange(hsvToHex(next.h, next.s, next.v))
  }

  const startAreaDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    const target = event.currentTarget
    const seed = hexToHsv(color)
    hsvRef.current = seed
    setLocalHsv(seed)
    setDragging(true)
    target.setPointerCapture(event.pointerId)
    applyAreaPoint(event.clientX, event.clientY)

    const onMove = (moveEvent: PointerEvent) => {
      applyAreaPoint(moveEvent.clientX, moveEvent.clientY)
    }
    const onUp = (upEvent: PointerEvent) => {
      setDragging(false)
      target.releasePointerCapture(upEvent.pointerId)
      target.removeEventListener("pointermove", onMove)
      target.removeEventListener("pointerup", onUp)
    }
    target.addEventListener("pointermove", onMove)
    target.addEventListener("pointerup", onUp)
  }

  const startHueDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    const target = event.currentTarget
    const seed = hexToHsv(color)
    hsvRef.current = seed
    setLocalHsv(seed)
    setDragging(true)
    target.setPointerCapture(event.pointerId)
    applyHuePoint(event.clientX)

    const onMove = (moveEvent: PointerEvent) => {
      applyHuePoint(moveEvent.clientX)
    }
    const onUp = (upEvent: PointerEvent) => {
      setDragging(false)
      target.releasePointerCapture(upEvent.pointerId)
      target.removeEventListener("pointermove", onMove)
      target.removeEventListener("pointerup", onUp)
    }
    target.addEventListener("pointermove", onMove)
    target.addEventListener("pointerup", onUp)
  }

  const hueColor = hsvToHex(hsv.h, 100, 100)
  const thumbLeft = Math.min((hsv.h / 360) * 100, 100 - 9.09)

  return (
    <div className="flex flex-col gap-1.5">
      <div
        ref={areaRef}
        className="relative isolate h-32 w-full cursor-crosshair overflow-hidden rounded-md"
        onPointerDown={startAreaDrag}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: hueColor }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, white, transparent)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, transparent, black)",
          }}
        />
        <div
          className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-md"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            backgroundColor: color,
          }}
        />
      </div>

      <div
        ref={hueRef}
        className="relative h-8 cursor-pointer select-none"
        onPointerDown={startHueDrag}
      >
        <div
          className="absolute inset-0 overflow-hidden rounded-lg"
          style={{
            background:
              "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
          }}
        />
        <div
          className="pointer-events-none absolute -top-0.5 -bottom-0.5 w-[9.09%] rounded-md border-2 border-background shadow-lg"
          style={{ left: `${thumbLeft}%`, backgroundColor: hueColor }}
        />
      </div>
    </div>
  )
}

const KitHexInput = ({
  color,
  onColorChange,
}: {
  color: string
  onColorChange: (color: string) => void
}) => {
  const [value, setValue] = useState(color.replace("#", "").toUpperCase())

  useEffect(() => {
    setValue(color.replace("#", "").toUpperCase())
  }, [color])

  const submit = () => {
    const cleaned = value.replace("#", "").trim()
    if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
      onColorChange(`#${cleaned.toLowerCase()}`)
      return
    }
    setValue(color.replace("#", "").toUpperCase())
  }

  return (
    <div className="flex h-8 items-center gap-1.5 rounded-lg bg-secondary px-2.5">
      <span className="shrink-0 text-[12px] font-medium text-muted-foreground">
        #
      </span>
      <input
        type="text"
        value={value}
        spellCheck={false}
        maxLength={6}
        aria-label="Hex color"
        onChange={(event) =>
          setValue(event.target.value.toUpperCase().slice(0, 6))
        }
        onBlur={submit}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit()
        }}
        className="h-8 w-full bg-transparent font-mono text-[12px] text-foreground/70 outline-none"
      />
    </div>
  )
}

const KitColorRow = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) => {
  const [open, setOpen] = useState(false)
  const pickerValue = normalizeHex(value)
  const displayHex = pickerValue.replace("#", "").toUpperCase()

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen, details) => {
        if (details.reason === "trigger-press") {
          details.cancel()
          setOpen((wasOpen) => !wasOpen)
          return
        }
        setOpen(nextOpen)
      }}
    >
      <PopoverTrigger className="flex h-10 w-full cursor-pointer items-center justify-between rounded-[10px] bg-secondary px-[14px] transition-colors outline-none hover:bg-foreground/10">
        <span className="text-[13px] font-medium text-muted-foreground">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="size-3.5 rounded-[4px] border border-border"
            style={{ backgroundColor: pickerValue }}
            aria-hidden
          />
          <span className="font-mono text-[13px] font-medium text-foreground/80">
            {displayHex}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="left"
        align="start"
        sideOffset={16}
        className="z-[999999] w-[240px] animate-none gap-1.5 rounded-xl border-0 bg-popover p-2 text-popover-foreground shadow-lg ring-0 outline-none data-open:zoom-in-100 data-closed:zoom-out-100"
      >
        <KitColorArea color={pickerValue} onColorChange={onChange} />
        <KitHexInput color={pickerValue} onColorChange={onChange} />
      </PopoverContent>
    </Popover>
  )
}

const KitToggleRow = ({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-cuelume-toggle="toggle"
      onClick={() => onCheckedChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg py-2 transition-colors"
    >
      <span className="text-[13px] font-medium text-foreground/80">
        {label}
      </span>
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-input"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-background shadow-sm transition-[left]",
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
    </button>
  )
}

const KitStepperRow = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) => {
  const [draft, setDraft] = useState(value.toFixed(step < 1 ? 1 : 0))

  useEffect(() => {
    setDraft(value.toFixed(step < 1 ? 1 : 0))
  }, [value, step])

  const commitDraft = () => {
    const parsed = Number.parseFloat(draft)
    if (Number.isNaN(parsed)) {
      setDraft(value.toFixed(step < 1 ? 1 : 0))
      return
    }
    onChange(Math.min(max, Math.max(min, parsed)))
  }

  const stepDown = () => onChange(Math.max(min, value - step))
  const stepUp = () => onChange(Math.min(max, value + step))

  return (
    <div className="flex h-10 items-center justify-between rounded-[10px] bg-secondary pr-1.5 pl-[14px]">
      <span className="text-[13px] font-medium text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          data-cuelume-press
          data-cuelume-release
          onClick={stepDown}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-opacity hover:text-muted-foreground"
        >
          <Minus className="size-3.5" />
        </button>
        <input
          aria-label={label}
          value={draft}
          inputMode="decimal"
          spellCheck={false}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur()
            }
          }}
          className="h-7 w-12 rounded-md bg-transparent text-center font-mono text-[13px] font-medium text-foreground/80 tabular-nums outline-none hover:bg-foreground/10 focus:bg-foreground/15"
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          data-cuelume-press
          data-cuelume-release
          onClick={stepUp}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-opacity hover:text-muted-foreground"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Reset ${label} to 0`}
          data-cuelume-press
          data-cuelume-release
          onClick={() => onChange(0)}
          className="ml-0.5 flex h-7 items-center justify-center rounded-md px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          0
        </button>
      </div>
    </div>
  )
}

const KitShortcutKeys = ({
  shortcut,
  className,
}: {
  shortcut: string
  className?: string
}) => {
  const parts = formatShortcutParts(shortcut)

  if (parts.length === 0) {
    return (
      <span
        className={cn(
          "text-[13px] font-medium text-muted-foreground",
          className
        )}
      >
        Waiting…
      </span>
    )
  }

  return (
    <KbdGroup className={className}>
      {parts.map((part, index) => (
        <Kbd key={`${part}-${index}`}>{part}</Kbd>
      ))}
    </KbdGroup>
  )
}

const KitShortcutCapture = ({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
        return
      }

      const next = formatShortcutFromEvent(event)
      if (!next) return

      event.preventDefault()
      event.stopPropagation()
      onChange(next)
      setOpen(false)
    }

    window.addEventListener("keydown", onKeyDown, true)
    return () => {
      window.removeEventListener("keydown", onKeyDown, true)
    }
  }, [open, onChange])

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen, details) => {
        if (details.reason === "trigger-press") {
          details.cancel()
          setOpen((wasOpen) => !wasOpen)
          return
        }
        setOpen(nextOpen)
      }}
    >
      <PopoverTrigger className="flex h-10 w-full cursor-pointer items-center justify-between rounded-[10px] bg-secondary px-[14px] transition-colors outline-none hover:bg-foreground/10">
        <span className="text-[13px] font-medium text-muted-foreground">
          Toggle
        </span>
        <KitShortcutKeys shortcut={value} />
      </PopoverTrigger>
      <PopoverContent
        side="left"
        align="start"
        sideOffset={16}
        className="z-[999999] w-[220px] animate-none gap-2 rounded-xl border-0 bg-popover p-3 text-popover-foreground shadow-lg ring-0 outline-none data-open:zoom-in-100 data-closed:zoom-out-100"
      >
        <p className="text-[13px] font-medium text-foreground/80">
          Press a shortcut
        </p>
        <p className="flex flex-wrap items-center gap-1 text-[11px] leading-snug text-muted-foreground">
          Use
          <KbdGroup>
            <Kbd>⌥</Kbd>
            <Kbd>⌘</Kbd>
            <Kbd>⌃</Kbd>
            <Kbd>⇧</Kbd>
          </KbdGroup>
          with a key.
          <Kbd>Esc</Kbd>
          cancels.
        </p>
        <div className="flex items-center justify-center rounded-lg bg-secondary px-3 py-2">
          <KitShortcutKeys shortcut={value} />
        </div>
      </PopoverContent>
    </Popover>
  )
}

const KitSegmented = ({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) => {
  return (
    <div className="flex h-9 items-center gap-1 rounded-[10px] bg-secondary p-1">
      {options.map((option) => {
        const isActive = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            data-cuelume-toggle="toggle"
            onClick={() => onChange(option.value)}
            className={cn(
              "h-7 flex-1 rounded-md text-[12px] font-medium transition-colors",
              isActive
                ? "bg-foreground/15 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

const KitRadioList = ({
  value,
  options,
  onChange,
  name,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  name: string
}) => {
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="flex flex-col gap-0.5"
    >
      {options.map((option) => {
        const id = `${name}-${option.value}`

        return (
          <label
            key={option.value}
            htmlFor={id}
            className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-foreground/5"
          >
            <RadioGroupItem value={option.value} id={id} />
            <span className="text-[13px] font-medium text-foreground/80">
              {option.label}
            </span>
          </label>
        )
      })}
    </RadioGroup>
  )
}

export const InspectorSettingsControls = ({
  className,
}: {
  className?: string
}) => {
  const settings = useInspectorSettings()
  const spotlight = settings.devSpotlightProps
  const tooltip = settings.tooltipProps

  useEffect(() => {
    initInspectorSettings()
  }, [])

  return (
    <div
      data-interface-kit-settings
      className={cn(
        "dark flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card text-card-foreground shadow-xl",
        className
      )}
    >
      <div className="min-h-0 flex-1 scroll-fade-y overflow-y-scroll">
        <KitSection title="Editor">
          <KitRadioList
            name="inspector-ide"
            value={settings.ide}
            options={IDE_OPTIONS}
            onChange={(ide) =>
              setInspectorSettings({ ide: ide as InspectorIde })
            }
          />
        </KitSection>

        <KitDivider />

        <KitSection title="Shortcut">
          <KitShortcutCapture
            value={settings.shortcut}
            onChange={(shortcut) => setInspectorSettings({ shortcut })}
          />
        </KitSection>

        <KitDivider />

        <KitSection title="Spotlight">
          <div className="flex h-10 items-center justify-between gap-3 rounded-[10px] bg-secondary pr-1.5 pl-[14px]">
            <span className="text-[13px] font-medium text-muted-foreground">
              Preset
            </span>
            <div className="flex h-7 items-center gap-0.5 rounded-md p-0.5">
              {COLOR_OPTIONS.map((color) => {
                const swatch = INSPECTOR_COLORS[color]
                const isActive =
                  spotlight.background === swatch.stroke &&
                  spotlight.border === swatch.stroke

                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={swatch.label}
                    aria-pressed={isActive}
                    data-cuelume-toggle="toggle"
                    onClick={() => {
                      setInspectorSettings({
                        devSpotlightProps: spotlightDefaultsForColor(color),
                        tooltipProps: tooltipDefaultsForColor(color),
                      })
                    }}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-md transition-colors",
                      isActive ? "bg-foreground/15" : "hover:bg-foreground/10"
                    )}
                  >
                    <span
                      className={cn(
                        "size-3 rounded-[3px] border",
                        color === "white"
                          ? "border-border"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: swatch.stroke }}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          <KitColorRow
            label="Background"
            value={spotlight.background}
            onChange={(background) => setDevSpotlightProps({ background })}
          />
          <KitColorRow
            label="Border"
            value={spotlight.border}
            onChange={(border) => setDevSpotlightProps({ border })}
          />
          <KitSlider
            label="BG opacity"
            value={Math.round(spotlight.bgOpacity * 100)}
            min={0}
            max={100}
            suffix="%"
            onChange={(next) => setDevSpotlightProps({ bgOpacity: next / 100 })}
          />
          <KitSlider
            label="Stroke opacity"
            value={Math.round(spotlight.strokeOpacity * 100)}
            min={0}
            max={100}
            suffix="%"
            onChange={(next) =>
              setDevSpotlightProps({ strokeOpacity: next / 100 })
            }
          />
          <KitStepperRow
            label="Stroke"
            value={spotlight.strokeWidth}
            min={STROKE_WIDTH_MIN}
            max={STROKE_WIDTH_MAX}
            step={STROKE_WIDTH_STEP}
            onChange={(strokeWidth) => setDevSpotlightProps({ strokeWidth })}
          />
          <KitSlider
            label="Roundness"
            value={spotlight.borderRadius}
            min={BORDER_RADIUS_MIN}
            max={BORDER_RADIUS_MAX}
            suffix="px"
            onChange={(borderRadius) => setDevSpotlightProps({ borderRadius })}
          />
          <KitSlider
            label="Padding X"
            value={spotlight.paddingX}
            min={PADDING_MIN}
            max={PADDING_MAX}
            suffix="px"
            onChange={(paddingX) => setDevSpotlightProps({ paddingX })}
          />
          <KitSlider
            label="Padding Y"
            value={spotlight.paddingY}
            min={PADDING_MIN}
            max={PADDING_MAX}
            suffix="px"
            onChange={(paddingY) => setDevSpotlightProps({ paddingY })}
          />
          <KitSegmented
            value={spotlight.strokeStyle}
            options={STROKE_STYLES}
            onChange={(strokeStyle) =>
              setDevSpotlightProps({
                strokeStyle: strokeStyle as InspectorStrokeStyle,
              })
            }
          />
          <KitToggleRow
            label="Animated"
            checked={spotlight.animated}
            onCheckedChange={(animated) => setDevSpotlightProps({ animated })}
          />
        </KitSection>

        <KitDivider />

        <KitSection title="Tooltip">
          <KitColorRow
            label="Background"
            value={tooltip.background}
            onChange={(background) => setTooltipProps({ background })}
          />
          <KitColorRow
            label="Border"
            value={tooltip.border}
            onChange={(border) => setTooltipProps({ border })}
          />
          <KitColorRow
            label="Text"
            value={tooltip.text}
            onChange={(text) => setTooltipProps({ text })}
          />
          <KitSegmented
            value={tooltip.side}
            options={TOOLTIP_SIDES}
            onChange={(side) => setTooltipProps({ side: side as TooltipSide })}
          />
          <KitSegmented
            value={tooltip.align}
            options={TOOLTIP_ALIGNS}
            onChange={(align) =>
              setTooltipProps({ align: align as TooltipAlign })
            }
          />
          <KitSlider
            label="Side offset"
            value={tooltip.sideOffset}
            min={SIDE_OFFSET_MIN}
            max={SIDE_OFFSET_MAX}
            suffix="px"
            onChange={(sideOffset) => setTooltipProps({ sideOffset })}
          />
          <KitSlider
            label="Align offset"
            value={tooltip.alignOffset}
            min={ALIGN_OFFSET_MIN}
            max={ALIGN_OFFSET_MAX}
            suffix="px"
            onChange={(alignOffset) => setTooltipProps({ alignOffset })}
          />
          <KitSlider
            label="Padding X"
            value={tooltip.paddingX}
            min={TOOLTIP_PADDING_MIN}
            max={TOOLTIP_PADDING_MAX}
            suffix="px"
            onChange={(paddingX) => setTooltipProps({ paddingX })}
          />
          <KitSlider
            label="Padding Y"
            value={tooltip.paddingY}
            min={TOOLTIP_PADDING_MIN}
            max={TOOLTIP_PADDING_MAX}
            suffix="px"
            onChange={(paddingY) => setTooltipProps({ paddingY })}
          />
          <KitSlider
            label="Rounded"
            value={tooltip.borderRadius}
            min={TOOLTIP_RADIUS_MIN}
            max={TOOLTIP_RADIUS_MAX}
            suffix="px"
            onChange={(borderRadius) => setTooltipProps({ borderRadius })}
          />
          <KitToggleRow
            label="Show title"
            checked={tooltip.showTitle}
            onCheckedChange={(showTitle) => setTooltipProps({ showTitle })}
          />
          <KitToggleRow
            label="Show page name"
            checked={tooltip.showPageName}
            onCheckedChange={(showPageName) =>
              setTooltipProps({ showPageName })
            }
          />
        </KitSection>

        <KitDivider />

        <KitSection title="Snippet">
          <pre className="overflow-x-auto rounded-[10px] bg-secondary p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/70">
            {formatInspectorComponentSnippet(settings)}
          </pre>
        </KitSection>
      </div>

      <div className="shrink-0 border-t border-border/50 px-3 pt-3 pb-3">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"

            onClick={() => {
              resetInspectorSettings()
            }}
          >
            Reset
          </Button>
          {/* <div className="h-px bg-border" /> */}
          <CopySnippetButton
            snippet={formatInspectorComponentSnippet(settings)}
          />
        </div>
      </div>
    </div>
  )
}

const CopySnippetButton = ({ snippet }: { snippet: string }) => {
  const [hasCopied, setHasCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setHasCopied(true)
      window.setTimeout(() => setHasCopied(false), 1600)
    } catch {
      setHasCopied(false)
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="default"
      className="flex-1"
      aria-label={hasCopied ? "Copied" : "Copy code"}
      onClick={() => {
        void handleCopy()
      }}
    >
      {hasCopied ? "Copied" : "Copy Code"}
    </Button>
  )
}
