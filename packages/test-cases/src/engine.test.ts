import assert from "node:assert/strict"
import { test } from "node:test"

import {
  decodeVlq,
  formatPageLabel,
  getDirectClimbOwner,
  getInstantUsedSource,
  getNamedTarget,
  isBundledOrExternalPath,
  isClimbUsageBoundary,
  isDirectFiberChildOf,
  isFrameworkInspectorName,
  isPointInRect,
  isReactServerStackFile,
  isVendorModulePath,
  parseDebugStack,
  readFiberComponentName,
  resolveFirstMappedFrame,
  resolveSourceMapSourcePath,
  sourceFromFiberDebugSource,
  type ReactFiber,
} from "../../next-inspect-ui/src/lib/engine.ts"
import { underStackTransform } from "../../next-inspect-ui/src/lib/tooltip.ts"

const loc = (filePath: string) => ({ filePath, line: 1, column: 1 })

test("does not send browser chunks through server stack-frame resolution", () => {
  assert.equal(isReactServerStackFile("http://localhost:3000/_next/static/chunks/app.js"), false)
})

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

test("detects turbopack vendor chunks without treating project chunks as vendor", () => {
  assert.equal(
    isVendorModulePath(
      "http://localhost:3000/_next/static/chunks/7725c_@base-ui_react_esm_544358c1._.js"
    ),
    true
  )
  assert.equal(
    isVendorModulePath(
      "http://localhost:3001/_next/static/chunks/0lhj_%40base-ui_react_0dg_2l2._.js"
    ),
    true
  )
  assert.equal(
    isVendorModulePath(
      "http://localhost:3000/_next/static/chunks/node_modules__pnpm_adae432c._.js"
    ),
    true
  )
  assert.equal(
    isVendorModulePath("http://localhost:3000/_next/static/chunks/_b8e932eb._.js"),
    false
  )
  assert.equal(isVendorModulePath("/app/components/ui/button.tsx"), false)
})

const BASE_UI_HOST_STACK = `Error: react-stack-top-frame
    at exports.createElement (http://localhost:3000/_next/static/chunks/1629d_next_dist_compiled_00b523c4._.js:1614:162)
    at renderTag (http://localhost:3000/_next/static/chunks/7725c_@base-ui_react_esm_544358c1._.js:344:370)
    at Button (http://localhost:3000/_next/static/chunks/7725c_@base-ui_react_esm_544358c1._.js:5658:387)`

const link = (partial: Partial<ReactFiber> & { tag: number }): ReactFiber =>
  partial as ReactFiber

test("parses Webpack browser and RSC frames with parentheses in their paths", () => {
  const frames = parseDebugStack(`Error\n    at SvgBars (webpack-internal:///(app-pages-browser)/./components/svg.tsx:7:159)\n    at TestSuitePage (about://React/Server/webpack-internal:///(rsc)/./app/(dev)/test/page.tsx?49:128:110)`)
  assert.equal(frames.length, 2)
  assert.equal(frames[0].file, "webpack-internal:///(app-pages-browser)/./components/svg.tsx")
  assert.equal(frames[0].isServer, false)
  assert.equal(frames[1].file, "about://React/Server/webpack-internal:///(rsc)/./app/(dev)/test/page.tsx?49")
  assert.equal(frames[1].isServer, true)
  assert.equal(isReactServerStackFile("webpack-internal:///(rsc)/./app/page.tsx"), true)
})

test("resolves Webpack frames through Next with the correct browser or server mode", async (t) => {
  const modes: boolean[] = []
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(url, "/__nextjs_original-stack-frames")
    modes.push(JSON.parse(init.body as string).isServer)
    return Response.json([{ status: "fulfilled", value: { originalStackFrame: {
      file: "components/svg.tsx", line1: 5, column1: 1,
    } } }])
  })
  for (const file of ["webpack-internal:///(app-pages-browser)/./components/svg.tsx", "webpack-internal:///(rsc)/./components/svg.tsx"]) {
    const source = await resolveFirstMappedFrame([{
      file, methodName: "SvgBars", arguments: [], line1: 7, column1: 159,
      isServer: isReactServerStackFile(file),
    }], "/repo", new Map())
    assert.deepEqual(source, { filePath: "/repo/components/svg.tsx", line: 5, column: 1 })
  }
  assert.deepEqual(modes, [false, true])
})

