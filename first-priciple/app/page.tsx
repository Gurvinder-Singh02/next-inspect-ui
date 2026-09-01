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
            <p className="text-muted-foreground">
              Hover any element, press <kbd className="px-2 py-1 bg-muted rounded text-sm">Cmd/Ctrl + Shift + I</kbd> to inspect.
              Press <kbd className="px-2 py-1 bg-muted rounded text-sm">↑</kbd> to climb parents.
            </p>
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
