import { Option } from "lucide-react"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"

import inspectUIPackage from "next-inspect-ui/package.json"

import { FaqList } from "@/components/landing/faq-list"
import { InstallSection } from "@/components/landing/install-section"
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site"
import { cn } from "@/lib/utils"

const shortcutKeyClassName = cn(
  "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 align-middle font-sans text-xs font-medium text-muted-foreground select-none [&_svg:not([class*='size-'])]:size-3"
)

export const metadata: Metadata = {
  title: {
    absolute: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
}

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "How does this work?",
    a: "Hover a node. The overlay finds that DOM node’s React fiber, reads the debug source, and shows the file. Click or Enter opens that line in your editor. Hold Option to climb to the component that rendered it.",
  },
  {
    q: "Does this affect production?",
    a: "Not if you mount InspectUI only when NODE_ENV is development. The overlay is omitted from production builds; gated that way the measured cost is about 0.2 KB gzipped. Keep the guard, or React serializes projectRoot into the page payload.",
  },
  {
    q: "Does it rely on any other libraries internally?",
    a: "No. You don’t install anything else under the hood. It only needs React, which a React 19+ app already has, and it works by reading the React fiber tree.",
  },
  {
    q: "Is this a build plugin?",
    a: "No. There is no Webpack, Vite, Turbopack, Babel, or SWC plugin. You mount InspectUI in development. It reads the React fiber tree at runtime. projectRoot is just a prop so relative debug paths resolve to real files.",
  },
  {
    q: "Does this only work with Next.js?",
    a: "No. It works with any React 19+ app. Next.js is a common setup, not a requirement. Right now async Server Components are not inspectable.",
  },
  {
    q: "What kind of elements can I inspect?",
    a: (
      <div className="flex flex-col gap-2">
        <p>Anything with a client fiber, including:</p>
        <ul className="flex list-disc flex-col gap-1 pl-4">
          <li>HTML : headings, buttons, links, cards</li>
          <li>
            SVG : <code>svg</code>, <code>rect</code>, and SVG components
          </li>
          <li>shadcn : Button, Card, Badge, nested composition</li>
          <li>
            Base UI : useRender hosts, and nested children like Collapsible
            Trigger / Panel
          </li>
          <li>
            Motion : <code>motion.div</code>, <code>motion.rect</code>
          </li>
          <li>Radix : Slot / asChild</li>
          <li>React kinds : forwardRef, memo, compound components</li>
          <li>Lists : children created in .map()</li>
          <li>Icons : Lucide and other third-party SVG</li>
          <li>Server hosts : sync server components that emit DOM</li>
        </ul>
        <p>
          <Link
            href="/works-with"
            className="text-foreground underline-offset-4 hover:underline"
          >
            See the patterns
          </Link>
        </p>
      </div>
    ),
  },
]

export default function OverviewPage() {
  return (
    <>
      <header className="flex flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <h1>next-inspect-ui</h1>
          <span className="font-inter text-[12px] text-muted-foreground">
            v{inspectUIPackage.version}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <p>
            Inspect any React or Next.js Component in your browser and jump
            directly to its source in your IDE. Works with{" "}
            <a
              href="https://vercel.com/academy/shadcn-ui/compound-components-and-advanced-composition"
              target="_blank"
              className="text-foreground no-underline hover:text-foreground/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              compound components
            </a>{" "}
            too. Hold{" "}
            <kbd className={shortcutKeyClassName}>
              <Option />
            </kbd>{" "}
            and press <kbd className={shortcutKeyClassName}>⇧</kbd> to move up
            the hierarchy.
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2>Installation</h2>
        <InstallSection />
      </section>

      <section className="flex flex-col gap-3">
        <h2>FAQ</h2>
        <FaqList items={FAQ} />
        <p className="pt-4 text-sm">
          <Link
            href="/walkthrough"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            See it in action
          </Link>
          {" · "}
          <Link
            href="/api-reference"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            API reference
          </Link>
        </p>
      </section>
    </>
  )
}
