export const inspectors = {
  off: { label: "Off", shortcut: "Use the page normally", description: "No inspector is loaded.", docs: "" },
  "next-inspect-ui": { label: "Next Inspect UI", shortcut: "Option + X → hover → Space for the tree", description: "Click or Enter opens the source. Hold Option to climb components.", docs: "https://github.com/Gurvinder-Singh02/next-inspect-ui" },
  "show-component": { label: "Show Component", shortcut: "Option + right-click · add Shift for the tree", description: "Reads React 19 debug stacks and resolves source maps in the browser.", docs: "https://github.com/sidorares/show-component" },
  "react-grab": { label: "React Grab", shortcut: "Hover an element → ⌘C / Ctrl+C", description: "Copies the element and component source context for your agent.", docs: "https://github.com/aidenybai/react-grab" },
  "click-to-react-component": { label: "Click to React Component", shortcut: "Option + click · Option + right-click for the tree", description: "Uses the older _debugSource metadata. Source lookup may fail on React 19; compare its actual behavior here.", docs: "https://github.com/ericclemmons/click-to-component" },
} as const
export type InspectorId = keyof typeof inspectors
export function inspectorId(value: string | undefined): InspectorId {
  return value && Object.hasOwn(inspectors, value) ? value as InspectorId : "off"
}
