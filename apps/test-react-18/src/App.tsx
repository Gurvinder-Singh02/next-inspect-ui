import { useState, version } from "react"
import { Button, ClassBox, ForwardedInput, MemoLabel, NestedButton } from "./fixtures"

type Node = { name: string; source: string | null }
type Probe = { inspect: (element: Element) => Promise<{ nodes: Node[] } | null> }
declare global { interface Window { __inspectUI?: Probe } }
type Case = { id: string; title: string; selector: string; expected: Node[] }
const cases: Case[] = [{"id": "button", "title": "Shared button", "selector": "#button [data-target]", "expected": [{"name": "Button", "source": "src/App.tsx:46"}, {"name": "button", "source": "src/fixtures.tsx:4"}]}, {"id": "nested", "title": "Nested button", "selector": "#nested [data-target]", "expected": [{"name": "Button", "source": "src/fixtures.tsx:22"}, {"name": "button", "source": "src/fixtures.tsx:4"}]}, {"id": "memo", "title": "Memo", "selector": "#memo [data-target]", "expected": [{"name": "MemoLabel", "source": "src/App.tsx:48"}, {"name": "span", "source": "src/fixtures.tsx:8"}]}, {"id": "forward-ref", "title": "Forward ref", "selector": "#forward-ref [data-target]", "expected": [{"name": "ForwardedInput", "source": "src/App.tsx:49"}, {"name": "input", "source": "src/fixtures.tsx:12"}]}, {"id": "class", "title": "Class component", "selector": "#class [data-target]", "expected": [{"name": "ClassBox", "source": "src/App.tsx:50"}, {"name": "div", "source": "src/fixtures.tsx:17"}]}, {"id": "heading", "title": "Plain heading", "selector": "#heading [data-target]", "expected": [{"name": "h2", "source": "src/App.tsx:44"}]}, {"id": "svg", "title": "Plain SVG", "selector": "#svg [data-target]", "expected": [{"name": "rect", "source": "src/App.tsx:45"}]}, {"id": "mapped", "title": "Mapped child", "selector": "#mapped [data-target]", "expected": [{"name": "span", "source": "src/App.tsx:51"}]}]

export function App() {
  const [results, setResults] = useState<Record<string, { pass: boolean; nodes: Node[]; error?: string }>>({})
  const [running, setRunning] = useState(false)
  async function runAll() {
    setRunning(true)
    const next: typeof results = {}
    for (const entry of cases) {
      try {
        const target = document.querySelector(entry.selector)
        if (!target) throw new Error("Target missing")
        if (!window.__inspectUI) await new Promise<void>((resolve, reject) => { const start = Date.now(); const check = () => window.__inspectUI ? resolve() : Date.now() - start > 5000 ? reject(new Error("Inspector not ready")) : setTimeout(check, 50); check() })
        const found = await window.__inspectUI!.inspect(target)
        const nodes = found?.nodes ?? []
        const pass = nodes.length === entry.expected.length && nodes.every((node, i) =>
          node.name === entry.expected[i].name && node.source?.replaceAll("\\", "/").endsWith(entry.expected[i].source!))
        next[entry.id] = { pass, nodes }
      } catch (error) {
        next[entry.id] = { pass: false, nodes: [], error: String(error) }
      }
    }
    setResults(next)
    setRunning(false)
  }
  const passed = Object.values(results).filter(result => result.pass).length
  return (
    <main>
      <header>
        <h1>test-react-18</h1>
        <p>React {version} · Vite · development</p>
        <p>Hover to inspect. Alt + X toggles inspection. Space opens the info panel.</p>
        <p>Experimental React 18 target. Library support remains React 19+.</p>
        <button onClick={() => void runAll()} disabled={running}>{running ? "Running…" : "Run all"}</button>
        <p role="status">{passed} PASS · {Object.keys(results).length - passed} FAIL · {cases.length - Object.keys(results).length} IDLE</p>
      </header>
      <section id="heading"><h2 data-target="heading">Plain heading</h2></section>
      <section id="svg"><svg aria-label="Plain SVG" width="80" height="40"><rect data-target="svg" width="60" height="30" fill="currentColor" /></svg></section>
      <section id="button"><Button /></section>
      <section id="nested"><NestedButton /></section>
      <section id="memo"><MemoLabel /></section>
      <section id="forward-ref"><ForwardedInput /></section>
      <section id="class"><ClassBox /></section>
      <section id="mapped">{["alpha", "beta"].map(item => <span key={item} data-target={item}>{item}</span>)}</section>
      <div className="reports">
        {cases.map(entry => <article key={entry.id}>
          <h2>{entry.title} — {results[entry.id] ? results[entry.id].pass ? "PASS" : "FAIL" : "IDLE"}</h2>
          <h3>Expected</h3><pre>{entry.expected.map(node => `${node.name} · ${node.source}`).join("\n")}</pre>
          <h3>Result</h3><pre>{results[entry.id]?.error ?? results[entry.id]?.nodes.map(node => `${node.name} · ${node.source ?? "Source unavailable"}`).join("\n") ?? "Run the suite"}</pre>
        </article>)}
      </div>
    </main>
  )
}
