import assert from "node:assert/strict"
import { test } from "node:test"

import { parseStampValue } from "./inspector-stamp.ts"

const ROOT = "/project"

test("parses a relative path with line and column", () => {
  const source = parseStampValue("app/page.tsx:12:7", ROOT)
  assert.deepEqual(source, {
    filePath: "/project/app/page.tsx",
    line: 12,
    column: 7,
  })
})

test("keeps a colon that belongs to the path", () => {
  const source = parseStampValue("app/foo:bar.tsx:10:5", ROOT)
  assert.deepEqual(source, {
    filePath: "/project/app/foo:bar.tsx",
    line: 10,
    column: 5,
  })
})

test("returns null for a string that is not file:line:column", () => {
  assert.equal(parseStampValue("app/page.tsx", ROOT), null)
  assert.equal(parseStampValue("app/page.tsx:12", ROOT), null)
  assert.equal(parseStampValue("app/page.tsx:x:7", ROOT), null)
  assert.equal(parseStampValue("", ROOT), null)
  assert.equal(parseStampValue(null, ROOT), null)
})
