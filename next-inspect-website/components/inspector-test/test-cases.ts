import {
  expandRectWithPadding,
  formatComponentTag,
  formatPageLabel,
  formatShortcutDisplay,
  formatShortcutFromEvent,
  formatShortcutParts,
  formatDomTag,
  formatTooltipLabel,
  getOverlayPaint,
  getTooltipPosition,
  isBundledOrExternalPath,
  isDistinctUsedSource,
  isInspectorChrome,
  isInspectorIde,
  matchesInspectorShortcut,
  nextOwnerChainDepth,
  normalizeSettings,
  pickDefinedSource,
  pickOpenSource,
  pickPreferredStackSource,
  sourceFromFiberDebugSource,
  toAbsolutePath,
  toRgba,
  toRgbChannels,
  underStackTransform,
  DEFAULT_INSPECTOR_SETTINGS,
  DEFAULT_TOOLTIP_PROPS,
  type InspectorSettings,
  type TooltipAlign,
  type TooltipSide,
} from "next-inspect-ui"

export type CheckResult = {
  label: string
  pass: boolean
  actual: string
  expected: string
}

export type TestOutcome = {
  pass: boolean
  /** Every sub-assertion this suite ran, in order. */
  checks: CheckResult[]
}

export type Rect = { left: number; top: number; width: number; height: number }

// A per-card visual preview of the thing the assertions check, so the test
// page doubles as a live view of the inspector's rendered behaviour.
export type PreviewSpec =
  | {
      kind: "overlay"
      settings: InspectorSettings
      side: TooltipSide
      align: TooltipAlign
      sideOffset: number
      alignOffset: number
      label: string
    }
  | { kind: "keys"; combo: string; pressed?: string; match?: boolean }
  | { kind: "label"; text: string }
  | { kind: "rect"; before: Rect; after: Rect }
  | { kind: "swatch"; hex: string; output: string; valid: boolean }
  | { kind: "value"; rows: { input: string; output: string }[] }

export type TestCase = {
  id: string
  name: string
  description: string
  preview: PreviewSpec
  run: () => TestOutcome
}

const show = (value: unknown) =>
  typeof value === "string" ? value : JSON.stringify(value)

// Each combined test runs several assertions; the card passes only if all do,
// and exposes every sub-check so the UI can list them individually.
const suite = (
  assertions: { label: string; actual: unknown; expected: unknown }[]
): TestOutcome => {
  const checks: CheckResult[] = assertions.map((a) => ({
    label: a.label,
    pass: JSON.stringify(a.actual) === JSON.stringify(a.expected),
    actual: show(a.actual),
    expected: show(a.expected),
  }))

  return { pass: checks.every((c) => c.pass), checks }
}

const key = (init: KeyboardEventInit) => new KeyboardEvent("keydown", init)

const spotlight = (
  patch: Partial<InspectorSettings["devSpotlightProps"]>
): InspectorSettings => ({
  ...DEFAULT_INSPECTOR_SETTINGS,
  devSpotlightProps: {
    ...DEFAULT_INSPECTOR_SETTINGS.devSpotlightProps,
    ...patch,
  },
})

const TARGET = { left: 100, top: 100, width: 50, height: 20 }
const TT = { tooltipWidth: 80, tooltipHeight: 16 }

