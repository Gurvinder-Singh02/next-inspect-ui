import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { CuelumeBind } from "@/components/cuelume-bind"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  AUTHOR_NAME,
  AUTHOR_URL,
  GITHUB_REPO,
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
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
    default: SITE_TITLE,
    template: `${SITE_NAME} | %s`,
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
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
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
      image: `${siteUrl}${OG_IMAGE.url}`,
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const InspectUI = process.env.NODE_ENV === "development"
    ? (await import("next-inspect-ui")).InspectUI
    : null
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
            {InspectUI && (
              <InspectUI />
            )}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
