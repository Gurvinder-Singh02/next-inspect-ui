import assert from "node:assert/strict"
import { test } from "node:test"
import { parseFiberStack, readFiberStack, readDefinitionStack, type StackFiber } from "../../next-inspect-ui/src/lib/fiber-stack.ts"
import { resolveBrowserStackFrame } from "../../next-inspect-ui/src/lib/engine.ts"

test("reads V8, Firefox and Safari frames and stops at the React render boundary", () => {
  const frames = parseFiberStack(`Error\n    at jsxDEV (http://localhost/react.js:1:1)\n    at Page (http://localhost/src/Page.tsx?t=1:12:7)\nButton@http://localhost/src/Button.tsx:4:2\n    at react_stack_bottom_frame (http://localhost/runtime.js:1:1)\n    at Bootstrap (http://localhost/boot.js:6:1)`)
  assert.deepEqual(frames.map(frame => [frame.methodName, frame.line1, frame.column1]), [["Page",12,7],["Button",4,2]])
  assert.equal(frames[0].file,"http://localhost/src/Page.tsx?t=1")
})

test("restores the stack formatter and caches structured enclosing locations", () => {
  const previous = Error.prepareStackTrace
  function SourceComponent() { return new Error("capture") }
  const error = SourceComponent()
  const frames = readFiberStack(error)
  assert.equal(Error.prepareStackTrace, previous)
  assert.equal(readFiberStack(error), frames)
  assert.equal(frames[0].methodName, "SourceComponent")
  assert(frames[0].enclosingLine! > 0)
  assert.equal(typeof error.stack, "string")
})

test("reads the component's own child without invoking it or following unrelated owners", () => {
  const fiber: StackFiber = {}
  const unrelated: StackFiber = { _debugOwner: {}, _debugStack: "Error\n at Wrong (/repo/Wrong.tsx:2:3)" }
  const child: StackFiber = { _debugOwner: fiber, _debugStack: "Error\n at Component (/repo/Component.tsx:7:4)" }
  fiber.child = unrelated
  unrelated.sibling = child
  child.child = fiber // malformed cycles cannot trap the walker
  assert.equal(readDefinitionStack(fiber)[0].file, "/repo/Component.tsx")
  child._debugOwner = unrelated
  assert.deepEqual(readDefinitionStack(fiber), [])
})

const frame = (file: string, column1 = 1, line1 = 1) => ({ file, column1, line1, methodName: "Component", arguments: [], isServer: false })

test("resolves inline maps relative to the bundle and shares pending downloads", async (t) => {
  const map = { version:3, sources:["Component.tsx"], mappings:"AAIE" }
  let calls = 0
  t.mock.method(globalThis, "fetch", async (url: string) => {
    calls++
    if (url.startsWith("data:")) return Response.json(map)
    return new Response(`//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(map)).toString("base64")}`)
  })
  const cache = new Map()
  const results = await Promise.all([1,2].map(() => resolveBrowserStackFrame(frame("http://localhost/src/Component.js"), "/repo", cache)))
  assert.deepEqual(results[0], { filePath:"/repo/src/Component.tsx", line:5, column:3 })
  assert.deepEqual(results[0], results[1])
  assert.equal(calls,2)
})

test("retries failed map downloads instead of caching the error", async (t) => {
  let maps = 0
  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.endsWith(".js")) return new Response("//# sourceMappingURL=Component.map")
    if (++maps === 1) throw new Error("network")
    return Response.json({ sources:["Component.tsx"], mappings:"AAAA" })
  })
  const cache = new Map()
  await assert.rejects(resolveBrowserStackFrame(frame("http://localhost/src/Component.js"), "/repo", cache))
  assert.equal((await resolveBrowserStackFrame(frame("http://localhost/src/Component.js"), "/repo", cache))?.filePath, "/repo/src/Component.tsx")
})

test("honors indexed map offsets, ignored sources and unmapped segments", async (t) => {
  let map: unknown = { sections:[{ offset:{line:1,column:4}, map:{sources:["/repo/Component.tsx"],mappings:"AAIE,K"} }] }
  t.mock.method(globalThis, "fetch", async (url: string) => url.endsWith(".js") ? new Response("//# sourceMappingURL=Component.map") : Response.json(map))
  const lookup = (column: number, line: number) => resolveBrowserStackFrame(frame("http://localhost/Component.js",column,line), "/repo", new Map())
  assert.equal(await lookup(1,1),null)
  assert.deepEqual(await lookup(5,2),{filePath:"/repo/Component.tsx",line:5,column:3})
  assert.equal(await lookup(10,2),null)
  map = {sources:["/repo/Component.tsx"],mappings:"AAAA",ignoreList:[0]}
  assert.equal(await lookup(1,1),null)
})

test("normalizes project source schemes instead of treating them as generated chunks", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string) => url.endsWith(".js") ? new Response("//# sourceMappingURL=Component.map") : Response.json({sources:["turbopack:///[project]/src/Component.tsx [app-client] (ecmascript)"],mappings:"AAAA"}))
  const source = await resolveBrowserStackFrame(frame("http://localhost/_next/static/chunks/Component.js"), "/repo",new Map())
  assert.deepEqual(source,{ filePath:"/repo/src/Component.tsx",line:1,column:1 })
})

test("component recovery restores globals, unwraps wrappers and caches samples", async () => {
  const { recoverComponentFrame } = await import("../../next-inspect-ui/src/lib/component-frame.ts")
  const previousError = console.error, previousWarn = console.warn
  let calls = 0
  function Component() { calls++; throw new Error("sample") }
  const result = recoverComponentFrame({ render: Component })
  assert.equal(calls,1)
  assert.equal(result[0].methodName,"Component")
  assert.equal(recoverComponentFrame(Component),result)
  assert.equal(calls,1)
  assert.equal(console.error,previousError)
  assert.equal(console.warn,previousWarn)
  assert.deepEqual(recoverComponentFrame("div"),[])
  assert.deepEqual(recoverComponentFrame(null),[])
})

test("keeps React 18 JSX caller metadata for generated hosts without sampling the component", async () => {
  const { resolveHostAuthorSource } = await import("../../next-inspect-ui/src/lib/engine.ts")
  let calls = 0
  function Badge() { calls++; throw new Error("must not sample") }
  const owner = { tag:0, type:Object.assign(Badge, { displayName:"Badge" }), _debugSource:{fileName:"/repo/src/App.tsx",lineNumber:167,columnNumber:9} }
  const host = { tag:5, return:owner }
  assert.deepEqual(await resolveHostAuthorSource(host,"/repo",new Map()),{filePath:"/repo/src/App.tsx",line:167,column:9})
  assert.equal(calls,0)
})
