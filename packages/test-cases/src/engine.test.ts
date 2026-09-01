import assert from "node:assert/strict"
import { test } from "node:test"

import {
  decodeVlq,
  formatPageLabel,
  isBundledOrExternalPath,
  isClimbUsageBoundary,
  isFrameworkInspectorName,
  isPointInRect,
  resolveSourceMapSourcePath,
  sourceFromFiberDebugSource,
  underStackTransform,
} from "../../next-inspect-ui/src/engine.ts"

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

test("decodes VLQ digits", () => {
  assert.deepEqual(decodeVlq("A"), [0])
  assert.deepEqual(decodeVlq("C"), [1])
  assert.deepEqual(decodeVlq("D"), [-1])
  assert.deepEqual(decodeVlq(""), [])
  assert.equal(decodeVlq("!"), null)
})

test("treats bundler and node_modules paths as external", () => {
  assert.equal(isBundledOrExternalPath("/app/node_modules/motion/index.js"), true)
  assert.equal(isBundledOrExternalPath("/app/.next/static/chunk.js"), true)
  assert.equal(isBundledOrExternalPath("webpack-internal:///src/button.tsx"), true)
  assert.equal(isBundledOrExternalPath("/app/components/button.tsx"), false)
})

test("drops framework frames from the inspect tree", () => {
  assert.equal(isFrameworkInspectorName("AppRouter"), true)
  assert.equal(isFrameworkInspectorName("RedirectBoundary"), true)
  assert.equal(isFrameworkInspectorName("NextLogo"), true)
  assert.equal(isFrameworkInspectorName("Button"), false)
  assert.equal(isFrameworkInspectorName("ServerCard"), false)
})

test("formats a page label relative to the project root", () => {
  assert.equal(
    formatPageLabel(
      { filePath: "/repo/app/page.tsx", line: 12, column: 4 },
      "/repo"
    ),
    "app/page.tsx:12"
  )
})

test("ignores bundled _debugSource files", () => {
  assert.equal(
    sourceFromFiberDebugSource(
      { fileName: "/app/node_modules/motion/index.js", lineNumber: 3 },
      "/app"
    ),
    null
  )
  assert.deepEqual(
    sourceFromFiberDebugSource(
      { fileName: "/app/components/button.tsx", lineNumber: 40, columnNumber: 8 },
      "/app"
    ),
    { filePath: "/app/components/button.tsx", line: 40, column: 8 }
  )
})

test("hit-tests the spotlight rect inclusively", () => {
  const rect = { left: 10, top: 20, width: 40, height: 10 }
  assert.equal(isPointInRect(10, 20, rect), true)
  assert.equal(isPointInRect(50, 30, rect), true)
  assert.equal(isPointInRect(9, 20, rect), false)
  assert.equal(isPointInRect(10, 31, rect), false)
})

test("offsets under-chips down and right by stack depth", () => {
  assert.equal(underStackTransform(1), "translate(29px, calc(100% * 1 + 5px))")
  assert.equal(underStackTransform(2), "translate(58px, calc(100% * 2 + 10px))")
})
