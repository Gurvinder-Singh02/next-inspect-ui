import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { InspectUI } from "next-inspect-ui"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "next-src-test",
  description: "Next.js src/ app for testing next-inspect-ui",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        {process.env.NODE_ENV === "development" ? (
          <InspectUI projectRoot={process.cwd()} />
        ) : null}
      </body>
    </html>
  )
}
