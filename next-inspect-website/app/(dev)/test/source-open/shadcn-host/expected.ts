import type { AccuracyRouteExpected } from "@/components/accuracy/types"

/**
 * Golden NODE TREE for /test/source-open/shadcn-host.
 *
 * Regenerate a case: hover target → press I → Snapshot on that case, paste
 * into `nodes`. Or run:
 *   pnpm --filter next-inspect-website accuracy:capture -- /test/source-open/shadcn-host
 *
 * Order matches Inspect UI NODE TREE (climb parents first, host last).
 */
export const shadcnHostExpected = {
  route: "/test/source-open/shadcn-host",
  cases: [
    {
      id: "plain-button",
      label: "plain button",
      selector: "[data-slot=button]",
      nodes: [
        {
          name: "Button",
          file: "app/(dev)/test/source-open/shadcn-host/page.tsx",
          line: 37,
        },
        {
          name: "button",
          file: "components/ui/button.tsx",
          line: 50,
        },
      ],
    },
    {
      id: "variants",
      label: "variants — the cva path",
      selector: "[data-slot=button]",
      nodes: [
        {
          name: "Button",
          file: "app/(dev)/test/source-open/shadcn-host/page.tsx",
        },
        {
          name: "button",
          file: "components/ui/button.tsx",
          line: 50,
        },
      ],
    },
    {
      id: "nested-card",
      label: "nested wrappers — card containing a button",
      selector: "[data-slot=button]",
      nodes: [
        {
          name: "Button",
          file: "app/(dev)/test/source-open/shadcn-host/page.tsx",
          line: 60,
        },
        {
          name: "button",
          file: "components/ui/button.tsx",
          line: 50,
        },
      ],
    },
  ],
} satisfies AccuracyRouteExpected
