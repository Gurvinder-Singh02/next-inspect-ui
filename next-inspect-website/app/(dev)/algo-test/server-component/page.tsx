import { Suspense } from "react"

import { CaseLayout, Fixture } from "@/components/algo-test/case-layout"
import {
  AsyncServerCard,
  NestedServer,
  ServerCard,
} from "@/components/algo-test/server-fixture"

export default function ServerComponentCase() {
  return (
    <CaseLayout
      title="Server Component host"
      reproduces="RSC _debugInfo was consulted before the stack walk and returned immediately, and it returned renderedBy — the owner's site — first. A <div> inside a Server Component therefore resolved to the page that rendered it: app/(main)/page.tsx:14, a line reading `const params = await searchParams`, not an element at all."
      expected={
        <>
          every element → <code>components/algo-test/server-fixture.tsx</code>
          <br />
          <span className="text-muted-foreground">
            never this page, and never a non-JSX line
          </span>
        </>
      }
    >
      <Fixture label="server component host">
        <ServerCard title="Direct" />
      </Fixture>

      <Fixture label="server component rendering another">
        <NestedServer />
      </Fixture>

      <Fixture label="async server component behind Suspense">
        <Suspense fallback={<div className="text-muted-foreground">…</div>}>
          <AsyncServerCard />
        </Suspense>
      </Fixture>
    </CaseLayout>
  )
}
