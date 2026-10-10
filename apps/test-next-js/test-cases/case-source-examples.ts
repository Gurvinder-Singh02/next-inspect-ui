/**
 * Short “what is this case?” snippets for the Show source panel.
 * Not full files — just enough to understand the component / usage.
 */

import type { CaseSourceExample } from "./types"

const TEST_PAGE = "app/(dev)/test/page.tsx"
const BUTTON = "components/ui/button.tsx"
const BADGE = "components/ui/badge.tsx"
const CARD = "components/ui/card.tsx"
const MOTION = "components/algo-test/motion-fixture.tsx"
const LIBRARY = "components/algo-test/library-rendered-fixture.tsx"
const RADIX = "components/algo-test/radix-fixture.tsx"
const KINDS = "components/algo-test/kinds-fixture.tsx"
const SERVER = "components/algo-test/server-fixture.tsx"
const SERVER_BUTTON = "components/algo-test/server-button-fixture.tsx"
const SVG = "components/algo-test/svg-fixture.tsx"

export const CASE_SOURCE_EXAMPLES: Record<string, CaseSourceExample[]> = {
  "basic-html-heading": [
    {
      label: "Defined & used in",
      file: TEST_PAGE,
      code: `<h1 className="text-xl font-medium tracking-tight">title</h1>`,
    },
  ],

  "svg-plain": [
    {
      label: "Defined & used in",
      file: TEST_PAGE,
      code: `<svg width={140} height={40} className="overflow-visible">
  <rect x={4} y={4} width={28} height={28} rx={6} />
</svg>`,
    },
  ],

  "svg-parent": [
    {
      label: "Defined in",
      file: SVG,
      code: `export const SvgBars = () => (
  <svg width={140} height={40} className="overflow-visible">
    <rect x={4} y={4} width={28} height={28} rx={6} />
  </svg>
)`,
    },
    {
      label: "Used in",
      file: TEST_PAGE,
      code: `<SvgBars />`,
    },
  ],

  "shadcn-plain": [
    {
      label: "Defined in",
      file: BUTTON,
      code: `function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}`,
    },
    {
      label: "Used in",
      file: TEST_PAGE,
      code: `<Button>Send code</Button>`,
    },
  ],

  "shadcn-variants": [
    {
      label: "Defined in",
      file: BUTTON,
      code: `function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}`,
    },
    {
      label: "Used in",
      file: TEST_PAGE,
      code: `<>
  <Button variant="secondary">Secondary</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="destructive" size="sm">Destructive</Button>
</>`,
    },
  ],

  "shadcn-nested": [
    {
      label: "Defined in",
      file: BUTTON,
      code: `function Button({ ...props }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}`,
    },
    {
      label: "Used in",
      file: TEST_PAGE,
      code: `<Card>
  <CardHeader>
    <CardTitle>Nested</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="outline">Inside a card</Button>
  </CardContent>
</Card>`,
    },
  ],

  "baseui-badge": [
    {
      label: "Defined in",
      file: BADGE,
      code: `function Badge({ className, variant = "default", render, ...props }) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      { className: cn(badgeVariants({ variant }), className) },
      props
    ),
    render,
    state: { slot: "badge", variant },
  })
}`,
    },
    {
      label: "Used in",
      file: TEST_PAGE,
      code: `<>
  <Badge>Default</Badge>
  <Badge variant="secondary">Secondary</Badge>
  <Badge variant="destructive">Destructive</Badge>
</>`,
    },
  ],

  "motion-simple": [
    {
      label: "Defined in",
      file: MOTION,
      code: `export const MotionSimple = () => (
  <motion.div initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} />
)

// nested — div → div → motion.div
<div>
  <div>
    <motion.div initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} />
  </div>
</div>`,
    },
    {
      label: "Used in",
      file: TEST_PAGE,
      code: `<MotionSimplePair />`,
    },
  ],

  "motion-boxes": [
    {
      label: "Defined in",
      file: MOTION,
      code: `export const MotionBoxes = () => (
  <div className="flex gap-3">
    {[0, 1, 2].map((index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        className="size-12 rounded-lg bg-muted-foreground/20"
      />
    ))}
  </div>
)`,
    },
    {
      label: "Used in",
      file: TEST_PAGE,
      code: `<MotionBoxes />`,
    },
  ],

  "motion-svg": [
    {
      label: "Defined in",
      file: MOTION,
      code: `export const MotionSvg = () => (
  <svg width={140} height={40}>
    {[0, 1, 2, 3].map((index) => (
      <motion.rect
        key={index}
        x={index * 34}
        y={4}
        width={28}
        height={28}
        rx={6}
        initial={{ scaleY: 0.6 }}
        animate={{ scaleY: 1 }}
      />
    ))}
  </svg>
)`,
    },
    {
      label: "Used in",
      file: TEST_PAGE,
      code: `<MotionSvg />`,
    },
  ],

  "motion-wrapped": [
    {
      label: "Defined in",
      file: MOTION,
      code: `const Chip = ({ label }) => (
  <motion.div whileHover={{ y: -2 }} className="rounded-full border px-3 py-1">
    {label}
  </motion.div>
)

export const MotionWrapped = () => (
  <div className="flex gap-2">
    <Chip label="alpha" />
    <Chip label="beta" />
  </div>
)`,
    },
    {
      label: "Used in",
      file: TEST_PAGE,
      code: `<MotionWrapped />`,
    },
  ],

  "library-own-host": [
    {
      label: "Defined in",
      file: LIBRARY,
      code: `export const RendersOwnHost = ({ label }) => {
  return createElement(
    "svg",
    { width: 100, height: 36, "aria-label": label },
    [0, 1, 2].map((index) =>
      createElement("rect", {
        key: index,
        x: index * 34,
        y: 4,
        width: 28,
        height: 28,
      })
    )
  )
}`,
    },
    {
      label: "Used in",
      file: TEST_PAGE,
      code: `<>
  <RendersOwnHost label="first" />
  <RendersOwnHost label="second" />
</>`,
    },
  ],

  "radix-slot": [
    {
      label: "Defined in",
      file: RADIX,
      code: `const Clickable = ({ asChild, children }) => {
  const Comp = asChild ? Slot : "button"
  return <Comp className="rounded-md border px-3 py-1.5">{children}</Comp>
}

// own button · Slot → <a> · Slot → <Link>
<Clickable>Renders its own button</Clickable>
<Clickable asChild>
  <a href="#slot">Slot renders this anchor</a>
</Clickable>
<Clickable asChild>
  <Link href="/test">Slot renders a next/link</Link>
</Clickable>`,
    },
    {
      label: "Used in",
      file: TEST_PAGE,
      code: `<SlotFixtures />`,
    },
  ],

  "kinds-forward-ref": [
    {
      label: "Defined in",
      file: KINDS,
      code: `export const ForwardedInput = forwardRef(function ForwardedInput({ hint }, ref) {
  return <input ref={ref} placeholder={hint} />
})

export const MemoPill = memo(function MemoPill({ label }) {
  return <span>{label}</span>
})

export const CompoundDemo = () => (
  <Panel>
    <Panel.Header>Header</Panel.Header>
    <Panel.Body>Body</Panel.Body>
  </Panel>
)`,
    },
    {
      label: "Used in",
      file: TEST_PAGE,
      code: `<>
  <ForwardedInput hint="forwardRef" />
  <MemoPill label="memo" />
  <CompoundDemo />
</>`,
    },
  ],

  "composition-map": [
    {
      label: "Defined & used in",
      file: TEST_PAGE,
      code: `{["alpha", "beta", "gamma"].map((item) => (
  <span key={item} className="rounded-md border px-3 py-1.5">
    {item}
  </span>
))}`,
    },
  ],

  "third-party-icons": [
    {
      label: "Defined & used in",
      file: TEST_PAGE,
      code: `<>
  <SparklesIcon className="size-5" />
  <CircleIcon className="size-5" />
  <ArrowRightIcon className="size-5" />
  <Link href="/">
    Docs
    <ArrowRightIcon className="size-4" />
  </Link>
</>`,
    },
  ],

  "server-direct": [
    {
      label: "Defined in",
      file: SERVER,
      code: `export const ServerCard = ({ title }) => (
  <div className="rounded-lg border p-4">
    <h3>{title}</h3>
    <p>Rendered on the server.</p>
  </div>
)`,
    },
    {
      label: "Used in",
      file: TEST_PAGE,
      code: `<ServerCard title="Direct" />`,
    },
  ],

  "server-nested": [
    {
      label: "Defined in",
      file: SERVER,
      code: `export const ServerCard = ({ title }) => (
  <div className="rounded-lg border p-4">
    <h3>{title}</h3>
  </div>
)`,
    },
    {
      label: "Used in",
      file: TEST_PAGE,
      code: `<ServerCard title="First" />
<ServerCard title="Second" />`,
    },
  ],

  "server-client-button": [
    {
      label: "Defined in",
      file: BUTTON,
      code: `function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}`,
    },
    {
      label: "Used in",
      file: SERVER_BUTTON,
      code: `const MinistryCard = ({ label, ...props }) => (
  <div className="rounded-lg border p-3">
    <Button data-accuracy-target={props["data-accuracy-target"]} size="sm">
      {label}
    </Button>
  </div>
)`,
    },
  ],

  "parent-inspectable-card": [
    {
      label: "Defined in",
      file: CARD,
      code: `function Card({ className, ...props }) {
  return <div data-slot="card" className={cn("flex flex-col", className)} {...props} />
}

function CardHeader({ className, ...props }) {
  return <div data-slot="card-header" {...props} />
}`,
    },
    {
      label: "Used in",
      file: TEST_PAGE,
      code: `<Card>
  <CardHeader>
    <CardDescription>Total Revenue</CardDescription>
    <CardTitle>$1,250.00</CardTitle>
    <CardAction>
      <Badge variant="outline">+12.5%</Badge>
    </CardAction>
  </CardHeader>
  <CardContent>
    <Button variant="outline">View</Button>
  </CardContent>
  <CardFooter>Trending up this month</CardFooter>
</Card>`,
    },
  ],
}
