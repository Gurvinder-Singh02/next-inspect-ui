#!/usr/bin/env node
/**
 * Capture Inspect UI NODE TREE goldens for an accuracy route.
 *
 * Requires a running dev server and `agent-browser`.
 *
 * Usage:
 *   pnpm accuracy:capture -- /test
 *   pnpm accuracy:capture -- /test --base http://localhost:3000
 *
 * Prints TypeScript `cases` you can paste into `expected.ts`.
 * Does not import next-inspect-ui-debug — it drives the public overlay only.
 */

import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

const args = process.argv.slice(2).filter((a) => a !== "--")
const route = args.find((a) => a.startsWith("/")) ?? "/test"
const baseIdx = args.indexOf("--base")
const base =
  baseIdx >= 0 && args[baseIdx + 1]
    ? args[baseIdx + 1]
    : "http://localhost:3000"

const ab = existsSync("/opt/homebrew/bin/agent-browser")
  ? "/opt/homebrew/bin/agent-browser"
  : "agent-browser"

const run = (cmd, cmdArgs) => {
  const result = spawnSync(cmd, cmdArgs, {
    encoding: "utf8",
    env: {
      ...process.env,
      AGENT_BROWSER_SESSION:
        process.env.AGENT_BROWSER_SESSION ||
        `accuracy-capture-${Date.now()}`,
    },
  })
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout || `failed: ${cmd}`)
    process.exit(result.status ?? 1)
  }
  return (result.stdout || "").trim()
}

const evalJs = (code) => {
  const out = run(ab, ["eval", code])
  // agent-browser wraps JSON/strings; try parse
  try {
    return JSON.parse(out)
  } catch {
    if (
      (out.startsWith('"') && out.endsWith('"')) ||
      (out.startsWith("'") && out.endsWith("'"))
    ) {
      try {
        return JSON.parse(out)
      } catch {
        return out.slice(1, -1)
      }
    }
    return out
  }
}

console.error(`Capturing ${base}${route}`)
run(ab, ["open", `${base}${route}`])
run(ab, ["wait", "--load", "networkidle"])
run(ab, ["set", "viewport", "1400", "1100"])

// Enable inspect
run(ab, ["press", "Alt+x"])

const caseIds = evalJs(`
(() => [...document.querySelectorAll("[data-accuracy-case]")]
  .map((el) => el.getAttribute("data-accuracy-case"))
  .filter(Boolean))()
`)

if (!Array.isArray(caseIds) || caseIds.length === 0) {
  console.error("No [data-accuracy-case] elements found on the page.")
  run(ab, ["close"])
  process.exit(1)
}

const cases = []

for (const id of caseIds) {
  const coords = evalJs(`
(() => {
  const root = document.querySelector('[data-accuracy-case="${id}"]');
  if (!root) return null;
  const target = root.querySelector("[data-slot=button], button, a, input");
  if (!target) return null;
  target.scrollIntoView({ block: "center" });
  const r = target.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
})()
`)

  if (!coords?.x) {
    console.error(`skip ${id}: no target`)
    continue
  }

  run(ab, ["mouse", "move", String(coords.x), String(coords.y)])
  // reopen info
  run(ab, ["press", "Escape"])
  run(ab, ["press", "Alt+x"])
  run(ab, ["mouse", "move", String(coords.x), String(coords.y)])
  // small wait via eval
  evalJs(`(() => { const t = Date.now(); while (Date.now() - t < 200) {} return true })()`)
  run(ab, ["press", "i"])
  evalJs(`(() => { const t = Date.now(); while (Date.now() - t < 400) {} return true })()`)

  const nodes = evalJs(`
(() => {
  const section = document.querySelector("[data-dev-inspector-owner-tree]");
  if (!section) return null;
  const treeRoot = section.querySelector(":scope > div:last-child");
  if (!treeRoot) return null;
  const strip = (raw) => raw.replace(/^</, "").replace(/\\/>$/, "").replace(/>$/, "").trim();
  const out = [];
  for (const row of treeRoot.children) {
    let name = null;
    for (const span of row.querySelectorAll("span")) {
      const text = (span.textContent || "").trim();
      if (text.startsWith("<") && text.includes(">")) { name = strip(text); break; }
    }
    const pathBtn = [...row.querySelectorAll("button")].find((b) => {
      const label = (b.getAttribute("title") || b.textContent || "").trim();
      return /\\.(tsx|ts|jsx|js)/.test(label);
    });
    const source = pathBtn?.getAttribute("title")?.trim() || (pathBtn?.textContent || "").trim() || null;
    if (!name) continue;
    const lastColon = (source || "").lastIndexOf(":");
    const line = lastColon > 0 ? Number(source.slice(lastColon + 1)) : undefined;
    const file = lastColon > 0 && Number.isFinite(line) ? source.slice(0, lastColon) : (source || "");
    out.push({ name, file, ...(Number.isFinite(line) ? { line } : {}) });
  }
  return out;
})()
`)

  const label =
    evalJs(`
(() => {
  const root = document.querySelector('[data-accuracy-case="${id}"]');
  const labelEl = root?.parentElement?.querySelector(".uppercase, [class*=uppercase]");
  return (labelEl?.textContent || "${id}").trim();
})()
`) || id

  cases.push({
    id,
    label,
    selector: "[data-slot=button]",
    nodes: Array.isArray(nodes) ? nodes : [],
  })

  console.error(`✓ ${id}: ${Array.isArray(nodes) ? nodes.length : 0} nodes`)
}

run(ab, ["close"])

const printed = {
  route,
  cases,
}

console.log(`import type { AccuracyRouteExpected } from "@/components/accuracy/types"

export const capturedExpected = ${JSON.stringify(printed, null, 2)} satisfies AccuracyRouteExpected
`)

console.error(
  `\nPaste into ${resolve("app/(dev)/test/cases.ts")}`
)
