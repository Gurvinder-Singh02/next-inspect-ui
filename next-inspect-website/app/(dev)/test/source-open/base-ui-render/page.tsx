import Link from "next/link"

import { CaseLayout, Fixture } from "@/components/algo-test/case-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function BaseUiRenderCase() {
  return (
    <CaseLayout
      title="Base UI useRender host"
      reproduces="Badge builds its host through @base-ui/react's useRender + mergeProps, so the DOM node is constructed inside node_modules and no project file contains that <span>. There is no host stamp — only the owner stamp that rides in through mergeProps. Scoring hover against that owner stamp marked the runtime wrong for answering the hover question correctly."
      expected={
        <>
          hover a badge → <code>components/ui/badge.tsx</code>
          <br />
          <span className="text-muted-foreground">
            verifier → grey (unverifiable), never red — no host stamp exists
          </span>
        </>
      }
    >
      <Fixture label="badge — host built by useRender">
        <div className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </Fixture>

      <Fixture label="render prop — Button rendering a Link">
        <Button nativeButton={false} render={<Link href="/test/source-open" />}>
          Rendered as an anchor
        </Button>
      </Fixture>

      <Fixture label="badge inside a wrapper that also forwards props">
        <div className="flex items-center gap-3">
          <span className="font-inter text-sm text-muted-foreground">
            Status
          </span>
          <Badge variant="secondary">Forwarded</Badge>
        </div>
      </Fixture>
    </CaseLayout>
  )
}
