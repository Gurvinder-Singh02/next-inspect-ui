import assert from "node:assert/strict"
import { test } from "node:test"

import { isClimbUsageBoundary } from "./inspector-source.ts"

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
      definition: loc("/app/components/ui/card.tsx"),
    }),
    false
  )
})

test("requires a project usage site", () => {
  assert.equal(
    isClimbUsageBoundary({
      usage: null,
      definition: loc("/app/a.tsx"),
    }),
    false
  )
})
