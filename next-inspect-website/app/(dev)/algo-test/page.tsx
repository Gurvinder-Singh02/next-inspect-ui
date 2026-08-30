import Link from "next/link"

/**
 * Index of source-resolution fixtures.
 *
 * Each route reproduces a failure the verifier caught in a real app. They are
 * hovered by hand — the inspector's own green/red panel is the oracle, so a
 * route "passes" when every element on it scores a match.
 */
const CASES = [
  {
    href: "/algo-test/shadcn-host",
    title: "shadcn wrapper host",
    blurb:
      "A <button> written inside components/ui. Hover must resolve to the wrapper's own file, not the call site — the components/ui redirect used to send it to the caller.",
  },
  {
    href: "/algo-test/base-ui-render",
    title: "Base UI useRender host",
    blurb:
      "The DOM node is constructed inside @base-ui/react, so no host stamp exists. There is no hover ground truth here — these should score grey, not red.",
  },
  {
    href: "/algo-test/server-component",
    title: "Server Component host",
    blurb:
      "RSC _debugInfo used to win over the stack frame and return the owner's site, resolving every server-rendered host to the page that rendered it.",
  },
  {
    href: "/algo-test/motion",
    title: "Motion components",
    blurb:
      "motion.div and motion.rect. The DOM is built inside the library, so the owner chain is the only route back — this is the shape that produced the original wrong file.",
  },
  {
    href: "/algo-test/library-rendered",
    title: "Library-rendered element",
    blurb:
      "An element with no project source anywhere in its owner chain. Resolution must decline rather than climb the render tree to the nearest page.",
  },
  {
    href: "/algo-test/radix",
    title: "Radix asChild and Slot",
    blurb:
      "asChild makes a component render its child instead of its own host, so the DOM was authored at the child's JSX. A different retargeting route from Base UI, and previously untested.",
  },
  {
    href: "/algo-test/component-kinds",
    title: "Declaration styles",
    blurb:
      "Class components, error boundaries, forwardRef, memo, HOCs, compound dot notation, context, portals and lazy. Each produces a differently shaped fiber, and resolution walks fibers.",
  },
  {
    href: "/algo-test/composition",
    title: "Composition patterns",
    blurb:
      "children, elements passed as props, render props, .map() lists, conditionals and fragments — the ordinary ways JSX nests.",
  },
  {
    href: "/algo-test/third-party",
    title: "Third-party components",
    blurb:
      "lucide icons, next/link and next/image. Their internals live in node_modules; the call site is the best available answer.",
  },
]

export default function AlgoTestIndex() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10 sm:py-16">
        <header className="flex flex-col gap-3">
          <h1 className="font-inter text-2xl font-semibold tracking-tight">
            Source resolution cases
          </h1>
          <p className="max-w-[62ch] font-inter text-[15px] leading-relaxed text-muted-foreground">
            Each route reproduces a way resolution has actually gone wrong.
            Press <kbd className="font-mono text-[12px]">⌥X</kbd> and hover
            everything: the debug panel scores each element against the
            build-time stamp, so a route passes when it stays green.
          </p>
        </header>

        <ul className="flex flex-col gap-3">
          {CASES.map((entry) => (
            <li key={entry.href}>
              <Link
                href={entry.href}
                className="flex flex-col gap-1.5 rounded-xl border border-border p-5 transition-colors hover:bg-muted/40"
              >
                <span className="font-inter text-[15px] font-medium">
                  {entry.title}
                </span>
                <span className="font-inter text-[14px] leading-relaxed text-muted-foreground">
                  {entry.blurb}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
