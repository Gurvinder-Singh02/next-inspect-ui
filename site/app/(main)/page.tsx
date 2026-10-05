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
    a: "Press Option / Alt + X to enable inspect mode, then hover an element. The inspector reads React Fiber metadata and source maps to find its source. Click or press Enter to open it. Hold Option / Alt to inspect the owning component’s usage.",
  },
  {
    q: "Does this affect production?",
    a: "Use the development-only dynamic import shown in Usage. Your bundler excludes the library from production. A static import disables the inspector but may retain a small wrapper. Serve the standalone script only in development.",
  },
  {
    q: "Does it rely on any other libraries internally?",
    a: "Yes. It uses bippy/source, the source resolver also used by React Grab, to recover component stacks. Your package manager installs it automatically. React and ReactDOM are peer dependencies.",
  },
  {
    q: "Is this a build plugin?",
    a: "No. There is no Webpack, Vite, Turbopack, Babel, or SWC plugin. You mount InspectUI in development. It reads the React fiber tree at runtime. No props are required. projectRoot can optionally resolve relative paths explicitly.",
  },
  {
    q: "Does this only work with Next.js?",
    a: "No. It supports React 19+ apps, including Next.js and Vite. React 18 compatibility is experimental. Source accuracy depends on your framework’s development metadata and source maps; Next.js Server Component locations use available server debug metadata.",
  },
  {
    q: "How do I navigate the tree?",
    a: "Press Space to open the popover. Component shows immediate parents up to the page boundary. Element shows nearby HTML, stopping at body. Left / Right switches tabs; Up / Down moves between rows and previews their elements. Enter opens the selected source. Press Space to close the popover or Escape to exit inspect mode.",
  },
  {
    q: "Which editors does it support?",
    a: "Cursor, VS Code, and VS Code Insiders. Choose your editor in the inspector settings. The inspector opens source through an editor URL or your framework’s development endpoint.",
  },
  {
    q: "What kind of elements can I inspect?",
    a: (
      <div className="flex flex-col gap-2">
        <p>Elements connected to React’s rendered tree, including:</p>
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
          <li>Server-rendered HTML when Next.js exposes source metadata</li>
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
            to inspect the owning component’s usage.
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
