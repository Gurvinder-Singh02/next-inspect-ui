import { createElement } from "react"
import { createRoot } from "react-dom/client"
import { InspectUI } from "./inspector.tsx"
import type { InspectUIProps } from "./lib/index.ts"

type ScriptWindow = Window & {
  __NEXT_INSPECT_UI_OPTIONS__?: InspectUIProps
  __NEXT_INSPECT_UI_SCRIPT__?: boolean
}

const start = () => {
  const host = window as ScriptWindow
  if (host.__NEXT_INSPECT_UI_SCRIPT__) return
  host.__NEXT_INSPECT_UI_SCRIPT__ = true
  const container = document.createElement("div")
  container.setAttribute("data-dev-inspector-script-root", "")
  container.style.display = "none"
  document.body.append(container)
  createRoot(container).render(createElement(InspectUI, host.__NEXT_INSPECT_UI_OPTIONS__ ?? {}))
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true })
else start()
