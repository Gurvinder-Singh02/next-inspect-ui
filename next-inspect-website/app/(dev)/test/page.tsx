import { Suspense } from "react"
import Link from "next/link"
import { SparklesIcon, CircleIcon, ArrowRightIcon } from "lucide-react"
import { inspectUIProjectRoot } from "next-inspect-ui-debug"

import { SuiteCase } from "@/components/accuracy/suite-case"
import { SuiteGroup } from "@/components/accuracy/suite-group"
import { TestSuiteShell } from "@/components/accuracy/test-suite-shell"
import { RendersOwnHost } from "@/components/algo-test/library-rendered-fixture"
import { SvgBars } from "@/components/algo-test/svg-fixture"
import {
  CompoundDemo,
  ForwardedInput,
  MemoPill,
} from "@/components/algo-test/kinds-fixture"
import {
  MotionBoxes,
  MotionSimplePair,
  MotionSvg,
  MotionWrapped,
} from "@/components/algo-test/motion-fixture"
import { SlotFixtures } from "@/components/algo-test/radix-fixture"
import { ServerCard } from "@/components/algo-test/server-fixture"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  TEST_CASE_META,
  baseuiBadgeTargets,
  basicHtmlHeadingNodes,
  compositionMapTargets,
  kindsForwardRefTargets,
  libraryOwnHostTargets,
  motionBoxesTargets,
  motionSimpleTargets,
  motionSvgNodes,
  motionWrappedTargets,
  radixSlotTargets,
  serverDirectNodes,
  serverNestedTargets,
  shadcnNestedNodes,
  svgParentNodes,
  svgPlainNodes,
  shadcnPlainNodes,
  shadcnVariantTargets,
  thirdPartyIconTargets,
} from "./cases"
import { loadCaseSources } from "./load-case-sources"