export const TEST_CASES: TestCase[] = [
  {
    id: "defined-source-nested-helper",
    name: "Defined source vs nested helper",
    description:
      "Opening <DetailCard/> must land on DetailCard’s definition — not nested ExpandSection JSX (detail-card.tsx:35). Host-tag labels still keep the clicked line.",
    preview: {
      kind: "value",
      rows: [
        {
          input: "label DetailCard · host ExpandSection@35",
          output: "→ DetailCard definition",
        },
        {
          input: "label div · host ExpandSection@35",
          output: "→ 35 (clicked JSX)",
        },
      ],
    },
    run: () => {
      // Recreates cal-tracker: hover/open logged <DetailCard/> but opened
      // components/overview/detail-card.tsx:35 (ExpandSection’s inner div).
      const file = "/app/components/overview/detail-card.tsx"
      const expandSectionJsx = {
        filePath: file,
        line: 35,
        column: 7,
      }
      const detailCardDefinition = {
        filePath: file,
        line: 120,
        column: 1,
      }
      const usageInParent = {
        filePath: "/app/components/overview/meals-list.tsx",
        line: 48,
        column: 10,
      }

      return suite([
        {
          label: "DetailCard label → definition, not ExpandSection@35",
          actual: pickDefinedSource({
            host: expandSectionJsx,
            componentDefinition: detailCardDefinition,
            labelIsComponent: true,
          }),
          expected: detailCardDefinition,
        },
        {
          label: "stack prefers DetailCard over ExpandSection",
          actual: pickPreferredStackSource(
            [
              { methodName: "ExpandSection", source: expandSectionJsx },
              { methodName: "DetailCard", source: detailCardDefinition },
            ],
            "DetailCard"
          ),
          expected: detailCardDefinition,
        },
        {
          label: "host tag label keeps clicked ExpandSection line",
          actual: pickDefinedSource({
            host: expandSectionJsx,
            componentDefinition: detailCardDefinition,
            labelIsComponent: false,
          }),
          expected: expandSectionJsx,
        },
        {
          label: "same-file ExpandSection ≠ dual used-in",
          actual: isDistinctUsedSource(expandSectionJsx, detailCardDefinition),
          expected: false,
        },
        {
          label: "parent file usage is dual",
          actual: isDistinctUsedSource(usageInParent, detailCardDefinition),
          expected: true,
        },
        {
          label: "debugSource keeps ExpandSection host line",
          actual: sourceFromFiberDebugSource(
            {
              fileName: "components/overview/detail-card.tsx",
              lineNumber: 35,
              columnNumber: 7,
            },
            "/app"
          ),
          expected: expandSectionJsx,
        },
      ])
    },
  },
  {
    id: "open-source-line-preference",
    name: "Open source line preference",
    description:
      "Click-open must use the host JSX / component frame — not a nested helper that appears first in the stack (TestCard L671 vs copyError L662).",
    preview: {
      kind: "value",
      rows: [
        { input: "stack: copyError@662, TestCard@671", output: "→ 671" },
        { input: "host JSX 671 + stack 662", output: "→ 671" },
      ],
    },
    run: () => {
      const file = "/app/components/inspector-test/test-runner.tsx"
      const nestedHelper = {
        filePath: file,
        line: 662,
        column: 9,
      }
      const hostJsx = {
        filePath: file,
        line: 671,
        column: 5,
      }
      // Recreates the real bug: first stack frame was nested `copyError` (662)
      // while the clicked host JSX / component frame is TestCard (671).
      // First-frame-wins fails this; prefer-by-component-name passes.
      return suite([
        {
          label: "prefer TestCard over nested copyError",
          actual: pickPreferredStackSource(
            [
              { methodName: "copyError", source: nestedHelper },
              { methodName: "TestCard", source: hostJsx },
            ],
            "TestCard"
          ),
          expected: hostJsx,
        },
        {
          label: "no name → first frame (legacy)",
          actual: pickPreferredStackSource(
            [
              { methodName: "copyError", source: nestedHelper },
              { methodName: "TestCard", source: hostJsx },
            ],
            null
          ),
          expected: nestedHelper,
        },
        {
          label: "host JSX beats stack fallback",
          actual: pickOpenSource(hostJsx, nestedHelper),
          expected: hostJsx,
        },
        {
          label: "stack used when host missing",
          actual: pickOpenSource(null, hostJsx),
          expected: hostJsx,
        },
      ])
    },
  },
  {
    id: "shortcut-matching",
    name: "Shortcut matching",
    description:
      "matchesInspectorShortcut honours modifiers, physical key codes, key-repeat suppression and modifier-only presses.",
    preview: { kind: "keys", combo: "Alt+X", pressed: "Alt+X", match: true },
    run: () =>
      suite([
        {
          label: "Alt+X",
          actual: matchesInspectorShortcut(
            key({ altKey: true, code: "KeyX", key: "x" }),
            "Alt+X"
          ),
          expected: true,
        },
        {
          label: "bare X",
          actual: matchesInspectorShortcut(
            key({ code: "KeyX", key: "x" }),
            "Alt+X"
          ),
          expected: false,
        },
        {
          label: "extra Shift",
          actual: matchesInspectorShortcut(
            key({ altKey: true, shiftKey: true, code: "KeyX", key: "x" }),
            "Alt+X"
          ),
          expected: false,
        },
        {
          label: "key repeat",
          actual: matchesInspectorShortcut(
            key({ altKey: true, code: "KeyX", key: "x", repeat: true }),
            "Alt+X"
          ),
          expected: false,
        },
        {
          label: "Cmd+I",
          actual: matchesInspectorShortcut(
            key({ metaKey: true, code: "KeyI", key: "i" }),
            "Cmd+I"
          ),
          expected: true,
        },
        {
          label: "modifier only",
          actual: matchesInspectorShortcut(
            key({ altKey: true, code: "AltLeft", key: "Alt" }),
            "Alt+X"
          ),
          expected: false,
        },
      ]),
  },
  {
    id: "shortcut-formatting",
    name: "Shortcut formatting",
    description:
      "A captured keydown serialises back to a string, and shortcut strings render into mac glyph parts.",
    preview: {
      kind: "value",
      rows: [
        { input: "keydown Alt+KeyX", output: "Alt+X" },
        { input: '"Alt+Shift+X"', output: "⌥⇧X" },
        { input: '"Ctrl+K"', output: "⌃ + K" },
      ],
    },
    run: () =>
      suite([
        {
          label: "from event",
          actual: formatShortcutFromEvent(
            key({ altKey: true, code: "KeyX", key: "x" })
          ),
          expected: "Alt+X",
        },
        {
          label: "display",
          actual: formatShortcutDisplay("Alt+Shift+X"),
          expected: "⌥⇧X",
        },
        {
          label: "parts",
          actual: formatShortcutParts("Ctrl+K"),
          expected: ["⌃", "K"],
        },
      ]),
  },
  {
    id: "tooltip-positioning",
    name: "Tooltip positioning",
    description:
      "getTooltipPosition places the tooltip on every side with start/center/end alignment and side/align offsets.",
    preview: {
      kind: "overlay",
      settings: DEFAULT_INSPECTOR_SETTINGS,
      side: "top",
      align: "start",
      sideOffset: 6,
      alignOffset: 0,
      label: "<Button/>",
    },
    run: () =>
      suite([
        {
          label: "top/start",
          actual: getTooltipPosition({
            target: TARGET,
            ...TT,
            side: "top",
            align: "start",
            sideOffset: 6,
            alignOffset: 0,
          }),
          expected: { left: 100, top: 78 },
        },
        {
          label: "bottom/center",
          actual: getTooltipPosition({
            target: TARGET,
            ...TT,
            side: "bottom",
            align: "center",
            sideOffset: 6,
            alignOffset: 0,
          }),
          expected: { left: 85, top: 126 },
        },
        {
          label: "left/end",
          actual: getTooltipPosition({
            target: TARGET,
            ...TT,
            side: "left",
            align: "end",
            sideOffset: 6,
            alignOffset: 0,
          }),
          expected: { left: 14, top: 104 },
        },
        {
          label: "right + offset",
          actual: getTooltipPosition({
            target: TARGET,
            ...TT,
            side: "right",
            align: "start",
            sideOffset: 6,
            alignOffset: 4,
          }),
          expected: { left: 156, top: 104 },
        },
        {
          label: "top flips inside when clipped",
          actual: getTooltipPosition({
            target: { left: 40, top: 4, width: 120, height: 48 },
            tooltipWidth: 80,
            tooltipHeight: 20,
            side: "top",
            align: "start",
            sideOffset: 6,
            alignOffset: 0,
            viewport: { width: 400, height: 300 },
          }),
          // Inside: side +10, align +15
          expected: { left: 55, top: 20 },
        },
      ]),
  },
  {
    id: "overlay-paint",
    name: "Overlay paint",
    description:
      "getOverlayPaint builds the spotlight border string — a dashed stroke by default, collapsing to none at zero width.",
    preview: {
      kind: "overlay",
      settings: spotlight({ strokeWidth: 0, bgOpacity: 0.18 }),
      side: "top",
      align: "start",
      sideOffset: 6,
      alignOffset: 0,
      label: "<Button/>",
    },
    run: () =>
      suite([
        {
          label: "default border",
          actual: getOverlayPaint(DEFAULT_INSPECTOR_SETTINGS).border,
          expected: "1px dashed rgba(249 115 22 / 1)",
        },
        {
          label: "zero stroke",
          actual: getOverlayPaint(spotlight({ strokeWidth: 0 })).border,
          expected: "0px none transparent",
        },
      ]),
  },
  {
    id: "rect-geometry",
    name: "Rect geometry",
    description:
      "expandRectWithPadding grows a rect from a scalar padding or independent per-edge values.",
    preview: {
      kind: "rect",
      before: { left: 10, top: 10, width: 100, height: 50 },
      after: { left: 6, top: 6, width: 108, height: 58 },
    },
    run: () =>
      suite([
        {
          label: "uniform",
          actual: expandRectWithPadding(
            { left: 10, top: 10, width: 100, height: 50 },
            4
          ),
          expected: { left: 6, top: 6, width: 108, height: 58 },
        },
        {
          label: "per-edge",
          actual: expandRectWithPadding(
            { left: 10, top: 10, width: 100, height: 50 },
            { left: 2, right: 6, top: 1, bottom: 3 }
          ),
          expected: { left: 8, top: 9, width: 108, height: 54 },
        },
      ]),
  },
  {
    id: "tooltip-label",
    name: "Tooltip label",
    description:
      "Default hover = DOM tag (`<button>`); ⌥ climb = component tag (`<Button/>`). Joins path when showPageName is on.",
    preview: { kind: "label", text: "<button> · copy-button.tsx:13" },
    run: () =>
      suite([
        {
          label: "component tag",
          actual: formatComponentTag("Button"),
          expected: "<Button/>",
        },
        {
          label: "dom tag",
          actual: formatDomTag("button"),
          expected: "<button>",
        },
        {
          label: "title + path (default component)",
          actual: formatTooltipLabel({
            title: "Button",
            pageName: "app/page.tsx:5",
            tooltipProps: DEFAULT_TOOLTIP_PROPS,
          }),
          expected: "<Button/> · app/page.tsx:5",
        },
        {
          label: "title + path (dom)",
          actual: formatTooltipLabel({
            title: "button",
            pageName: "copy-button.tsx:13",
            tooltipProps: DEFAULT_TOOLTIP_PROPS,
            tagStyle: "dom",
          }),
          expected: "<button> · copy-button.tsx:13",
        },
        {
          label: "title only",
          actual: formatTooltipLabel({
            title: "Button",
            pageName: "app/page.tsx:5",
            tooltipProps: { ...DEFAULT_TOOLTIP_PROPS, showPageName: false },
          }),
          expected: "<Button/>",
        },
        {
          label: "path only",
          actual: formatTooltipLabel({
            title: "Button",
            pageName: "app/page.tsx:5",
            tooltipProps: {
              ...DEFAULT_TOOLTIP_PROPS,
              showTitle: false,
              showPageName: true,
            },
          }),
          expected: "app/page.tsx:5",
        },
        {
          label: "both hidden",
          actual: formatTooltipLabel({
            title: "Button",
            pageName: "app/page.tsx:5",
            tooltipProps: {
              ...DEFAULT_TOOLTIP_PROPS,
              showTitle: false,
              showPageName: false,
            },
          }),
          expected: "",
        },
      ]),
  },
  {
    id: "color-conversion",
    name: "Color conversion",
    description:
      "toRgbChannels / toRgba parse hex into channels and modern rgba syntax, returning null for malformed input.",
    preview: {
      kind: "swatch",
      hex: "#f97316",
      output: "249 115 22",
      valid: true,
    },
    run: () =>
      suite([
        {
          label: "channels",
          actual: toRgbChannels("#f97316"),
          expected: "249 115 22",
        },
        {
          label: "short hex",
          actual: toRgbChannels("#fff"),
          expected: null,
        },
        {
          label: "rgba",
          actual: toRgba("#f97316", 0.5),
          expected: "rgba(249 115 22 / 0.5)",
        },
      ]),
  },
  {
    id: "settings-normalization",
    name: "Settings normalization",
    description:
      "normalizeSettings clamps and snaps out-of-range values, rejects invalid enums, migrates legacy configs and backfills blanks.",
    preview: {
      kind: "value",
      rows: [
        { input: "sideOffset 999", output: "48" },
        { input: "strokeWidth 2.3", output: "2.5" },
        { input: 'side "diagonal"', output: '"top"' },
        { input: '{ color: "sky" }', output: "#0ea5e9" },
        { input: 'shortcut "   "', output: "Alt+X" },
      ],
    },
    run: () =>
      suite([
        {
          label: "clamp sideOffset",
          actual: normalizeSettings({
            tooltipProps: { ...DEFAULT_TOOLTIP_PROPS, sideOffset: 999 },
          }).tooltipProps.sideOffset,
          expected: 48,
        },
        {
          label: "snap strokeWidth",
          actual: normalizeSettings({
            devSpotlightProps: {
              ...DEFAULT_INSPECTOR_SETTINGS.devSpotlightProps,
              strokeWidth: 2.3,
            },
          }).devSpotlightProps.strokeWidth,
          expected: 2.5,
        },
        {
          label: "invalid side",
          actual: normalizeSettings({
            tooltipProps: {
              ...DEFAULT_TOOLTIP_PROPS,
              side: "diagonal" as never,
            },
          }).tooltipProps.side,
          expected: "top",
        },
        {
          label: "legacy color",
          actual: normalizeSettings({ color: "sky" }).devSpotlightProps
            .background,
          expected: "#0ea5e9",
        },
        {
          label: "blank shortcut",
          actual: normalizeSettings({ shortcut: "   " }).shortcut,
          expected: "Alt+X",
        },
      ]),
  },
  {
    id: "bundled-path-filter",
    name: "Bundled path filter",
    description:
      "isBundledOrExternalPath / sourceFromFiberDebugSource reject .next chunks and accept real project sources (the CopyableText hover bug).",
    preview: {
      kind: "value",
      rows: [
        {
          input: ".next/dev/server/chunks/…js",
          output: "rejected",
        },
        {
          input: "components/landing/copyable-text.tsx",
          output: "accepted",
        },
      ],
    },
    run: () => {
      const root = "/Users/demo/project"
      const chunk =
        ".next/dev/server/chunks/ssr/[root-of-the-server]__057~dt0._.js"
      return suite([
        {
          label: "reject .next relative",
          actual: isBundledOrExternalPath(chunk),
          expected: true,
        },
        {
          label: "reject /.next/ absolute",
          actual: isBundledOrExternalPath(
            `${root}/.next/dev/server/chunks/ssr/chunk.js`
          ),
          expected: true,
        },
        {
          label: "reject /_next/",
          actual: isBundledOrExternalPath("/_next/static/chunks/main.js"),
          expected: true,
        },
        {
          label: "reject node_modules",
          actual: isBundledOrExternalPath(
            `${root}/node_modules/react/index.js`
          ),
          expected: true,
        },
        {
          label: "accept project tsx",
          actual: isBundledOrExternalPath(
            `${root}/components/landing/copyable-text.tsx`
          ),
          expected: false,
        },
        {
          label: "debugSource drops chunk",
          actual: sourceFromFiberDebugSource(
            { fileName: chunk, lineNumber: 265, columnNumber: 1 },
            root
          ),
          expected: null,
        },
        {
          label: "debugSource keeps tsx",
          actual: sourceFromFiberDebugSource(
            {
              fileName: "components/landing/copyable-text.tsx",
              lineNumber: 31,
              columnNumber: 5,
            },
            root
          ),
          expected: {
            filePath: `${root}/components/landing/copyable-text.tsx`,
            line: 31,
            column: 5,
          },
        },
        {
          label: "page label relative",
          actual: formatPageLabel(
            {
              filePath: `${root}/components/landing/copyable-text.tsx`,
              line: 31,
              column: 5,
            },
            root
          ),
          expected: "components/landing/copyable-text.tsx:31",
        },
      ])
    },
  },
  {
    id: "rendered-by-vs-source",
    name: "Rendered by vs source",
    description:
      "isDistinctUsedSource is file-based — same file ≠ dual; different files separate “rendered by” (call site) from “source” (definition).",
    preview: {
      kind: "value",
      rows: [
        { input: "same file", output: "not dual" },
        { input: "page.tsx vs site-header.tsx", output: "dual" },
      ],
    },
    run: () => {
      const source = {
        filePath: "/app/components/site-header.tsx",
        line: 6,
        column: 1,
      }
      const sameFile = {
        filePath: "/app/components/site-header.tsx",
        line: 12,
        column: 1,
      }
      const renderedBy = {
        filePath: "/app/app/dashboard/page.tsx",
        line: 22,
        column: 1,
      }
      return suite([
        {
          label: "same file ≠ dual",
          actual: isDistinctUsedSource(sameFile, source),
          expected: false,
        },
        {
          label: "rendered by ≠ source file",
          actual: isDistinctUsedSource(renderedBy, source),
          expected: true,
        },
        {
          label: "null rendered by",
          actual: isDistinctUsedSource(null, source),
          expected: false,
        },
      ])
    },
  },
  {
    id: "option-shift-climb",
    name: "⌥+⇧ climb depth",
    description:
      "nextOwnerChainDepth clamps ⌥+⇧ climb. Fail closed at the top (shake + stay). Empty chain is always atBound.",
    preview: {
      kind: "value",
      rows: [
        { input: "depth 0 + ⇧", output: "1" },
        { input: "top + ⇧", output: "atBound" },
        { input: "empty chain", output: "atBound" },
      ],
    },
    run: () =>
      suite([
        {
          label: "⇧ from root",
          actual: nextOwnerChainDepth(0, 1, 4),
          expected: { depth: 1, atBound: false },
        },
        {
          label: "⇧ mid chain",
          actual: nextOwnerChainDepth(1, 1, 4),
          expected: { depth: 2, atBound: false },
        },
        {
          label: "⇧ to top",
          actual: nextOwnerChainDepth(2, 1, 4),
          expected: { depth: 3, atBound: false },
        },
        {
          label: "⇧ at top bound",
          actual: nextOwnerChainDepth(3, 1, 4),
          expected: { depth: 3, atBound: true },
        },
        {
          label: "empty chain",
          actual: nextOwnerChainDepth(0, 1, 0),
          expected: { depth: 0, atBound: true },
        },
      ]),
  },
  {
    id: "tooltip-under-stack",
    name: "Tooltip under-stack transform",
    description:
      "underStackTransform places previous chips below the front tooltip while ⌥ / ⇧ climbs.",
    preview: {
      kind: "value",
      rows: [
        {
          input: "depth 1",
          output: "translate(29px, calc(100% * 1 + 5px))",
        },
        {
          input: "depth 2",
          output: "translate(58px, calc(100% * 2 + 10px))",
        },
      ],
    },
    run: () =>
      suite([
        {
          label: "depth 1",
          actual: underStackTransform(1),
          expected: "translate(29px, calc(100% * 1 + 5px))",
        },
        {
          label: "depth 2",
          actual: underStackTransform(2),
          expected: "translate(58px, calc(100% * 2 + 10px))",
        },
        {
          label: "depth 3",
          actual: underStackTransform(3),
          expected: "translate(87px, calc(100% * 3 + 15px))",
        },
      ]),
  },
  {
    id: "climb-tooltip-label",
    name: "Climb tooltip labels",
    description:
      "Default hover uses DOM tags (`<button>`); ⌥ climb uses component tags (`<LeafComp/>`) + rendered-by path.",
    preview: {
      kind: "label",
      text: "<LeafComp/> · level-a.tsx:5",
    },
    run: () =>
      suite([
        {
          label: "DOM hover",
          actual: formatTooltipLabel({
            title: "button",
            pageName: "leaf-comp.tsx:4",
            tooltipProps: DEFAULT_TOOLTIP_PROPS,
            tagStyle: "dom",
          }),
          expected: "<button> · leaf-comp.tsx:4",
        },
        {
          label: "⌥ climb (rendered by)",
          actual: formatTooltipLabel({
            title: "LeafComp",
            pageName: "level-a.tsx:5",
            tooltipProps: DEFAULT_TOOLTIP_PROPS,
            tagStyle: "component",
          }),
          expected: "<LeafComp/> · level-a.tsx:5",
        },
        {
          label: "RSC climb",
          actual: formatTooltipLabel({
            title: "ServerProbe",
            pageName: "inspector-test/page.tsx:12",
            tooltipProps: DEFAULT_TOOLTIP_PROPS,
            tagStyle: "component",
          }),
          expected: "<ServerProbe/> · inspector-test/page.tsx:12",
        },
      ]),
  },
  {
    id: "path-helpers",
    name: "Path helpers",
    description:
      "toAbsolutePath joins project-relative / file:// sources; formatPageLabel strips the project root for tooltips.",
    preview: {
      kind: "value",
      rows: [
        {
          input: "relative tsx",
          output: "/proj/components/button.tsx",
        },
        {
          input: "file:// URL",
          output: "decoded absolute",
        },
      ],
    },
    run: () => {
      const root = "/proj"
      return suite([
        {
          label: "relative → absolute",
          actual: toAbsolutePath("components/button.tsx", root),
          expected: "/proj/components/button.tsx",
        },
        {
          label: "already absolute",
          actual: toAbsolutePath("/proj/components/button.tsx", root),
          expected: "/proj/components/button.tsx",
        },
        {
          label: "file URL",
          actual: toAbsolutePath("file:///proj/components/button.tsx", root),
          expected: "/proj/components/button.tsx",
        },
        {
          label: "ide enum",
          actual: isInspectorIde("cursor"),
          expected: true,
        },
        {
          label: "bad ide",
          actual: isInspectorIde("notepad"),
          expected: false,
        },
      ])
    },
  },
  {
    id: "rsc-path-filter",
    name: "RSC path filter",
    description:
      "about://React/Server/… is treated as bundled (needs strip/remap). file:// project paths decode for rendered by / source.",
    preview: {
      kind: "value",
      rows: [
        { input: "about://React/Server/…", output: "bundled" },
        { input: "file:///proj/site-header.tsx", output: "absolute" },
      ],
    },
    run: () => {
      const root = "/proj"
      return suite([
        {
          label: "about://React/Server is bundled",
          actual: isBundledOrExternalPath(
            "about://React/Server/file:///proj/components/site-header.tsx"
          ),
          expected: true,
        },
        {
          label: "stripped file:// is project source",
          actual: toAbsolutePath(
            "file:///proj/components/site-header.tsx",
            root
          ),
          expected: "/proj/components/site-header.tsx",
        },
        {
          label: "page label for RSC source",
          actual: formatPageLabel(
            {
              filePath: "/proj/components/site-header.tsx",
              line: 6,
              column: 5,
            },
            root
          ),
          expected: "components/site-header.tsx:6",
        },
      ])
    },
  },
  {
    id: "inspector-chrome",
    name: "Inspector chrome detection",
    description:
      "isInspectorChrome ignores the inspector's own overlay / tooltip / log panel so hover never targets itself.",
    preview: {
      kind: "value",
      rows: [
        { input: "data-dev-inspector-tooltip", output: "chrome" },
        { input: "plain div", output: "not chrome" },
      ],
    },
    run: () => {
      if (typeof document === "undefined") {
        return suite([
          {
            label: "skipped (no DOM)",
            actual: true,
            expected: true,
          },
        ])
      }
      const chrome = document.createElement("div")
      chrome.setAttribute("data-dev-inspector-tooltip", "")
      const plain = document.createElement("div")
      const nested = document.createElement("span")
      chrome.append(nested)
      return suite([
        {
          label: "tooltip host",
          actual: isInspectorChrome(chrome),
          expected: true,
        },
        {
          label: "nested in chrome",
          actual: isInspectorChrome(nested),
          expected: true,
        },
        {
          label: "plain element",
          actual: isInspectorChrome(plain),
          expected: false,
        },
      ])
    },
  },
]
