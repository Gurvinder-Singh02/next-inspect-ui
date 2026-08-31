/**
 * Host-stamp preference for getHostAuthorSource.
 *
 * Imports the built overlay entry because source relative imports omit `.ts`
 * and Node's strip-types loader cannot resolve them.
 */

import assert from "node:assert/strict"
import { test } from "node:test"

import { HOST_STAMP_ATTR } from "../lib/inspector-stamp.ts"
import { getHostAuthorSource } from "../../dist/overlay.js"

test("stamped host wins over a wrong _debugSource", () => {
  const element = {
    getAttribute(name: string) {
      return name === HOST_STAMP_ATTR ? "app/page.tsx:10:5" : null
    },
  }

  const fiber = {
    stateNode: element,
    _debugSource: {
      fileName: "/project/wrong/file.tsx",
      lineNumber: 1,
      columnNumber: 1,
    },
  }

  const source = getHostAuthorSource(fiber as never, "/project")
  assert.ok(source)
  assert.equal(source.filePath, "/project/app/page.tsx")
  assert.equal(source.line, 10)
  assert.equal(source.column, 5)
})

test("unstamped host still uses runtime _debugSource", () => {
  const element = {
    getAttribute() {
      return null
    },
  }

  const fiber = {
    stateNode: element,
    _debugSource: {
      fileName: "/project/app/runtime.tsx",
      lineNumber: 4,
      columnNumber: 2,
    },
    return: null,
    child: null,
    tag: 5,
    type: "div",
  }

  const source = getHostAuthorSource(fiber as never, "/project")
  assert.ok(source)
  assert.equal(source.filePath, "/project/app/runtime.tsx")
  assert.equal(source.line, 4)
  assert.equal(source.column, 2)
})
