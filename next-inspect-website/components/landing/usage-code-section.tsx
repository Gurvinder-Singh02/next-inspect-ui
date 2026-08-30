import { UsageCode } from "@/components/landing/usage-code"
import { highlightCode } from "@/lib/highlight-code"

const USAGE_TABS = [
  {
    id: "activate",
    label: "Activate",
    code: `// Press ⌥ + X to toggle inspect mode
// Esc exits inspect mode

// Cursor becomes a crosshair when active`,
  },
  {
    id: "inspect",
    label: "Inspect",
    code: `// Hover any React component

// Overlay highlights the element
// Tooltip shows name · path:line`,
  },
  {
    id: "open",
    label: "Open",
    code: `// Click → open where it's defined
// Hold ⌥ + click → open where it's used

// Opens the file in your editor
// at the exact line and column`,
  },
] as const

export const UsageCodeSection = async () => {
  const tabs = await Promise.all(
    USAGE_TABS.map(async (tab) => ({
      ...tab,
      html: await highlightCode(tab.code, "tsx"),
    }))
  )

  return <UsageCode tabs={tabs} />
}
