import assert from "node:assert/strict"
import { test } from "node:test"
import { createFiberSourceCache } from "../../next-inspect-ui/src/lib/source-cache.ts"
import type { ReactFiber, SourceLocation } from "../../next-inspect-ui/src/lib/engine.ts"

const source = { filePath: "/repo/button.tsx", line: 4, column: 2 }

test("hover, panel, and click share pending and completed source work", async () => {
  const cache = createFiberSourceCache()
  const fiber: ReactFiber = { tag: 5 }
  let calls = 0
  const resolve = async () => { calls++; return source }
  const first = cache(fiber, resolve)
  assert.equal(cache(fiber, resolve), first)
  assert.equal(await first, source)
  assert.equal(await cache(fiber, resolve), source)
  assert.equal(calls, 1)
})

test("source metadata edits invalidate the cached location", async () => {
  const cache = createFiberSourceCache()
  const fiber: ReactFiber = { _debugSource: { fileName: "/repo/button.tsx", lineNumber: 4 } }
  const resolve = async () => ({ ...source, line: fiber._debugSource!.lineNumber! })
  assert.equal((await cache(fiber, resolve))?.line, 4)
  fiber._debugSource!.lineNumber = 8
  assert.equal((await cache(fiber, resolve))?.line, 8)
  fiber._debugStack = "new creation site"
  const updated = { ...source, filePath: "/repo/other.tsx" }
  assert.equal(await cache(fiber, async () => updated), updated)
})

test("missing sources and rejected requests can retry", async () => {
  const cache = createFiberSourceCache()
  const fiber: ReactFiber = {}
  assert.equal(await cache(fiber, async () => null), null)
  await assert.rejects(cache(fiber, async () => { throw new Error("temporary failure") }))
  assert.equal(await cache(fiber, async () => source), source)
})

test("an old failed request cannot evict a newer revision", async () => {
  const cache = createFiberSourceCache()
  const fiber: ReactFiber = { _debugStack: "old" }
  let rejectOld!: (reason: Error) => void
  const old = cache(fiber, () => new Promise<SourceLocation | null>((_, reject) => { rejectOld = reject }))
  await Promise.resolve()
  fiber._debugStack = "new"
  const current = cache(fiber, async () => source)
  rejectOld(new Error("old request failed"))
  await assert.rejects(old)
  assert.equal(await current, source)
  assert.equal(cache(fiber, async () => null), current)
})
