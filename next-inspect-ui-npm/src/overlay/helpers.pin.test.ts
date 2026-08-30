import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const EXPECTED = {
  getFiber: "e665ec6889b5c409",
  readComponentTypeName: "fc94682f5b043392",
  isCompositeComponentFiber: "5f621015f5318076",
  isHostComponentFiber: "134695c1f5c6847f",
  isFrameworkInspectorName: "882fcb4c624b5e95",
  getHostTagName: "b856d68aac01befe",
  getNamedTarget: "fb2c658b3d9eac28",
  FRAGMENT_TAG: "577c22cbaa89bdaf",
  MODE_TAG: "770ce07b780b7641",
  PROFILER_TAG: "4aac65cc2fef75b0",
  isWrapperFiber: "4251837e61aa87d5",
  getOwningCompositeFiber: "ac14fd905d7e9cde",
  readDebugInfoOwner: "7a8f669d3d5b300a",
  getLabelOwner: "2bc883a307b937fd",
  getDirectClimbOwner: "1f13314f7e541c1d",
  getOwningCompositeName: "d45cc51412b06194",
  framesLookServer: "ae0cfe0d8469aecd",
  getComponentRuntime: "21e495d12679ed84",
  isOwnerAncestorOf: "4e258cddc95d94e0",
  isDirectFiberChildOf: "c158b9cb63c80fe9",
  getComponentName: "632c261bc9fa657b",
  getDomHoverName: "7c289e75b11df8e3",
  getDebugSourceUntil: "47541eba78f6686d",
  parseDebugStack: "fc2928bd9b455b3a",
  getStackFrames: "5a2ba2af52de5a9e",
  getOwnStackFrames: "3655437cf33640ac",
  framesFromUnknownStack: "edbd8ca85e4f1a5e",
  getDebugInfoFrames: "28a7f8d6f7e0f7db",
  BASE64_CHARS: "ea095312aca6b6b0",
  resolveFirstMappedFrame: "4abe7c62f600b29a",
  sourceFromStackFrame: "ce795a5712469c73",
  preferredSourceFromFrames: "15b889a06a6ae93a",
  findNearestAuthorCallSiteSync: "1e9db151550c8bff",
  findNearestAuthorCallSite: "0d92b86ba19c8cf1",
  finalizeHostAuthorSource: "0d2e306140730872",
  getHostAuthorSource: "f708cfdfba9e8931",
  getInstantDefinedSource: "21da9be6e8b2a55c",
  getInstantUsedSource: "9e523245cdde6960",
  decodeVlq: "2de8205d0df33821",
  decodeOriginalPosition: "f86169056fb02f72",
  getSourceMapSection: "f3e595c4fb912cc8",
  resolveServerStackFrame: "e10acc1032d8c6c6",
  resolveFiberDebugSource: "641cff17ca421275",
  resolveStackFrame: "f1fdb3c303af5318",
  resolveHostAuthorSource: "6afed74abfb366aa",
  resolveSource: "4da4d29c953323bb",
  resolveInstanceSource: "916f17352baf2d46",
  resolveNearestAncestorSource: "1cb0fd2dcf75dd5b",
  openInEditor: "274f8f8e12154146",
  resolveDebugInfoPairSync: "5b38913b8838b885",
  resolveDebugInfoPair: "5706a6742acddbba",
  CSS_SKIP: "d91febc036f13979",
  COLOR_PROPS: "8684b1faefa6af8a",
  resolveToRgbKey: "d550a4584b323ce5",
  collectDocumentCssVarNames: "7e653f399917203e",
  scoreCssColorVar: "7873cbf559d6c966",
  toCssColorVar: "a48302f2fc995575",
  getCssDeclarations: "b812a8fae00ec56f",
  isColorValue: "978d79cdf5bb96e4",
  cssSpan: "8cf2a5cfb925c3d4",
  createCodeSurface: "a01589dbc2ebc5a8",
  classNameFromProps: "70057779e202a2a9",
  getElementClassName: "06fad2ff3ffb3951",
  isPreferredInspectHost: "0d56547c370bd2f3",
  isNestedMediaHit: "f47408687db80f2a",
  resolveInspectElement: "ecf22255f2bcdc6f",
  isPointInRect: "40508787530d0062",
  createCssBlock: "8f6a3c6eaca9edd0",
  createTailwindBlock: "ebaed10c883be288",
  createStylesSection: "4d3fc321823d91b4",
  applyOverlayStyles: "7045dba11637d70d",
  ARROW_UP_RIGHT_ICON: "e8fb99513e27f5fc",
} as const

const hashHelpers = (sources: string[]) => {
  const hashes: Record<string, string> = {}
  for (const src of sources) {
    const re = /^(?:export )?const (\w+) =/gm
    const matches = [...src.matchAll(re)]
    for (let i = 0; i < matches.length; i += 1) {
      const name = matches[i]![1]!
      if (name === "InspectUI") continue
      const start = matches[i]!.index!
      let end = src.length
      if (i + 1 < matches.length) end = matches[i + 1]!.index!
      const nextType = src.slice(start + 1).search(/\n(?:export )?type /)
      const nextExport = src.slice(start + 1).search(/\nexport const InspectUI/)
      if (nextType >= 0) end = Math.min(end, start + 1 + nextType)
      if (nextExport >= 0) end = Math.min(end, start + 1 + nextExport)
      const body = src
        .slice(start, end)
        .replace(/^export /m, "")
        .replace(/\s+/g, " ")
        .trim()
      hashes[name] = createHash("sha256").update(body).digest("hex").slice(0, 16)
    }
  }
  return hashes
}

describe("overlay helper pin", () => {
  it("keeps helper bodies unchanged across the file split", () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), "..")
    const overlay = ["fiber.ts", "resolve.ts", "chrome.ts"].map((name) =>
      join(root, "overlay", name)
    )
    const sources = existsSync(overlay[0]!)
      ? [...overlay, join(root, "dev-inspector.tsx")].map((file) =>
          readFileSync(file, "utf8")
        )
      : [readFileSync(join(root, "dev-inspector.tsx"), "utf8")]
    const hashes = hashHelpers(sources)
    assert.deepEqual(hashes, EXPECTED)
  })
})
