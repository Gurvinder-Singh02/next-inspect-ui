"use client"

import { createElement } from "react"

import { CaseLayout, Fixture } from "@/components/algo-test/case-layout"

/**
 * Stands in for framer-motion / recharts: a component that constructs its own
 * host DOM rather than returning JSX the caller wrote. Nothing in project
 * source contains these elements, so their owner chain is the only route back.
 */
const RendersOwnHost = ({ label }: { label: string }) => {
  // createElement, not JSX — deliberately outside anything the stamper sees,
  // which is exactly how a chart or animation library builds its DOM.
  const children = [0, 1, 2].map((index) =>
    createElement("rect", {
      key: index,
      x: index * 34,
      y: 4,
      width: 28,
      height: 28,
      rx: 6,
      className: "fill-muted-foreground/30",
    })
  )

  return createElement(
    "svg",
    {
      width: 100,
      height: 36,
      role: "img",
      "aria-label": label,
      className: "overflow-visible",
    },
    children
  )
}

export default function LibraryRenderedCase() {
  return (
    <CaseLayout
      title="Library-rendered element"
      reproduces="An element with no project source anywhere: built by createElement inside a component, exactly as framer-motion and chart libraries build theirs. findNearestAuthorCallSite used to queue fiber.return alongside _debugOwner, and the return chain always terminates at the page — so it could never say 'no answer' and instead returned a plausible wrong file."
      expected={
        <>
          hover a square → the call site below, via the owner chain
          <br />
          <span className="text-muted-foreground">
            never app/(dev)/… from the render tree; if nothing resolves, the
            nearest ancestor — labelled as such
          </span>
        </>
      }
    >
      <Fixture label="component building its own host">
        <RendersOwnHost label="three squares" />
      </Fixture>

      <Fixture label="two instances — must not collapse to one location">
        <div className="flex gap-6">
          <RendersOwnHost label="first" />
          <RendersOwnHost label="second" />
        </div>
      </Fixture>
    </CaseLayout>
  )
}
