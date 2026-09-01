/**
 * Transform seam: source in, stamped source out.
 *
 * Asserts only what ends up in the output — never which visitor branch ran.
 * Every case here corresponds to a way the stamp could be wrong in a way that
 * would silently corrupt the verifier that depends on it.
 */

import assert from "node:assert/strict"
import { test } from "node:test"
import { transformSync } from "@babel/core"
import { HOST_STAMP_ATTR, OWNER_STAMP_ATTR } from "next-inspect-ui-deprecated/lib"

import stampPlugin from "./babel-stamp.ts"

test("stamp attribute names come from next-inspect-ui-deprecated/lib", () => {
  assert.equal(HOST_STAMP_ATTR, "data-inspect-host")
  assert.equal(OWNER_STAMP_ATTR, "data-inspect-owner")
})

const ROOT = "/project"

const stamp = (
  code: string,
  { filename = `${ROOT}/app/page.tsx`, exclude = [] as string[] } = {}
) =>
  transformSync(code, {
    filename,
    babelrc: false,
    configFile: false,
    compact: false,
    parserOpts: { plugins: ["typescript", "jsx"] },
    plugins: [[stampPlugin, { root: ROOT, exclude }]],
  })?.code ?? ""

test("stamps a host element with its own path, line and column", () => {
  const out = stamp(`const a = <div />`)
  assert.match(out, /data-inspect-host="app\/page\.tsx:1:11"/)
})

test("stamps a component with an owner attribute, not a host attribute", () => {
  const out = stamp(`const a = <Button />`)
  assert.match(out, /data-inspect-owner="app\/page\.tsx:1:11"/)
  assert.doesNotMatch(out, /data-inspect-host/)
})

test("member-expression component names are treated as components", () => {
  const out = stamp(`const a = <Card.Header />`)
  assert.match(out, /data-inspect-owner=/)
  assert.doesNotMatch(out, /data-inspect-host/)
})

test("namespaced names are treated as components", () => {
  const out = stamp(`const a = <svg:circle />`)
  assert.match(out, /data-inspect-owner=/)
})

// The defect in @react-dev-inspector/babel-plugin: it unshifts, so a trailing
// spread overwrites the stamp and the DOM node claims its caller's file.
test("owner stamp yields to a caller's forwarded stamp", () => {
  // A wrapper forwarding props carries the caller's owner stamp in that spread,
  // and the caller's call site is the one worth climbing to.
  const out = stamp(`const a = <Primitive className={c} {...props} />`)
  assert.ok(out.indexOf("data-inspect-owner") < out.indexOf("...props"))
})

test("stamp survives a trailing spread", () => {
  const out = stamp(`const a = <button className={c} {...props} />`)
  const spreadAt = out.indexOf("...props")
  const stampAt = out.indexOf("data-inspect-host")
  assert.ok(stampAt > spreadAt, "stamp must be emitted after the spread")
})

test("stamp survives a spread even when the spread is the only prop", () => {
  const out = stamp(`const a = <button {...props} />`)
  assert.ok(out.indexOf("data-inspect-host") > out.indexOf("...props"))
})

test("does not stamp fragments", () => {
  const out = stamp(`const a = <><div /></>`)
  assert.equal(out.match(/data-inspect-host/g)?.length, 1)
})

test("does not stamp named Fragment, Suspense or Provider elements", () => {
  for (const name of [
    "Fragment",
    "React.Fragment",
    "Suspense",
    "React.Suspense",
    "ThemeProvider",
    "Ctx.Provider",
  ]) {
    const out = stamp(`const a = <${name}><div /></${name}>`)
    assert.equal(
      out.match(/data-inspect-owner/g),
      null,
      `${name} should not be stamped`
    )
  }
})

test("stamps elements written inside a prop", () => {
  //           1234567890123456789012345678
  //                      <Modal at 11      <span at 28
  const out = stamp(`const a = <Modal fallback={<span />} />`)
  assert.match(out, /data-inspect-host="app\/page\.tsx:1:28"/)
  assert.match(out, /data-inspect-owner="app\/page\.tsx:1:11"/)
})

test("stamps elements written inside a callback", () => {
  const out = stamp(`const a = items.map((i) => <li key={i} />)`)
  assert.match(out, /data-inspect-host=/)
})

// Babel columns are 0-based, lines are 1-based, editors want both 1-based.
test("columns are 1-based", () => {
  const out = stamp(`<div />`)
  assert.match(out, /data-inspect-host="app\/page\.tsx:1:1"/)
})

test("lines are reported from the element, not the file start", () => {
  const out = stamp(`\n\n\n<div />`)
  assert.match(out, /data-inspect-host="app\/page\.tsx:4:1"/)
})

// A path the runtime could not join back is worse than no stamp at all.
test("files outside the root are left unstamped", () => {
  const out = stamp(`const a = <div />`, { filename: "/elsewhere/x.tsx" })
  assert.doesNotMatch(out, /data-inspect/)
})

test("a root-prefix near-miss is not treated as inside the root", () => {
  const out = stamp(`const a = <div />`, { filename: "/project-other/x.tsx" })
  assert.doesNotMatch(out, /data-inspect/)
})

test("excluded files are left unstamped", () => {
  const out = stamp(`const a = <div />`, {
    filename: `${ROOT}/node_modules/pkg/x.tsx`,
    exclude: ["node_modules"],
  })
  assert.doesNotMatch(out, /data-inspect/)
})

test("excludes match anywhere in the path", () => {
  const out = stamp(`const a = <div />`, {
    filename: `${ROOT}/app/generated/x.tsx`,
    exclude: ["generated"],
  })
  assert.doesNotMatch(out, /data-inspect/)
})

// The loader can run twice across HMR rounds; a second stamp would shadow the
// first in getAttribute.
test("re-stamping already-stamped source is a no-op", () => {
  const once = stamp(`const a = <div />`)
  const twice = stamp(once)
  assert.equal(twice.match(/data-inspect-host/g)?.length, 1)
})

test("paths keep their subdirectories", () => {
  const out = stamp(`const a = <div />`, {
    filename: `${ROOT}/components/ui/button.tsx`,
  })
  assert.match(out, /data-inspect-host="components\/ui\/button\.tsx:/)
})

test("host and component siblings each get their own attribute", () => {
  const out = stamp(`const a = <div><Button /></div>`)
  assert.equal(out.match(/data-inspect-host/g)?.length, 1)
  assert.equal(out.match(/data-inspect-owner/g)?.length, 1)
})