test("uses React 18 component JSX metadata before its owner's caller", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "Element")
  Object.defineProperty(globalThis, "Element", { value: class {}, configurable: true })
  try {
    const component = link({ tag: 0, type: { name: "Chip" },
      _debugSource: { fileName: "/repo/chips.tsx", lineNumber: 147, columnNumber: 5 },
      _debugOwner: link({ tag: 0, type: { name: "Chips" },
        _debugSource: { fileName: "/repo/page.tsx", lineNumber: 234 } }),
    })
    assert.deepEqual(getInstantUsedSource(component, "/repo"), {
      filePath: "/repo/chips.tsx", line: 147, column: 5,
    })
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "Element", descriptor)
    else Reflect.deleteProperty(globalThis, "Element")
  }
})

test("keeps a memo wrapper's displayName when the compiled function is renamed", () => {
  assert.equal(readFiberComponentName(link({ tag: 15, type: { name: "MemoPill2" },
    elementType: { displayName: "MemoPill" } })), "MemoPill")
})

test("skips same-name vendor host builders in Vite and React 18", () => {
  for (const stack of [undefined, `Error\n    at exports.createElement (http://localhost:5173/node_modules/.vite/deps/react.js:1:1)\n    at renderTag (http://localhost:5173/node_modules/.vite/deps/base-ui.js:300:43)`]) {
    const project = link({ tag: 0, type: { name: "Button" } })
    const vendor = link({ tag: 11, type: { name: "Button" }, return: project, _debugOwner: project })
    const host = link({ tag: 5, return: vendor, _debugOwner: vendor, _debugStack: stack })
    vendor.child = host
    project.child = vendor
    assert.equal(getDirectClimbOwner(host)?.fiber, project)
    assert.equal(getNamedTarget(host)?.fiber, project)
  }
})

test("a debug owner cannot bypass a wrapping host when climbing", () => {
  const owner = link({ tag: 0, type: { name: "Card" } })
  const wrapper = link({ tag: 5, return: owner })
  const child = link({ tag: 0, type: { name: "Button" }, return: wrapper, _debugOwner: owner })
  assert.equal(isDirectFiberChildOf(child, owner), false)
  child.return = owner
  assert.equal(isDirectFiberChildOf(child, owner), true)
})

test("climbs past a vendor Button primitive to the project Button wrapper", () => {
  const host = link({
    tag: 5,
    _debugStack: BASE_UI_HOST_STACK,
  })
  const vendorButton = link({
    tag: 11,
    type: { name: "Button", displayName: "Button" },
  })
  const projectButton = link({
    tag: 0,
    type: { name: "Button" },
  })

  host.return = vendorButton
  host._debugOwner = vendorButton
  vendorButton.child = host
  vendorButton.return = projectButton
  vendorButton._debugOwner = projectButton
  projectButton.child = vendorButton

  const owner = getDirectClimbOwner(host)
  assert.equal(owner?.name, "Button")
  assert.equal(owner?.fiber, projectButton)
  assert.equal(isDirectFiberChildOf(host, projectButton), true)
})

test("keeps a vendor Button as the owner when nothing wraps it", () => {
  const host = link({
    tag: 5,
    _debugStack: BASE_UI_HOST_STACK,
  })
  const vendorButton = link({
    tag: 11,
    type: { name: "Button", displayName: "Button" },
  })
  const suiteCase = link({
    tag: 5,
  })

  host.return = vendorButton
  host._debugOwner = vendorButton
  vendorButton.child = host
  vendorButton.return = suiteCase

  const owner = getDirectClimbOwner(host)
  assert.equal(owner?.name, "Button")
  assert.equal(owner?.fiber, vendorButton)
})

test("treats turbopack RSC chunk paths as server frames", () => {
  assert.equal(
    isReactServerStackFile(
      "/app/.next/dev/server/chunks/ssr/[root-of-the-server]__09lvfbo._.js"
    ),
    true
  )
  assert.equal(
    isReactServerStackFile("about://React/Server/file:///app/.next/server/app.js"),
    true
  )
  assert.equal(isReactServerStackFile("/app/components/button.tsx"), false)
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
