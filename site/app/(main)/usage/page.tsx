import type { Metadata } from "next"

import { HeroWindows } from "@/components/landing/hero-windows"

export const metadata: Metadata = {
  title: "Usage",
  description:
    "See next-inspect-ui in action: hover, click to open source, and climb to the component that rendered an element.",
  alternates: { canonical: "/usage" },
}

export default function UsagePage() {
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="font-inter text-2xl leading-tight font-semibold tracking-tight">
          Usage
        </h1>
        <p className="font-inter text-[14px] leading-relaxed text-muted-foreground">
          See next-inspect-ui in action.
        </p>
      </header>

      <HeroWindows className="w-full" />
    </>
  )
}
