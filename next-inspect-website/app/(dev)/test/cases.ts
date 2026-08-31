import type { AccuracyNode } from "@/components/accuracy/types"
import type { SuiteCaseMeta } from "@/components/accuracy/suite-header"

const TEST_PAGE = "app/(dev)/test/page.tsx"
const BUTTON = "components/ui/button.tsx"

/** Sticky-header meta — keep in sync with cases rendered on /test. */
export const TEST_CASE_META: SuiteCaseMeta[] = [
  { id: "shadcn-plain", title: "plain button", group: "shadcn" },
  { id: "shadcn-variants", title: "button variants", group: "shadcn" },
  { id: "shadcn-nested", title: "button inside card", group: "shadcn" },
  { id: "baseui-badge", title: "badge useRender host", group: "base-ui" },
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

export const shadcnPlainNodes: AccuracyNode[] = [
  { name: "Button", file: TEST_PAGE },
  { name: "button", file: BUTTON, line: 50 },
]

export const shadcnVariantNodes: AccuracyNode[] = [
  { name: "Button", file: TEST_PAGE },
  { name: "button", file: BUTTON, line: 50 },
]

export const shadcnNestedNodes: AccuracyNode[] = [
  { name: "Button", file: TEST_PAGE },
  { name: "button", file: BUTTON, line: 50 },
]
