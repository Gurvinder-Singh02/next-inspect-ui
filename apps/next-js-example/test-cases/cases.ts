/**
 * Manual expected NODE TREE cases for apps/next-js-example.
 * Edit by hand — pin from live inspect
 * (`window.__inspectUI.inspect` → `nodes[].source`;
 * `.cursor/skills/match-expected-case`).
 */
import type { AccuracyNode, AccuracyTarget, SuiteCaseMeta } from "./types"

const TEST_PAGE = "app/(dev)/test/page.tsx"
const BUTTON = "components/ui/button.tsx"
const BADGE = "components/ui/badge.tsx"
const CARD = "components/ui/card.tsx"
const MOTION = "components/algo-test/motion-fixture.tsx"
const LIBRARY = "components/algo-test/library-rendered-fixture.tsx"
const RADIX = "components/algo-test/radix-fixture.tsx"
const KINDS = "components/algo-test/kinds-fixture.tsx"
const SERVER = "components/algo-test/server-fixture.tsx"
const SVG = "components/algo-test/svg-fixture.tsx"

/** Sticky-header meta — keep in sync with cases rendered on /test. */
export const TEST_CASE_META: SuiteCaseMeta[] = [
  { id: "basic-html-heading", title: "plain heading", group: "basic html snippet" },
  { id: "svg-plain", title: "plain svg", group: "svg" },
  { id: "svg-parent", title: "svg parent climb", group: "svg" },
  { id: "shadcn-plain", title: "plain button", group: "shadcn" },
  { id: "shadcn-variants", title: "button variants", group: "shadcn" },
  { id: "shadcn-nested", title: "button inside card", group: "shadcn" },
  { id: "baseui-badge", title: "badge useRender host", group: "base-ui" },
  { id: "motion-simple", title: "motion.div bare + nested", group: "motion" },
  { id: "motion-boxes", title: "motion.div list", group: "motion" },
  { id: "motion-svg", title: "motion.rect svg", group: "motion" },
  { id: "motion-wrapped", title: "wrapped motion climb", group: "motion" },
  { id: "library-own-host", title: "library-built host", group: "library" },
  { id: "radix-slot", title: "radix Slot / asChild", group: "radix" },
  { id: "kinds-forward-ref", title: "forwardRef + memo", group: "kinds" },
  { id: "composition-map", title: "list map children", group: "composition" },
  { id: "third-party-icons", title: "lucide icons", group: "third-party" },
  { id: "server-direct", title: "server component host", group: "server" },
  { id: "server-nested", title: "nested server cards", group: "server" },
  { id: "parent-inspectable-card", title: "card parent / child", group: "parent inspectable" },
]

export const basicHtmlHeadingNodes: AccuracyNode[] = [
  { name: "h1", file: TEST_PAGE, line: 66 },
]

export const svgPlainNodes: AccuracyNode[] = [
  { name: "rect", file: TEST_PAGE, line: 85 },
]

export const svgParentNodes: AccuracyNode[] = [
  { name: "SvgBars", file: TEST_PAGE, line: 103 },
  { name: "svg", file: SVG, line: 5 },
]

export const shadcnPlainNodes: AccuracyNode[] = [
  { name: "Button", file: TEST_PAGE, line: 115 },
  { name: "button", file: BUTTON, line: 52 },
]

export const shadcnVariantTargets: AccuracyTarget[] = [
  {
    id: "secondary",
    label: "Secondary",
    nodes: [
      { name: "Button", file: TEST_PAGE, line: 126 },
      { name: "button", file: BUTTON, line: 52 },
    ],
  },
  {
    id: "ghost",
    label: "Ghost",
    nodes: [
      { name: "Button", file: TEST_PAGE, line: 129 },
      { name: "button", file: BUTTON, line: 52 },
    ],
  },
  {
    id: "destructive",
    label: "Destructive",
    nodes: [
      { name: "Button", file: TEST_PAGE, line: 132 },
      { name: "button", file: BUTTON, line: 52 },
    ],
  },
]

