import { CaseLayout, Fixture } from "@/components/algo-test/case-layout"
import {
  BorderedNote,
  Boundary,
  ClassBox,
  CompoundDemo,
  ForwardedInput,
  LazyBox,
  MemoPill,
  PortalBox,
  ToneProvider,
  ToneReader,
} from "@/components/algo-test/kinds-fixture"

export default function ComponentKindsCase() {
  return (
    <CaseLayout
      title="Declaration styles"
      reproduces="Every way a component can be declared produces a differently shaped fiber — class fibers, memo and forwardRef wrappers, context providers, lazy boundaries, portals. Resolution walks fibers, so each shape is a separate risk, and none of them had a fixture until now."
      expected={
        <>
          every element → <code>components/algo-test/kinds-fixture.tsx</code>
          <br />
          <span className="text-muted-foreground">
            including the portal, which is attached to document.body
          </span>
        </>
      }
    >
      <Fixture label="class component">
        <ClassBox label="Rendered by a class." />
      </Fixture>

      <Fixture label="class error boundary wrapping children">
        <Boundary>
          <p className="font-inter text-[14px]">Inside a boundary.</p>
        </Boundary>
      </Fixture>

      <Fixture label="forwardRef">
        <ForwardedInput hint="forwarded ref" />
      </Fixture>

      <Fixture label="memo">
        <div className="flex gap-2">
          <MemoPill label="memo one" />
          <MemoPill label="memo two" />
        </div>
      </Fixture>

      <Fixture label="higher-order component">
        <BorderedNote text="Wrapped by an HOC." />
      </Fixture>

      <Fixture label="compound component — dot notation, used inside the client module">
        <CompoundDemo />
      </Fixture>

      <Fixture label="context provider and consumer">
        <ToneProvider>
          <ToneReader />
        </ToneProvider>
      </Fixture>

      <Fixture label="portal — rendered onto document.body">
        <PortalBox />
      </Fixture>

      <Fixture label="lazy behind Suspense">
        <LazyBox />
      </Fixture>
    </CaseLayout>
  )
}
