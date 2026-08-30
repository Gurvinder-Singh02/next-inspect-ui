import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const resolveSource = readFileSync(
  fileURLToPath(new URL("./resolve.ts", import.meta.url)),
  "utf8"
)
const alphabet = /export const BASE64_CHARS =\s*"([^"]+)"/.exec(resolveSource)
assert.ok(alphabet, "BASE64_CHARS is in resolve.ts")
const start = resolveSource.indexOf("export const decodeVlq")
const end = resolveSource.indexOf("export const decodeOriginalPosition")
assert.ok(start >= 0 && end > start, "decodeVlq is in resolve.ts")

const snippet = `const BASE64_CHARS = "${alphabet[1]}";\n${resolveSource
  .slice(start, end)
  .replaceAll(/^export /gm, "")
  .replaceAll(": string", "")
  .replaceAll(": number[]", "")}`
const decodeVlq = new Function(`${snippet}; return decodeVlq;`)() as (
  segment: string
) => number[] | null

test("decodes a zero VLQ digit", () => {
  assert.deepEqual(decodeVlq("A"), [0])
})

test("decodes a positive VLQ digit", () => {
  assert.deepEqual(decodeVlq("C"), [1])
})

test("decodes a negative VLQ digit", () => {
  assert.deepEqual(decodeVlq("D"), [-1])
})

test("returns an empty list for an empty segment", () => {
  assert.deepEqual(decodeVlq(""), [])
})

test("returns null when a character is outside the VLQ alphabet", () => {
  assert.equal(decodeVlq("*"), null)
})
