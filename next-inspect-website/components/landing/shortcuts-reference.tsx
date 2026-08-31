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
      "Activate or deactivate inspect mode (configurable via `shortcut`).",
  },
  {
    keys: ["Esc"],
    type: "exit",
    description: "Exit inspect mode.",
  },
  {
    keys: ["Click"],
    type: "action",
    description: "Open where the component is defined.",
  },
  {
    keys: ["Enter"],
    type: "action",
    description: "Open where the component is defined (same as click).",
  },
  {
    keys: [<Option key="opt-used" />, "Click"],
    type: "action",
    description:
      "Hold ⌥ to preview the usage site, then click (or Enter) to open it.",
  },
  {
    keys: [<Option key="opt-shift" />, "⇧"],
    type: "tree",
    description:
      "While holding ⌥, press ⇧ to walk up the used-in owner chain. At the top, hop to the next parent that has a climb.",
  },
  {
    keys: [<Option key="opt-ctrl" />, "⌃"],
    type: "tree",
    description:
      "While holding ⌥, press ⌃ (Control) to walk back down the owner chain.",
  },
  {
    keys: ["i"],
    type: "panel",
    description:
      "Toggle the info panel — source links, owner tree (└─ parents), and styles.",
  },
  {
    keys: ["↑", "↓"],
    join: "/",
    type: "panel",
    description:
      "Info panel open: climb the Node tree. At the top, hop to the next parent that has a climb and show it. Closed: previous / next sibling.",
  },
  {
    keys: ["⌘", "["],
    type: "nav",
    description:
      "Move the spotlight to the parent inspectable element.",
  },
  {
    keys: ["⌘", "]"],
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
    description: "Jump to the first sibling inspectable element.",
  },
  {
    keys: ["⌘", "→"],
    type: "nav",
    description: "Jump to the last sibling inspectable element.",
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
    description: "Reset spotlight padding to the defaults.",
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
