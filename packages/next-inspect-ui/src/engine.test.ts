import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

import {
  isClimbUsageBoundary,
  resolveSourceMapSourcePath,
} from "./engine.ts"

const loc = (filePath: string) => ({ filePath, line: 1, column: 1 })

test("stops once usage is a project file distinct from the definition", () => {
  assert.equal(
    isClimbUsageBoundary({
      usage: loc("/app/components/section-cards.tsx"),
      definition: loc("/app/components/ui/card.tsx"),
    }),
    true
  )
})

test("stops when usage differs from the host file even without a definition", () => {
  assert.equal(
    isClimbUsageBoundary({
      usage: loc("/app/components/section-cards.tsx"),
      definition: null,
      host: loc("/app/components/ui/card.tsx"),
    }),
    true
  )
})

test("keeps climbing for same-file wrappers", () => {
  assert.equal(
    isClimbUsageBoundary({
      usage: loc("/app/components/algo-test/motion-fixture.tsx"),
      definition: loc("/app/components/algo-test/motion-fixture.tsx"),
      host: loc("/app/components/algo-test/motion-fixture.tsx"),
    }),
    false
  )
})

test("keeps climbing when usage is still inside node_modules", () => {
  assert.equal(
    isClimbUsageBoundary({
      usage: loc("/app/node_modules/motion/dist/index.js"),
      definition: loc("/app/node_modules/motion/dist/index.js"),
    }),
    false
  )
})

test("resolves Vite basename sources against the map URL directory", () => {
  assert.equal(
    resolveSourceMapSourcePath({
      source: "App.tsx",
      sourceMapUrl: new URL("http://localhost:5173/src/App.tsx.map"),
      projectRoot: "/repo/react-test",
    }),
    "/repo/react-test/src/App.tsx"
  )
})

test("keeps absolute filesystem sourcemap sources", () => {
  assert.equal(
    resolveSourceMapSourcePath({
      source: "/Users/gxuri/project/app/page.tsx",
      sourceMapUrl: new URL(
        "http://localhost:3000/_next/static/chunks/app.js.map"
      ),
      projectRoot: "/Users/gxuri/project",
    }),
    "/Users/gxuri/project/app/page.tsx"
  )
})

const resolveSource = readFileSync(
  fileURLToPath(new URL("./engine.ts", import.meta.url)),
  "utf8"
)
const alphabet = /(?:export )?const BASE64_CHARS =\s*"([^"]+)"/.exec(
  resolveSource
)
assert.ok(alphabet, "BASE64_CHARS is in engine.ts")
const start = resolveSource.indexOf("const decodeVlq")
const end = resolveSource.indexOf("const decodeOriginalPosition")
assert.ok(start >= 0 && end > start, "decodeVlq is in engine.ts")

const snippet = `const BASE64_CHARS = "${alphabet[1]}";\n${resolveSource
  .slice(start, end)
  .replaceAll(/^export /gm, "")
  .replaceAll(": string", "")
  .replaceAll(": number[]", "")}`
const decodeVlq = new Function(`${snippet}; return decodeVlq;`)() as (
  segment: string
) => number[] | null

test("decodes VLQ digits", () => {
  assert.deepEqual(decodeVlq("A"), [0])
  assert.deepEqual(decodeVlq("C"), [1])
  assert.deepEqual(decodeVlq("D"), [-1])
  assert.deepEqual(decodeVlq(""), [])
  assert.equal(decodeVlq("!"), null)
})
