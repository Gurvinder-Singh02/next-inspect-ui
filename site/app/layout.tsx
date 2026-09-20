import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { CuelumeBind } from "@/components/cuelume-bind"
import { InspectUI } from "next-inspect-ui"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  AUTHOR_NAME,
  AUTHOR_URL,
  GITHUB_REPO,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  getSiteUrl,
} from "@/lib/site"
import { cn } from "@/lib/utils"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR_NAME, url: AUTHOR_URL }],
  creator: AUTHOR_NAME,
  keywords: [
    "Next.js",
    "React",
    "inspector",
    "devtools",
    "component source",
    "next-inspect-ui",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      description: SITE_DESCRIPTION,
      url: siteUrl,
      downloadUrl: "https://www.npmjs.com/package/next-inspect-ui",
      codeRepository: GITHUB_REPO,
      author: {
        "@type": "Person",
        name: AUTHOR_NAME,
        url: AUTHOR_URL,
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: siteUrl,
      description: SITE_DESCRIPTION,
      publisher: {
        "@type": "Person",
        name: AUTHOR_NAME,
        url: AUTHOR_URL,
      },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "font-inter antialiased",
        geistSans.variable,
        geistMono.variable
      )}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <TooltipProvider>
            <CuelumeBind />
            {children}
            <Toaster />
            {process.env.NODE_ENV === "development" && (
              <InspectUI projectRoot={process.cwd()} />
            )}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
