/**
 * Production-cost harness for next-inspect-ui.
 *
 * Builds the same one-page fixture under several wiring scenarios and
 * reports, per scenario:
 *   - client bytes:  .next/static  (raw + gzip), delta vs baseline
 *   - server bytes:  .next/server  (raw), delta vs baseline
 *   - sentinel grep: strings that exist only in the library must not appear
 *     in production output
 *   - path leak:     the projectRoot value must not appear in served HTML
 *
 * Scenarios rewrite app/layout.jsx and next.config.mjs in place, then run
 * `next build`. Run from prod-test/: `pnpm measure`.
 */

import { execSync } from "node:child_process"
import { gzipSync } from "node:zlib"
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  rmSync,
  existsSync,
} from "node:fs"
import { join } from "node:path"

const ROOT = new URL(".", import.meta.url).pathname

// Strings that exist only inside the library. "data-inspect-host"/"-owner"
// are the stamp attributes; the two phrases live in the overlay's body and
// prove the component code itself, not just re-exported helpers, is present.
const SENTINELS = [
  "data-inspect-host",
  "data-inspect-owner",
  "Could not resolve source",
  "inspect mode on",
]

const LAYOUTS = {
  baseline: `export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`,
  gated: `import { InspectUI } from "next-inspect-ui"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NODE_ENV === "development" && (
          <InspectUI projectRoot={process.cwd()} />
        )}
      </body>
    </html>
  )
}
`,
  ungated: `import { InspectUI } from "next-inspect-ui"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <InspectUI projectRoot={process.cwd()} />
      </body>
    </html>
  )
}
`,
}

const CONFIGS = {
  plain: `const nextConfig = {}
export default nextConfig
`,
  plugin: `import { withInspectUI } from "next-inspect-ui-debug"

const nextConfig = {}
export default withInspectUI(nextConfig)
`,
}

const SCENARIOS = [
  { id: "P0", label: "baseline (no library)", layout: "baseline", config: "plain" },
  { id: "P1", label: "README pattern (NODE_ENV-gated)", layout: "gated", config: "plain" },
  { id: "P2", label: "ungated <InspectUI/>", layout: "ungated", config: "plain" },
  { id: "P3", label: "gated + withInspectUI plugin", layout: "gated", config: "plugin" },
]

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const stats = statSync(path)
    if (stats.isDirectory()) walk(path, out)
    else out.push(path)
  }
  return out
}

const dirBytes = (dir) => {
  if (!existsSync(dir)) return { raw: 0, gzip: 0 }
  let raw = 0
  let gzip = 0
  for (const file of walk(dir)) {
    const buf = readFileSync(file)
    raw += buf.length
    gzip += gzipSync(buf, { level: 9 }).length
  }
  return { raw, gzip }
}

const grepSentinels = (dir) => {
  if (!existsSync(dir)) return []
  const hits = new Set()
  for (const file of walk(dir)) {
    if (/\.(png|jpg|ico|woff2?)$/.test(file)) continue
    const text = readFileSync(file, "latin1")
    for (const sentinel of SENTINELS) {
      if (text.includes(sentinel)) hits.add(sentinel)
    }
  }
  return [...hits]
}

const grepHtmlForPath = (dir, needle) => {
  if (!existsSync(dir)) return false
  return walk(dir)
    .filter((file) => file.endsWith(".html") || file.endsWith(".rsc"))
    .some((file) => readFileSync(file, "utf8").includes(needle))
}

const firstLoadJs = (buildOutput) => {
  // Next prints e.g. "├ ○ /  1.2 kB  118 kB" — but the "First Load JS"
  // summary line is stabler across versions.
  const match = buildOutput.match(/First Load JS[^\n]*?([\d.]+\s*[km]?B)/i)
  return match ? match[1].replace(/\s+/g, " ").trim() : "n/a"
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`
const delta = (bytes, base) => {
  const diff = bytes - base
  if (diff === 0) return "±0"
  return `${diff > 0 ? "+" : "−"}${kb(Math.abs(diff))}`
}

const results = []
let baseline = null

for (const scenario of SCENARIOS) {
  writeFileSync(join(ROOT, "app/layout.jsx"), LAYOUTS[scenario.layout])
  writeFileSync(join(ROOT, "next.config.mjs"), CONFIGS[scenario.config])
  rmSync(join(ROOT, ".next"), { recursive: true, force: true })

  console.log(`\n=== ${scenario.id} · ${scenario.label} ===`)
  let output = ""
  try {
    output = execSync("npx next build", {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    })
  } catch (error) {
    console.error(`${scenario.id} BUILD FAILED`)
    console.error(error.stdout ?? "", error.stderr ?? "")
    results.push({ ...scenario, failed: true })
    continue
  }

  const client = dirBytes(join(ROOT, ".next/static"))
  const server = dirBytes(join(ROOT, ".next/server"))
  const clientSentinels = grepSentinels(join(ROOT, ".next/static"))
  const serverSentinels = grepSentinels(join(ROOT, ".next/server"))
  const pathLeak = grepHtmlForPath(join(ROOT, ".next/server"), ROOT.replace(/\/$/, ""))

  const row = {
    ...scenario,
    firstLoad: firstLoadJs(output),
    client,
    server,
    clientSentinels,
    serverSentinels,
    pathLeak,
  }
  if (scenario.id === "P0") baseline = row
  results.push(row)

  console.log(`first load JS       ${row.firstLoad}`)
  console.log(`client (static)     ${kb(client.raw)} raw · ${kb(client.gzip)} gzip`)
  console.log(`server (.next/server) ${kb(server.raw)} raw`)
  console.log(`client sentinels    ${clientSentinels.length ? clientSentinels.join(", ") : "none"}`)
  console.log(`server sentinels    ${serverSentinels.length ? serverSentinels.join(", ") : "none"}`)
  console.log(`projectRoot in HTML ${pathLeak ? "LEAKED" : "no"}`)
}

console.log("\n\n## Results vs baseline\n")
console.log("| case | first load JS | client raw Δ | client gzip Δ | server raw Δ | sentinels (client) | path leak |")
console.log("|---|---|---|---|---|---|---|")
for (const row of results) {
  if (row.failed) {
    console.log(`| ${row.id} ${row.label} | BUILD FAILED | | | | | |`)
    continue
  }
  console.log(
    `| ${row.id} ${row.label} | ${row.firstLoad} | ${delta(row.client.raw, baseline.client.raw)} | ${delta(
      row.client.gzip,
      baseline.client.gzip
    )} | ${delta(row.server.raw, baseline.server.raw)} | ${
      row.clientSentinels.length ? row.clientSentinels.join(", ") : "none"
    } | ${row.pathLeak ? "LEAKED" : "no"} |`
  )
}

// Leave the fixture in the safest state for the next reader.
writeFileSync(join(ROOT, "app/layout.jsx"), LAYOUTS.gated)
writeFileSync(join(ROOT, "next.config.mjs"), CONFIGS.plain)
