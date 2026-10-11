import { Option } from "lucide-react"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"

import inspectUIPackage from "next-inspect-ui/package.json"

import { FaqList } from "@/components/landing/faq-list"
import { InstallSection } from "@/components/landing/install-section"
import { contentLinkClassName } from "@/lib/content-link"
import {
  FAQ_ENTRIES,
  SITE_DESCRIPTION,
  SITE_TITLE,
  getSiteUrl,
} from "@/lib/site"
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
  openGraph: {
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
}

const FAQ: { q: string; a: ReactNode }[] = FAQ_ENTRIES.map((item) =>
  item.q === "What kind of elements can I inspect?"
    ? {
        q: item.q,
        a: (
          <>
            {item.a}{" "}
            <Link href="/benchmarks" className={contentLinkClassName}>
              See the patterns
            </Link>
          </>
        ),
      }
    : item
)

export default function OverviewPage() {
  const siteUrl = getSiteUrl()
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ENTRIES.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  }
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}/#webpage`,
    url: siteUrl,
    name: SITE_TITLE,
    description: SITE_DESCRIPTION,
    isPartOf: { "@id": `${siteUrl}/#website` },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd).replace(/</g, "\\u003c"),
        }}
      />
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
              rel="noopener noreferrer"
              className={contentLinkClassName}
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
          <Link href="/walkthrough" className={contentLinkClassName}>
            See it in action
          </Link>
          {" · "}
          <Link href="/api-reference" className={contentLinkClassName}>
            API reference
          </Link>
        </p>
      </section>
    </>
  )
}
