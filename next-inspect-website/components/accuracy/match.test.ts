import assert from "node:assert/strict"
import { test } from "node:test"

import { nodeMatches, scoreNodes } from "./match.ts"

test("matches file and optional line", () => {
  assert.equal(
    nodeMatches(
      { name: "button", source: "components/ui/button.tsx:50" },
      { name: "button", file: "components/ui/button.tsx", line: 50 }
    ),
    true
  )
  assert.equal(
    nodeMatches(
      { name: "Button", source: "app/(dev)/test/source-open/shadcn-host/page.tsx:37" },
      { name: "Button", file: "app/(dev)/test/source-open/shadcn-host/page.tsx" }
    ),
    true
  )
  assert.equal(
    nodeMatches(
      { name: "Button", source: "app/(dev)/test/source-open/shadcn-host/page.tsx:37" },
      { name: "Button", file: "app/(dev)/test/source-open/shadcn-host/page.tsx", line: 60 }
    ),
    false
  )
})

test("100% when both nodes match", () => {
  const report = scoreNodes(
    [
      { name: "Button", file: "app/(dev)/test/source-open/shadcn-host/page.tsx", line: 37 },
      { name: "button", file: "components/ui/button.tsx", line: 50 },
    ],
    [
      { name: "Button", source: "app/(dev)/test/source-open/shadcn-host/page.tsx:37" },
      { name: "button", source: "components/ui/button.tsx:50" },
    ]
  )
  assert.equal(report.ok, true)
  assert.equal(report.rate, 100)
  assert.equal(report.expectedCount, 2)
  assert.equal(report.foundCount, 2)
})
