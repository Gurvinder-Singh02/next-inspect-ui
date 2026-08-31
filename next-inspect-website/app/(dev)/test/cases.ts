/**
 * Manual expected NODE TREE goldens for /test.
 * Edit by hand — pin from stamp ground truth
 * (`.cursor/skills/pin-accuracy-goldens`).
 */
import type { AccuracyNode, AccuracyTarget } from "@/components/accuracy/types"
import type { SuiteCaseMeta } from "@/components/accuracy/suite-header"

const TEST_PAGE = "app/(dev)/test/page.tsx"
const BUTTON = "components/ui/button.tsx"
const BADGE = "components/ui/badge.tsx"
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
]

export const basicHtmlHeadingNodes: AccuracyNode[] = [
  { name: "h1", file: TEST_PAGE, line: 68 },
]

export const svgPlainNodes: AccuracyNode[] = [
  { name: "rect", file: TEST_PAGE, line: 87 },
]

export const svgParentNodes: AccuracyNode[] = [
  { name: "SvgBars", file: TEST_PAGE, line: 105 },
  { name: "svg", file: SVG, line: 5 },
]

export const shadcnPlainNodes: AccuracyNode[] = [
  { name: "Button", file: TEST_PAGE, line: 117 },
  { name: "button", file: BUTTON, line: 56 },
]

export const shadcnVariantTargets: AccuracyTarget[] = [
  {
    id: "secondary",
    label: "Secondary",
    nodes: [
      { name: "Button", file: TEST_PAGE, line: 128 },
      { name: "button", file: BUTTON, line: 56 },
    ],
  },
  {
    id: "ghost",
    label: "Ghost",
    nodes: [
      { name: "Button", file: TEST_PAGE, line: 131 },
      { name: "button", file: BUTTON, line: 56 },
    ],
  },
  {
    id: "destructive",
    label: "Destructive",
    nodes: [
      { name: "Button", file: TEST_PAGE, line: 134 },
      { name: "button", file: BUTTON, line: 56 },
    ],
  },
]

export const shadcnNestedNodes: AccuracyNode[] = [
  { name: "Button", file: TEST_PAGE, line: 152 },
  { name: "button", file: BUTTON, line: 56 },
]

export const baseuiBadgeTargets: AccuracyTarget[] = [
  {
    id: "default",
    label: "Default",
    nodes: [
      { name: "Badge", file: TEST_PAGE, line: 167 },
      { name: "span", file: BADGE, line: 46 },
    ],
  },
  {
    id: "secondary",
    label: "Secondary",
    nodes: [
      { name: "Badge", file: TEST_PAGE, line: 168 },
      { name: "span", file: BADGE, line: 46 },
    ],
  },
  {
    id: "destructive",
    label: "Destructive",
    nodes: [
      { name: "Badge", file: TEST_PAGE, line: 171 },
      { name: "span", file: BADGE, line: 46 },
    ],
  },
]

export const motionSimpleTargets: AccuracyTarget[] = [
  {
    id: "bare",
    label: "Bare",
    nodes: [
      { name: "MotionSimple", file: MOTION, line: 34 },
      { name: "motion.div", file: MOTION, line: 23 },
    ],
  },
  {
    id: "nested",
    label: "Nested",
    nodes: [{ name: "motion.div", file: MOTION, line: 37 }],
  },
]

/** Nested in the flex wrapper — no climb, same as nested HTML. */
export const motionBoxesTargets: AccuracyTarget[] = [
  {
    id: "box-0",
    label: "Box 0",
    nodes: [{ name: "motion.div", file: MOTION, line: 53 }],
  },
  {
    id: "box-1",
    label: "Box 1",
    nodes: [{ name: "motion.div", file: MOTION, line: 53 }],
  },
  {
    id: "box-2",
    label: "Box 2",
    nodes: [{ name: "motion.div", file: MOTION, line: 53 }],
  },
]

export const motionSvgNodes: AccuracyNode[] = [
  { name: "motion.rect", file: MOTION, line: 69 },
]

export const motionWrappedTargets: AccuracyTarget[] = [
  {
    id: "alpha",
    label: "alpha",
    nodes: [
      { name: "Chip", file: MOTION, line: 148 },
      { name: "motion.div", file: MOTION, line: 137 },
    ],
  },
  {
    id: "beta",
    label: "beta",
    nodes: [
      { name: "Chip", file: MOTION, line: 149 },
      { name: "motion.div", file: MOTION, line: 137 },
    ],
  },
]

export const libraryOwnHostTargets: AccuracyTarget[] = [
  {
    id: "first",
    label: "First",
    nodes: [
      { name: "RendersOwnHost", file: TEST_PAGE, line: 229 },
      { name: "svg", file: LIBRARY, line: 28 },
    ],
  },
  {
    id: "second",
    label: "Second",
    nodes: [
      { name: "RendersOwnHost", file: TEST_PAGE, line: 230 },
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
      { name: "ForwardedInput", file: TEST_PAGE, line: 256 },
      { name: "input", file: KINDS, line: 60 },
    ],
  },
  {
    id: "memo",
    label: "memo",
    nodes: [
      { name: "MemoPill", file: TEST_PAGE, line: 257 },
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
    nodes: [{ name: "span", file: TEST_PAGE, line: 273 }],
  },
  {
    id: "beta",
    label: "beta",
    nodes: [{ name: "span", file: TEST_PAGE, line: 273 }],
  },
  {
    id: "gamma",
    label: "gamma",
    nodes: [{ name: "span", file: TEST_PAGE, line: 273 }],
  },
]

export const thirdPartyIconTargets: AccuracyTarget[] = [
  {
    id: "sparkles",
    label: "Sparkles",
    nodes: [{ name: "svg", file: TEST_PAGE, line: 294 }],
  },
  {
    id: "circle",
    label: "Circle",
    nodes: [{ name: "svg", file: TEST_PAGE, line: 295 }],
  },
  {
    id: "arrow",
    label: "Arrow",
    nodes: [{ name: "svg", file: TEST_PAGE, line: 296 }],
  },
  {
    id: "docs",
    label: "Docs link",
    nodes: [
      { name: "LinkComponent", file: TEST_PAGE, line: 297 },
      { name: "a", file: TEST_PAGE, line: 297 },
    ],
  },
]

export const serverDirectNodes: AccuracyNode[] = [
  { name: "ServerCard", file: TEST_PAGE, line: 317 },
  { name: "div", file: SERVER, line: 17 },
]

export const serverNestedTargets: AccuracyTarget[] = [
  {
    id: "first",
    label: "First",
    nodes: [
      { name: "ServerCard", file: TEST_PAGE, line: 333 },
      { name: "div", file: SERVER, line: 17 },
    ],
  },
  {
    id: "second",
    label: "Second",
    nodes: [
      { name: "ServerCard", file: TEST_PAGE, line: 334 },
      { name: "div", file: SERVER, line: 17 },
    ],
  },
]