export const shadcnNestedNodes: AccuracyNode[] = [
  { name: "Button", file: TEST_PAGE, line: 150 },
  { name: "button", file: BUTTON, line: 52 },
]

export const baseuiBadgeTargets: AccuracyTarget[] = [
  {
    id: "default",
    label: "Default",
    nodes: [
      { name: "Badge", file: TEST_PAGE, line: 165 },
      { name: "span", file: BADGE, line: 36 },
    ],
  },
  {
    id: "secondary",
    label: "Secondary",
    nodes: [
      { name: "Badge", file: TEST_PAGE, line: 166 },
      { name: "span", file: BADGE, line: 36 },
    ],
  },
  {
    id: "destructive",
    label: "Destructive",
    nodes: [
      { name: "Badge", file: TEST_PAGE, line: 169 },
      { name: "span", file: BADGE, line: 36 },
    ],
  },
]

export const motionSimpleTargets: AccuracyTarget[] = [
  {
    id: "bare",
    label: "Bare",
    nodes: [
      { name: "MotionSimple", file: MOTION, line: 33 },
      { name: "motion.div", file: MOTION, line: 22 },
    ],
  },
  {
    id: "nested",
    label: "Nested",
    nodes: [{ name: "motion.div", file: MOTION, line: 36 }],
  },
]

/** Nested in the flex wrapper — no climb, same as nested HTML. */
export const motionBoxesTargets: AccuracyTarget[] = [
  {
    id: "box-0",
    label: "Box 0",
    nodes: [{ name: "motion.div", file: MOTION, line: 52 }],
  },
  {
    id: "box-1",
    label: "Box 1",
    nodes: [{ name: "motion.div", file: MOTION, line: 52 }],
  },
  {
    id: "box-2",
    label: "Box 2",
    nodes: [{ name: "motion.div", file: MOTION, line: 52 }],
  },
]

export const motionSvgNodes: AccuracyNode[] = [
  { name: "motion.rect", file: MOTION, line: 68 },
]

export const motionWrappedTargets: AccuracyTarget[] = [
  {
    id: "alpha",
    label: "alpha",
    nodes: [
      { name: "Chip", file: MOTION, line: 147 },
      { name: "motion.div", file: MOTION, line: 136 },
    ],
  },
  {
    id: "beta",
    label: "beta",
    nodes: [
      { name: "Chip", file: MOTION, line: 148 },
      { name: "motion.div", file: MOTION, line: 136 },
    ],
  },
]

export const libraryOwnHostTargets: AccuracyTarget[] = [
  {
    id: "first",
    label: "First",
    nodes: [
      { name: "RendersOwnHost", file: TEST_PAGE, line: 227 },
      { name: "svg", file: LIBRARY, line: 28 },
    ],
  },
  {
    id: "second",
    label: "Second",
    nodes: [
      { name: "RendersOwnHost", file: TEST_PAGE, line: 228 },
      { name: "svg", file: LIBRARY, line: 28 },
    ],
  },
]

export const radixSlotTargets: AccuracyTarget[] = [
  {
    id: "button",
    label: "Own button",
    nodes: [
      { name: "Clickable", file: RADIX, line: 42 },
      { name: "button", file: RADIX, line: 31 },
    ],
  },
  {
    id: "anchor",
    label: "Slot anchor",
    nodes: [
      { name: "Slot.Slot", file: RADIX, line: 31 },
      { name: "a", file: RADIX, line: 45 },
    ],
  },
  {
    id: "link",
    label: "Slot link",
    nodes: [
      { name: "LinkComponent", file: RADIX, line: 51 },
      { name: "a", file: RADIX, line: 51 },
    ],
  },
]

export const kindsForwardRefTargets: AccuracyTarget[] = [
  {
    id: "forward-ref",
    label: "forwardRef",
    nodes: [
      { name: "ForwardedInput", file: TEST_PAGE, line: 254 },
      { name: "input", file: KINDS, line: 60 },
    ],
  },
  {
    id: "memo",
    label: "memo",
    nodes: [
      { name: "MemoPill", file: TEST_PAGE, line: 255 },
      { name: "span", file: KINDS, line: 77 },
    ],
  },
  {
    id: "compound",
    label: "compound",
    nodes: [
      { name: "Panel", file: KINDS, line: 137 },
      { name: "div", file: KINDS, line: 113 },
    ],
  },
]

