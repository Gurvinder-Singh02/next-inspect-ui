import { AccuracyCase } from "@/components/accuracy/accuracy-case"
import { CaseLayout, Fixture } from "@/components/algo-test/case-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { shadcnHostExpected } from "./expected"

const byId = Object.fromEntries(
  shadcnHostExpected.cases.map((entry) => [entry.id, entry])
)

export default function ShadcnHostCase() {
  const plain = byId["plain-button"]!
  const variants = byId.variants!
  const nested = byId["nested-card"]!

  return (
    <CaseLayout
      title="shadcn wrapper host"
      reproduces="isShadcnUiSource demoted any candidate under components/ui/ and reached past it for the app-level call site. Hovering a <button> rendered by <Button> resolved to this file instead of button.tsx, which also made the verifier score every shadcn host as a mismatch."
      expected={
        <>
          hover a button → <code>components/ui/button.tsx</code>
          <br />
          <span className="text-muted-foreground">⌥ climb → </span>
          <code>this file</code>
          <span className="text-muted-foreground">
            {" "}
            · NODE TREE is 2 nodes (<code>Button</code> usage + host)
          </span>
        </>
      }
      autoCheck={false}
    >
      <Fixture label={plain.label}>
        <AccuracyCase id={plain.id} nodes={plain.nodes}>
          <Button>Send code</Button>
        </AccuracyCase>
      </Fixture>

      <Fixture label={variants.label}>
        <AccuracyCase id={variants.id} nodes={variants.nodes}>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive" size="sm">
              Destructive
            </Button>
          </div>
        </AccuracyCase>
      </Fixture>

      <Fixture label={nested.label}>
        <AccuracyCase id={nested.id} nodes={nested.nodes}>
          <Card>
            <CardHeader>
              <CardTitle>Nested</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline">Inside a card</Button>
            </CardContent>
          </Card>
        </AccuracyCase>
      </Fixture>
    </CaseLayout>
  )
}
