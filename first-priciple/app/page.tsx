import { Card } from "@/components/card"
import { InspectOverlay } from "@/components/inspect-overlay"

export default function Home() {
  return (
    <>
      <InspectOverlay />
      <div className="min-h-screen p-8 flex items-center justify-center bg-background">
        <div className="max-w-2xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">first-priciple demo</h1>
            <div className="space-y-3 text-muted-foreground text-sm leading-relaxed">
              <p>
                <strong className="text-foreground">Fiber ≠ new in React&nbsp;19.</strong>{" "}
                Since React&nbsp;16, every rendered thing is a fiber. In <em>dev</em>, each DOM node
                gets a hidden pointer <code className="text-xs">__reactFiber$</code> → that fiber.
              </p>
              <p>
                <strong className="text-foreground">What the fiber knows:</strong> component{" "}
                <em>name</em> (<code className="text-xs">Card</code>), parent link (
                <code className="text-xs">fiber.return</code>), children.{" "}
                <strong className="text-foreground">What it does <em>not</em> know in React&nbsp;19:</strong>{" "}
                your source <code className="text-xs">file:line</code> — React removed{" "}
                <code className="text-xs">_debugSource</code>. That&apos;s why next-inspect-ui needs
                stamps or stack remapping for the path.
              </p>
              <p>
                Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Cmd/Ctrl&nbsp;+&nbsp;X</kbd>{" "}
                then hover — this demo only reads the <em>name</em> from the fiber.{" "}
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↑</kbd> climbs{" "}
                <code className="text-xs">fiber.return</code>.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <Card title="Outer Card" description="This is the outer container">
              <Card title="Nested Card" description="This card is nested inside">
                <p className="text-sm text-muted-foreground">
                  Deeply nested content to demonstrate climbing the component tree.
                </p>
              </Card>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
