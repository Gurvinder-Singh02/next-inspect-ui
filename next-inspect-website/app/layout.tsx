import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { CuelumeBind } from "@/components/cuelume-bind"
import { inspectUIProjectRoot } from "next-inspect-ui-debug"
import { InspectUI } from "next-inspect-ui-debug/inspect"
import { DevTools } from "@/components/dev-tools"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

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
        <ThemeProvider>
          <TooltipProvider>
            <CuelumeBind />
            {children}
            <Toaster />
            {process.env.NODE_ENV === "development" && (
              <>
                <InspectUI projectRoot={inspectUIProjectRoot()} debug verify />
                <DevTools />
              </>
            )}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
