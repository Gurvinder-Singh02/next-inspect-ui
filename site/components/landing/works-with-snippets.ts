export const WORKS_WITH_SNIPPETS = {
  html: `<p className="text-xl font-medium tracking-tight">title</p>`,
  svg: `<svg width={140} height={40} role="img" aria-label="plain bar">
  <rect x={4} y={4} width={28} height={28} rx={6} />
</svg>`,
  shadcn: `<Button>Send code</Button>
<Button variant="secondary">Secondary</Button>

<Card>
  <CardHeader>
    <CardTitle>Nested</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="outline">Inside a card</Button>
  </CardContent>
</Card>`,
  baseui: `<Badge>Default</Badge>

<Collapsible>
  <CollapsibleTrigger>Details</CollapsibleTrigger>
  <CollapsibleContent>
    Nested children still resolve.
  </CollapsibleContent>
</Collapsible>`,
  motion: `<motion.div initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} />

<svg>
  {[0, 1, 2, 3].map((index) => (
    <motion.rect key={index} x={index * 34} y={4} width={28} height={28} />
  ))}
</svg>`,
  library: `createElement("svg", { width: 100, height: 36 },
  [0, 1, 2].map((index) =>
    createElement("rect", { key: index, x: index * 34, y: 4 })
  )
)`,
  radix: `const Clickable = ({ asChild, children, ...props }) => {
  const Comp = asChild ? Slot : "button"
  return <Comp {...props}>{children}</Comp>
}

<Clickable>Renders its own button</Clickable>
<Clickable asChild>
  <a href="#slot">Slot renders this anchor</a>
</Clickable>`,
  kinds: `const ForwardedInput = forwardRef(function ForwardedInput(props, ref) {
  return <input ref={ref} {...props} />
})

const MemoPill = memo(function MemoPill({ label }) {
  return <span>{label}</span>
})

<Panel>
  <Panel.Header>Header</Panel.Header>
  <Panel.Body>Body</Panel.Body>
</Panel>`,
  map: `{["alpha", "beta", "gamma"].map((item) => (
  <span key={item}>{item}</span>
))}`,
  icons: `<SparklesIcon />
<CircleIcon />
<ArrowRightIcon />`,
  server: `export const ServerCard = ({ title }) => (
  <div>
    <h3>{title}</h3>
    <p>Rendered on the server.</p>
  </div>
)`,
} as const
