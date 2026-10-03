"use client"

import dynamic from "next/dynamic"
import { inspectors, type InspectorId } from "@/lib/inspectors"

const NextInspector = dynamic(() => import("next-inspect-ui").then(module => module.InspectUI), { ssr: false })
const ShowInspector = dynamic(() => import("show-component").then(module => module.ShowComponent), { ssr: false })
const ClickInspector = dynamic(() => import("click-to-react-component").then(module => module.ClickToComponent), { ssr: false })

export function InspectorSwitch({ selected, projectRoot }: { selected: InspectorId; projectRoot: string }) {
  const active = inspectors[selected]
  function select(value: string) {
    document.cookie = `competitor-inspector=${encodeURIComponent(value)}; Path=/; SameSite=Lax`
    window.location.reload()
  }
  return (
    <>
      <aside className="inspector-dock" aria-label="Inspector comparison tools" data-react-grab-ignore data-dev-inspector-debug-toggle>
        <div className="dock-heading"><span className={`live-dot ${selected === "off" ? "off" : ""}`} /><strong>Inspector lab</strong><span className="dock-stack">NEXT 16 · REACT 19 · TURBOPACK</span></div>
        <div className="dock-controls">
          <label htmlFor="inspection-library">Library</label>
          <select id="inspection-library" value={selected} onChange={event => select(event.target.value)}>
            {Object.entries(inspectors).map(([id, inspector]) => <option key={id} value={id}>{inspector.label}</option>)}
          </select>
          <span className="shortcut">{active.shortcut}</span>
          {active.docs && <a href={active.docs} target="_blank" rel="noreferrer">Source ↗</a>}
        </div>
        <p>{active.description} <span className="reload-note">Switching reloads the page; one library runs at a time.</span></p>
      </aside>
      {selected === "next-inspect-ui" && <NextInspector projectRoot={projectRoot} />}
      {selected === "show-component" && <ShowInspector sourceRoot={projectRoot} editorScheme="cursor" />}
      {selected === "click-to-react-component" && <ClickInspector editor="cursor" />}
    </>
  )
}
