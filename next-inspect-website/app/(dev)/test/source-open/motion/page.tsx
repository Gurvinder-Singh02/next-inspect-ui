import { CaseLayout, Fixture } from "@/components/algo-test/case-layout"
import {
  MotionBoxes,
  MotionNested,
  MotionPresence,
  MotionSvg,
  MotionWrapped,
} from "@/components/algo-test/motion-fixture"

export default function MotionCase() {
  return (
    <CaseLayout
      title="Motion components"
      reproduces="The case that started this: an SVG <rect> rendered by motion.rect resolved to app/(main)/page.tsx:14 — a line reading `const params = await searchParams`, not an element at all. motion.div is a component rather than a host, so the DOM node is built inside the library and the owner chain is the only route back to your code."
      expected={
        <>
          every element → <code>components/algo-test/motion-fixture.tsx</code>
          <br />
          <span className="text-muted-foreground">
            never a page file, never a non-JSX line, never node_modules
          </span>
        </>
      }
    >
      <Fixture label="motion.div in a list">
        <MotionBoxes />
      </Fixture>

      <Fixture label="motion.rect — SVG built inside the library">
        <MotionSvg />
      </Fixture>

      <Fixture label="motion nested in ordinary markup">
        <MotionNested />
      </Fixture>

      <Fixture label="mount / unmount through AnimatePresence">
        <MotionPresence />
      </Fixture>

      <Fixture label="a component wrapping a motion element — two levels to climb">
        <MotionWrapped />
      </Fixture>
    </CaseLayout>
  )
}
