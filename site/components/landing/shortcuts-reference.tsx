import { Option } from "lucide-react"

import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

type KeyboardShortcut = {
  keys: React.ReactNode[]
  /** How to join keys — `+` for chords, `/` for alternatives. Default `+`. */
  join?: "+" | "/"
  type: string
  description: string
}

const SHORTCUTS: KeyboardShortcut[] = [
  {
    keys: [<Option key="opt" />, "x"],
    type: "toggle",
    description:
      "Activate or deactivate inspect mode (configurable via `shortcut` / settings).",
  },
  {
    keys: ["Esc"],
    type: "exit",
    description: "Exit inspect mode.",
  },
  {
    keys: ["Hover"],
    type: "action",
    description: "Show the element’s DOM tag and source file.",
  },
  {
    keys: ["Click"],
    type: "action",
    description: "Open the hovered element’s source in the editor.",
  },
  {
    keys: ["Enter"],
    type: "action",
    description: "Open the hovered element’s source (same as click).",
  },
  {
    keys: [<Option key="opt-used" />, "Click"],
    type: "action",
    description:
      "Hold ⌥ to climb to the component that rendered it, then click (or Enter) to open that usage site.",
  },
  {
    keys: [<Option key="opt-shift" />, "⇧"],
    type: "tree",
    description:
      "While holding ⌥, press ⇧ to climb another owner level. At the top, hop to the next parent that has a climb.",
  },
  {
    keys: ["I"],
    type: "panel",
    description:
      "Toggle the info panel — node tree, source links, and CSS.",
  },
  {
    keys: ["↑", "↓"],
    join: "/",
    type: "panel",
    description:
      "Info panel open: climb the Node tree. At the top, hop to the next parent that has a climb. Closed: previous / next sibling.",
  },
  {
    keys: ["["],
    type: "nav",
    description: "Move the spotlight to the parent inspectable element.",
  },
  {
    keys: ["]"],
    type: "nav",
    description: "Move the spotlight to the first child inspectable element.",
  },
  {
    keys: ["←"],
    type: "nav",
    description: "Move to the previous sibling inspectable element.",
  },
  {
    keys: ["→"],
    type: "nav",
    description: "Move to the next sibling inspectable element.",
  },
  {
    keys: ["⌘", "←"],
    type: "nav",
    description: "Jump to the first sibling inspectable element (Ctrl on Windows).",
  },
  {
    keys: ["⌘", "→"],
    type: "nav",
    description: "Jump to the last sibling inspectable element (Ctrl on Windows).",
  },
  {
    keys: [<Option key="opt-minus" />, "−"],
    type: "padding",
    description: "Shrink spotlight padding by 4px on each axis.",
  },
  {
    keys: [<Option key="opt-plus" />, "+"],
    type: "padding",
    description: "Grow spotlight padding by 4px on each axis.",
  },
  {
    keys: ["⌘", "\\"],
    type: "padding",
    description: "Reset spotlight padding to the defaults (Ctrl on Windows).",
  },
]

const ShortcutKeys = ({
  keys,
  join = "+",
}: {
  keys: React.ReactNode[]
  join?: "+" | "/"
}) => (
  <span className="inline-flex flex-wrap items-center gap-1">
    {keys.map((key, index) => (
      <span key={index} className="inline-flex items-center gap-1">
        {index > 0 && (
          <span className="font-inter text-[12px] text-muted-foreground">
            {join}
          </span>
        )}
        <Kbd>{key}</Kbd>
      </span>
    ))}
  </span>
)

const ShortcutRow = ({
  shortcut,
  isLast,
}: {
  shortcut: KeyboardShortcut
  isLast: boolean
}) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 py-4 sm:flex-row sm:items-baseline sm:gap-6",
        !isLast && "border-b border-border"
      )}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:w-[42%]">
        <ShortcutKeys keys={shortcut.keys} join={shortcut.join} />
        <code className="rounded-md bg-muted px-1.5 py-0.5 font-azeret-mono text-[12px] text-muted-foreground">
          {shortcut.type}
        </code>
      </div>
      <p className="font-inter text-[13px] leading-relaxed text-muted-foreground">
        {shortcut.description}
      </p>
    </div>
  )
}

export const ShortcutsReference = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div>
        {SHORTCUTS.map((shortcut, index) => (
          <ShortcutRow
            key={`${shortcut.type}-${index}`}
            shortcut={shortcut}
            isLast={index === SHORTCUTS.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