export default async function TestSuitePage() {
  const sourcesByCase = await loadCaseSources()

  return (
    <TestSuiteShell
      cases={TEST_CASE_META}
      projectRoot={inspectUIProjectRoot()}
      sourcesByCase={sourcesByCase}
    >
      <SuiteGroup title="basic html snippet">
        <SuiteCase
          id="basic-html-heading"
          title="plain heading"
          group="basic html snippet"
          description="Native HTML authored on this page. Hover the heading → this file. NODE TREE is one node: h1."
          nodes={basicHtmlHeadingNodes}
        >
          <h1 className="text-xl font-medium tracking-tight">title</h1>
        </SuiteCase>
      </SuiteGroup>

      <SuiteGroup title="svg">
        <SuiteCase
          id="svg-plain"
          title="plain svg"
          group="svg"
          description="Native SVG authored on this page. Hover the rect → this file. NODE TREE is one node: rect."
          nodes={svgPlainNodes}
        >
          <svg
            width={140}
            height={40}
            role="img"
            aria-label="plain bar"
            className="overflow-visible"
          >
            <rect
              x={4}
              y={4}
              width={28}
              height={28}
              rx={6}
              className="fill-muted-foreground/30"
            />
          </svg>
        </SuiteCase>

        <SuiteCase
          id="svg-parent"
          title="svg parent climb"
          group="svg"
          description="SvgBars returns svg as its root. Hover the svg → climb to SvgBars. Inner rect stays put — nested host, no climb."
          nodes={svgParentNodes}
        >
          <SvgBars data-accuracy-target="root" />
        </SuiteCase>
      </SuiteGroup>

      <SuiteGroup title="shadcn">
        <SuiteCase
          id="shadcn-plain"
          title="plain button"
          group="shadcn"
          description="Hover the button → components/ui/button.tsx. ⌥ climb → this page. NODE TREE stops at <Button/> (2 nodes)."
          nodes={shadcnPlainNodes}
        >
          <Button>Send code</Button>
        </SuiteCase>

        <SuiteCase
          id="shadcn-variants"
          title="button variants"
          group="shadcn"
          description="cva variants still author the host in button.tsx. Climb is still one hop — never Card or page parents."
          targets={shadcnVariantTargets}
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Button data-accuracy-target="secondary" variant="secondary">
              Secondary
            </Button>
            <Button data-accuracy-target="ghost" variant="ghost">
              Ghost
            </Button>
            <Button data-accuracy-target="destructive" variant="destructive" size="sm">
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
      </SuiteGroup>

      <SuiteGroup title="base-ui">
        <SuiteCase
          id="baseui-badge"
          title="badge useRender host"
          group="base-ui"
          description="Badge builds its host through useRender + mergeProps. Prefer badge.tsx when possible; never invent a false host stamp."
          targets={baseuiBadgeTargets}
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Badge data-accuracy-target="default">Default</Badge>
            <Badge data-accuracy-target="secondary" variant="secondary">
              Secondary
            </Badge>
            <Badge data-accuracy-target="destructive" variant="destructive">
              Destructive
            </Badge>
          </div>
        </SuiteCase>
      </SuiteGroup>

      <SuiteGroup title="motion">
        <SuiteCase
          id="motion-simple"
          title="motion.div bare + nested"
          group="motion"
          description="Bare MotionSimple returns motion.div (climbs). Nested div→div→motion.div does not."
          targets={motionSimpleTargets}
        >
          <MotionSimplePair />
        </SuiteCase>

        <SuiteCase
          id="motion-boxes"
          title="motion.div list"
          group="motion"
          description="Each motion.div is its own target — resolve the box host in the fixture file, never the flex wrapper or a random page line."
          targets={motionBoxesTargets}
        >
          <MotionBoxes />
        </SuiteCase>

        <SuiteCase
          id="motion-svg"
          title="motion.rect svg"
          group="motion"
          description="SVG rects from motion.rect — the original wrong-file case. Expect the fixture file, not searchParams."
          nodes={motionSvgNodes}
        >
          <MotionSvg />
        </SuiteCase>

        <SuiteCase
          id="motion-wrapped"
          title="wrapped motion climb"
          group="motion"
          description="Chip returns motion.div — climbs like Chip → div."
          targets={motionWrappedTargets}
        >
          <MotionWrapped />
        </SuiteCase>
      </SuiteGroup>

      <SuiteGroup title="library">
        <SuiteCase
          id="library-own-host"
          title="library-built host"
          group="library"
          description="Squares built with createElement. Prefer the call site via owner chain; never invent a page line from the return tree."
          targets={libraryOwnHostTargets}
        >
          <div className="flex justify-center gap-6">
            <RendersOwnHost data-accuracy-target="first" label="first" />
            <RendersOwnHost data-accuracy-target="second" label="second" />
          </div>
        </SuiteCase>
      </SuiteGroup>

      <SuiteGroup title="radix">
        <SuiteCase
          id="radix-slot"
          title="radix Slot / asChild"
          group="radix"
          description="Slot-rendered anchors should resolve to the child's JSX in the radix fixture, not a phantom parent host."
          targets={radixSlotTargets}
        >
          <SlotFixtures />
        </SuiteCase>
      </SuiteGroup>

      <SuiteGroup title="kinds">
        <SuiteCase
          id="kinds-forward-ref"
          title="forwardRef + memo"
          group="kinds"
          description="forwardRef and memo wrappers still need a clean path back to project source."
          targets={kindsForwardRefTargets}
        >
          <div className="flex flex-col items-center gap-3">
            <ForwardedInput data-accuracy-target="forward-ref" hint="forwardRef" />
            <MemoPill data-accuracy-target="memo" label="memo" />
            <CompoundDemo data-accuracy-target="compound" />
          </div>
        </SuiteCase>
      </SuiteGroup>

      <SuiteGroup title="composition">
        <SuiteCase
          id="composition-map"
          title="list map children"
          group="composition"
          description="Elements created in .map() should still open the authoring file for this page."
          targets={compositionMapTargets}
        >
          <div className="flex flex-wrap justify-center gap-2">
            {["alpha", "beta", "gamma"].map((item) => (
              <span
                key={item}
                data-accuracy-target={item}
                className="rounded-md border border-border px-3 py-1.5 font-mono text-[13px]"
              >
                {item}
              </span>
            ))}
          </div>
        </SuiteCase>
      </SuiteGroup>

      <SuiteGroup title="third-party">
        <SuiteCase
          id="third-party-icons"
          title="lucide icons"
          group="third-party"
          description="Lucide SVGs are built in node_modules. Prefer this page's call site, never a vendor path."
          targets={thirdPartyIconTargets}
        >
          <div className="flex items-center justify-center gap-4">
            <SparklesIcon data-accuracy-target="sparkles" className="size-5" />
            <CircleIcon data-accuracy-target="circle" className="size-5" />
            <ArrowRightIcon data-accuracy-target="arrow" className="size-5" />
            <Link
              data-accuracy-target="docs"
              href="/"
              className="inline-flex items-center gap-2 font-inter text-[14px] underline underline-offset-4"
            >
              Docs
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </SuiteCase>
      </SuiteGroup>

      <SuiteGroup title="server">
        <SuiteCase
          id="server-direct"
          title="server component host"
          group="server"
          description="Server-rendered card hosts should open components/algo-test/server-fixture.tsx, never this page."
          nodes={serverDirectNodes}
        >
          <ServerCard title="Direct" />
        </SuiteCase>

        <SuiteCase
          id="server-nested"
          title="nested server cards"
          group="server"
          description="Nested server trees must still point at the fixture file for every host."
          targets={serverNestedTargets}
        >
          <Suspense
            fallback={
              <div className="text-muted-foreground">Loading server tree…</div>
            }
          >
            <div className="flex flex-col gap-3">
              <ServerCard data-accuracy-target="first" title="First" />
              <ServerCard data-accuracy-target="second" title="Second" />
            </div>
          </Suspense>
        </SuiteCase>
      </SuiteGroup>
    </TestSuiteShell>
  )
}
