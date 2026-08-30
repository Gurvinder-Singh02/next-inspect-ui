import { CaseLayout, Fixture } from "@/components/algo-test/case-layout"
import {
  RadixAsChildTrigger,
  RadixMenu,
  SlotFixtures,
} from "@/components/algo-test/radix-fixture"

export default function RadixCase() {
  return (
    <CaseLayout
      title="Radix asChild and Slot"
      reproduces="Radix retargets differently from Base UI. asChild makes a component render its child instead of its own host, merging props onto it — so the DOM node was authored at the child's JSX and the parent contributes only props. Base UI's useRender instead builds a fresh host inside the library. Both produce DOM the caller never literally wrote, by different routes, and only one of them was covered."
      expected={
        <>
          hover a Slot-rendered node → the child's JSX in{" "}
          <code>components/algo-test/radix-fixture.tsx</code>
          <br />
          <span className="text-muted-foreground">
            portalled menu content resolves to the same file, not to the portal
            root
          </span>
        </>
      }
    >
      <Fixture label="Slot — asChild swaps the rendered host">
        <SlotFixtures />
      </Fixture>

      <Fixture label="Radix primitive with portalled content (open it, then hover)">
        <RadixMenu />
      </Fixture>

      <Fixture label="asChild trigger — the trigger's DOM comes from the child">
        <RadixAsChildTrigger />
      </Fixture>
    </CaseLayout>
  )
}
