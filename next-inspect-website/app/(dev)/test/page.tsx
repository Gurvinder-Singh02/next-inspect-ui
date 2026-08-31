import { Suspense } from "react"
import Link from "next/link"
import { SparklesIcon, CircleIcon, ArrowRightIcon } from "lucide-react"

import { SuiteCase } from "@/components/accuracy/suite-case"
import { TestSuiteShell } from "@/components/accuracy/test-suite-shell"
import { RendersOwnHost } from "@/components/algo-test/library-rendered-fixture"
import {
  CompoundDemo,
  ForwardedInput,
  MemoPill,
} from "@/components/algo-test/kinds-fixture"
import {
  MotionBoxes,
  MotionSvg,
  MotionWrapped,
} from "@/components/algo-test/motion-fixture"
import { SlotFixtures } from "@/components/algo-test/radix-fixture"
import {
  NestedServer,
  ServerCard,
} from "@/components/algo-test/server-fixture"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  TEST_CASE_META,
  shadcnNestedNodes,
  shadcnPlainNodes,
  shadcnVariantNodes,
} from "./cases"

export default function TestSuitePage() {
  return (
    <TestSuiteShell cases={TEST_CASE_META}>
      <GroupHeading
        title="shadcn"
        blurb="Wrapper hosts under components/ui — hover resolves to the wrapper file; ⌥ climb is one hop to this page."
      />

      <SuiteCase
        id="shadcn-plain"
        title="plain button"
        group="shadcn"
        description='Hover the button → components/ui/button.tsx. ⌥ climb → this page. NODE TREE stops at <Button/> (2 nodes).'
        nodes={shadcnPlainNodes}
      >
        <Button>Send code</Button>
      </SuiteCase>

      <SuiteCase
        id="shadcn-variants"
        title="button variants"
        group="shadcn"
        description="cva variants still author the host in button.tsx. Climb is still one hop — never Card or page parents."
        nodes={shadcnVariantNodes}
      >
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive" size="sm">
            Destructive
          </Button>
        </div>
      </SuiteCase>

      <SuiteCase
        id="shadcn-nested"
        title="button inside card"
        group="shadcn"
        description="Nested wrappers must not inflate the climb chain. Expected still 2 nodes: Button usage + button host."
        nodes={shadcnNestedNodes}
      >
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Nested</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Inside a card</Button>
          </CardContent>
        </Card>
      </SuiteCase>

      <GroupHeading
        title="base-ui"
        blurb="Hosts built inside @base-ui/react via useRender — often no host stamp."
      />

      <SuiteCase
        id="baseui-badge"
        title="badge useRender host"
        group="base-ui"
        description="Badge builds its host through useRender + mergeProps. Prefer badge.tsx when possible; never invent a false host stamp."
      >
        <div className="flex flex-wrap justify-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </SuiteCase>

      <GroupHeading
        title="motion"
        blurb="DOM built inside motion — owner chain is the only route back to project source."
      />

      <SuiteCase
        id="motion-boxes"
        title="motion.div list"
        group="motion"
        description="motion.div list items should resolve into the motion fixture file, never a random page line."
      >
        <MotionBoxes />
      </SuiteCase>

      <SuiteCase
        id="motion-svg"
        title="motion.rect svg"
        group="motion"
        description="SVG rects from motion.rect — the original wrong-file case. Expect the fixture file, not searchParams."
      >
        <MotionSvg />
      </SuiteCase>

      <SuiteCase
        id="motion-wrapped"
        title="wrapped motion climb"
        group="motion"
        description="User component wrapping motion — same-file wrappers may need a second climb hop."
      >
        <MotionWrapped />
      </SuiteCase>

      <GroupHeading
        title="library"
        blurb="createElement hosts with no project JSX for the DOM node."
      />

      <SuiteCase
        id="library-own-host"
        title="library-built host"
        group="library"
        description="Squares built with createElement. Prefer the call site via owner chain; never invent a page line from the return tree."
      >
        <div className="flex justify-center gap-6">
          <RendersOwnHost label="first" />
          <RendersOwnHost label="second" />
        </div>
      </SuiteCase>

      <GroupHeading
        title="radix"
        blurb="asChild / Slot merge onto the child host."
      />

      <SuiteCase
        id="radix-slot"
        title="radix Slot / asChild"
        group="radix"
        description="Slot-rendered anchors should resolve to the child's JSX in the radix fixture, not a phantom parent host."
      >
        <SlotFixtures />
      </SuiteCase>

      <GroupHeading
        title="kinds"
        blurb="Different fiber shapes from declaration style."
      />

      <SuiteCase
        id="kinds-forward-ref"
        title="forwardRef + memo"
        group="kinds"
        description="forwardRef and memo wrappers still need a clean path back to project source."
      >
        <div className="flex flex-col items-center gap-3">
          <ForwardedInput hint="forwardRef" />
          <MemoPill label="memo" />
          <CompoundDemo />
        </div>
      </SuiteCase>

      <GroupHeading
        title="composition"
        blurb="Ordinary JSX nesting patterns."
      />

      <SuiteCase
        id="composition-map"
        title="list map children"
        group="composition"
        description="Elements created in .map() should still open the authoring file for this page."
      >
        <div className="flex flex-wrap justify-center gap-2">
          {["alpha", "beta", "gamma"].map((item) => (
            <span
              key={item}
              className="rounded-md border border-border px-3 py-1.5 font-mono text-[13px]"
            >
              {item}
            </span>
          ))}
        </div>
      </SuiteCase>

      <GroupHeading
        title="third-party"
        blurb="Hosts from node_modules — call site is the honest answer."
      />

      <SuiteCase
        id="third-party-icons"
        title="lucide icons"
        group="third-party"
        description="Lucide SVGs are built in node_modules. Prefer this page's call site, never a vendor path."
      >
        <div className="flex items-center justify-center gap-4">
          <SparklesIcon className="size-5" />
          <CircleIcon className="size-5" />
          <ArrowRightIcon className="size-5" />
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-inter text-[14px] underline underline-offset-4"
          >
            Docs
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </SuiteCase>

      <GroupHeading
        title="server"
        blurb="RSC hosts — resolve into the server fixture file, not the page."
      />

      <SuiteCase
        id="server-direct"
        title="server component host"
        group="server"
        description="Server-rendered card hosts should open components/algo-test/server-fixture.tsx, never this page."
      >
        <ServerCard title="Direct" />
      </SuiteCase>

      <SuiteCase
        id="server-nested"
        title="nested server cards"
        group="server"
        description="Nested server trees must still point at the fixture file for every host."
      >
        <Suspense
          fallback={
            <div className="text-muted-foreground">Loading server tree…</div>
          }
        >
          <NestedServer />
        </Suspense>
      </SuiteCase>
    </TestSuiteShell>
  )
}

const GroupHeading = ({
  title,
  blurb,
}: {
  title: string
  blurb: string
}) => (
  <div className="flex flex-col gap-1 pt-4 first:pt-0">
    <h2 className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
      {title}
    </h2>
    <p className="max-w-[60ch] font-inter text-[13px] text-muted-foreground/80">
      {blurb}
    </p>
  </div>
)
