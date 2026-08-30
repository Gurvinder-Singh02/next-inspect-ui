import { CaseLayout, Fixture } from "@/components/algo-test/case-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ShadcnHostCase() {
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
        </>
      }
    >
      <Fixture label="plain button">
        <Button>Send code</Button>
      </Fixture>

      <Fixture label="variants — the cva path">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive" size="sm">
            Destructive
          </Button>
        </div>
      </Fixture>

      <Fixture label="nested wrappers — card containing a button">
        <Card>
          <CardHeader>
            <CardTitle>Nested</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Inside a card</Button>
          </CardContent>
        </Card>
      </Fixture>
    </CaseLayout>
  )
}