export const compositionMapTargets: AccuracyTarget[] = [
  {
    id: "alpha",
    label: "alpha",
    nodes: [{ name: "span", file: TEST_PAGE, line: 271 }],
  },
  {
    id: "beta",
    label: "beta",
    nodes: [{ name: "span", file: TEST_PAGE, line: 271 }],
  },
  {
    id: "gamma",
    label: "gamma",
    nodes: [{ name: "span", file: TEST_PAGE, line: 271 }],
  },
]

export const thirdPartyIconTargets: AccuracyTarget[] = [
  {
    id: "sparkles",
    label: "Sparkles",
    nodes: [{ name: "svg", file: TEST_PAGE, line: 292 }],
  },
  {
    id: "circle",
    label: "Circle",
    nodes: [{ name: "svg", file: TEST_PAGE, line: 293 }],
  },
  {
    id: "arrow",
    label: "Arrow",
    nodes: [{ name: "svg", file: TEST_PAGE, line: 294 }],
  },
  {
    id: "docs",
    label: "Docs link",
    nodes: [
      { name: "LinkComponent", file: TEST_PAGE, line: 295 },
      { name: "a", file: TEST_PAGE, line: 295 },
    ],
  },
]

export const serverDirectNodes: AccuracyNode[] = [
  { name: "ServerCard", file: TEST_PAGE, line: 315 },
  { name: "div", file: SERVER, line: 17 },
]

export const serverNestedTargets: AccuracyTarget[] = [
  {
    id: "first",
    label: "First",
    nodes: [
      { name: "ServerCard", file: TEST_PAGE, line: 331 },
      { name: "div", file: SERVER, line: 17 },
    ],
  },
  {
    id: "second",
    label: "Second",
    nodes: [
      { name: "ServerCard", file: TEST_PAGE, line: 332 },
      { name: "div", file: SERVER, line: 17 },
    ],
  },
]

/** `[` / `]` hops on a full Card — each target is one inspectable. */
export const parentInspectableCardTargets: AccuracyTarget[] = [
  {
    id: "badge",
    label: "Badge",
    nodes: [
      { name: "Badge", file: TEST_PAGE, line: 358 },
      { name: "span", file: BADGE, line: 36 },
    ],
  },
  {
    id: "action",
    label: "CardAction",
    nodes: [
      { name: "CardAction", file: TEST_PAGE, line: 357 },
      { name: "div", file: CARD, line: 61 },
    ],
  },
  {
    id: "header",
    label: "CardHeader",
    nodes: [
      { name: "CardHeader", file: TEST_PAGE, line: 347 },
      { name: "div", file: CARD, line: 25 },
    ],
  },
  {
    id: "card",
    label: "Card",
    nodes: [
      { name: "Card", file: TEST_PAGE, line: 346 },
      { name: "div", file: CARD, line: 11 },
    ],
  },
  {
    id: "title",
    label: "CardTitle",
    nodes: [
      { name: "CardTitle", file: TEST_PAGE, line: 351 },
      { name: "div", file: CARD, line: 38 },
    ],
  },
  {
    id: "description",
    label: "CardDescription",
    nodes: [
      { name: "CardDescription", file: TEST_PAGE, line: 348 },
      { name: "div", file: CARD, line: 51 },
    ],
  },
  {
    id: "button",
    label: "Button",
    nodes: [
      { name: "Button", file: TEST_PAGE, line: 365 },
      { name: "button", file: BUTTON, line: 52 },
    ],
  },
  {
    id: "content",
    label: "CardContent",
    nodes: [
      { name: "CardContent", file: TEST_PAGE, line: 364 },
      { name: "div", file: CARD, line: 74 },
    ],
  },
  {
    id: "footer",
    label: "CardFooter",
    nodes: [
      { name: "CardFooter", file: TEST_PAGE, line: 369 },
      { name: "div", file: CARD, line: 84 },
    ],
  },
]
